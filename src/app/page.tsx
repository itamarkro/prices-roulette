"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Sparkles,
  X,
  Check,
  AlertTriangle,
  Info,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Minus,
  ChevronDown,
  Zap,
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
    icon: <Sparkles className="w-6 h-6" />,
    message: "זה מחיר מעולה, קנה עכשיו!",
  },
  good: {
    label: "מחיר טוב",
    color: "text-green-400",
    bg: "rating-good",
    icon: <TrendingDown className="w-6 h-6" />,
    message: "מחיר הוגן, שווה לקנות",
  },
  average: {
    label: "מחיר ממוצע",
    color: "text-amber-400",
    bg: "rating-average",
    icon: <Minus className="w-6 h-6" />,
    message: "מחיר סביר, לא טוב ולא רע",
  },
  high: {
    label: "מחיר גבוה",
    color: "text-orange-400",
    bg: "rating-high",
    icon: <TrendingUp className="w-6 h-6" />,
    message: "כדאי לבדוק מקום אחר",
  },
  expensive: {
    label: "יקר מאוד!",
    color: "text-rose-400",
    bg: "rating-expensive",
    icon: <AlertTriangle className="w-6 h-6" />,
    message: "מחיר גבוה מהממוצע, חפש מקום אחר",
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
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg animate-pulse-glow">
                  <span className="text-2xl">🎰</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center">
                  <Zap className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient-gold">מחירון סופר</h1>
                <p className="text-sm text-zinc-500">בדוק מחירים בזמן אמת</p>
              </div>
            </div>

            <button
              onClick={refreshPrices}
              disabled={isRefreshing}
              className="group p-3 rounded-xl glass-card glass-card-hover focus-ring"
              title="רענן מחירים"
            >
              <RefreshCw
                className={`w-5 h-5 text-zinc-400 group-hover:text-amber-400 transition-colors ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>

          {/* Status bar */}
          <div className="mt-3 flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5">
              <span
                className={`w-2 h-2 rounded-full ${
                  dataSource === "crawled" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span className="text-zinc-400">
                {dataSource === "crawled" ? "מעודכן" : "בסיסי"}
              </span>
            </div>
            {lastUpdated && (
              <span className="text-zinc-600">{formatLastUpdated(lastUpdated)}</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="relative">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="חפש מוצר... (לדוגמא: עגבניות, חלב)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-14 pl-14 py-5 rounded-2xl input-dark text-lg"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all duration-200 ${
                showFilters || selectedCategory !== "all"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
              }`}
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Category Filter */}
          {showFilters && (
            <div className="mt-4 p-5 glass-card rounded-2xl animate-slide-up">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`category-pill px-5 py-2.5 rounded-xl text-sm font-medium ${
                    selectedCategory === "all" ? "active" : ""
                  }`}
                >
                  הכל
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`category-pill px-5 py-2.5 rounded-xl text-sm font-medium ${
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

        {/* Selected Product Card */}
        {selectedProduct && (
          <div className="mb-8 animate-scale-in">
            <div className="glass-card rounded-3xl p-8 relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-5">
                    <div className="text-6xl float">{selectedProduct.image}</div>
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-1">
                        {selectedProduct.nameHebrew}
                      </h2>
                      <p className="text-zinc-500 text-lg">{selectedProduct.unit}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClearSelection}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <X className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
                  </button>
                </div>

                {/* Price Range */}
                <div className="mb-8 p-6 rounded-2xl bg-black/20 border border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-400">טווח מחירים בשוק</span>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-xs text-zinc-600 mb-1">הכי זול</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        ₪{selectedProduct.lowPrice.toFixed(1)}
                      </p>
                    </div>
                    <div className="flex-1 h-3 price-range-bar rounded-full" />
                    <div className="text-center">
                      <p className="text-xs text-zinc-600 mb-1">הכי יקר</p>
                      <p className="text-2xl font-bold text-rose-400">
                        ₪{selectedProduct.highPrice.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-center pt-4 border-t border-white/5">
                    <p className="text-xs text-zinc-600 mb-1">מחיר ממוצע</p>
                    <p className="text-xl font-semibold text-amber-400">
                      ₪{selectedProduct.averagePrice.toFixed(1)}
                    </p>
                  </div>
                </div>

                {/* Price Input */}
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-xl">
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
                      className="w-full pr-14 pl-6 py-5 rounded-2xl input-dark text-xl font-medium"
                    />
                  </div>
                  <button
                    onClick={handleCheckPrice}
                    disabled={!priceInput}
                    className="btn-gold px-8 py-5 rounded-2xl flex items-center gap-2 text-lg font-bold"
                  >
                    <Check className="w-6 h-6" />
                    <span className="hidden sm:inline">בדוק</span>
                  </button>
                </div>

                {/* Price Rating Result */}
                {priceRating && (
                  <div
                    className={`mt-6 p-6 rounded-2xl ${ratingConfig[priceRating].bg} animate-scale-in`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`${ratingConfig[priceRating].color} glow-gold`}>
                        {ratingConfig[priceRating].icon}
                      </div>
                      <div>
                        <p className={`text-2xl font-bold ${ratingConfig[priceRating].color}`}>
                          {ratingConfig[priceRating].label}
                        </p>
                        <p className="text-zinc-400 mt-1">
                          {ratingConfig[priceRating].message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              {selectedCategory === "all" ? "כל המוצרים" : selectedCategory}
            </h2>
            <span className="text-sm text-zinc-500 bg-white/5 px-3 py-1.5 rounded-lg">
              {filteredProducts.length} מוצרים
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-3xl">
              <Search className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 text-xl font-medium">לא נמצאו מוצרים</p>
              <p className="text-zinc-600 mt-2">נסה לחפש משהו אחר</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className={`product-card p-5 rounded-2xl text-right opacity-0 animate-fade-in focus-ring ${
                    selectedProduct?.id === product.id ? "selected" : ""
                  }`}
                  style={{ animationDelay: `${Math.min(index * 0.04, 0.4)}s` }}
                >
                  <div className="text-4xl mb-3">{product.image}</div>
                  <h3 className="font-semibold text-white text-base leading-tight mb-1">
                    {product.nameHebrew}
                  </h3>
                  <p className="text-xs text-zinc-500 mb-3">{product.unit}</p>
                  <div className="price-badge inline-block px-3 py-1.5 rounded-lg text-sm font-bold">
                    ~₪{product.averagePrice.toFixed(1)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 glass-card border-t border-white/5 py-4">
        <p className="text-center text-sm text-zinc-600">
          המחירים הם הערכה בלבד ועשויים להשתנות בין חנויות
        </p>
      </footer>
    </div>
  );
}
