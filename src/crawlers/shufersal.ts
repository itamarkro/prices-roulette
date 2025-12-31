/**
 * Shufersal Price Crawler
 *
 * Fetches prices from Shufersal's price transparency site.
 * The site provides Azure Blob Storage links to gzipped XML price files.
 *
 * Data source: https://prices.shufersal.co.il/
 */

import { gunzipSync } from "zlib";
import { RawStoreItem, CrawlerResult } from "../lib/types";

// Shufersal's price transparency page
const SHUFERSAL_URL = "https://prices.shufersal.co.il/";

/**
 * Parse XML price data from Shufersal
 * The XML structure contains Items with price information
 */
function parseXMLPrices(xmlContent: string): RawStoreItem[] {
  const items: RawStoreItem[] = [];

  // Match all <Item> elements
  const itemMatches = xmlContent.match(/<Item>[\s\S]*?<\/Item>/gi) || [];

  for (const itemXml of itemMatches) {
    try {
      const getTagValue = (tag: string): string => {
        const match = itemXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, "i"));
        return match ? match[1].trim() : "";
      };

      const itemCode = getTagValue("ItemCode");
      const itemName = getTagValue("ItemName");
      const priceStr = getTagValue("ItemPrice");
      const unitOfMeasure = getTagValue("UnitOfMeasure") || getTagValue("Quantity");
      const quantityStr = getTagValue("Quantity") || "1";
      const unitPriceStr = getTagValue("UnitOfMeasurePrice");
      const priceUpdateDate = getTagValue("PriceUpdateDate");

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
      continue;
    }
  }

  return items;
}

/**
 * Extract Azure Blob URLs from Shufersal's page
 */
async function fetchPriceFileUrls(): Promise<string[]> {
  console.log("🔍 Fetching Shufersal price page...");

  const response = await fetch(SHUFERSAL_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // Extract Azure Blob storage URLs for .gz files
  // Format: https://pricesprodpublic.blob.core.windows.net/price/Price*.gz?...
  const urlRegex = /https:\/\/pricesprodpublic\.blob\.core\.windows\.net\/[^"'\s]+\.gz[^"'\s]*/g;
  const matches = html.match(urlRegex) || [];

  // Decode HTML entities in URLs
  const urls = matches.map((url) =>
    url.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  );

  // Remove duplicates
  const uniqueUrls = [...new Set(urls)];

  console.log(`📁 Found ${uniqueUrls.length} price files`);

  return uniqueUrls;
}

/**
 * Download and decompress a gzipped price file
 */
async function downloadPriceFile(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PriceChecker/1.0)",
      Accept: "application/gzip, */*",
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const uint8 = new Uint8Array(buffer);

  // Check if gzipped (magic bytes: 0x1f 0x8b)
  if (uint8[0] === 0x1f && uint8[1] === 0x8b) {
    const decompressed = gunzipSync(Buffer.from(buffer));
    return decompressed.toString("utf-8");
  }

  // Already plain text
  return new TextDecoder().decode(buffer);
}

/**
 * Main crawler function - fetches and parses Shufersal prices
 */
export async function crawlShufersal(): Promise<CrawlerResult> {
  const result: CrawlerResult = {
    success: false,
    storeName: "Shufersal",
    items: [],
    fetchedAt: new Date().toISOString(),
  };

  try {
    // Get list of price file URLs
    const urls = await fetchPriceFileUrls();

    if (urls.length === 0) {
      throw new Error("No price files found");
    }

    // Download and parse first few files (to avoid overwhelming)
    // Each file is a different store branch
    const filesToProcess = urls.slice(0, 5);
    let successCount = 0;

    for (let i = 0; i < filesToProcess.length; i++) {
      const url = filesToProcess[i];
      try {
        // Extract store ID from URL for logging
        const storeMatch = url.match(/Price\d+-(\d+)-/);
        const storeId = storeMatch ? storeMatch[1] : `file${i + 1}`;

        console.log(`📥 Downloading store ${storeId}...`);
        const xmlContent = await downloadPriceFile(url);
        const items = parseXMLPrices(xmlContent);

        if (items.length > 0) {
          result.items.push(...items);
          successCount++;
          console.log(`   ✅ Parsed ${items.length} items`);
        }
      } catch (error) {
        console.error(`   ❌ Failed:`, error instanceof Error ? error.message : error);
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

    // Also track high prices for range
    const highPrices = new Map<string, number>();
    for (const item of result.items) {
      const current = highPrices.get(item.itemCode) || 0;
      if (item.itemPrice > current) {
        highPrices.set(item.itemCode, item.itemPrice);
      }
    }

    result.items = Array.from(uniqueItems.values());
    result.success = successCount > 0 && result.items.length > 0;

    console.log(`\n🎉 Crawl complete!`);
    console.log(`   Processed ${successCount}/${filesToProcess.length} files`);
    console.log(`   Found ${result.items.length} unique products`);
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Crawl failed:", error);
  }

  return result;
}

/**
 * Search for items matching given terms (barcode or name)
 */
export function searchItems(
  items: RawStoreItem[],
  searchTerms: string[]
): RawStoreItem[] {
  return items.filter((item) => {
    const itemNameLower = item.itemName.toLowerCase();
    return searchTerms.some(
      (term) =>
        item.itemCode === term ||
        item.itemCode.includes(term) ||
        itemNameLower.includes(term.toLowerCase())
    );
  });
}
