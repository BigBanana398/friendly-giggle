
export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  category: 'produce' | 'meat' | 'dairy' | 'pantry' | 'other' | 'seafood'; // Added seafood
}

export type RecipeCategory = '蔬菜' | '肉类' | '海鲜' | '菌类' | '主食' | '汤品' | '其他';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string; // URL
  cookTime: number; // minutes
  calories: number;
  tags: string[]; // e.g., "Vegetarian", "Spicy", "Kids Favorite"
  ingredients: Ingredient[];
  instructions: string[];
  rating: number; // 0-5
  timesCooked: number;
  lastCooked?: string; // ISO date
  category: RecipeCategory; // NEW
  price: number; // NEW (Estimated cost)
}

export interface WeeklyPlan {
  [date: string]: string[]; // Changed: Supports multiple recipe IDs per day
}

export interface UserPreference {
  id: string;
  name: string;
  dislikes: string[];
  allergies: string[];
  dietaryGoal?: string;
}

export enum ViewState {
  DASHBOARD = 'dashboard',
  RECIPES = 'recipes',
  PLANNER = 'planner',
  SHOPPING = 'shopping',
  STATS = 'stats'
}

export type PlannerViewMode = 'week' | 'month' | 'year';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Data structure for export/import
export interface AppData {
  recipes: Recipe[];
  plan: WeeklyPlan;
  preferences: UserPreference;
  version: string;
  exportDate: string;
}
