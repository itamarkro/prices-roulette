import { NextResponse } from "next/server";
import { fetchAllPrices, getFallbackProducts } from "@/lib/priceService";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skipCrawl = searchParams.get("fallback") === "true";

  try {
    let products;

    if (skipCrawl) {
      // Use fallback prices without crawling
      products = getFallbackProducts();
    } else {
      // Fetch real prices (with caching)
      products = await fetchAllPrices();
    }

    return NextResponse.json({
      success: true,
      products,
      source: skipCrawl ? "fallback" : "crawled",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("API Error:", error);

    // Fallback to static prices on error
    const products = getFallbackProducts();

    return NextResponse.json({
      success: true,
      products,
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}

