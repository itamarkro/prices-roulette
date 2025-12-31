// Core types for the price system

export interface Product {
  id: string;
  name: string;
  nameHebrew: string;
  category: string;
  unit: string;
  barcode?: string; // For matching with store data
  averagePrice: number;
  lowPrice: number;
  highPrice: number;
  image: string;
  lastUpdated?: string;
  storePrices?: StorePrice[];
}

export interface StorePrice {
  storeName: string;
  storeChain: string;
  price: number;
  priceUpdateDate?: string;
}

export interface RawStoreItem {
  itemCode: string;
  itemName: string;
  itemPrice: number;
  unitOfMeasure: string;
  quantity: number;
  unitOfMeasurePrice?: number;
  priceUpdateDate?: string;
}

export interface CrawlerResult {
  success: boolean;
  storeName: string;
  items: RawStoreItem[];
  error?: string;
  fetchedAt: string;
}

export const categories = [
  "ירקות",
  "פירות",
  "חלב וביצים",
  "לחם ומאפים",
  "בשר ועוף",
  "דגים",
  "שימורים",
  "משקאות",
  "חטיפים",
  "ניקיון",
] as const;

export type Category = (typeof categories)[number];

