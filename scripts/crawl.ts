#!/usr/bin/env npx tsx
/**
 * Manual Price Crawler Script
 *
 * Run with: npx tsx scripts/crawl.ts
 * Or add to package.json: "crawl": "tsx scripts/crawl.ts"
 */

import { crawlShufersal } from "../src/crawlers/shufersal";
import { productCatalog } from "../src/lib/productCatalog";
import { writeFileSync } from "fs";
import { join } from "path";

interface PriceData {
  lastUpdated: string;
  source: string;
  products: Array<{
    id: string;
    name: string;
    nameHebrew: string;
    category: string;
    unit: string;
    image: string;
    averagePrice: number;
    lowPrice: number;
    highPrice: number;
    matchedItems: number;
  }>;
}

async function main() {
  console.log("🚀 Starting price crawl...\n");

  // Crawl Shufersal
  const result = await crawlShufersal();

  if (!result.success) {
    console.error("❌ Crawl failed:", result.error);
    console.log("\n📋 Generating fallback prices file...");
    generateFallbackPrices();
    return;
  }

  console.log(`\n📊 Processing ${result.items.length} items...`);

  // Match to our catalog
  const priceData: PriceData = {
    lastUpdated: new Date().toISOString(),
    source: "Shufersal",
    products: [],
  };

  for (const product of productCatalog) {
    // Find matching items by barcode or name
    const matches = result.items.filter((item) => {
      // Barcode match
      if (product.barcodes.includes(item.itemCode)) return true;

      // Name match
      const itemNameLower = item.itemName.toLowerCase();
      return product.searchTerms.some(
        (term) => itemNameLower.includes(term.toLowerCase())
      );
    });

    if (matches.length > 0) {
      const prices = matches.map((m) => m.itemPrice).filter((p) => p > 0);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const min = Math.min(...prices);
      const max = Math.max(...prices);

      priceData.products.push({
        id: product.id,
        name: product.name,
        nameHebrew: product.nameHebrew,
        category: product.category,
        unit: product.unit,
        image: product.image,
        averagePrice: Math.round(avg * 10) / 10,
        lowPrice: Math.round(min * 10) / 10,
        highPrice: Math.round(max * 10) / 10,
        matchedItems: matches.length,
      });

      console.log(
        `✅ ${product.nameHebrew}: ₪${min.toFixed(1)} - ₪${max.toFixed(1)} (${matches.length} matches)`
      );
    } else {
      console.log(`⚠️  ${product.nameHebrew}: No matches found`);
    }
  }

  // Save to file
  const outputPath = join(process.cwd(), "src/data/prices.json");
  writeFileSync(outputPath, JSON.stringify(priceData, null, 2), "utf-8");
  console.log(`\n💾 Saved to ${outputPath}`);

  console.log(`\n✨ Done! Found prices for ${priceData.products.length}/${productCatalog.length} products`);
}

function generateFallbackPrices() {
  const fallbackPrices: Record<string, { average: number; low: number; high: number }> = {
    "1": { average: 8.9, low: 5.9, high: 14.9 },
    "2": { average: 6.9, low: 3.9, high: 9.9 },
    "3": { average: 5.5, low: 3.5, high: 8.9 },
    "4": { average: 4.9, low: 2.9, high: 7.9 },
    "5": { average: 5.9, low: 3.9, high: 8.9 },
    "6": { average: 12.9, low: 7.9, high: 19.9 },
    "7": { average: 6.9, low: 4.9, high: 9.9 },
    "8": { average: 9.9, low: 6.9, high: 14.9 },
    "9": { average: 7.9, low: 5.9, high: 11.9 },
    "10": { average: 6.9, low: 4.9, high: 9.9 },
    "11": { average: 19.9, low: 12.9, high: 29.9 },
    "12": { average: 4.9, low: 2.9, high: 7.9 },
    "13": { average: 6.9, low: 5.9, high: 7.9 },
    "14": { average: 23.9, low: 19.9, high: 29.9 },
    "15": { average: 7.9, low: 5.9, high: 9.9 },
    "16": { average: 18.9, low: 14.9, high: 24.9 },
    "17": { average: 12.9, low: 9.9, high: 16.9 },
    "18": { average: 8.9, low: 6.9, high: 12.9 },
    "19": { average: 7.9, low: 5.9, high: 10.9 },
    "20": { average: 14.9, low: 10.9, high: 19.9 },
    "21": { average: 39.9, low: 29.9, high: 49.9 },
    "22": { average: 54.9, low: 44.9, high: 69.9 },
    "23": { average: 29.9, low: 22.9, high: 39.9 },
    "24": { average: 89.9, low: 69.9, high: 119.9 },
    "25": { average: 44.9, low: 34.9, high: 54.9 },
    "26": { average: 9.9, low: 6.9, high: 14.9 },
    "27": { average: 7.9, low: 4.9, high: 10.9 },
    "28": { average: 6.9, low: 4.9, high: 9.9 },
    "29": { average: 8.9, low: 5.9, high: 11.9 },
    "30": { average: 12.9, low: 9.9, high: 16.9 },
    "31": { average: 4.9, low: 2.9, high: 6.9 },
    "32": { average: 6.9, low: 4.9, high: 8.9 },
    "33": { average: 6.9, low: 4.9, high: 8.9 },
    "34": { average: 14.9, low: 9.9, high: 19.9 },
    "35": { average: 39.9, low: 29.9, high: 54.9 },
  };

  const priceData: PriceData = {
    lastUpdated: new Date().toISOString(),
    source: "fallback",
    products: productCatalog.map((p) => ({
      id: p.id,
      name: p.name,
      nameHebrew: p.nameHebrew,
      category: p.category,
      unit: p.unit,
      image: p.image,
      ...fallbackPrices[p.id],
      matchedItems: 0,
    })),
  };

  const outputPath = join(process.cwd(), "src/data/prices.json");
  writeFileSync(outputPath, JSON.stringify(priceData, null, 2), "utf-8");
  console.log(`💾 Fallback prices saved to ${outputPath}`);
}

main().catch(console.error);

