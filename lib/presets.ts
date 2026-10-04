import { GarmentPreset } from "./decart";

export const GARMENT_PRESETS: GarmentPreset[] = [
  {
    id: "red-leather-jacket",
    name: "Crimson Moto Jacket",
    category: "Jackets",
    prompt: "Substitute the current top with a sleek red leather biker jacket with asymmetric silver zipper, polished lapels, and tailored waist",
    color: "from-red-600 to-rose-900",
    badge: "Popular",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "navy-blazer",
    name: "Executive Navy Blazer",
    category: "Formal & Blazers",
    prompt: "Substitute the current top with a tailored dark navy blue wool blazer over a crisp white dress shirt with open collar",
    color: "from-blue-800 to-slate-900",
    badge: "Formal",
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "denim-sherpa-jacket",
    name: "Vintage Sherpa Denim",
    category: "Jackets",
    prompt: "Substitute the current top with a vintage washed indigo denim jacket with a warm white fleece sherpa collar and front button closure",
    color: "from-sky-700 to-indigo-900",
    imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "cyber-neon-hoodie",
    name: "Cyber Neon Pullover",
    category: "Streetwear",
    prompt: "Substitute the current top with an oversized matte black streetwear hoodie featuring iridescent cyan and magenta geometric line graphics",
    color: "from-cyan-500 to-purple-800",
    badge: "Cyberpunk",
    imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "emerald-silk-bomber",
    name: "Emerald Silk Bomber",
    category: "Jackets",
    prompt: "Substitute the current top with a luxurious emerald green satin bomber jacket with ribbed gold trim collar and cuffs",
    color: "from-emerald-600 to-teal-950",
    imageUrl: "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "pastel-knit-sweater",
    name: "Chunky Cable Knit",
    category: "Hoodies & Sweaters",
    prompt: "Substitute the current top with a cosy oversized cream beige chunky cable knit turtleneck sweater with soft textured weave",
    color: "from-amber-100 to-stone-400",
    imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "tactical-techwear-vest",
    name: "Techwear Tactical Vest",
    category: "Streetwear",
    prompt: "Substitute the current top with a futuristic matte black tactical utility vest over a charcoal fitted long-sleeve compression shirt with modular buckles",
    color: "from-zinc-700 to-neutral-900",
    badge: "Techwear",
    imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "golden-baseball-cap",
    name: "Gold Embroidered Cap",
    category: "Accessories",
    prompt: "Add a premium structured black baseball cap with metallic gold embroidered logo onto the person's head",
    color: "from-yellow-600 to-neutral-900",
    badge: "Accessory",
    imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&auto=format&fit=crop&q=60"
  }
];

export const CATEGORIES = [
  "All",
  "Jackets",
  "Hoodies & Sweaters",
  "Formal & Blazers",
  "Streetwear",
  "Accessories"
] as const;
