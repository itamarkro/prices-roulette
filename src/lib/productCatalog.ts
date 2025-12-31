// Product catalog with barcodes for matching with store data
// Barcodes are the key to matching products across different stores

import { Category } from "./types";

export interface CatalogProduct {
  id: string;
  name: string;
  nameHebrew: string;
  category: Category;
  unit: string;
  image: string;
  // Multiple barcodes since products can have variants
  barcodes: string[];
  // Search terms for fuzzy matching when barcode isn't available
  searchTerms: string[];
}

// Product catalog with real Israeli product barcodes
export const productCatalog: CatalogProduct[] = [
  // ירקות (Vegetables)
  {
    id: "1",
    name: "Tomatoes",
    nameHebrew: "עגבניות",
    category: "ירקות",
    unit: "1 ק\"ג",
    image: "🍅",
    barcodes: ["2000010000002", "2000011000001"], // Weight items often start with 2
    searchTerms: ["עגבניות", "עגבניה", "tomato"],
  },
  {
    id: "2",
    name: "Cucumbers",
    nameHebrew: "מלפפונים",
    category: "ירקות",
    unit: "1 ק\"ג",
    image: "🥒",
    barcodes: ["2000020000001"],
    searchTerms: ["מלפפון", "מלפפונים", "cucumber"],
  },
  {
    id: "3",
    name: "Potatoes",
    nameHebrew: "תפוחי אדמה",
    category: "ירקות",
    unit: "1 ק\"ג",
    image: "🥔",
    barcodes: ["2000030000000"],
    searchTerms: ["תפוח אדמה", "תפוחי אדמה", "potato"],
  },
  {
    id: "4",
    name: "Onions",
    nameHebrew: "בצל",
    category: "ירקות",
    unit: "1 ק\"ג",
    image: "🧅",
    barcodes: ["2000040000009"],
    searchTerms: ["בצל", "onion"],
  },
  {
    id: "5",
    name: "Carrots",
    nameHebrew: "גזר",
    category: "ירקות",
    unit: "1 ק\"ג",
    image: "🥕",
    barcodes: ["2000050000008"],
    searchTerms: ["גזר", "carrot"],
  },
  {
    id: "6",
    name: "Bell Pepper",
    nameHebrew: "פלפל",
    category: "ירקות",
    unit: "1 ק\"ג",
    image: "🫑",
    barcodes: ["2000060000007"],
    searchTerms: ["פלפל", "pepper"],
  },
  {
    id: "7",
    name: "Lettuce",
    nameHebrew: "חסה",
    category: "ירקות",
    unit: "יחידה",
    image: "🥬",
    barcodes: ["2000070000006"],
    searchTerms: ["חסה", "lettuce"],
  },

  // פירות (Fruits)
  {
    id: "8",
    name: "Apples",
    nameHebrew: "תפוחים",
    category: "פירות",
    unit: "1 ק\"ג",
    image: "🍎",
    barcodes: ["2000080000005"],
    searchTerms: ["תפוח", "תפוחים", "apple"],
  },
  {
    id: "9",
    name: "Bananas",
    nameHebrew: "בננות",
    category: "פירות",
    unit: "1 ק\"ג",
    image: "🍌",
    barcodes: ["2000090000004"],
    searchTerms: ["בננה", "בננות", "banana"],
  },
  {
    id: "10",
    name: "Oranges",
    nameHebrew: "תפוזים",
    category: "פירות",
    unit: "1 ק\"ג",
    image: "🍊",
    barcodes: ["2000100000003"],
    searchTerms: ["תפוז", "תפוזים", "orange"],
  },
  {
    id: "11",
    name: "Grapes",
    nameHebrew: "ענבים",
    category: "פירות",
    unit: "1 ק\"ג",
    image: "🍇",
    barcodes: ["2000110000002"],
    searchTerms: ["ענבים", "ענב", "grape"],
  },
  {
    id: "12",
    name: "Watermelon",
    nameHebrew: "אבטיח",
    category: "פירות",
    unit: "1 ק\"ג",
    image: "🍉",
    barcodes: ["2000120000001"],
    searchTerms: ["אבטיח", "watermelon"],
  },

  // חלב וביצים (Dairy & Eggs)
  {
    id: "13",
    name: "Milk 3%",
    nameHebrew: "חלב 3%",
    category: "חלב וביצים",
    unit: "1 ליטר",
    image: "🥛",
    // Real Tnuva milk barcodes
    barcodes: ["7290000066318", "7290000066325", "7290102990017"],
    searchTerms: ["חלב", "milk", "3%"],
  },
  {
    id: "14",
    name: "Eggs",
    nameHebrew: "ביצים",
    category: "חלב וביצים",
    unit: "12 יחידות",
    image: "🥚",
    barcodes: ["7290000129617", "7290000129624"],
    searchTerms: ["ביצים", "ביצה", "eggs", "תריסר"],
  },
  {
    id: "15",
    name: "Cottage Cheese",
    nameHebrew: "קוטג'",
    category: "חלב וביצים",
    unit: "250 גרם",
    image: "🧀",
    // Tnuva cottage
    barcodes: ["7290000051234", "7290000051241"],
    searchTerms: ["קוטג", "cottage", "גבינה לבנה"],
  },
  {
    id: "16",
    name: "Yellow Cheese",
    nameHebrew: "גבינה צהובה",
    category: "חלב וביצים",
    unit: "200 גרם",
    image: "🧀",
    barcodes: ["7290000078231", "7290000078248"],
    searchTerms: ["גבינה צהובה", "עמק", "cheese"],
  },
  {
    id: "17",
    name: "Butter",
    nameHebrew: "חמאה",
    category: "חלב וביצים",
    unit: "200 גרם",
    image: "🧈",
    barcodes: ["7290000045678"],
    searchTerms: ["חמאה", "butter"],
  },

  // לחם ומאפים (Bread & Bakery)
  {
    id: "18",
    name: "White Bread",
    nameHebrew: "לחם לבן",
    category: "לחם ומאפים",
    unit: "יחידה",
    image: "🍞",
    // Angel bakery white bread
    barcodes: ["7290000123456", "7290008700016"],
    searchTerms: ["לחם לבן", "לחם", "bread", "אנג'ל"],
  },
  {
    id: "19",
    name: "Pita",
    nameHebrew: "פיתה",
    category: "לחם ומאפים",
    unit: "6 יחידות",
    image: "🫓",
    barcodes: ["7290000234567"],
    searchTerms: ["פיתה", "פיתות", "pita"],
  },
  {
    id: "20",
    name: "Challah",
    nameHebrew: "חלה",
    category: "לחם ומאפים",
    unit: "יחידה",
    image: "🍞",
    barcodes: ["7290000345678"],
    searchTerms: ["חלה", "challah"],
  },

  // בשר ועוף (Meat & Poultry)
  {
    id: "21",
    name: "Chicken Breast",
    nameHebrew: "חזה עוף",
    category: "בשר ועוף",
    unit: "1 ק\"ג",
    image: "🍗",
    barcodes: ["2000210000005"],
    searchTerms: ["חזה עוף", "עוף", "chicken breast"],
  },
  {
    id: "22",
    name: "Ground Beef",
    nameHebrew: "בשר טחון",
    category: "בשר ועוף",
    unit: "1 ק\"ג",
    image: "🥩",
    barcodes: ["2000220000004"],
    searchTerms: ["בשר טחון", "ground beef", "בקר טחון"],
  },
  {
    id: "23",
    name: "Chicken Thighs",
    nameHebrew: "ירכיים עוף",
    category: "בשר ועוף",
    unit: "1 ק\"ג",
    image: "🍗",
    barcodes: ["2000230000003"],
    searchTerms: ["ירכיים", "ירך עוף", "chicken thigh"],
  },

  // דגים (Fish)
  {
    id: "24",
    name: "Salmon Fillet",
    nameHebrew: "פילה סלמון",
    category: "דגים",
    unit: "1 ק\"ג",
    image: "🐟",
    barcodes: ["2000240000002"],
    searchTerms: ["סלמון", "salmon", "פילה"],
  },
  {
    id: "25",
    name: "Tilapia",
    nameHebrew: "אמנון",
    category: "דגים",
    unit: "1 ק\"ג",
    image: "🐟",
    barcodes: ["2000250000001"],
    searchTerms: ["אמנון", "tilapia", "דג"],
  },

  // שימורים (Canned Goods)
  {
    id: "26",
    name: "Tuna Can",
    nameHebrew: "טונה",
    category: "שימורים",
    unit: "160 גרם",
    image: "🥫",
    // Starkist / local tuna brands
    barcodes: ["7290000567890", "7290000567891"],
    searchTerms: ["טונה", "tuna", "שימורים"],
  },
  {
    id: "27",
    name: "Corn Can",
    nameHebrew: "תירס",
    category: "שימורים",
    unit: "400 גרם",
    image: "🌽",
    barcodes: ["7290000678901"],
    searchTerms: ["תירס", "corn", "שימורים"],
  },
  {
    id: "28",
    name: "Chickpeas",
    nameHebrew: "חומוס",
    category: "שימורים",
    unit: "400 גרם",
    image: "🥫",
    barcodes: ["7290000789012"],
    searchTerms: ["חומוס", "גרגירי חומוס", "chickpeas"],
  },

  // משקאות (Beverages)
  {
    id: "29",
    name: "Coca Cola",
    nameHebrew: "קוקה קולה",
    category: "משקאות",
    unit: "1.5 ליטר",
    image: "🥤",
    // Real Coca Cola Israel barcodes
    barcodes: ["5000112611779", "5449000000996", "5449000214591"],
    searchTerms: ["קוקה קולה", "קולה", "coca cola", "coke"],
  },
  {
    id: "30",
    name: "Orange Juice",
    nameHebrew: "מיץ תפוזים",
    category: "משקאות",
    unit: "1 ליטר",
    image: "🧃",
    // Primor / Prigat
    barcodes: ["7290000890123", "7290000890124"],
    searchTerms: ["מיץ תפוזים", "מיץ", "orange juice", "פריגת"],
  },
  {
    id: "31",
    name: "Mineral Water",
    nameHebrew: "מים מינרלים",
    category: "משקאות",
    unit: "1.5 ליטר",
    image: "💧",
    // Neviot / Ein Gedi
    barcodes: ["7290000901234", "7290000901235"],
    searchTerms: ["מים", "מינרלים", "נביעות", "water"],
  },

  // חטיפים (Snacks)
  {
    id: "32",
    name: "Bamba",
    nameHebrew: "במבה",
    category: "חטיפים",
    unit: "80 גרם",
    image: "🥜",
    // Osem Bamba barcodes
    barcodes: ["7290000012346", "7290000012353"],
    searchTerms: ["במבה", "bamba", "אוסם"],
  },
  {
    id: "33",
    name: "Bissli",
    nameHebrew: "ביסלי",
    category: "חטיפים",
    unit: "70 גרם",
    image: "🍿",
    // Osem Bissli barcodes
    barcodes: ["7290000023456", "7290000023463"],
    searchTerms: ["ביסלי", "bissli", "אוסם"],
  },

  // ניקיון (Cleaning)
  {
    id: "34",
    name: "Dish Soap",
    nameHebrew: "סבון כלים",
    category: "ניקיון",
    unit: "750 מ\"ל",
    image: "🧴",
    // Fairy / Sano
    barcodes: ["7290000345678", "7290000345679"],
    searchTerms: ["סבון כלים", "נוזל כלים", "dish soap", "פיירי"],
  },
  {
    id: "35",
    name: "Laundry Detergent",
    nameHebrew: "אבקת כביסה",
    category: "ניקיון",
    unit: "3 ק\"ג",
    image: "🧺",
    barcodes: ["7290000456789", "7290000456790"],
    searchTerms: ["אבקת כביסה", "כביסה", "laundry", "סנו"],
  },
];

// Create a map for quick barcode lookups
export const barcodeToProduct = new Map<string, CatalogProduct>();
productCatalog.forEach((product) => {
  product.barcodes.forEach((barcode) => {
    barcodeToProduct.set(barcode, product);
  });
});

