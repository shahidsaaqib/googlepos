
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Menu, X, Bell, User as UserIcon, RotateCcw, Cloud, CloudSync, Settings as SettingsIcon, CheckCircle, AlertCircle, ShieldCheck, ArrowLeft, Database, Zap, Share2, Server, Globe, ExternalLink, RefreshCw, HardDrive, Wifi, Copy, Laptop, FolderOpen, Rocket, Download, Store, Info, HardDriveDownload, HelpCircle, FileQuestion, ArrowRight, Monitor, Smartphone, Lock, Gift, Shield, PlayCircle, Save, FileUp, FileDown, Trash, Github, Terminal, Link, LayoutGrid, Key, ShieldAlert } from 'lucide-react';
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
  const [pocketBaseInput, setPocketBaseInput] = useState(user?.pocketBaseUrl || 'http://127.0.0.1:8090');
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
      case 'dashboard': return (
        <div className="space-y-6">
          {isDemoMode && (
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-[32px] flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                  <Globe className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-black text-blue-900 text-lg">Online Permanent Mode</p>
                  <p className="text-blue-700 text-xs font-bold uppercase tracking-tight">GitHub + Firebase = Automatic Cloud Backup</p>
                </div>
              </div>
              <button onClick={() => setActiveView('settings')} className="px-6 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2">
                 <Rocket className="w-4 h-4" /> Setup Online Sync
              </button>
            </div>
          )}
          <Dashboard sales={sales} products={products} />
        </div>
      );
      case 'pos': return <POS products={products} onCompleteSale={handleCompleteSale} />;
      case 'inventory': return <Inventory products={products} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} />;
      case 'ai-assistant': return <AIPharmacist products={products} />;
      case 'sales': return (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-800">Sales History</h2>
              <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase border border-slate-100 hover:bg-slate-100 transition-all">
                <Download className="w-4 h-4" /> Export All
              </button>
           </div>
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
        <div className="max-w-7xl mx-auto space-y-12 pb-32">
          {/* Header */}
          <div className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-2xl shadow-blue-500/5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-slate-50 pb-12 mb-12">
              <div className="flex items-center gap-8">
                <div className="w-24 h-24 bg-blue-600 rounded-[38px] flex items-center justify-center text-white shadow-2xl shadow-blue-500/20">
                  <SettingsIcon className="w-12 h-12" />
                </div>
                <div>
                  <h2 className="text-4xl font-black text-slate-800 tracking-tight">System Settings</h2>
                  <p className="text-sm text-slate-400 font-bold uppercase mt-1">GitHub Hosting & Firebase Database Sync</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-12">
                {/* CLOUD OPTION: FIREBASE */}
                <div className="p-10 bg-slate-900 rounded-[48px] border border-slate-800 space-y-8 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                    <Zap className="w-40 h-40 text-yellow-400" />
                  </div>
                  <div className="flex items-center justify-between relative z-10">
                    <h3 className="text-2xl font-black flex items-center gap-4 uppercase tracking-tight">
                      <Cloud className="w-7 h-7 text-yellow-400" /> Permanent Database
                    </h3>
                  </div>
                  
                  <div className="space-y-6 relative z-10">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                       <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Firebase Guide (Urdu):</p>
                       <ol className="text-xs text-slate-300 space-y-3 list-decimal ml-4 font-medium leading-relaxed">
                         <li>Firebase mein **Realtime Database** on karein.</li>
                         <li>"Rules" mein ja kar `.read` aur `.write` ko **true** kar dein.</li>
                         <li>Apna Database URL (https://...) yahan daalein.</li>
                         <li>Aapka data GitHub par hamesha mehfooz rahega!</li>
                       </ol>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 mb-2 block">Firebase Database URL</label>
                        <div className="relative">
                          <Link className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input 
                            type="text" 
                            value={firebaseUrl}
                            onChange={(e) => setFirebaseUrl(e.target.value)}
                            placeholder="https://your-app.firebaseio.com"
                            className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-yellow-500/20 transition-all font-bold text-white text-sm"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={() => handleLogin('admin@cloud.pos', 'firebase', { authDomain: firebaseUrl, apiKey: firebaseSecret })}
                        disabled={isBootstrapping}
                        className="w-full py-5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                         {isBootstrapping ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                         {isBootstrapping ? 'Connecting...' : 'Connect to Google Cloud'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* GITHUB PAGES GUIDE */}
                <div className="p-10 bg-slate-50 rounded-[48px] border border-slate-200 space-y-8 relative overflow-hidden">
                   <div className="flex items-center gap-4">
                      <Github className="w-8 h-8 text-slate-800" />
                      <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">GitHub Pages Setup</h3>
                   </div>
                   <div className="space-y-6">
                      <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl">
                        <p className="text-[10px] font-black text-rose-600 uppercase mb-1">Dhyan Dein (Warning):</p>
                        <p className="text-xs text-rose-700 font-bold leading-relaxed">
                          GitHub agar "npm install" kahe toh usay **Ignore** karein. Ye app direct chalti hai baghair kisi command ke.
                        </p>
                      </div>
                      <div className="space-y-4">
                         <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0 font-black text-blue-600 text-xs shadow-sm">1</div>
                            <p className="text-[11px] text-slate-500 font-bold uppercase mt-1">Upload files to Repository</p>
                         </div>
                         <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0 font-black text-blue-600 text-xs shadow-sm">2</div>
                            <p className="text-[11px] text-slate-500 font-bold uppercase mt-1">Settings > Pages > Branch: Main > Save</p>
                         </div>
                         <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0 font-black text-blue-600 text-xs shadow-sm">3</div>
                            <p className="text-[11px] text-slate-500 font-bold uppercase mt-1">Aapka Link live ho jayega!</p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* SECOND COLUMN */}
              <div className="space-y-12">
                <div className="p-10 bg-emerald-50 rounded-[48px] border border-emerald-100 space-y-8">
                  <div className="flex items-center gap-4">
                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                    <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-tight">Data Backup</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={exportData} className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl hover:shadow-xl transition-all border border-emerald-200 group">
                       <FileDown className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                       <span className="text-[10px] font-black uppercase text-emerald-800">Download All</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl hover:shadow-xl transition-all border border-emerald-200 group">
                       <FileUp className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                       <span className="text-[10px] font-black uppercase text-blue-800">Restore Data</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={importData} className="hidden" accept=".json" />
                  </div>
                </div>

                <div className="p-10 bg-white border border-slate-100 rounded-[48px] space-y-8 shadow-sm">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4 uppercase tracking-tight">
                    <Store className="w-7 h-7 text-blue-600" /> Shop Profile
                  </h3>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Pharmacy / Store Name</label>
                    <input 
                      type="text" 
                      value={pharmacyName}
                      onChange={(e) => setPharmacyName(e.target.value)}
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[28px] outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-slate-700 text-lg"
                    />
                  </div>
                </div>
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
            <div className="w-12 h-12 bg-blue-600 rounded-[18px] flex items-center justify-center text-white shadow-xl shadow-blue-500/20"><Bell className="w-6 h-6" /></div>
            <div><h1 className="text-2xl font-black text-slate-800 tracking-tighter">MedFlow</h1><p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Smart POS</p></div>
          </div>
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => { setActiveView(item.id as View); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all group ${activeView === item.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/30' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}>
                {React.cloneElement(item.icon as React.ReactElement, { className: 'w-5 h-5' })}<span className="font-bold text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-6 border-t border-slate-50">
            <div className={`flex items-center gap-4 p-4 rounded-3xl border transition-all ${isDemoMode ? 'bg-slate-50 border-slate-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className={`w-10 h-10 rounded-2xl bg-white border flex items-center justify-center shadow-sm ${isDemoMode ? 'text-slate-400' : 'text-emerald-500 border-emerald-200'}`}>
                {user?.provider === 'firebase' ? <Cloud className="w-5 h-5 text-yellow-500" /> : user?.provider === 'pocketbase' ? <Database className="w-5 h-5 text-blue-500" /> : <HardDrive className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-800 truncate">{pharmacyName}</p>
                <p className={`text-[10px] font-bold uppercase tracking-tighter truncate ${isDemoMode ? 'text-slate-400' : 'text-emerald-600'}`}>
                  {isDemoMode ? 'Offline Mode' : `${user?.provider} Active`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-20 bg-white border-b border-slate-50 px-10 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 text-slate-500 hover:bg-slate-50 rounded-2xl lg:hidden transition-all">{isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
            <div className="flex items-center gap-3">
               <h2 className="text-xl font-black text-slate-800 capitalize tracking-tight">{activeView.replace('-', ' ')}</h2>
               {isDemoMode && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-widest hidden sm:inline-block">Local Device Only</span>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`hidden md:flex items-center gap-3 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all ${sync.status === 'online' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : sync.status === 'error' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              {isDemoMode ? <HardDrive className="w-4 h-4" /> : (sync.isSyncing ? <CloudSync className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />)}
              {isDemoMode ? 'OFFLINE' : (sync.isSyncing ? 'SYNCING...' : sync.status === 'online' ? 'CLOUD SYNC' : 'OFFLINE')}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-10 no-scrollbar">{renderView()}</div>
      </main>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[48px] shadow-2xl w-full max-lg overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div><h3 className="text-2xl font-black text-slate-800">Bill #{selectedSale.id.slice(-6)}</h3><p className="text-xs font-bold text-slate-400 uppercase mt-1">{new Date(selectedSale.timestamp).toLocaleString()}</p></div>
              <button onClick={() => setSelectedSale(null)} className="p-4 bg-white border border-slate-100 text-slate-400 hover:text-slate-600 rounded-3xl transition-all shadow-sm"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-4">
                {selectedSale.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div><span className="text-sm font-black text-slate-800 block">{item.name}</span><span className="text-xs text-slate-400 font-bold">Qty: {item.quantity}</span></div>
                    <span className="font-black text-slate-800">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t-2 border-slate-100 border-dashed flex justify-between font-black text-3xl text-slate-900 pt-4">
                <span className="text-sm self-center text-slate-400 font-bold uppercase">Grand Total</span>
                <span className="text-blue-600">${selectedSale.total.toFixed(2)}</span>
              </div>
            </div>
            <div className="p-10 bg-slate-50/50 flex gap-4">
              <button onClick={() => window.print()} className="flex-1 py-5 bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20">Print Receipt</button>
              <button onClick={() => setSelectedSale(null)} className="flex-1 py-5 bg-white text-slate-600 border border-slate-200 rounded-[24px] font-black text-xs uppercase">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
