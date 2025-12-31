/**
 * Shufersal Price Crawler
 *
 * Fetches prices from Shufersal's price transparency API.
 * Based on Israeli Price Transparency Law requirements.
 *
 * Data source: https://prices.shufersal.co.il/
 * Format: XML files (gzipped) containing price lists
 */

import { gunzipSync } from "zlib";
import { RawStoreItem, CrawlerResult } from "../lib/types";

// Shufersal's price transparency endpoint
const SHUFERSAL_BASE_URL = "http://prices.shufersal.co.il/FileObject/UpdateCategory";

// Store IDs for different Shufersal branches
export const SHUFERSAL_STORES = {
  // Major branches - you can add more as needed
  "Shufersal Deal Ramat Aviv": "001",
  "Shufersal Sheli Tel Aviv": "002",
  "Shufersal Online": "003",
} as const;

interface ShufersalFileInfo {
  url: string;
  fileName: string;
  fileType: string;
}

/**
 * Parse XML price data from Shufersal
 * Simple XML parsing without external dependencies
 */
function parseXMLPrices(xmlContent: string): RawStoreItem[] {
  const items: RawStoreItem[] = [];

  // Match all <Item> or <Product> elements
  const itemMatches = xmlContent.match(/<(Item|Product)[^>]*>[\s\S]*?<\/\1>/gi) || [];

  for (const itemXml of itemMatches) {
    try {
      const getTagValue = (tag: string): string => {
        const match = itemXml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i"));
        return match ? match[1].trim() : "";
      };

      const itemCode =
        getTagValue("ItemCode") ||
        getTagValue("ItemBarcode") ||
        getTagValue("Barcode") ||
        "";
      const itemName =
        getTagValue("ItemName") ||
        getTagValue("ItemNm") ||
        getTagValue("ManufacturerItemDescription") ||
        "";
      const priceStr =
        getTagValue("ItemPrice") ||
        getTagValue("Price") ||
        "0";
      const unitOfMeasure =
        getTagValue("UnitOfMeasure") ||
        getTagValue("UnitQty") ||
        getTagValue("Quantity") ||
        "";
      const quantityStr =
        getTagValue("Quantity") ||
        getTagValue("QtyInPackage") ||
        "1";
      const unitPriceStr =
        getTagValue("UnitOfMeasurePrice") ||
        getTagValue("UnitPrice") ||
        "";
      const priceUpdateDate =
        getTagValue("PriceUpdateDate") ||
        getTagValue("ItemUpdateDate") ||
        "";

      const itemPrice = parseFloat(priceStr) || 0;
      const quantity = parseFloat(quantityStr) || 1;
      const unitOfMeasurePrice = unitPriceStr ? parseFloat(unitPriceStr) : undefined;

      if (itemCode && itemPrice > 0) {
        items.push({
          itemCode,
          itemName,
          itemPrice,
          unitOfMeasure,
          quantity,
          unitOfMeasurePrice,
          priceUpdateDate,
        });
      }
    } catch {
      // Skip malformed items
      continue;
    }
  }

  return items;
}

/**
 * Fetch the list of available price files from Shufersal
 */
async function fetchFileList(): Promise<ShufersalFileInfo[]> {
  try {
    const response = await fetch(SHUFERSAL_BASE_URL, {
      headers: {
        "Accept": "application/json, text/html, */*",
        "User-Agent": "Mozilla/5.0 (compatible; PriceChecker/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const files: ShufersalFileInfo[] = [];

    // Parse file links from the HTML/JSON response
    // Shufersal typically returns links to .gz files
    const linkMatches = html.match(/href="([^"]*(?:PriceFull|Prices)[^"]*\.gz)"/gi) || [];

    for (const match of linkMatches) {
      const urlMatch = match.match(/href="([^"]*)"/i);
      if (urlMatch) {
        let url = urlMatch[1];
        // Make absolute URL if needed
        if (!url.startsWith("http")) {
          url = `http://prices.shufersal.co.il${url.startsWith("/") ? "" : "/"}${url}`;
        }
        files.push({
          url,
          fileName: url.split("/").pop() || "",
          fileType: url.includes("PriceFull") ? "full" : "prices",
        });
      }
    }

    return files;
  } catch (error) {
    console.error("Failed to fetch Shufersal file list:", error);
    return [];
  }
}

/**
 * Download and decompress a gzipped price file
 */
async function downloadPriceFile(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "Accept": "application/gzip, application/xml, */*",
      "User-Agent": "Mozilla/5.0 (compatible; PriceChecker/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();

  // Check if gzipped and decompress
  const uint8 = new Uint8Array(buffer);
  if (uint8[0] === 0x1f && uint8[1] === 0x8b) {
    // Gzip magic bytes
    const decompressed = gunzipSync(Buffer.from(buffer));
    return decompressed.toString("utf-8");
  }

  // Already plain text
  return new TextDecoder().decode(buffer);
}

/**
 * Crawl Shufersal prices
 * Returns a list of products with their prices
 */
export async function crawlShufersal(): Promise<CrawlerResult> {
  const result: CrawlerResult = {
    success: false,
    storeName: "Shufersal",
    items: [],
    fetchedAt: new Date().toISOString(),
  };

  try {
    console.log("🛒 Fetching Shufersal price files...");

    // Get list of available files
    const files = await fetchFileList();

    if (files.length === 0) {
      // Try direct known URL patterns as fallback
      console.log("📋 No files found in listing, trying direct access...");

      // Shufersal sometimes uses direct file patterns
      const directUrls = [
        "http://prices.shufersal.co.il/FileObject/UpdateCategory?catID=2&storeId=1&sort=Time&sortdir=DESC",
      ];

      for (const url of directUrls) {
        try {
          const response = await fetch(url);
          const html = await response.text();

          // Look for download links in the response
          const gzLinks = html.match(/http[^"'\s]*\.gz/g) || [];
          for (const link of gzLinks.slice(0, 3)) {
            files.push({
              url: link,
              fileName: link.split("/").pop() || "",
              fileType: "prices",
            });
          }
        } catch {
          continue;
        }
      }
    }

    console.log(`📁 Found ${files.length} price files`);

    // Download and parse price files (limit to first few for speed)
    const filesToProcess = files.slice(0, 3);

    for (const file of filesToProcess) {
      try {
        console.log(`📥 Downloading: ${file.fileName}`);
        const xmlContent = await downloadPriceFile(file.url);
        const items = parseXMLPrices(xmlContent);
        result.items.push(...items);
        console.log(`✅ Parsed ${items.length} items from ${file.fileName}`);
      } catch (error) {
        console.error(`❌ Failed to process ${file.fileName}:`, error);
      }
    }

    // Deduplicate by item code, keeping lowest price
    const uniqueItems = new Map<string, RawStoreItem>();
    for (const item of result.items) {
      const existing = uniqueItems.get(item.itemCode);
      if (!existing || item.itemPrice < existing.itemPrice) {
        uniqueItems.set(item.itemCode, item);
      }
    }
    result.items = Array.from(uniqueItems.values());

    result.success = result.items.length > 0;
    console.log(`🎉 Crawl complete: ${result.items.length} unique items`);
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Shufersal crawl failed:", error);
  }

  return result;
}

/**
 * Search for specific products by name or barcode
 */
export function searchItems(
  items: RawStoreItem[],
  searchTerms: string[]
): RawStoreItem[] {
  const results: RawStoreItem[] = [];

  for (const item of items) {
    const itemNameLower = item.itemName.toLowerCase();
    const matches = searchTerms.some(
      (term) =>
        item.itemCode === term ||
        item.itemCode.includes(term) ||
        itemNameLower.includes(term.toLowerCase())
    );
    if (matches) {
      results.push(item);
    }
  }

  return results;
}

