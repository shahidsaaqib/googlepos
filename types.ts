
export interface Product {
  id: string;
  name: string;
  genericName: string;
  category: string;
  price: number;
  stock: number;
  expiryDate: string;
  batchNumber: string;
  manufacturer: string;
  description: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  tax: number;
  discount: number;
  paymentMethod: 'cash' | 'card' | 'upi';
  timestamp: string;
  customerName?: string;
}

export type CloudProvider = 'none' | 'pocketbase' | 'firebase';

export interface FirebaseConfig {
  apiKey: string;
  projectId: string;
  authDomain: string;
}

export interface CloudUser {
  id: string;
  name: string;
  email: string;
  pharmacyName: string;
  isLoggedIn: boolean;
  provider: CloudProvider;
  pocketBaseUrl?: string;
  firebaseConfig?: FirebaseConfig;
}

export interface SyncState {
  isSyncing: boolean;
  lastSynced: string | null;
  status: 'online' | 'offline' | 'error';
  latency?: number;
}

export type View = 'dashboard' | 'pos' | 'inventory' | 'sales' | 'ai-assistant' | 'settings';
