
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { DollarSign, ShoppingBag, PackageX, CalendarClock, TrendingUp, AlertCircle } from 'lucide-react';
import StatCard from './ui/StatCard';
import { Sale, Product } from '../types';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
}

const Dashboard: React.FC<DashboardProps> = ({ sales, products }) => {
  const totalSalesValue = sales.reduce((acc, sale) => acc + sale.total, 0);
  const lowStockCount = products.filter(p => p.stock < 20).length;
  const expiringSoonCount = products.filter(p => {
    const expiry = new Date(p.expiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiry <= threeMonthsFromNow;
  }).length;

  const chartData = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 2000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 1890 },
    { name: 'Sat', sales: 2390 },
    { name: 'Sun', sales: 3490 },
  ];

  const categoryData = [
    { name: 'Antibiotics', value: 400 },
    { name: 'Analgesics', value: 300 },
    { name: 'Gastro', value: 300 },
    { name: 'Cardiac', value: 200 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={`$${totalSalesValue.toLocaleString()}`} 
          icon={<DollarSign className="w-6 h-6 text-blue-600" />} 
          trend="+12.5%" 
          color="bg-blue-50"
        />
        <StatCard 
          title="Daily Orders" 
          value={sales.length} 
          icon={<ShoppingBag className="w-6 h-6 text-emerald-600" />} 
          trend="+5.2%" 
          color="bg-emerald-50"
        />
        <StatCard 
          title="Low Stock Alerts" 
          value={lowStockCount} 
          icon={<PackageX className="w-6 h-6 text-orange-600" />} 
          color="bg-orange-50"
        />
        <StatCard 
          title="Expiring Soon" 
          value={expiringSoonCount} 
          icon={<CalendarClock className="w-6 h-6 text-rose-600" />} 
          color="bg-rose-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Sales Performance
            </h3>
            <select className="text-sm border-slate-200 rounded-lg bg-slate-50 px-2 py-1 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#3b82f6', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Stock Categories
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12}} width={80} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {products.filter(p => p.stock < 10).slice(0, 3).map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm p-2 bg-orange-50 rounded-lg">
                <span className="text-slate-700 font-medium truncate max-w-[150px]">{p.name}</span>
                <span className="text-orange-600 font-bold">{p.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
