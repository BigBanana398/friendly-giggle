import React, { useState } from 'react';
import { Recipe } from '../types';
import { Clock, Flame, Star, Trash2, Tag, CircleDollarSign, UtensilsCrossed } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect?: (recipe: Recipe) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
    '蔬菜': 'bg-teal-100 text-teal-800',
    '肉类': 'bg-red-100 text-red-800',
    '海鲜': 'bg-blue-100 text-blue-800',
    '菌类': 'bg-orange-100 text-orange-800',
    '主食': 'bg-yellow-100 text-yellow-800',
    '汤品': 'bg-cyan-100 text-cyan-800',
    '其他': 'bg-stone-100 text-stone-800'
};

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelect, onDelete, compact = false }) => {
  const [imgError, setImgError] = useState(false);

  // Determine if we should show the fallback image (if URL is empty or load failed)
  const showFallback = imgError || !recipe.image;

  return (
    <div 
      className={`bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-lg hover:border-orange-100 transition-all cursor-pointer flex group ${compact ? 'flex-row h-24' : 'flex-col'}`}
      onClick={() => onSelect && onSelect(recipe)}
    >
      <div className={`relative ${compact ? 'w-24 h-24 shrink-0' : 'w-full h-32'} overflow-hidden bg-stone-100`}>
        {showFallback ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 p-2 bg-stone-50">
                <UtensilsCrossed size={compact ? 24 : 32} />
                {!compact && <span className="text-[10px] mt-1 font-bold">暂无图片</span>}
            </div>
        ) : (
            <img 
              src={recipe.image} 
              alt={recipe.title} 
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImgError(true)}
            />
        )}
        
        {!compact && (
           <div className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-orange-500 flex items-center gap-0.5 shadow-sm">
             <Star size={10} fill="currentColor" /> {recipe.rating}
           </div>
        )}
      </div>
      
      <div className={`p-3 flex flex-col justify-between flex-1 min-w-0`}>
        <div>
            <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${CATEGORY_COLORS[recipe.category] || CATEGORY_COLORS['其他']}`}>
                    {recipe.category}
                </span>
                {compact && (
                    <span className="text-xs font-bold text-stone-600 flex items-center gap-0.5 ml-auto">
                         <span className="text-[10px] text-stone-400">¥</span>{recipe.price}
                    </span>
                )}
            </div>
            <h3 className="font-bold text-stone-800 text-sm leading-tight mb-1 line-clamp-1 truncate group-hover:text-orange-600 transition-colors">{recipe.title}</h3>
            {!compact && <p className="text-[10px] text-stone-500 line-clamp-2 mb-2 leading-relaxed">{recipe.description}</p>}
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-stone-50">
            {!compact ? (
                <div className="flex items-center gap-2 text-[10px] text-stone-400 w-full font-medium">
                    <span className="flex items-center gap-0.5">
                        <Clock size={12} className="text-orange-300" /> {recipe.cookTime}m
                    </span>
                    <span className="flex items-center gap-0.5">
                        <CircleDollarSign size={12} className="text-teal-300" /> ¥{recipe.price}
                    </span>
                </div>
            ) : null}
            
            {onDelete && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(recipe.id); }}
                    className="text-stone-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 ml-auto transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
      </div>
    </div>
  );
};