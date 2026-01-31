import React, { useRef } from 'react';
import { ViewState } from '../types';
import { Home, ChefHat, Calendar, ShoppingCart, BarChart2, PlusCircle, Download, Upload, Share2, UtensilsCrossed } from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  children: React.ReactNode;
  onAddRecipe: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, setView, children, onAddRecipe, onExport, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { id: ViewState.DASHBOARD, label: '灵感', icon: Home },
    { id: ViewState.RECIPES, label: '菜谱库', icon: ChefHat },
    { id: ViewState.PLANNER, label: '饮食日历', icon: Calendar },
    { id: ViewState.SHOPPING, label: '采买清单', icon: ShoppingCart },
    { id: ViewState.STATS, label: '饮食分析', icon: BarChart2 },
  ];

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row font-sans text-stone-700">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={onImport}
        className="hidden"
        accept=".json"
      />

      {/* Mobile Header */}
      <div className="md:hidden bg-white/80 backdrop-blur-xl border-b border-stone-100 p-4 flex justify-between items-center sticky top-0 z-30">
        <h1 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <UtensilsCrossed className="text-orange-500" size={20}/>
            今天吃什么
        </h1>
        <div className="flex gap-1">
            <button 
                onClick={onAddRecipe}
                className="text-orange-600 bg-orange-50 p-2 rounded-full active:scale-95 transition-transform"
            >
                <PlusCircle size={24} />
            </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-stone-100 h-screen sticky top-0 p-6 shadow-[0_0_40px_-10px_rgba(0,0,0,0.03)] z-20">
        <h1 className="text-2xl font-black text-stone-800 mb-10 flex items-center gap-3 tracking-tight">
            <div className="bg-gradient-to-br from-orange-400 to-red-500 p-2.5 rounded-2xl text-white shadow-lg shadow-orange-200">
                <UtensilsCrossed size={24} strokeWidth={2.5} />
            </div>
            <span>今天吃什么？</span>
        </h1>
        
        <nav className="flex-1 space-y-1.5">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                        currentView === item.id 
                        ? 'bg-stone-900 text-white shadow-xl shadow-stone-200 font-medium translate-x-2' 
                        : 'text-stone-400 hover:bg-stone-50 hover:text-stone-800 hover:translate-x-1'
                    }`}
                >
                    <item.icon 
                        size={22} 
                        className={`transition-colors duration-300 ${currentView === item.id ? 'text-orange-400' : 'group-hover:text-orange-500'}`} 
                        strokeWidth={currentView === item.id ? 2.5 : 2}
                    />
                    <span className="text-[15px] tracking-wide">{item.label}</span>
                </button>
            ))}
        </nav>

        {/* Data Management Section */}
        <div className="mt-8 pt-6 border-t border-dashed border-stone-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={onExport}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-stone-50 text-stone-400 hover:bg-orange-50 hover:text-orange-600 transition-all text-xs font-medium"
                >
                    <Download size={18} /> 备份数据
                </button>
                <button 
                    onClick={handleImportClick}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-stone-50 text-stone-400 hover:bg-teal-50 hover:text-teal-600 transition-all text-xs font-medium"
                >
                    <Upload size={18} /> 恢复数据
                </button>
            </div>
        </div>

        <button 
            onClick={onAddRecipe}
            className="mt-6 w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-2xl font-bold hover:shadow-lg hover:shadow-orange-200 transition-all flex items-center justify-center gap-2 active:scale-95 duration-200"
        >
            <PlusCircle size={22} strokeWidth={2.5} /> 添加新菜谱
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 pb-28 md:pb-10 max-w-[1600px] mx-auto w-full overflow-x-hidden">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-stone-100 px-6 py-2 flex justify-between z-40 pb-safe shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
            <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 ${
                    currentView === item.id 
                    ? 'text-stone-800 -translate-y-2 bg-white shadow-lg shadow-stone-100 ring-1 ring-stone-50' 
                    : 'text-stone-300 hover:text-stone-500'
                }`}
            >
                <item.icon size={24} strokeWidth={currentView === item.id ? 2.5 : 2} className={currentView === item.id ? 'text-orange-500' : ''} />
                <span className={`text-[10px] font-bold transition-all ${currentView === item.id ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{item.label}</span>
            </button>
        ))}
      </nav>
    </div>
  );
};