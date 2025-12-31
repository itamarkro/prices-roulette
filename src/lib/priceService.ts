/**
 * Price Service
 *
 * Aggregates prices from multiple sources and calculates statistics
 */

import { Product, StorePrice } from "./types";
import { productCatalog, CatalogProduct } from "./productCatalog";
import { crawlShufersal, searchItems } from "../crawlers/shufersal";

// Cache for crawled prices
let priceCache: Map<string, StorePrice[]> = new Map();
let lastCrawlTime: Date | null = null;
const CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour

/**
 * Find matching prices for a catalog product
 */
function findPricesForProduct(
  product: CatalogProduct,
  allItems: { itemCode: string; itemName: string; itemPrice: number; priceUpdateDate?: string }[]
): StorePrice[] {
  const prices: StorePrice[] = [];

  // First try exact barcode match
  for (const barcode of product.barcodes) {
    const matches = allItems.filter((item) => item.itemCode === barcode);
    for (const match of matches) {
      prices.push({
        storeName: "Shufersal",
        storeChain: "Shufersal",
        price: match.itemPrice,
        priceUpdateDate: match.priceUpdateDate,
      });
    }
  }

  // If no barcode match, try fuzzy name matching
  if (prices.length === 0) {
    const matchedItems = searchItems(
      allItems.map((i) => ({
        ...i,
        unitOfMeasure: "",
        quantity: 1,
      })),
      product.searchTerms
    );

    // Take up to 5 price points
    for (const match of matchedItems.slice(0, 5)) {
      prices.push({
        storeName: "Shufersal",
        storeChain: "Shufersal",
        price: match.itemPrice,
        priceUpdateDate: match.priceUpdateDate,
      });
    }
  }

  return prices;
}

/**
 * Calculate price statistics from a list of prices
 */
function calculatePriceStats(prices: StorePrice[]): {
  averagePrice: number;
  lowPrice: number;
  highPrice: number;
} {
  if (prices.length === 0) {
    return { averagePrice: 0, lowPrice: 0, highPrice: 0 };
  }

  const priceValues = prices.map((p) => p.price).filter((p) => p > 0);

  if (priceValues.length === 0) {
    return { averagePrice: 0, lowPrice: 0, highPrice: 0 };
  }

  const sum = priceValues.reduce((a, b) => a + b, 0);
  const avg = sum / priceValues.length;
  const min = Math.min(...priceValues);
  const max = Math.max(...priceValues);

  return {
    averagePrice: Math.round(avg * 10) / 10,
    lowPrice: Math.round(min * 10) / 10,
    highPrice: Math.round(max * 10) / 10,
  };
}

/**
 * Fetch and process all prices
 */
export async function fetchAllPrices(): Promise<Product[]> {
  // Check cache
  if (
    lastCrawlTime &&
    Date.now() - lastCrawlTime.getTime() < CACHE_DURATION_MS &&
    priceCache.size > 0
  ) {
    console.log("📦 Using cached prices");
    return buildProductsFromCache();
  }

  console.log("🔄 Fetching fresh prices...");

  // Crawl Shufersal
  const shufersalResult = await crawlShufersal();

  if (!shufersalResult.success) {
    console.error("❌ Failed to fetch prices, using fallback");
    return getFallbackProducts();
  }

  // Match prices to our catalog products
  priceCache.clear();
  for (const catalogProduct of productCatalog) {
    const prices = findPricesForProduct(catalogProduct, shufersalResult.items);
    priceCache.set(catalogProduct.id, prices);
  }

  lastCrawlTime = new Date();
  return buildProductsFromCache();
}

/**
 * Build Product array from cached prices
 */
function buildProductsFromCache(): Product[] {
  return productCatalog.map((catalogProduct) => {
    const storePrices = priceCache.get(catalogProduct.id) || [];
    const stats = calculatePriceStats(storePrices);

    // Use stats if we have real data, otherwise use fallback values
    const hasRealData = storePrices.length > 0 && stats.averagePrice > 0;

    return {
      id: catalogProduct.id,
      name: catalogProduct.name,
      nameHebrew: catalogProduct.nameHebrew,
      category: catalogProduct.category,
      unit: catalogProduct.unit,
      barcode: catalogProduct.barcodes[0],
      image: catalogProduct.image,
      averagePrice: hasRealData ? stats.averagePrice : getFallbackPrice(catalogProduct.id).average,
      lowPrice: hasRealData ? stats.lowPrice : getFallbackPrice(catalogProduct.id).low,
      highPrice: hasRealData ? stats.highPrice : getFallbackPrice(catalogProduct.id).high,
      lastUpdated: lastCrawlTime?.toISOString(),
      storePrices: hasRealData ? storePrices : undefined,
    };
  });
}

/**
 * Fallback prices when crawling fails
 * These are reasonable estimates based on typical Israeli supermarket prices
 */
function getFallbackPrice(productId: string): { average: number; low: number; high: number } {
  const fallbackPrices: Record<string, { average: number; low: number; high: number }> = {
    "1": { average: 8.9, low: 5.9, high: 14.9 }, // Tomatoes
    "2": { average: 6.9, low: 3.9, high: 9.9 }, // Cucumbers
    "3": { average: 5.5, low: 3.5, high: 8.9 }, // Potatoes
    "4": { average: 4.9, low: 2.9, high: 7.9 }, // Onions
    "5": { average: 5.9, low: 3.9, high: 8.9 }, // Carrots
    "6": { average: 12.9, low: 7.9, high: 19.9 }, // Bell Pepper
    "7": { average: 6.9, low: 4.9, high: 9.9 }, // Lettuce
    "8": { average: 9.9, low: 6.9, high: 14.9 }, // Apples
    "9": { average: 7.9, low: 5.9, high: 11.9 }, // Bananas
    "10": { average: 6.9, low: 4.9, high: 9.9 }, // Oranges
    "11": { average: 19.9, low: 12.9, high: 29.9 }, // Grapes
    "12": { average: 4.9, low: 2.9, high: 7.9 }, // Watermelon
    "13": { average: 6.9, low: 5.9, high: 7.9 }, // Milk
    "14": { average: 23.9, low: 19.9, high: 29.9 }, // Eggs
    "15": { average: 7.9, low: 5.9, high: 9.9 }, // Cottage
    "16": { average: 18.9, low: 14.9, high: 24.9 }, // Yellow Cheese
    "17": { average: 12.9, low: 9.9, high: 16.9 }, // Butter
    "18": { average: 8.9, low: 6.9, high: 12.9 }, // White Bread
    "19": { average: 7.9, low: 5.9, high: 10.9 }, // Pita
    "20": { average: 14.9, low: 10.9, high: 19.9 }, // Challah
    "21": { average: 39.9, low: 29.9, high: 49.9 }, // Chicken Breast
    "22": { average: 54.9, low: 44.9, high: 69.9 }, // Ground Beef
    "23": { average: 29.9, low: 22.9, high: 39.9 }, // Chicken Thighs
    "24": { average: 89.9, low: 69.9, high: 119.9 }, // Salmon
    "25": { average: 44.9, low: 34.9, high: 54.9 }, // Tilapia
    "26": { average: 9.9, low: 6.9, high: 14.9 }, // Tuna
    "27": { average: 7.9, low: 4.9, high: 10.9 }, // Corn
    "28": { average: 6.9, low: 4.9, high: 9.9 }, // Chickpeas
    "29": { average: 8.9, low: 5.9, high: 11.9 }, // Coca Cola
    "30": { average: 12.9, low: 9.9, high: 16.9 }, // Orange Juice
    "31": { average: 4.9, low: 2.9, high: 6.9 }, // Water
    "32": { average: 6.9, low: 4.9, high: 8.9 }, // Bamba
    "33": { average: 6.9, low: 4.9, high: 8.9 }, // Bissli
    "34": { average: 14.9, low: 9.9, high: 19.9 }, // Dish Soap
    "35": { average: 39.9, low: 29.9, high: 54.9 }, // Laundry Detergent
  };

  return fallbackPrices[productId] || { average: 10, low: 5, high: 15 };
}

/**
 * Get products with fallback prices (no crawling)
 */
export function getFallbackProducts(): Product[] {
  return productCatalog.map((catalogProduct) => {
    const prices = getFallbackPrice(catalogProduct.id);
    return {
      id: catalogProduct.id,
      name: catalogProduct.name,
      nameHebrew: catalogProduct.nameHebrew,
      category: catalogProduct.category,
      unit: catalogProduct.unit,
      barcode: catalogProduct.barcodes[0],
      image: catalogProduct.image,
      averagePrice: prices.average,
      lowPrice: prices.low,
      highPrice: prices.high,
    };
  });
}

/**
 * Get price rating for a given price
 */
export function getPriceRating(
  price: number,
  product: Product
): "great" | "good" | "average" | "high" | "expensive" {
  const range = product.highPrice - product.lowPrice;
  if (range === 0) return "average";

  const position = (price - product.lowPrice) / range;

  if (position <= 0.1) return "great";
  if (position <= 0.35) return "good";
  if (position <= 0.65) return "average";
  if (position <= 0.85) return "high";
  return "expensive";
}

