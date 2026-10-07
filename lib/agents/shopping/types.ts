export type EngineType = 'google_shopping' | 'amazon' | 'google_lens' | 'bing';

export interface Product {
  id: string; // unique hash or slug
  title: string;
  image: string; // strictly required; dropped if missing
  price?: number;
  currency?: string;
  priceText?: string;
  store?: string;
  link: string;
  rating?: number;
  engine: EngineType;
}

export interface EngineResult {
  engine: EngineType;
  success: boolean;
  count: number;
  durationMs: number;
  error?: string;
  products: Product[];
}

export interface WardrobeMemoryItem {
  id: string;
  title: string;
  category: 'top' | 'bottom' | 'shoes' | 'outerwear' | 'accessory';
  color?: string;
  pattern?: string;
  fabric?: string;
  sleeves?: string;
  notes?: string;
  triedAt?: string;
}

export interface ParallelSearchResponse {
  query: string;
  imageUrl?: string;
  totalProducts: number;
  engineResults: Record<EngineType, {
    status: 'pending' | 'ok' | 'empty' | 'error' | 'skipped';
    durationMs: number;
    count: number;
    error?: string;
  }>;
  fallbackTriggered: boolean;
  products: Product[];
}

export interface GarmentAnalysis {
  garmentType: string;
  primaryColor: string;
  secondaryColors: string[];
  pattern: string;
  fabric: string;
  styleVibe: string;
  recommendedBottomTypes: string[];
  recommendedColors: string[];
  recommendedShoes: string[];
  searchQueries: string[];
}
