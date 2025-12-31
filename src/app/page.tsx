"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Sparkles,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Minus,
  ChevronDown,
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
  { label: string; color: string; bg: string; icon: React.ReactNode; message: string }
> = {
  great: {
    label: "מציאה!",
    color: "text-emerald-400",
    bg: "rating-great",
    icon: <Sparkles className="w-7 h-7" />,
    message: "מחיר מעולה, קנה עכשיו!",
  },
  good: {
    label: "מחיר טוב",
    color: "text-green-400",
    bg: "rating-good",
    icon: <TrendingDown className="w-7 h-7" />,
    message: "מחיר הוגן, שווה לקנות",
  },
  average: {
    label: "מחיר ממוצע",
    color: "text-amber-400",
    bg: "rating-average",
    icon: <Minus className="w-7 h-7" />,
    message: "לא טוב ולא רע",
  },
  high: {
    label: "מחיר גבוה",
    color: "text-orange-400",
    bg: "rating-high",
    icon: <TrendingUp className="w-7 h-7" />,
    message: "כדאי לבדוק מקום אחר",
  },
  expensive: {
    label: "יקר מאוד!",
    color: "text-rose-400",
    bg: "rating-expensive",
    icon: <AlertTriangle className="w-7 h-7" />,
    message: "חפש מקום אחר",
  },
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>(pricesData.products);
  const [dataSource, setDataSource] = useState<string>(pricesData.source);
  const [lastUpdated, setLastUpdated] = useState<string>(pricesData.lastUpdated);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [priceRating, setPriceRating] = useState<PriceRating | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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

  useEffect(() => {
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
      {/* Compact Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-white/5 safe-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg animate-pulse-glow">
                  <span className="text-2xl">🎰</span>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient-gold">מחירון סופר</h1>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      dataSource === "crawled" ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  <span className="text-zinc-500">
                    {dataSource === "crawled" ? "מעודכן" : "בסיסי"}
                    {lastUpdated && ` • ${formatLastUpdated(lastUpdated)}`}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={refreshPrices}
              disabled={isRefreshing}
              className="touch-target p-3 rounded-xl glass-card active:scale-95 transition-transform"
            >
              <RefreshCw
                className={`w-5 h-5 text-zinc-400 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4">
        {/* Search */}
        <div className="mb-4 animate-fade-in">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="חפש מוצר..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 pl-14 py-4 rounded-2xl input-dark text-base"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute left-3 top-1/2 -translate-y-1/2 touch-target p-2.5 rounded-xl transition-all ${
                showFilters || selectedCategory !== "all"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-white/5 text-zinc-500"
              }`}
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Category Pills - Horizontal Scroll */}
          {showFilters && (
            <div className="mt-3 -mx-4 px-4 overflow-x-auto scrollbar-hide animate-slide-up">
              <div className="flex gap-2 pb-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`category-pill shrink-0 px-5 py-3 rounded-xl text-sm font-medium ${
                    selectedCategory === "all" ? "active" : ""
                  }`}
                >
                  הכל
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`category-pill shrink-0 px-5 py-3 rounded-xl text-sm font-medium ${
                      selectedCategory === category ? "active" : ""
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">
            {selectedCategory === "all" ? "כל המוצרים" : selectedCategory}
          </h2>
          <span className="text-sm text-zinc-500 bg-white/5 px-3 py-1.5 rounded-lg">
            {filteredProducts.length} מוצרים
          </span>
        </div>

        {/* Products Grid - Optimized for mobile */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-3xl">
            <Search className="w-14 h-14 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 text-lg">לא נמצאו מוצרים</p>
            <p className="text-zinc-600 text-sm mt-1">נסה לחפש משהו אחר</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product, index) => (
              <button
                key={product.id}
                onClick={() => handleProductSelect(product)}
                className={`product-card p-4 rounded-2xl text-right opacity-0 animate-fade-in active:scale-[0.98] transition-transform ${
                  selectedProduct?.id === product.id ? "selected" : ""
                }`}
                style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
              >
                <div className="text-4xl mb-2 text-center">{product.image}</div>
                <h3 className="font-semibold text-white text-sm leading-tight mb-0.5 line-clamp-2">
                  {product.nameHebrew}
                </h3>
                <p className="text-xs text-zinc-500 mb-2">{product.unit}</p>
                <div className="price-badge inline-block px-3 py-1.5 rounded-lg text-sm font-bold">
                  ~₪{product.averagePrice.toFixed(1)}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Sheet for Selected Product */}
      {selectedProduct && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
            onClick={handleClearSelection}
          />

          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up safe-bottom">
            <div className="glass-card rounded-t-[2rem] border-t border-white/10 max-h-[85vh] overflow-y-auto">
              {/* Handle */}
              <div className="sticky top-0 pt-3 pb-2 flex justify-center bg-inherit z-10">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="px-5 pb-8">
                {/* Product Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="text-6xl float">{selectedProduct.image}</div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {selectedProduct.nameHebrew}
                    </h2>
                    <p className="text-zinc-500">{selectedProduct.unit}</p>
                  </div>
                  <button
                    onClick={handleClearSelection}
                    className="touch-target p-3 rounded-xl bg-white/5 active:bg-white/10"
                  >
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>

                {/* Price Range - Compact */}
                <div className="mb-6 p-4 rounded-2xl bg-black/30 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-center">
                      <p className="text-xs text-zinc-600 mb-0.5">הכי זול</p>
                      <p className="text-xl font-bold text-emerald-400">
                        ₪{selectedProduct.lowPrice.toFixed(1)}
                      </p>
                    </div>
                    <div className="flex-1 mx-4 h-2 price-range-bar rounded-full" />
                    <div className="text-center">
                      <p className="text-xs text-zinc-600 mb-0.5">הכי יקר</p>
                      <p className="text-xl font-bold text-rose-400">
                        ₪{selectedProduct.highPrice.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <div className="text-center pt-3 border-t border-white/5">
                    <span className="text-xs text-zinc-600">ממוצע: </span>
                    <span className="text-lg font-semibold text-amber-400">
                      ₪{selectedProduct.averagePrice.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Price Input - Large touch targets */}
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-xl">
                      ₪
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min="0"
                      placeholder="הזן מחיר"
                      value={priceInput}
                      onChange={(e) => {
                        setPriceInput(e.target.value);
                        setPriceRating(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleCheckPrice()}
                      className="w-full pr-12 pl-4 py-5 rounded-2xl input-dark text-2xl font-bold text-center"
                    />
                  </div>
                  <button
                    onClick={handleCheckPrice}
                    disabled={!priceInput}
                    className="btn-gold px-8 py-5 rounded-2xl active:scale-95 transition-transform"
                  >
                    <Check className="w-7 h-7" />
                  </button>
                </div>

                {/* Rating Result */}
                {priceRating && (
                  <div
                    className={`p-5 rounded-2xl ${ratingConfig[priceRating].bg} animate-scale-in`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`${ratingConfig[priceRating].color}`}>
                        {ratingConfig[priceRating].icon}
                      </div>
                      <div>
                        <p className={`text-2xl font-bold ${ratingConfig[priceRating].color}`}>
                          {ratingConfig[priceRating].label}
                        </p>
                        <p className="text-zinc-400 text-sm mt-0.5">
                          {ratingConfig[priceRating].message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer - Minimal */}
      <footer className="fixed bottom-0 left-0 right-0 glass-card border-t border-white/5 py-3 safe-bottom z-40">
        <p className="text-center text-xs text-zinc-600">
          המחירים הם הערכה בלבד
        </p>
      </footer>
    </div>
  );
}
