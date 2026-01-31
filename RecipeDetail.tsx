import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Recipe } from '../types';
import { 
    ArrowLeft, Clock, Flame, Users, CircleDollarSign, 
    ChefHat, CheckCircle2, ShoppingBag, Pencil, X, Check, Camera, Plus, Trash2, Star,
    Sparkles
} from 'lucide-react';

interface RecipeDetailProps {
    recipes: Recipe[];
    onUpdateRecipe: (recipe: Recipe) => void;
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

export const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipes, onUpdateRecipe }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const recipe = recipes.find(r => r.id === id);

    // Edit state for Price
    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const [priceValue, setPriceValue] = useState('');

    // Edit state for Description
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [descValue, setDescValue] = useState('');

    // Edit state for Image
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [imageValue, setImageValue] = useState('');

    // Edit state for Instructions
    const [isEditingInstructions, setIsEditingInstructions] = useState(false);
    const [instructionsValue, setInstructionsValue] = useState<string[]>([]);

    // Edit state for Tags
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTag, setNewTag] = useState('');

    if (!recipe) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h2 className="text-xl font-bold text-stone-600 mb-2">未找到菜谱</h2>
                <button 
                    onClick={() => navigate('/')}
                    className="text-orange-600 font-medium hover:underline"
                >
                    返回首页
                </button>
            </div>
        );
    }

    // --- Price Handlers ---
    const startEditingPrice = () => {
        setPriceValue(recipe.price.toString());
        setIsEditingPrice(true);
    };

    const savePrice = () => {
        const val = parseFloat(priceValue);
        if (!isNaN(val) && val >= 0) {
            onUpdateRecipe({ ...recipe, price: val });
        }
        setIsEditingPrice(false);
    };

    const cancelEditPrice = () => {
        setIsEditingPrice(false);
    }

    // --- Description Handlers ---
    const startEditingDesc = () => {
        setDescValue(recipe.description);
        setIsEditingDesc(true);
    };

    const saveDesc = () => {
        onUpdateRecipe({ ...recipe, description: descValue.trim() });
        setIsEditingDesc(false);
    };

    const cancelEditDesc = () => {
        setIsEditingDesc(false);
    };

    // --- Image Handlers ---
    const startEditingImage = () => {
        setImageValue(recipe.image);
        setIsEditingImage(true);
    };

    const saveImage = () => {
        if (imageValue.trim()) {
            onUpdateRecipe({ ...recipe, image: imageValue.trim() });
        }
        setIsEditingImage(false);
    };

    const cancelEditImage = () => {
        setIsEditingImage(false);
    };

    // --- Instructions Handlers ---
    const startEditingInstructions = () => {
        setInstructionsValue([...recipe.instructions]);
        setIsEditingInstructions(true);
    };

    const saveInstructions = () => {
        const cleanedInstructions = instructionsValue.filter(step => step.trim() !== '');
        onUpdateRecipe({ ...recipe, instructions: cleanedInstructions });
        setIsEditingInstructions(false);
    };

    const cancelEditInstructions = () => {
        setIsEditingInstructions(false);
    };

    const handleInstructionChange = (index: number, text: string) => {
        const newInstructions = [...instructionsValue];
        newInstructions[index] = text;
        setInstructionsValue(newInstructions);
    };

    const addInstruction = () => {
        setInstructionsValue([...instructionsValue, '']);
    };

    const removeInstruction = (index: number) => {
        const newInstructions = instructionsValue.filter((_, i) => i !== index);
        setInstructionsValue(newInstructions);
    };

    // --- Tag Handlers ---
    const handleAddTag = () => {
        if (newTag.trim()) {
            if (!recipe.tags.includes(newTag.trim())) {
                const updatedTags = [...recipe.tags, newTag.trim()];
                onUpdateRecipe({ ...recipe, tags: updatedTags });
            }
            setNewTag('');
            setIsAddingTag(false);
        } else {
             setIsAddingTag(false);
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        const updatedTags = recipe.tags.filter(t => t !== tagToRemove);
        onUpdateRecipe({ ...recipe, tags: updatedTags });
    };

    // --- Rating Handler ---
    const handleRate = (newRating: number) => {
        onUpdateRecipe({ ...recipe, rating: newRating });
    };

    return (
        <div className="min-h-screen bg-white md:bg-[#FDFBF7] pb-safe">
            {/* Header / Navigation */}
            <div className="fixed top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-md border-b border-stone-100 px-4 py-3 flex items-center gap-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 hover:bg-stone-100 rounded-full transition-colors text-stone-600"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-bold text-lg text-stone-800 truncate flex-1">{recipe.title}</h1>
            </div>

            <div className="pt-16 md:pt-20 max-w-4xl mx-auto md:px-6 md:pb-12">
                <div className="bg-white md:rounded-[2rem] md:shadow-xl md:shadow-stone-200/50 md:border md:border-stone-100 overflow-hidden">
                    {/* Hero Image */}
                    <div className="relative min-h-[20rem] md:min-h-[28rem] w-full group/image bg-stone-200">
                        {recipe.image ? (
                            <img 
                                src={recipe.image} 
                                alt={recipe.title} 
                                loading="eager"
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-stone-100 text-stone-300">
                                <div className="flex flex-col items-center gap-2">
                                    <Sparkles className="text-stone-300" size={48} />
                                    <span className="text-xs font-bold text-stone-400">暂无图片</span>
                                </div>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        {/* Edit Image Button (Visible on hover) */}
                        {!isEditingImage && (
                            <button
                                onClick={startEditingImage}
                                className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white p-2 rounded-full transition-all opacity-0 group-hover/image:opacity-100 z-20 shadow-lg border border-white/10"
                                title="手动更改图片URL"
                            >
                                <Camera size={20} />
                            </button>
                        )}

                        {/* Image Edit Overlay */}
                        {isEditingImage && (
                            <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
                                <h3 className="text-white font-bold mb-4 text-lg">更改封面图片</h3>
                                <div className="w-full max-w-md space-y-4">
                                    <input
                                        type="text"
                                        value={imageValue}
                                        onChange={(e) => setImageValue(e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                                        placeholder="输入图片 URL"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveImage();
                                            if (e.key === 'Escape') cancelEditImage();
                                        }}
                                    />
                                    <div className="flex gap-3 justify-center">
                                        <button 
                                            onClick={saveImage}
                                            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-xl font-bold transition-colors shadow-lg"
                                        >
                                            保存
                                        </button>
                                        <button 
                                            onClick={cancelEditImage}
                                            className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl font-bold transition-colors"
                                        >
                                            取消
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="absolute bottom-0 left-0 p-8 text-white w-full z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${CATEGORY_COLORS[recipe.category] || 'bg-white/20 backdrop-blur-md'}`}>
                                    {recipe.category}
                                </span>
                                {/* Rating Stars */}
                                <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 hover:bg-black/30 transition-colors">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => handleRate(star)}
                                            className="focus:outline-none transition-transform active:scale-95"
                                            title={`评分: ${star} 星`}
                                        >
                                            <Star 
                                                size={16} 
                                                className={`${
                                                    star <= recipe.rating 
                                                        ? 'fill-yellow-400 text-yellow-400' 
                                                        : 'text-white/30 hover:text-white/60'
                                                } transition-colors`} 
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight drop-shadow-lg">{recipe.title}</h1>
                            
                            {isEditingDesc ? (
                                <div className="mt-2 animate-in fade-in zoom-in duration-200">
                                    <textarea
                                        value={descValue}
                                        onChange={(e) => setDescValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') saveDesc();
                                            if (e.key === 'Escape') cancelEditDesc();
                                        }}
                                        className="w-full bg-white/95 text-stone-800 rounded-xl p-4 text-base md:text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[120px] resize-none"
                                        placeholder="输入菜谱描述..."
                                        autoFocus
                                    />
                                    <div className="flex gap-2 mt-3">
                                        <button 
                                            onClick={saveDesc} 
                                            className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                                        >
                                            <Check size={16} /> 保存
                                        </button>
                                        <button 
                                            onClick={cancelEditDesc} 
                                            className="bg-black/40 hover:bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-sm transition-colors border border-white/20"
                                        >
                                            <X size={16} /> 取消
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="group relative pr-8">
                                    <p className="text-white/90 text-base md:text-lg leading-relaxed max-w-3xl whitespace-pre-wrap font-medium drop-shadow-md">
                                        {recipe.description || "暂无描述，点击编辑添加..."}
                                    </p>
                                    <button
                                        onClick={startEditingDesc}
                                        className="absolute top-0 right-0 md:left-full md:ml-4 text-white/60 hover:text-white transition-all opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-full"
                                        title="编辑描述"
                                    >
                                        <Pencil size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-10">
                        {/* Main Content */}
                        <div className="md:col-span-2 space-y-10">
                            
                            {/* Stats Bar */}
                            <div className="flex items-center justify-between p-5 bg-stone-50 rounded-2xl border border-stone-100">
                                <div className="text-center flex-1">
                                    <div className="text-stone-400 mb-1.5 flex justify-center"><Clock size={24} className="text-orange-400" /></div>
                                    <div className="font-bold text-stone-700 text-lg">{recipe.cookTime} <span className="text-sm font-normal text-stone-400">分钟</span></div>
                                </div>
                                <div className="w-px h-10 bg-stone-200" />
                                <div className="text-center flex-1">
                                    <div className="text-stone-400 mb-1.5 flex justify-center"><Flame size={24} className="text-red-400" /></div>
                                    <div className="font-bold text-stone-700 text-lg">{recipe.calories} <span className="text-sm font-normal text-stone-400">千卡</span></div>
                                </div>
                                <div className="w-px h-10 bg-stone-200" />
                                <div className="text-center flex-1">
                                    <div className="text-stone-400 mb-1.5 flex justify-center"><CircleDollarSign size={24} className="text-teal-400" /></div>
                                    
                                    {isEditingPrice ? (
                                        <div className="flex items-center justify-center gap-1">
                                             <input 
                                                type="number"
                                                value={priceValue}
                                                onChange={(e) => setPriceValue(e.target.value)}
                                                className="w-20 border border-stone-300 rounded px-1 py-0.5 text-center font-bold text-stone-700 text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') savePrice();
                                                    if (e.key === 'Escape') cancelEditPrice();
                                                }}
                                             />
                                             <div className="flex flex-col">
                                                 <button onClick={savePrice} className="text-teal-500 hover:text-teal-600"><Check size={14} /></button>
                                                 <button onClick={cancelEditPrice} className="text-red-400 hover:text-red-500"><X size={14} /></button>
                                             </div>
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={startEditingPrice}
                                            className="font-bold text-stone-700 text-lg flex items-center justify-center gap-1 cursor-pointer hover:bg-stone-100 rounded px-2 py-0.5 transition-colors group"
                                        >
                                            {recipe.price} <span className="text-sm font-normal text-stone-400">元</span>
                                            <Pencil size={12} className="text-stone-300 group-hover:text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Ingredients */}
                            <section>
                                <h3 className="text-2xl font-black text-stone-800 mb-6 flex items-center gap-2">
                                    <ShoppingBag className="text-orange-500" strokeWidth={2.5} /> 食材清单
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {recipe.ingredients.map((ing, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-[#FFFBF0] border border-orange-100 hover:border-orange-200 transition-colors group">
                                            <span className="font-bold text-stone-700 text-lg group-hover:text-orange-800 transition-colors">{ing.name}</span>
                                            <span className="text-stone-500 text-sm font-bold bg-white px-3 py-1 rounded-lg border border-orange-50/50 shadow-sm">
                                                {ing.amount} {ing.unit}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Instructions */}
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-black text-stone-800 flex items-center gap-2">
                                        <ChefHat className="text-teal-500" strokeWidth={2.5} /> 
                                        {isEditingInstructions ? '编辑步骤' : '烹饪步骤'}
                                    </h3>
                                    {!isEditingInstructions ? (
                                        <button
                                            onClick={startEditingInstructions}
                                            className="text-stone-400 hover:text-stone-600 p-2 hover:bg-stone-100 rounded-full transition-colors"
                                            title="编辑步骤"
                                        >
                                            <Pencil size={20} />
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={saveInstructions}
                                                className="bg-teal-100 hover:bg-teal-200 text-teal-700 p-2 rounded-full transition-colors"
                                                title="保存"
                                            >
                                                <Check size={20} />
                                            </button>
                                            <button 
                                                onClick={cancelEditInstructions}
                                                className="bg-stone-100 hover:bg-stone-200 text-stone-500 p-2 rounded-full transition-colors"
                                                title="取消"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                {isEditingInstructions ? (
                                    <div className="space-y-4">
                                        {instructionsValue.map((step, idx) => (
                                            <div key={idx} className="flex gap-3 items-start animate-in fade-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-100 text-stone-500 font-bold flex items-center justify-center mt-1">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <textarea
                                                        value={step}
                                                        onChange={(e) => handleInstructionChange(idx, e.target.value)}
                                                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none min-h-[80px]"
                                                        placeholder={`步骤 ${idx + 1}`}
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => removeInstruction(idx)}
                                                    className="mt-3 text-stone-400 hover:text-red-500 transition-colors p-1"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                        <button 
                                            onClick={addInstruction}
                                            className="w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 font-medium hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus size={20} /> 添加步骤
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {recipe.instructions.map((step, idx) => (
                                            <div key={idx} className="flex gap-6 group">
                                                <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 font-black flex items-center justify-center border border-orange-200 shadow-sm group-hover:from-orange-500 group-hover:to-red-500 group-hover:text-white transition-all duration-300">
                                                    {idx + 1}
                                                </div>
                                                <div className="pt-1.5 flex-1">
                                                    <p className="text-stone-700 leading-loose text-lg font-medium">{step}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Sidebar / Tags */}
                        <div className="space-y-6">
                            <div className="bg-stone-50 p-6 rounded-[2rem] border border-stone-100">
                                <h3 className="font-bold text-stone-800 mb-4 text-xs uppercase tracking-wider text-stone-400">标签</h3>
                                <div className="flex flex-wrap gap-2">
                                    {recipe.tags.map(tag => (
                                        <span key={tag} className="group px-4 py-1.5 bg-white border border-stone-200 rounded-full text-sm font-medium text-stone-600 flex items-center gap-2 transition-all hover:border-orange-300 hover:text-orange-600 hover:shadow-sm">
                                            {tag}
                                            <button 
                                                onClick={() => handleRemoveTag(tag)}
                                                className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                                                title="删除标签"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                    
                                    {isAddingTag ? (
                                        <div className="flex items-center gap-1 animate-in fade-in duration-200">
                                            <input 
                                                type="text"
                                                value={newTag}
                                                onChange={(e) => setNewTag(e.target.value)}
                                                className="px-4 py-1.5 bg-white border border-orange-400 rounded-full text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-200 w-28 shadow-sm"
                                                autoFocus
                                                placeholder="新标签"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddTag();
                                                    if (e.key === 'Escape') setIsAddingTag(false);
                                                }}
                                            />
                                             <button 
                                                onClick={handleAddTag} 
                                                className="bg-teal-100 text-teal-600 hover:bg-teal-200 p-1.5 rounded-full transition-colors"
                                            >
                                                <Check size={14}/>
                                            </button>
                                            <button 
                                                onClick={() => setIsAddingTag(false)} 
                                                className="bg-stone-200 text-stone-500 hover:bg-stone-300 p-1.5 rounded-full transition-colors"
                                            >
                                                <X size={14}/>
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setIsAddingTag(true)}
                                            className="px-4 py-1.5 bg-stone-100 border border-dashed border-stone-300 rounded-full text-sm font-medium text-stone-400 hover:bg-white hover:border-orange-400 hover:text-orange-600 transition-all flex items-center gap-1.5"
                                        >
                                            <Plus size={16} /> 添加
                                        </button>
                                    )}
                                </div>
                            </div>

                             <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-[2rem] border border-yellow-100 shadow-sm">
                                <h3 className="font-bold text-orange-800 mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                                    <Sparkles size={14}/> 健康小贴士
                                </h3>
                                <p className="text-orange-900/80 text-sm leading-relaxed font-medium">
                                    这道菜提供了约 {recipe.calories} 卡路里的热量。建议搭配清淡的蔬菜汤以获得更均衡的营养。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};