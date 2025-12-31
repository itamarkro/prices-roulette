"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  Filter,
  X,
  Check,
  AlertTriangle,
  Info,
  RefreshCw,
} from "lucide-react";
import pricesData from "@/data/prices.json";
import { categories, type Category } from "@/lib/types";

interface Product {
  id: string;
  name: string;
  nameHebrew: string;
  category: string;
  unit: string;
  averagePrice: number;
  lowPrice: number;
  highPrice: number;
  image: string;
  lastUpdated?: string;
}

type PriceRating = "great" | "good" | "average" | "high" | "expensive";

function getPriceRating(price: number, product: Product): PriceRating {
  const range = product.highPrice - product.lowPrice;
  if (range === 0) return "average";
  const position = (price - product.lowPrice) / range;

  if (position <= 0.1) return "great";
  if (position <= 0.35) return "good";
  if (position <= 0.65) return "average";
  if (position <= 0.85) return "high";
  return "expensive";
}

const ratingConfig: Record<
  PriceRating,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  great: {
    label: "מחיר מעולה!",
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    icon: <Sparkles className="w-5 h-5" />,
  },
  good: {
    label: "מחיר טוב",
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    icon: <TrendingDown className="w-5 h-5" />,
  },
  average: {
    label: "מחיר ממוצע",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    icon: <Minus className="w-5 h-5" />,
  },
  high: {
    label: "מחיר גבוה",
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
    icon: <TrendingUp className="w-5 h-5" />,
  },
  expensive: {
    label: "יקר מאוד!",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    icon: <AlertTriangle className="w-5 h-5" />,
  },
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>(pricesData.products);
  const [dataSource, setDataSource] = useState<string>(pricesData.source);
  const [lastUpdated, setLastUpdated] = useState<string>(pricesData.lastUpdated);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">(
    "all"
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [priceRating, setPriceRating] = useState<PriceRating | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Try to fetch live prices from API
  const refreshPrices = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.products) {
          setProducts(data.products);
          setDataSource(data.source);
          setLastUpdated(data.timestamp);
        }
      }
    } catch (error) {
      console.error("Failed to refresh prices:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial load - try to get fresh data
  useEffect(() => {
    // Only fetch from API if prices are stale (older than 1 hour)
    const lastUpdate = new Date(lastUpdated);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (lastUpdate < oneHourAgo) {
      refreshPrices();
    }
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.nameHebrew.includes(searchQuery) ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setPriceInput("");
    setPriceRating(null);
  };

  const handleCheckPrice = () => {
    if (!selectedProduct || !priceInput) return;
    const price = parseFloat(priceInput);
    if (isNaN(price) || price <= 0) return;
    const rating = getPriceRating(price, selectedProduct);
    setPriceRating(rating);
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
    setPriceInput("");
    setPriceRating(null);
  };

  const formatLastUpdated = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("he-IL", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">מחירון סופר</h1>
                <p className="text-xs text-gray-500">בדוק מחירים בזמן אמת</p>
              </div>
            </div>
            <button
              onClick={refreshPrices}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="רענן מחירים"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-500 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
          {/* Data source indicator */}
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            <span
              className={`w-2 h-2 rounded-full ${
                dataSource === "crawled" ? "bg-green-400" : "bg-amber-400"
              }`}
            />
            <span>
              {dataSource === "crawled" ? "מחירים מעודכנים" : "מחירי בסיס"}
              {lastUpdated && ` • ${formatLastUpdated(lastUpdated)}`}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Search and Filter Section */}
        <div className="mb-6 animate-fade-in">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="חפש מוצר... (לדוגמא: עגבניות, חלב)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 pl-12 py-4 bg-white rounded-2xl border border-gray-200 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-blue-400"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all duration-200 ${
                showFilters || selectedCategory !== "all"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Category Filter */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-2xl border border-gray-200 animate-slide-in">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  סנן לפי קטגוריה
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === "all"
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  הכל
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedCategory === category
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Product Card */}
        {selectedProduct && (
          <div className="mb-6 animate-fade-in">
            <div className="bg-white rounded-3xl border border-gray-200 p-6 card-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{selectedProduct.image}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedProduct.nameHebrew}
                    </h2>
                    <p className="text-gray-500">{selectedProduct.unit}</p>
                  </div>
                </div>
                <button
                  onClick={handleClearSelection}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Price Range Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600">
                    טווח מחירים בשוק
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">הכי זול</p>
                    <p className="text-lg font-bold text-green-600">
                      ₪{selectedProduct.lowPrice.toFixed(1)}
                    </p>
                  </div>
                  <div className="flex-1 mx-4 h-2 bg-gradient-to-l from-red-300 via-amber-300 to-green-300 rounded-full" />
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">הכי יקר</p>
                    <p className="text-lg font-bold text-red-600">
                      ₪{selectedProduct.highPrice.toFixed(1)}
                    </p>
                  </div>
                </div>
                <div className="text-center mt-2">
                  <p className="text-xs text-gray-500">מחיר ממוצע</p>
                  <p className="text-lg font-semibold text-gray-700">
                    ₪{selectedProduct.averagePrice.toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Price Input */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    ₪
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="הזן את המחיר שראית"
                    value={priceInput}
                    onChange={(e) => {
                      setPriceInput(e.target.value);
                      setPriceRating(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleCheckPrice()}
                    className="w-full pr-10 pl-4 py-4 bg-white rounded-xl border border-gray-200 text-gray-900 text-lg font-medium placeholder-gray-400 transition-all duration-200 focus:border-blue-400"
                  />
                </div>
                <button
                  onClick={handleCheckPrice}
                  disabled={!priceInput}
                  className="btn-primary px-8 py-4 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Check className="w-6 h-6" />
                </button>
              </div>

              {/* Price Rating Result */}
              {priceRating && (
                <div
                  className={`mt-4 p-5 rounded-2xl border-2 ${ratingConfig[priceRating].bg} animate-pulse-once`}
                >
                  <div className="flex items-center gap-3">
                    <div className={ratingConfig[priceRating].color}>
                      {ratingConfig[priceRating].icon}
                    </div>
                    <div>
                      <p
                        className={`text-xl font-bold ${ratingConfig[priceRating].color}`}
                      >
                        {ratingConfig[priceRating].label}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        המחיר הממוצע הוא ₪
                        {selectedProduct.averagePrice.toFixed(1)}
                        {priceRating === "great" || priceRating === "good"
                          ? " - מצאת מציאה!"
                          : priceRating === "expensive" || priceRating === "high"
                          ? " - כדאי לחפש במקום אחר"
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {selectedCategory === "all" ? "כל המוצרים" : selectedCategory}
            </h2>
            <span className="text-sm text-gray-500">
              {filteredProducts.length} מוצרים
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-gray-200">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">לא נמצאו מוצרים</p>
              <p className="text-gray-400 text-sm mt-1">נסה לחפש משהו אחר</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredProducts.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className={`p-4 bg-white rounded-2xl border transition-all duration-200 text-right card-shadow hover:scale-[1.02] opacity-0 animate-fade-in ${
                    selectedProduct?.id === product.id
                      ? "border-blue-400 ring-2 ring-blue-100"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
                >
                  <div className="text-3xl mb-2">{product.image}</div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                    {product.nameHebrew}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{product.unit}</p>
                  <p className="text-sm font-bold text-blue-600 mt-2">
                    ~₪{product.averagePrice.toFixed(1)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 py-3">
        <p className="text-center text-xs text-gray-400">
          המחירים הם הערכה בלבד ועשויים להשתנות בין חנויות
        </p>
      </footer>
    </div>
  );
}
