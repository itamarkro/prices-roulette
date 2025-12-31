#!/usr/bin/env node
/**
 * Test script for Shufersal price crawler - Full catalog version
 * Run with: node scripts/test-crawler.mjs
 */

import { gunzipSync } from "zlib";

const SHUFERSAL_URL = "https://prices.shufersal.co.il/";

// Products we want to find
const TARGET_PRODUCTS = [
  { name: "חלב תנובה", keywords: ["חלב", "תנובה"] },
  { name: "ביצים", keywords: ["ביצים", "ביצה"] },
  { name: "לחם", keywords: ["לחם לבן", "אנג'ל"] },
  { name: "קוקה קולה", keywords: ["קוקה קולה", "קולה 1.5"] },
  { name: "במבה", keywords: ["במבה"] },
  { name: "ביסלי", keywords: ["ביסלי"] },
  { name: "קוטג'", keywords: ["קוטג"] },
  { name: "גבינה צהובה", keywords: ["גבינה צהובה", "עמק"] },
  { name: "חזה עוף", keywords: ["חזה עוף", "עוף"] },
];

async function main() {
  console.log("🧪 Testing Shufersal Price Crawler (Full Catalog)\n");
  console.log("=".repeat(60));

  // Step 1: Fetch the main page
  console.log("\n📡 Step 1: Fetching Shufersal price transparency page...");
  
  const response = await fetch(SHUFERSAL_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      "Accept": "text/html,application/xhtml+xml,application/xml",
      "Accept-Language": "he-IL,he;q=0.9",
    },
  });

  if (!response.ok) {
    console.log(`❌ Failed: ${response.status}`);
    return;
  }
  console.log("✅ Page loaded successfully");

  // Step 2: Extract Azure Blob URLs - look for PriceFull files
  console.log("\n📋 Step 2: Extracting price file URLs...");
  const html = await response.text();
  
  // Look for PriceFull files (complete catalog) and regular Price files
  const urlRegex = /https:\/\/pricesprodpublic\.blob\.core\.windows\.net\/[^"'\s]+(?:PriceFull|Price)[^"'\s]*\.gz[^"'\s]*/g;
  const matches = html.match(urlRegex) || [];
  const urls = [...new Set(matches.map(u => u.replace(/&amp;/g, "&")))];
  
  // Separate PriceFull and regular Price files
  const priceFullUrls = urls.filter(u => u.includes("PriceFull"));
  const priceUrls = urls.filter(u => !u.includes("PriceFull"));
  
  console.log(`✅ Found ${priceFullUrls.length} PriceFull files (complete catalog)`);
  console.log(`✅ Found ${priceUrls.length} Price files (updates/promotions)`);

  // Use PriceFull if available, otherwise regular Price
  const targetUrls = priceFullUrls.length > 0 ? priceFullUrls : priceUrls;
  
  if (targetUrls.length === 0) {
    console.log("❌ No price files found");
    return;
  }

  // Download multiple files to get price ranges
  console.log("\n📥 Step 3: Downloading price files...");
  
  const allItems = [];
  const filesToDownload = targetUrls.slice(0, 3); // Download 3 files for variety
  
  for (let i = 0; i < filesToDownload.length; i++) {
    const url = filesToDownload[i];
    const storeMatch = url.match(/(?:Price|PriceFull)\d+-(\d+)-/);
    const storeId = storeMatch ? storeMatch[1] : `file${i + 1}`;
    
    try {
      console.log(`   📦 Store ${storeId}...`);
      const fileResponse = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      
      if (!fileResponse.ok) {
        console.log(`      ❌ Failed: ${fileResponse.status}`);
        continue;
      }
      
      const buffer = await fileResponse.arrayBuffer();
      const decompressed = gunzipSync(Buffer.from(buffer));
      const xml = decompressed.toString("utf-8");
      
      // Parse items
      const itemMatches = xml.match(/<Item>[\s\S]*?<\/Item>/gi) || [];
      
      for (const itemXml of itemMatches) {
        const getTag = (tag) => {
          const m = itemXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, "i"));
          return m ? m[1].trim() : "";
        };
        
        const itemCode = getTag("ItemCode");
        const itemName = getTag("ItemName");
        const itemPrice = parseFloat(getTag("ItemPrice")) || 0;
        
        if (itemCode && itemName && itemPrice > 0) {
          allItems.push({ itemCode, itemName, itemPrice, storeId });
        }
      }
      
      console.log(`      ✅ Parsed ${itemMatches.length} items`);
    } catch (error) {
      console.log(`      ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Total items collected: ${allItems.length}`);

  // Search for our target products
  console.log("\n" + "=".repeat(60));
  console.log("🎯 SEARCHING FOR TARGET PRODUCTS\n");
  
  for (const target of TARGET_PRODUCTS) {
    const found = allItems.filter(item => 
      target.keywords.some(kw => 
        item.itemName.includes(kw)
      )
    );
    
    if (found.length > 0) {
      const prices = found.map(f => f.itemPrice);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      
      console.log(`✅ ${target.name}:`);
      console.log(`   Found: ${found.length} variants`);
      console.log(`   Range: ₪${min.toFixed(2)} - ₪${max.toFixed(2)}`);
      console.log(`   Average: ₪${avg.toFixed(2)}`);
      console.log(`   Examples:`);
      // Show unique product names with lowest price
      const uniqueProducts = new Map();
      found.forEach(f => {
        const key = f.itemName.substring(0, 35);
        if (!uniqueProducts.has(key) || f.itemPrice < uniqueProducts.get(key).itemPrice) {
          uniqueProducts.set(key, f);
        }
      });
      [...uniqueProducts.values()].slice(0, 3).forEach(f => {
        console.log(`     - ${f.itemName.substring(0, 45)} @ ₪${f.itemPrice.toFixed(2)}`);
      });
      console.log();
    } else {
      console.log(`⚠️  ${target.name}: Not found\n`);
    }
  }

  console.log("=".repeat(60));
  console.log("✨ Test complete!\n");
  console.log("The crawler found real price data from Shufersal.");
  console.log("These prices can be used to update your app.\n");
}

main().catch(console.error);
