#!/usr/bin/env node
/**
 * Test script for Israeli supermarket price crawling
 * Run with: node scripts/test-crawler.mjs
 */

console.log("🧪 Testing Israeli Supermarket Price APIs\n");
console.log("=".repeat(60));

// Test multiple endpoints
const endpoints = [
  {
    name: "Shufersal Main",
    url: "https://prices.shufersal.co.il/",
    method: "GET",
  },
  {
    name: "Shufersal HTTP",
    url: "http://prices.shufersal.co.il/",
    method: "GET",
  },
  {
    name: "Shufersal FileObject",
    url: "http://prices.shufersal.co.il/FileObject/UpdateCategory?catID=-1&storeId=-1&sort=Time&sortdir=DESC",
    method: "GET",
  },
  {
    name: "Open Prices IL (Community)",
    url: "https://raw.githubusercontent.com/erasta/IsraelSupermarketPrices/main/data/latest/shufersal.json",
    method: "GET",
  },
  {
    name: "Gov IL Open Data",
    url: "https://data.gov.il/api/3/action/package_search?q=supermarket+prices",
    method: "GET",
  },
];

async function testEndpoint(endpoint) {
  console.log(`\n📡 Testing: ${endpoint.name}`);
  console.log(`   URL: ${endpoint.url}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    
    clearTimeout(timeoutId);
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get("content-type") || "N/A"}`);
    
    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      let preview = "";
      
      if (contentType.includes("json")) {
        const json = await response.json();
        preview = JSON.stringify(json, null, 2).substring(0, 500);
        console.log(`   ✅ JSON Response (first 500 chars):`);
        console.log(`   ${preview.split('\n').join('\n   ')}`);
        return { success: true, type: "json", data: json };
      } else {
        const text = await response.text();
        preview = text.substring(0, 500);
        console.log(`   ✅ Response (first 500 chars):`);
        console.log(`   ${preview.split('\n').slice(0, 10).join('\n   ')}`);
        
        // Look for useful links in HTML
        const links = text.match(/href="([^"]*(?:gz|xml|json)[^"]*)"/gi) || [];
        if (links.length > 0) {
          console.log(`\n   📁 Found ${links.length} data file links:`);
          links.slice(0, 5).forEach((l, i) => {
            const url = l.match(/href="([^"]*)"/i)?.[1] || "";
            console.log(`      ${i + 1}. ${url}`);
          });
        }
        
        return { success: true, type: "html", data: text };
      }
    } else {
      console.log(`   ❌ Failed: ${response.status}`);
      return { success: false };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`   ❌ Timeout (>10s)`);
    } else {
      console.log(`   ❌ Error: ${error.message}`);
    }
    return { success: false, error: error.message };
  }
}

async function main() {
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push({ name: endpoint.name, ...result });
  }
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 SUMMARY\n");
  
  const working = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Working: ${working.length}`);
  working.forEach(r => console.log(`   - ${r.name}`));
  
  console.log(`\n❌ Failed: ${failed.length}`);
  failed.forEach(r => console.log(`   - ${r.name}: ${r.error || 'HTTP error'}`));
  
  console.log("\n" + "=".repeat(60));
  console.log("💡 RECOMMENDATION\n");
  
  if (working.some(r => r.name.includes("Community") || r.name.includes("Gov"))) {
    console.log("The community/government data sources are available!");
    console.log("These are more reliable than scraping individual supermarket sites.");
    console.log("\nI recommend updating the crawler to use:");
    console.log("1. GitHub community data (IsraelSupermarketPrices)");
    console.log("2. data.gov.il open data portal");
  } else {
    console.log("Direct supermarket APIs may require:");
    console.log("- Specific headers or cookies");
    console.log("- Running from an Israeli IP");
    console.log("- Handling their specific authentication");
  }
}

main().catch(console.error);
