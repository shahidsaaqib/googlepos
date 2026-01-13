
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Minus, CreditCard, Banknote, QrCode, ShoppingCart, User, X, CheckCircle2, Printer, Trash2, ArrowRight } from 'lucide-react';
import { Product, CartItem, Sale } from '../types';

interface POSProps {
  products: Product[];
  onCompleteSale: (sale: Sale) => void;
}

const POS: React.FC<POSProps> = ({ products, onCompleteSale }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [recentSale, setRecentSale] = useState<Sale | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.genericName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty > item.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const clearCart = () => {
    if (cart.length > 0 && confirm("Clear all items from cart?")) {
      setCart([]);
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05; 
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const sale: Sale = {
      id: `S-${Date.now().toString().slice(-6)}`,
      items: [...cart],
      total,
      tax,
      discount: 0,
      paymentMethod,
      timestamp: new Date().toISOString(),
      customerName: customerName || 'Walk-in Customer'
    };
    onCompleteSale(sale);
    setRecentSale(sale);
    setCart([]);
    setCustomerName('');
    setIsMobileCartOpen(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full max-h-[calc(100vh-120px)] overflow-hidden">
      
      {/* Product Catalog Section */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="relative flex-shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Search by medicine name or generic composition..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-4 no-scrollbar">
          {filteredProducts.map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
              className={`text-left p-5 bg-white border border-slate-200 rounded-3xl hover:border-blue-400 hover:shadow-xl transition-all flex flex-col justify-between group relative overflow-hidden ${product.stock === 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'active:scale-95'}`}
            >
              {product.stock > 0 && product.stock < 15 && (
                <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-tighter">Low Stock</div>
              )}
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors leading-tight line-clamp-2">{product.name}</h4>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-medium italic">{product.genericName}</p>
                <div className="mt-8 flex items-center justify-between">
                  <div>
                    <span className="text-blue-600 font-black text-2xl">${product.price.toFixed(2)}</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Per Unit</p>
                  </div>
                  <div className={`flex flex-col items-end`}>
                    <span className={`text-[11px] px-3 py-1 rounded-full font-bold ${product.stock < 20 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {product.stock === 0 ? 'Sold Out' : `${product.stock} Units`}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Cart / Mobile Overlay */}
      <div className={`
        fixed lg:static inset-0 z-40 lg:z-auto bg-white lg:bg-transparent lg:w-[400px] flex flex-col transition-transform duration-300
        ${isMobileCartOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
      `}>
        <div className="flex-1 bg-white border border-slate-200 lg:rounded-[32px] shadow-2xl lg:shadow-sm flex flex-col overflow-hidden">
          
          {/* Cart Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-tight">Active Order</h3>
                <p className="text-[10px] font-bold text-slate-400">{cart.length} ITEMS SELECTED</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearCart} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                <Trash2 className="w-5 h-5" />
              </button>
              <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-12 h-12 text-slate-400 stroke-[1.5]" />
                </div>
                <div>
                  <p className="font-black text-slate-500 uppercase">Cart is Empty</p>
                  <p className="text-xs text-slate-400 font-medium">Add medications to start billing</p>
                </div>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">${item.price.toFixed(2)} / unit</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-black w-6 text-center text-slate-700">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* CHECKOUT FOOTER - PINNED TO BOTTOM */}
          <div className="p-6 bg-white border-t-2 border-slate-50 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.03)] space-y-5">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Patient / Customer Name"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl">
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="text-slate-600">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span>Tax (5%)</span>
                <span className="text-slate-600">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-3xl text-slate-900 pt-3 border-t border-slate-200/50">
                <span className="text-sm self-center text-slate-400">GRAND TOTAL</span>
                <span className="text-blue-600">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[ 
                {id: 'cash', icon: <Banknote />, label: 'Cash'}, 
                {id: 'card', icon: <CreditCard />, label: 'Card'}, 
                {id: 'upi', icon: <QrCode />, label: 'UPI'} 
              ].map(p => (
                <button 
                  key={p.id} 
                  onClick={() => setPaymentMethod(p.id as any)} 
                  className={`flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all ${paymentMethod === p.id ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200 scale-[1.02]' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-100'}`}
                >
                  {React.cloneElement(p.icon as React.ReactElement, { className: 'w-6 h-6 mb-1' })}
                  <span className="text-[10px] font-black uppercase tracking-tighter">{p.label}</span>
                </button>
              ))}
            </div>

            {/* THE COMPLETE TRANSACTION BUTTON */}
            <button 
              disabled={cart.length === 0}
              onClick={handleCheckout}
              className={`
                w-full py-5 rounded-[24px] font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-3 relative overflow-hidden
                ${cart.length === 0 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200 hover:shadow-emerald-300 active:scale-[0.97] ring-4 ring-emerald-500/10'
                }
              `}
            >
              <CheckCircle2 className={`w-6 h-6 ${cart.length > 0 ? 'animate-bounce' : ''}`} />
              <span>COMPLETE TRANSACTION</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      {cart.length > 0 && !isMobileCartOpen && (
        <button 
          onClick={() => setIsMobileCartOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-5 rounded-full shadow-2xl flex items-center gap-3 animate-bounce shadow-blue-300"
        >
          <div className="relative">
            <ShoppingCart className="w-7 h-7" />
            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ring-2 ring-white">
              {cart.length}
            </span>
          </div>
          <span className="font-bold">Checkout</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      )}

      {/* Sale Success Modal */}
      {recentSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 text-center space-y-6">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Billing Done!</h2>
                <p className="text-slate-500 font-medium mt-1">Receipt ID: <span className="text-blue-600 font-bold">#{recentSale.id}</span></p>
              </div>
              
              <div className="bg-slate-50 rounded-3xl p-6 text-left space-y-4 border border-slate-100">
                <div className="max-h-48 overflow-y-auto pr-1 no-scrollbar space-y-3">
                  {recentSale.items.map(i => (
                    <div key={i.id} className="flex justify-between text-sm">
                      <span className="text-slate-600 font-bold">{i.name} <span className="text-slate-400 font-medium">×{i.quantity}</span></span>
                      <span className="font-black text-slate-800">${(i.price * i.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t-2 border-slate-200 border-dashed flex justify-between font-black text-2xl text-slate-900">
                  <span className="text-sm self-center text-slate-400">PAID AMOUNT</span>
                  <span className="text-emerald-600">${recentSale.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setRecentSale(null)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-xs">Close</button>
                <button onClick={() => window.print()} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-200 uppercase tracking-widest text-xs">
                  <Printer className="w-5 h-5" /> Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
