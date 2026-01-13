
import React from 'react';
import { LayoutDashboard, ShoppingCart, Package, ReceiptText, Bot, Settings as SettingsIcon } from 'lucide-react';
import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Paracetamol 500mg',
    genericName: 'Acetaminophen',
    category: 'Analgesics',
    price: 15.50,
    stock: 250,
    expiryDate: '2025-12-01',
    batchNumber: 'BT-9921',
    manufacturer: 'HealthCorp',
    description: 'Relief of mild to moderate pain and fever.'
  }
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'pos', label: 'Billing / POS', icon: <ShoppingCart className="w-5 h-5" /> },
  { id: 'inventory', label: 'Inventory', icon: <Package className="w-5 h-5" /> },
  { id: 'sales', label: 'Sales History', icon: <ReceiptText className="w-5 h-5" /> },
  { id: 'ai-assistant', label: 'AI Assistant', icon: <Bot className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
];

export const CATEGORIES = [
  'All',
  'Analgesics',
  'Antibiotics',
  'Antihistamines',
  'Gastrointestinal',
  'Antidiabetics',
  'Cardiovascular',
  'Dermatological'
];
