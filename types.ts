
export enum Screen {
  HOME = 'HOME',
  ANALYZE_ME = 'ANALYZE_ME',
  OUTFIT_MATCH = 'OUTFIT_MATCH',
  EVENT_STYLIST = 'EVENT_STYLIST',
  SKINCARE = 'SKINCARE',
  SHOP = 'SHOP',
  AUTH = 'AUTH'
}

export type Language = 'en' | 'hi';

export interface UserProfile {
  uid: string;
  name: string;
  photoURL?: string;
  analyzedData?: AnalysisResult;
}

export interface AnalysisResult {
  faceShape: string;
  skinTone: string;
  bodyType: string;
  lookalike: string;
  bestColors: string[];
  bestPatterns: string[];
  hairstyle: string;
  sunglasses: string;
  outfitCombinations: {
    style: string;
    top: string;
    bottom: string;
    footwear: string;
  }[];
}

export interface OutfitMatchResult {
  score: number;
  verdict: string;
  reasoning: string;
  styleTips: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 string
  timestamp: number;
}

export interface SkincareRoutine {
  skinType: string;
  morning: string[];
  evening: string[];
  products: string[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  image: string; // URL
  link: string; // Shopping URL
  category: 'Top' | 'Bottom' | 'Shoes' | 'Accessory';
  tags: string[]; // e.g., "Casual", "Party", "Blue", "Slim"
  colors: string[];
  matchScore?: number; // Calculated dynamically
}
