
import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { View, Product, Sale, CloudUser, SyncState, CloudProvider } from './types.ts';
import { NAV_ITEMS, INITIAL_PRODUCTS } from './constants.tsx';
import Dashboard from './components/Dashboard.tsx';
import POS from './components/POS.tsx';
import Inventory from './components/Inventory.tsx';
import AIPharmacist from './components/AIPharmacist.tsx';
import { StorageService } from './services/storageService.ts';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [user, setUser] = useState<CloudUser | null>(() => StorageService.getLocal('user'));
  const [sync, setSync] = useState<SyncState>({ isSyncing: false, lastSynced: StorageService.getLocal('last_sync_time'), status: user?.isLoggedIn ? 'online' : 'offline' });
  const [firebaseUrl, setFirebaseUrl] = useState(user?.firebaseConfig?.authDomain || '');
  const [firebaseSecret, setFirebaseSecret] = useState(user?.firebaseConfig?.apiKey || '');
  const [pharmacyName, setPharmacyName] = useState(user?.pharmacyName || 'My Medical Store');
  
  const [products, setProducts] = useState<Product[]>(() => {
    return StorageService.getLocal('products') || INITIAL_PRODUCTS;
  });
  
  const [sales, setSales] = useState<Sale[]>(() => {
    return StorageService.getLocal('sales') || [];
  });

  const isDemoMode = !user?.isLoggedIn || user.provider === 'none';

  const exportData = () => {
    const data = { products, sales, pharmacyName, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.products && json.sales) {
          if (confirm("Importing will replace current data. Continue?")) {
            setProducts(json.products);
            setSales(json.sales);
            if (json.pharmacyName) setPharmacyName(json.pharmacyName);
            alert("Data Restored Successfully!");
          }
        }
      } catch (err) { alert("Invalid backup file!"); }
    };
    reader.readAsText(file);
  };

  const performSync = useCallback(async (manual = false) => {
    if (isDemoMode && !manual) return;
    setSync(prev => ({ ...prev, isSyncing: true }));
    try {
      const pSuccess = await StorageService.syncToCloud('products', products, user);
      const sSuccess = await StorageService.syncToCloud('sales', sales, user);
      const now = new Date().toLocaleTimeString();
      setSync({ isSyncing: false, lastSynced: now, status: (pSuccess && sSuccess) ? 'online' : 'error' });
      StorageService.saveLocal('last_sync_time', now);
    } catch (e) {
      setSync(prev => ({ ...prev, isSyncing: false, status: 'error' }));
    }
  }, [products, sales, user, isDemoMode]);

  useEffect(() => {
    StorageService.saveLocal('products', products);
    StorageService.saveLocal('sales', sales);
    StorageService.saveLocal('user', user);
    const timeout = setTimeout(() => performSync(), 15000);
    return () => clearTimeout(timeout);
  }, [products, sales, user, performSync]);

  const handleCompleteSale = useCallback((newSale: Sale) => {
    setSales(prev => [newSale, ...prev]);
    setProducts(prev => prev.map(p => {
      const soldItem = newSale.items.find(item => item.id === p.id);
      if (soldItem) return { ...p, stock: Math.max(0, p.stock - soldItem.quantity) };
      return p;
    }));
  }, []);

  const handleAddProduct = useCallback((newProduct: Product) => setProducts(prev => [newProduct, ...prev]), []);
  const handleUpdateProduct = useCallback((updatedProduct: Product) => setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)), []);
  const handleDeleteProduct = useCallback((id: string) => { if (confirm("Delete product?")) setProducts(prev => prev.filter(p => p.id !== id)) }, []);

  const handleLogin = async (email: string, provider: CloudProvider, config?: any) => {
    setIsBootstrapping(true);
    try {
      const userData = await StorageService.login(email, provider, config);
      const updatedUser = { ...userData, pharmacyName };
      setUser(updatedUser);
      const remoteProducts = await StorageService.fetchFromCloud('products', updatedUser);
      const remoteSales = await StorageService.fetchFromCloud('sales', updatedUser);
      if (remoteProducts) setProducts(remoteProducts);
      if (remoteSales) setSales(remoteSales);
      alert(`${provider.toUpperCase()} Connected Successfully!`);
    } catch (e) {
      alert("Cloud Connection Failed!");
    } finally {
      setIsBootstrapping(false);
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard sales={sales} products={products} />;
      case 'pos': return <POS products={products} onCompleteSale={handleCompleteSale} />;
      case 'inventory': return <Inventory products={products} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} />;
      case 'ai-assistant': return <AIPharmacist products={products} />;
      case 'sales': return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
           <h2 className="text-2xl font-black text-slate-800 mb-6">Sales History</h2>
           <div className="space-y-3">
              {sales.length === 0 ? (
                <div className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest text-sm">No sales found</div>
              ) : sales.map(s => (
                <div key={s.id} onClick={() => setSelectedSale(s)} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 flex justify-between items-center hover:bg-white hover:border-blue-200 cursor-pointer transition-all">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-blue-600 text-xs shadow-sm">#{s.id.slice(-4)}</div>
                    <div>
                      <div className="font-black text-slate-800 text-sm">{s.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(s.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-emerald-600 text-lg">${s.total.toFixed(2)}</div>
                    <div className="text-[10px] uppercase font-black text-slate-300">{s.paymentMethod}</div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      );
      case 'settings': return (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-4">
            <Icons.Settings className="w-8 h-8 text-blue-600" /> System Settings
          </h2>
          <div className="space-y-8">
            <div className="p-8 bg-blue-50 border border-blue-100 rounded-2xl">
              <h3 className="text-lg font-black text-blue-900 mb-4 flex items-center gap-2">
                <Icons.Cloud className="w-5 h-5" /> Cloud Sync (Firebase)
              </h3>
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={firebaseUrl}
                  onChange={(e) => setFirebaseUrl(e.target.value)}
                  placeholder="Firebase DB URL (https://...)"
                  className="w-full px-6 py-4 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                />
                <button 
                  onClick={() => handleLogin('admin@medflow.com', 'firebase', { authDomain: firebaseUrl, apiKey: firebaseSecret })}
                  disabled={isBootstrapping}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  {isBootstrapping ? <Icons.RefreshCw className="w-5 h-5 animate-spin" /> : <Icons.Zap className="w-5 h-5" />}
                  {isBootstrapping ? 'Connecting...' : 'Connect to Cloud'}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
      default: return <Dashboard sales={sales} products={products} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 transition-transform lg:translate-x-0 lg:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 border-b border-slate-50 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white"><Icons.Bell className="w-6 h-6" /></div>
            <div><h1 className="text-2xl font-black text-slate-800 tracking-tighter">MedFlow</h1><p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Smart POS</p></div>
          </div>
          <nav className="flex-1 p-6 space-y-2">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => { setActiveView(item.id as View); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeView === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}>
                {item.icon}<span className="font-bold text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-50 px-10 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 text-slate-500 hover:bg-slate-50 rounded-2xl lg:hidden"><Icons.Menu className="w-6 h-6" /></button>
            <h2 className="text-xl font-black text-slate-800 capitalize">{activeView.replace('-', ' ')}</h2>
          </div>
          <div className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all ${sync.status === 'online' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
            {sync.status === 'online' ? <Icons.Wifi className="w-4 h-4 inline mr-2" /> : <Icons.HardDrive className="w-4 h-4 inline mr-2" />}
            {sync.status === 'online' ? 'Cloud Sync Active' : 'Offline Mode'}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-10 no-scrollbar">{renderView()}</div>
      </main>

      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden p-10 text-center">
            <Icons.CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-slate-800">Sale Details</h3>
            <div className="mt-6 space-y-4 text-left">
               {selectedSale.items.map(item => (
                 <div key={item.id} className="flex justify-between text-sm p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold">{item.name} x{item.quantity}</span>
                    <span className="font-black">${(item.price * item.quantity).toFixed(2)}</span>
                 </div>
               ))}
               <div className="pt-4 border-t-2 border-dashed border-slate-200 flex justify-between text-xl font-black text-blue-600">
                  <span>Total Paid</span>
                  <span>${selectedSale.total.toFixed(2)}</span>
               </div>
            </div>
            <button onClick={() => setSelectedSale(null)} className="mt-10 w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
