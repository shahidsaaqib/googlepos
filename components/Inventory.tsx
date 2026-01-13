
import React, { useState } from 'react';
import { Search, Plus, Info, X, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Product } from '../types.ts';
import { CATEGORIES } from '../constants.tsx';
import { getMedicineInsights } from '../services/gemini.ts';

interface InventoryProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [aiInsight, setAiInsight] = useState<{ id: string, text: string | null, loading: boolean }>({ id: '', text: null, loading: false });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    genericName: '',
    category: 'Analgesics',
    price: 0,
    stock: 0,
    expiryDate: '',
    batchNumber: '',
    manufacturer: '',
    description: ''
  });

  const filtered = products.filter(p => 
    (filter === 'All' || p.category === filter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.genericName.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        genericName: '',
        category: 'Analgesics',
        price: 0,
        stock: 0,
        expiryDate: '',
        batchNumber: '',
        manufacturer: '',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleGetInsight = async (product: Product) => {
    setAiInsight({ id: product.id, text: null, loading: true });
    const text = await getMedicineInsights(product.name);
    setAiInsight({ id: product.id, text, loading: false });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      ...formData as Product,
      price: Number(formData.price),
      stock: Number(formData.stock)
    };

    if (editingProduct) {
      onUpdateProduct(productData);
    } else {
      onAddProduct({ ...productData, id: `P-${Date.now()}` });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-1 gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Filter inventory..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Product Details</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Category</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Stock</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Price</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Expiry</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">AI Insights</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(product => (
              <React.Fragment key={product.id}>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{product.name}</div>
                    <div className="text-xs text-slate-400">{product.genericName} • {product.batchNumber}</div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{product.category}</span>
                  </td>
                  <td className="p-4">
                    <div className={`text-sm font-bold flex items-center gap-1.5 ${product.stock < 20 ? 'text-orange-600' : 'text-slate-700'}`}>
                      {product.stock < 20 && <AlertCircle className="w-4 h-4" />}
                      {product.stock} units
                    </div>
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-700">${product.price.toFixed(2)}</td>
                  <td className="p-4">
                    <div className="text-xs text-slate-500">{product.expiryDate}</div>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleGetInsight(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors inline-flex items-center"
                      title="Get AI Drug Info"
                    >
                      <Info className="w-5 h-5" />
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleOpenModal(product)}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDeleteProduct(product.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                {aiInsight.id === product.id && (
                  <tr>
                    <td colSpan={7} className="p-4 bg-blue-50/50">
                      <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm relative">
                        <button 
                          onClick={() => setAiInsight({ id: '', text: null, loading: false })}
                          className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 text-sm"
                        >✕</button>
                        <h5 className="text-blue-700 font-bold flex items-center gap-2 mb-2 text-sm">
                          <Info className="w-4 h-4" /> Pharmacist Assistant Insights
                        </h5>
                        {aiInsight.loading ? (
                          <div className="flex items-center gap-2 text-slate-500 text-xs animate-pulse">
                            Consulting database...
                          </div>
                        ) : (
                          <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                            {aiInsight.text}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Product Name</label>
                <input required type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Generic Name</label>
                <input required type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.genericName} onChange={e => setFormData({...formData, genericName: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Category</label>
                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Price ($)</label>
                <input required type="number" step="0.01" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value as any})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Stock</label>
                <input required type="number" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value as any})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Expiry Date</label>
                <input required type="date" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Batch Number</label>
                <input required type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.batchNumber} onChange={e => setFormData({...formData, batchNumber: e.target.value})} />
              </div>
              <div className="md:col-span-2 flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
