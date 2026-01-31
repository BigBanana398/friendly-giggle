import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ViewState, Recipe, WeeklyPlan, UserPreference, Ingredient, RecipeCategory, AppData, PlannerViewMode } from './types';
import { Layout } from './components/Layout';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetail } from './components/RecipeDetail';
import { RECIPES as INITIAL_RECIPES } from './recipes'; 
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line, CartesianGrid, BarChart, Bar, Legend
} from 'recharts';
import { 
    CalendarCheck, CheckCircle, Circle, RefreshCw, 
    Sparkles, Plus, AlertCircle, TrendingUp, Users,
    Clock, ChefHat, ShoppingCart, Filter, BarChart2, CircleDollarSign, X, Search,
    ChevronLeft, ChevronRight, Trash2, Calendar, Download, List, CalendarDays, ArrowRight, Tag, Flame,
    MessageSquare, Activity, SlidersHorizontal, Utensils
} from 'lucide-react';

// Refined Category Map - Focusing on Fresh Ingredients
const SHOPPING_CATEGORY_MAP: Record<string, string> = {
    'produce': '🥦 蔬菜水果',
    'meat': '🥩 肉禽蛋品',
    'seafood': '🐟 海鲜水产',
    'dairy': '🥛 乳制品/冷藏',
    // Pantry and Other are intentionally omitted to filter them out
};

// Aliases for ingredient normalization
const INGREDIENT_ALIASES: Record<string, string> = {
    '西红柿': '番茄', '洋芋': '土豆', '马铃薯': '土豆',
    '卷心菜': '包菜', '洋白菜': '包菜', '圆白菜': '包菜',
    '青蒜': '蒜苗', '蒜头': '蒜',
    '生姜': '姜', '老姜': '姜', '嫩姜': '姜',
    '鸡蛋': '蛋', '鸡子': '蛋',
    '娃娃菜': '白菜', 
    '西兰花': '花菜', '花椰菜': '花菜',
    '口蘑': '蘑菇', '香菇': '蘑菇',
};

const RECIPE_CATEGORIES: RecipeCategory[] = ['蔬菜', '肉类', '海鲜', '菌类', '主食', '汤品', '其他'];

// Helper for icon needed in recipes
const PlusCircle = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
);

interface ShoppingItem {
    name: string;
    details: string;
    category: string;
    checked: boolean;
}

interface MainScreenProps {
    recipes: Recipe[];
    setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
    plan: WeeklyPlan;
    setPlan: React.Dispatch<React.SetStateAction<WeeklyPlan>>;
    preferences: UserPreference;
    setPreferences: React.Dispatch<React.SetStateAction<UserPreference>>;
}

const MainScreen: React.FC<MainScreenProps> = ({ 
    recipes, setRecipes, plan, setPlan, preferences, setPreferences 
}) => {
    // State
    const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
    
    // Shopping List State
    const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
    const [dailyShoppingItems, setDailyShoppingItems] = useState<{date: string, items: ShoppingItem[]}[]>([]);
    const [shoppingMode, setShoppingMode] = useState<'weekly' | 'daily'>('weekly');
    
    const [activeCategory, setActiveCategory] = useState<string>('全部');
    
    // Add Recipe Modal State
    const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);
    const [newRecipeTitle, setNewRecipeTitle] = useState('');

    // Planner State
    const [selectingForDate, setSelectingForDate] = useState<string | null>(null);
    const [plannerMode, setPlannerMode] = useState<PlannerViewMode>('week');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Stats View State
    const [statsMode, setStatsMode] = useState<'week' | 'month' | 'year'>('week');
    const [statsDate, setStatsDate] = useState(new Date());

    // Modal specific filters
    const [planModalCategory, setPlanModalCategory] = useState<string>('全部');
    const [planModalSearch, setPlanModalSearch] = useState<string>('');

    // Main Recipe View Filters
    const [recipeSearch, setRecipeSearch] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);
    const [filterTime, setFilterTime] = useState<'all' | 'fast' | 'medium' | 'slow'>('all'); // fast < 20, medium 20-45, slow > 45
    const [filterCalories, setFilterCalories] = useState<'all' | 'low' | 'medium' | 'high'>('all'); // low < 300, medium 300-600, high > 600
    const [filterPrice, setFilterPrice] = useState<'all' | 'cheap' | 'moderate' | 'expensive'>('all'); // cheap < 20, moderate 20-50, expensive > 50
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const navigate = useNavigate();

    // --- Helpers ---

    const getWeekRange = (date: Date) => {
        const start = new Date(date);
        start.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1)); // Adjust to Monday start
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    };

    const getMonthDays = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    };

    const normalizeName = (name: string) => {
        // Remove text in parentheses and trim
        let clean = name.replace(/（.*?）/g, '').replace(/\(.*?\)/g, '').trim();
        
        // 1. Specific Aggressive Replacements (Suffix removal for aggregation)
        // Meat: Remove suffix like 丝, 末, 丁, 片, 块
        if (/^(猪|牛|羊)肉/.test(clean)) {
             clean = clean.replace(/[丝末丁片块条馅]/g, '');
        }
        // Specific Fixes for common variations
        clean = clean.replace(/^猪里脊肉$/, '猪肉');
        clean = clean.replace(/^猪肉馅$/, '猪肉');
        clean = clean.replace(/^五花肉$/, '猪肉'); // Optional aggregation, keeping simplified
        
        // Poultry
        if (/^鸡.*肉/.test(clean)) {
             // Keep '鸡胸肉' distinct if preferred, or merge to '鸡肉'. Let's keep 鸡胸肉 distinct but remove form.
             if (clean.includes('鸡胸肉')) clean = '鸡胸肉';
             else if (clean.includes('鸡腿')) clean = '鸡腿'; 
             else clean = '鸡肉';
        }

        // Aromatics & Veggies
        if (/^(大葱|小葱|香葱|葱花|葱段|葱丝|葱末)$/.test(clean)) clean = '葱';
        if (/^(生姜|老姜|姜片|姜丝|姜末)$/.test(clean)) clean = '姜';
        if (/^(大蒜|蒜头|蒜瓣|蒜片|蒜末|蒜泥)$/.test(clean)) clean = '蒜';
        
        clean = clean.replace(/^青椒[丝末块条]?$/, '青椒');
        clean = clean.replace(/^红椒[丝末块条]?$/, '红椒');
        clean = clean.replace(/^土豆[丝末块条片]?$/, '土豆');
        clean = clean.replace(/^胡萝卜[丝末块条片丁]?$/, '胡萝卜');
        clean = clean.replace(/^香菇[丝末块条片丁]?$/, '香菇');

        // 2. Map lookup
        return INGREDIENT_ALIASES[clean] || clean;
    };

    // --- Derived State ---
    
    // Filtered Recipes for Main View
    const filteredRecipes = useMemo(() => {
        return recipes.filter(r => {
            // 1. Text Search
            const matchesSearch = r.title.toLowerCase().includes(recipeSearch.toLowerCase()) || 
                                  r.ingredients.some(i => i.name.includes(recipeSearch));
            
            // 2. Category
            const matchesCategory = activeCategory === '全部' || r.category === activeCategory;

            // 3. Time Filter
            let matchesTime = true;
            if (filterTime === 'fast') matchesTime = r.cookTime <= 20;
            else if (filterTime === 'medium') matchesTime = r.cookTime > 20 && r.cookTime <= 45;
            else if (filterTime === 'slow') matchesTime = r.cookTime > 45;

            // 4. Calories Filter
            let matchesCalories = true;
            if (filterCalories === 'low') matchesCalories = r.calories <= 300;
            else if (filterCalories === 'medium') matchesCalories = r.calories > 300 && r.calories <= 600;
            else if (filterCalories === 'high') matchesCalories = r.calories > 600;

            // 5. Price Filter
            let matchesPrice = true;
            if (filterPrice === 'cheap') matchesPrice = r.price <= 20;
            else if (filterPrice === 'moderate') matchesPrice = r.price > 20 && r.price <= 50;
            else if (filterPrice === 'expensive') matchesPrice = r.price > 50;

            // 6. Tags Filter (AND logic - must have all selected tags)
            let matchesTags = true;
            if (selectedTags.length > 0) {
                matchesTags = selectedTags.every(t => r.tags.includes(t));
            }

            return matchesSearch && matchesCategory && matchesTime && matchesCalories && matchesPrice && matchesTags;
        });
    }, [recipes, activeCategory, recipeSearch, filterTime, filterCalories, filterPrice, selectedTags]);

    // All unique tags for filter
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        recipes.forEach(r => r.tags.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [recipes]);

    // Filter Active State
    const isFilterActive = filterTime !== 'all' || filterCalories !== 'all' || filterPrice !== 'all' || selectedTags.length > 0;

    // Filtered Recipes for Planner Modal
    const modalFilteredRecipes = useMemo(() => {
        return recipes.filter(r => {
            const matchesCategory = planModalCategory === '全部' || r.category === planModalCategory;
            const matchesSearch = r.title.toLowerCase().includes(planModalSearch.toLowerCase()) || 
                                  r.ingredients.some(i => i.name.includes(planModalSearch));
            return matchesCategory && matchesSearch;
        });
    }, [recipes, planModalCategory, planModalSearch]);

    // Random suggestion logic (MOVED TO TOP LEVEL)
    const randomSuggestion = useMemo(() => {
        if (recipes.length === 0) return null;
        const random = recipes[Math.floor(Math.random() * recipes.length)];
        return random;
    }, [recipes.length]);

    // --- Stats Data Preparation (Memoized) ---
    const statsAnalysis = useMemo(() => {
        let title = '';
        let relevantRecipes: Recipe[] = [];
        let chartData: any[] = [];
        let periodDescription = '';

        if (statsMode === 'week') {
            const weekDays = getWeekRange(statsDate);
            const startDay = new Date(weekDays[0]);
            const endDay = new Date(weekDays[6]);
            title = `${startDay.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} - ${endDay.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`;
            periodDescription = `${startDay.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} 至 ${endDay.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} 这周`;
            
            // Collect recipes
            weekDays.forEach(dateStr => {
                const ids = plan[dateStr] || [];
                ids.forEach(id => {
                    const r = recipes.find(rec => rec.id === id);
                    if (r) relevantRecipes.push(r);
                });
            });

            // Chart Data: Calories per day
            chartData = weekDays.map(dateStr => {
                const date = new Date(dateStr);
                const dayName = date.toLocaleDateString('zh-CN', { weekday: 'short' }).replace('周', '');
                const ids = plan[dateStr] || [];
                const dailyCals = ids.reduce((sum, id) => {
                    const r = recipes.find(rec => rec.id === id);
                    return sum + (r?.calories || 0);
                }, 0);
                return { name: dayName, calories: dailyCals };
            });

        } else if (statsMode === 'month') {
            const year = statsDate.getFullYear();
            const month = statsDate.getMonth();
            title = `${year}年 ${month + 1}月`;
            periodDescription = `${year}年 ${month + 1}月`;
            
            Object.keys(plan).forEach(dateStr => {
                const d = new Date(dateStr);
                if (d.getFullYear() === year && d.getMonth() === month) {
                    const ids = plan[dateStr];
                    ids.forEach(id => {
                        const r = recipes.find(rec => rec.id === id);
                        if (r) relevantRecipes.push(r);
                    });
                }
            });

            const daysInMonth = new Date(year, month + 1, 0).getDate();
            chartData = Array.from({length: daysInMonth}, (_, i) => {
                const day = i + 1;
                const dateStr = new Date(year, month, day).toISOString().split('T')[0];
                const ids = plan[dateStr] || [];
                const dailyCals = ids.reduce((sum, id) => {
                    const r = recipes.find(rec => rec.id === id);
                    return sum + (r?.calories || 0);
                }, 0);
                return { name: `${day}`, calories: dailyCals };
            });

        } else {
            // Year Mode
            const year = statsDate.getFullYear();
            title = `${year}年`;
            periodDescription = `${year}年`;

            Object.keys(plan).forEach(dateStr => {
                const d = new Date(dateStr);
                if (d.getFullYear() === year) {
                    const ids = plan[dateStr];
                    ids.forEach(id => {
                        const r = recipes.find(rec => rec.id === id);
                        if (r) relevantRecipes.push(r);
                    });
                }
            });

            chartData = Array.from({length: 12}, (_, i) => {
                const monthName = `${i + 1}月`;
                let monthlyCals = 0;
                Object.keys(plan).forEach(dateStr => {
                    const d = new Date(dateStr);
                    if (d.getFullYear() === year && d.getMonth() === i) {
                        const ids = plan[dateStr];
                        monthlyCals += ids.reduce((sum, id) => {
                            const r = recipes.find(rec => rec.id === id);
                            return sum + (r?.calories || 0);
                        }, 0);
                    }
                });
                return { name: monthName, calories: monthlyCals };
            });
        }
        
        return { title, relevantRecipes, chartData, periodDescription };
    }, [statsMode, statsDate, plan, recipes]);


    // --- Effects ---

    // Optimized Shopping List Generation
    useEffect(() => {
        // Helper to process ingredients into a map
        const processIngredientsToMap = (ingredients: Ingredient[], targetMap: Map<string, any>) => {
            ingredients.forEach(ing => {
                // FILTER: Only keep major fresh categories
                if (!['produce', 'meat', 'seafood', 'dairy'].includes(ing.category)) {
                    return;
                }

                const name = normalizeName(ing.name);
                if (!targetMap.has(name)) {
                    targetMap.set(name, { 
                        category: ing.category, 
                        units: new Map<string, number>(), 
                        rawAmounts: new Set<string>() 
                    });
                }
                
                const entry = targetMap.get(name)!;
                const numericAmount = parseFloat(ing.amount);
                
                if (!isNaN(numericAmount) && ing.unit) {
                    // Normalize units (basic)
                    let unitKey = ing.unit.trim();
                    // Simple unit normalization could go here if needed
                    const currentTotal = entry.units.get(unitKey) || 0;
                    entry.units.set(unitKey, currentTotal + numericAmount);
                } else {
                    // Text based amount
                    const fullText = ing.unit ? `${ing.amount}${ing.unit}` : ing.amount;
                    entry.rawAmounts.add(fullText);
                }
            });
        };

        const formatMapToList = (map: Map<string, any>): ShoppingItem[] => {
            const list: ShoppingItem[] = [];
            map.forEach((data, name) => {
                const parts: string[] = [];
                data.units.forEach((amount: number, unit: string) => {
                    const rounded = Math.round(amount * 100) / 100;
                    parts.push(`${rounded}${unit}`);
                });
                if (data.rawAmounts.size > 0) {
                    parts.push(...Array.from(data.rawAmounts as Set<string>));
                }
                
                list.push({
                    name: name,
                    details: parts.join(' + '),
                    category: data.category,
                    checked: false
                });
            });
            return list.sort((a, b) => a.category.localeCompare(b.category));
        };

        // 1. Weekly Aggregation
        const weeklyMap = new Map<string, any>();
        const dailyMaps: Record<string, Map<string, any>> = {};

        // Sort dates to ensure order
        const sortedDates = Object.keys(plan).sort();

        sortedDates.forEach(date => {
            const recipeIds = plan[date] || [];
            dailyMaps[date] = new Map<string, any>();

            recipeIds.forEach(id => {
                const recipe = recipes.find(r => r.id === id);
                if (recipe) {
                    // Add to weekly total
                    processIngredientsToMap(recipe.ingredients, weeklyMap);
                    // Add to daily list
                    processIngredientsToMap(recipe.ingredients, dailyMaps[date]);
                }
            });
        });

        // 2. State Update
        // Preserve checked state for weekly items based on name
        setShoppingItems(prev => {
            const newList = formatMapToList(weeklyMap);
            return newList.map(newItem => {
                const existing = prev.find(p => p.name === newItem.name);
                return existing ? { ...newItem, checked: existing.checked } : newItem;
            });
        });

        // Generate Daily List structure
        const newDailyList = sortedDates.map(date => ({
            date,
            items: formatMapToList(dailyMaps[date])
        })).filter(d => d.items.length > 0);
        
        setDailyShoppingItems(newDailyList);

    }, [plan, recipes]);

    // --- Handlers ---

    const toggleShoppingItem = (name: string, isDaily: boolean = false, dateKey?: string) => {
        if (isDaily && dateKey) {
            setDailyShoppingItems(prev => prev.map(day => {
                if (day.date === dateKey) {
                    return {
                        ...day,
                        items: day.items.map(item => item.name === name ? { ...item, checked: !item.checked } : item)
                    };
                }
                return day;
            }));
        } else {
            setShoppingItems(items => items.map(item => 
                item.name === name ? { ...item, checked: !item.checked } : item
            ));
        }
    };

    const changeDate = (offset: number) => {
        const newDate = new Date(currentDate);
        if (plannerMode === 'week') {
            newDate.setDate(newDate.getDate() + (offset * 7));
        } else if (plannerMode === 'month') {
            newDate.setMonth(newDate.getMonth() + offset);
        } else {
            newDate.setFullYear(newDate.getFullYear() + offset);
        }
        setCurrentDate(newDate);
    };

    const changeStatsDate = (offset: number) => {
        const newDate = new Date(statsDate);
        if (statsMode === 'week') {
             newDate.setDate(newDate.getDate() + (offset * 7));
        } else if (statsMode === 'month') {
             newDate.setMonth(newDate.getMonth() + offset);
        } else {
             newDate.setFullYear(newDate.getFullYear() + offset);
        }
        setStatsDate(newDate);
    };

    const handleExportData = () => {
        const data: AppData = {
            recipes,
            plan,
            preferences,
            version: '1.0',
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `family-dinner-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (window.confirm("导入数据将覆盖当前的所有菜谱和计划，确定要继续吗？")) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string) as AppData;
                    if (data.recipes && data.plan) {
                        setRecipes(data.recipes);
                        setPlan(data.plan);
                        if (data.preferences) setPreferences(data.preferences);
                        alert("数据导入成功！");
                    } else {
                        alert("文件格式不正确，无法导入。");
                    }
                } catch (error) {
                    console.error(error);
                    alert("导入失败，文件可能已损坏。");
                }
            };
            reader.readAsText(file);
        }
        e.target.value = '';
    };

    const handleAddRecipe = async () => {
        setShowAddRecipeModal(true);
    };

    const performAddRecipe = async () => {
        if (!newRecipeTitle.trim()) return;
        
        const newRecipe: Recipe = {
            id: Date.now().toString(),
            title: newRecipeTitle.trim(),
            description: "请点击编辑按钮添加描述...",
            category: '其他', 
            price: 0, 
            image: '',
            rating: 0, 
            timesCooked: 0,
            cookTime: 30,
            calories: 0,
            ingredients: [],
            instructions: [],
            tags: []
        };
        setRecipes([...recipes, newRecipe]);
        setNewRecipeTitle('');
        setShowAddRecipeModal(false);
        
        // Optional: navigate to detail to edit immediately
        if(window.confirm(`已添加 "${newRecipe.title}"！是否立即前往编辑详情？`)) {
            navigateToDetail(newRecipe);
        }
    };

    // Pure local randomizer for weekly plan
    const handleAutoPlan = async () => {
        if (recipes.length === 0) {
            alert("请先添加一些菜谱！");
            return;
        }
        
        if (!window.confirm("这将覆盖当前周的计划，确定要重新生成吗？")) return;

        const newPlan = { ...plan };
        const weekDays = getWeekRange(currentDate);
        
        // Simple shuffle algorithm
        const shuffledRecipes = [...recipes].sort(() => 0.5 - Math.random());
        let recipeIndex = 0;

        weekDays.forEach(day => {
            const dailySelection = [];
            // Pick 2 distinct recipes per day
            for(let i=0; i<2; i++) {
                if(recipeIndex >= shuffledRecipes.length) recipeIndex = 0; // Cycle if run out
                dailySelection.push(shuffledRecipes[recipeIndex].id);
                recipeIndex++;
            }
            newPlan[day] = dailySelection;
        });

        setPlan(newPlan);
        alert("✨ 已为您随机生成了本周菜单！");
    };

    const handleRemoveFromPlan = (date: string, recipeId: string) => {
        const currentRecipes = plan[date] || [];
        setPlan({ ...plan, [date]: currentRecipes.filter(id => id !== recipeId) });
    };

    const handleAddToPlan = (recipeId: string, date: string) => {
        const currentRecipes = plan[date] || [];
        if (currentRecipes.includes(recipeId)) {
            alert("该菜品已在今日菜单中！");
            return;
        }
        setPlan({ ...plan, [date]: [...currentRecipes, recipeId] });
    };
    
    const handleSelectRecipeForPlan = (recipe: Recipe) => {
        if (selectingForDate) {
            handleAddToPlan(recipe.id, selectingForDate);
            setSelectingForDate(null);
        }
    };

    const navigateToDetail = (recipe: Recipe) => {
        navigate(`/recipe/${recipe.id}`);
    };

    const toggleTagFilter = (tag: string) => {
        setSelectedTags(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const resetFilters = () => {
        setFilterTime('all');
        setFilterCalories('all');
        setFilterPrice('all');
        setSelectedTags([]);
        setRecipeSearch('');
        setActiveCategory('全部');
    };

    // --- VIEWS ---

    const renderDashboard = () => {
        const today = new Date().toISOString().split('T')[0];
        const todayMealIds = plan[today] || [];
        const todayRecipes = todayMealIds.map(id => recipes.find(r => r.id === id)).filter(Boolean) as Recipe[];
        const totalCost = todayRecipes.reduce((sum, r) => sum + (r.price || 0), 0);
        
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <header>
                    <h2 className="text-3xl font-black text-stone-800 tracking-tight">你好，大厨！ 👋</h2>
                    <p className="text-stone-500 mt-2 font-medium">今天想要做点什么好吃的？</p>
                </header>

                {/* Hero Section: Today's Menu */}
                <section className="bg-gradient-to-br from-orange-400 via-red-500 to-rose-500 rounded-[2rem] p-8 text-white shadow-2xl shadow-orange-200/50 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-orange-50 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                <span className="w-2 h-2 bg-orange-200 rounded-full animate-pulse"></span>
                                今日菜单 · {new Date().toLocaleDateString('zh-CN', {month:'long', day:'numeric'})}
                            </h3>
                            {todayRecipes.length > 0 && (
                                <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold border border-white/20 shadow-sm flex items-center gap-1">
                                    <span className="opacity-70">预估</span> ¥{totalCost}
                                </span>
                            )}
                        </div>
                        
                        {todayRecipes.length > 0 ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {todayRecipes.map(recipe => (
                                    <div key={recipe.id} onClick={() => navigateToDetail(recipe)} className="bg-white/10 backdrop-blur-md p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/20 transition-all border border-white/10 group/card active:scale-95 duration-200">
                                        <div className="w-16 h-16 rounded-xl bg-stone-100 flex items-center justify-center text-stone-300 shadow-lg">
                                            {recipe.image ? (
                                                <img src={recipe.image} className="w-full h-full object-cover rounded-xl" />
                                            ) : (
                                                <Utensils size={24} />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="font-bold text-lg leading-tight truncate">{recipe.title}</h2>
                                            <div className="flex items-center gap-2 text-orange-50 text-xs mt-1.5">
                                                <span className="bg-black/20 px-2 py-0.5 rounded-md backdrop-blur-sm">{recipe.category}</span>
                                                <span className="flex items-center gap-1 opacity-80"><Clock size={10} />{recipe.cookTime}m</span>
                                            </div>
                                        </div>
                                        <div className="ml-auto opacity-0 group-hover/card:opacity-100 transition-opacity">
                                            <ArrowRight size={20} className="text-white/70" />
                                        </div>
                                    </div>
                                ))}
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setView(ViewState.RECIPES)} className="flex-1 bg-white text-orange-600 px-6 py-4 rounded-2xl font-bold shadow-lg hover:bg-orange-50 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                                        <ChefHat size={20}/> 开始烹饪
                                    </button>
                                    <button onClick={() => setView(ViewState.SHOPPING)} className="bg-black/20 text-white px-6 py-4 rounded-2xl font-bold hover:bg-black/30 backdrop-blur-sm transition-all flex items-center gap-2">
                                        <ShoppingCart size={20}/> 补货
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-10 text-center relative z-10">
                                <h2 className="text-3xl font-bold mb-3 drop-shadow-md">还没有安排晚餐？</h2>
                                <p className="text-orange-100 mb-8 text-sm opacity-90 max-w-md mx-auto">即使是最简单的家常菜，也能温暖全家人的胃。</p>
                                <button onClick={() => setView(ViewState.PLANNER)} className="bg-white text-orange-600 px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-all active:scale-95">
                                    去规划一下
                                </button>
                            </div>
                        )}
                    </div>
                    {/* Decorative Background Elements */}
                    <div className="absolute -top-24 -right-24 w-80 h-80 bg-yellow-300 rounded-full mix-blend-overlay opacity-30 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                    <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-orange-700 rounded-full mix-blend-overlay opacity-40 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Inspiration Card */}
                    <div className="md:col-span-2 bg-white rounded-[2rem] border border-stone-100 shadow-sm p-6 relative overflow-hidden group hover:shadow-xl hover:border-orange-100 transition-all duration-300">
                         <div className="relative z-10 flex flex-col md:flex-row gap-6 h-full">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg text-xs font-bold">✨ 灵感推荐</span>
                                </div>
                                <h3 className="text-2xl font-bold text-stone-800 mb-2">不知道吃什么？</h3>
                                <p className="text-stone-500 text-sm mb-6 leading-relaxed">
                                    试试看这道 <span className="text-orange-500 font-bold">{randomSuggestion?.title}</span>！
                                    {randomSuggestion?.description}
                                </p>
                                {randomSuggestion && (
                                    <button onClick={() => navigateToDetail(randomSuggestion)} className="text-teal-600 font-bold text-sm hover:underline flex items-center gap-1">
                                        查看详情 <ArrowRight size={16}/>
                                    </button>
                                )}
                            </div>
                            {randomSuggestion && (
                                <div className="w-full md:w-40 h-32 md:h-auto rounded-2xl overflow-hidden shadow-md rotate-2 group-hover:rotate-0 transition-transform duration-500 bg-stone-100 flex items-center justify-center">
                                    {randomSuggestion.image ? (
                                        <img src={randomSuggestion.image} className="w-full h-full object-cover" />
                                    ) : (
                                        <Utensils size={40} className="text-stone-300"/>
                                    )}
                                </div>
                            )}
                         </div>
                    </div>

                    {/* Quick Shopping Stats */}
                    <div onClick={() => setView(ViewState.SHOPPING)} className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-xl hover:border-teal-100 transition-all cursor-pointer group flex flex-col justify-between h-full">
                         <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl group-hover:bg-teal-500 group-hover:text-white transition-colors shadow-sm"><ShoppingCart size={24} /></div>
                            <span className="text-xs font-bold text-stone-400 bg-stone-50 px-2.5 py-1 rounded-full">{shoppingItems.filter(i => !i.checked).length} 待买</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-stone-800 mb-1">采购清单</h3>
                            <p className="text-stone-400 text-xs">下班路上去趟超市？</p>
                        </div>
                    </div>
                </section>
            </div>
        );
    };

    const renderRecipes = () => {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <header className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-stone-800 tracking-tight">我的菜谱库</h2>
                        <p className="text-stone-500 mt-2 font-medium">共 {recipes.length} 道美味佳肴</p>
                    </div>
                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        <div className="relative flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="搜索菜名或食材..." 
                                    value={recipeSearch}
                                    onChange={(e) => setRecipeSearch(e.target.value)}
                                    className="w-full md:w-80 bg-white border border-stone-200 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all shadow-sm"
                                />
                            </div>
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-3 rounded-2xl border transition-all flex items-center justify-center relative ${showFilters || isFilterActive ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-stone-200 text-stone-400 hover:text-stone-600'}`}
                            >
                                <SlidersHorizontal size={20} />
                                {isFilterActive && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"></span>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="bg-[#FFFBF5] rounded-3xl p-6 border border-orange-100 shadow-sm space-y-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-lg text-stone-800 flex items-center gap-2"><Filter size={18} className="text-orange-500"/> 筛选</h3>
                            <button onClick={resetFilters} className="text-xs text-stone-400 hover:text-orange-600 font-bold transition-colors">重置所有</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Time Filter */}
                            <div className="space-y-3">
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">烹饪时间</span>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'all', label: '全部' },
                                        { id: 'fast', label: '< 20分' },
                                        { id: 'medium', label: '20-45分' },
                                        { id: 'slow', label: '> 45分' }
                                    ].map(opt => (
                                        <button 
                                            key={opt.id}
                                            onClick={() => setFilterTime(opt.id as any)}
                                            className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all ${filterTime === opt.id ? 'bg-orange-500 text-white shadow-md' : 'bg-white border border-stone-100 text-stone-500 hover:bg-stone-50'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Calories Filter */}
                            <div className="space-y-3">
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">卡路里 (kcal)</span>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'all', label: '全部' },
                                        { id: 'low', label: '< 300' },
                                        { id: 'medium', label: '300-600' },
                                        { id: 'high', label: '> 600' }
                                    ].map(opt => (
                                        <button 
                                            key={opt.id}
                                            onClick={() => setFilterCalories(opt.id as any)}
                                            className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all ${filterCalories === opt.id ? 'bg-orange-500 text-white shadow-md' : 'bg-white border border-stone-100 text-stone-500 hover:bg-stone-50'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Filter */}
                            <div className="space-y-3">
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">预估价格</span>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'all', label: '全部' },
                                        { id: 'cheap', label: '< ¥20' },
                                        { id: 'moderate', label: '¥20-50' },
                                        { id: 'expensive', label: '> ¥50' }
                                    ].map(opt => (
                                        <button 
                                            key={opt.id}
                                            onClick={() => setFilterPrice(opt.id as any)}
                                            className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all ${filterPrice === opt.id ? 'bg-orange-500 text-white shadow-md' : 'bg-white border border-stone-100 text-stone-500 hover:bg-stone-50'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Tags Filter */}
                        <div className="space-y-3 pt-2 border-t border-orange-100/50">
                            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">标签筛选</span>
                            <div className="flex flex-wrap gap-2">
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTagFilter(tag)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                            selectedTags.includes(tag) 
                                            ? 'bg-teal-500 border-teal-500 text-white shadow-sm' 
                                            : 'bg-white border-stone-200 text-stone-600 hover:border-teal-300 hover:text-teal-600'
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
    
                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                     <button 
                        onClick={() => setActiveCategory('全部')}
                        className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${activeCategory === '全部' ? 'bg-stone-800 text-white shadow-lg shadow-stone-200' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-100'}`}
                    >
                        全部
                    </button>
                    {RECIPE_CATEGORIES.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-stone-600 hover:bg-orange-50 hover:text-orange-600 border border-stone-100'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
    
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredRecipes.map(recipe => (
                        <RecipeCard 
                            key={recipe.id} 
                            recipe={recipe} 
                            onSelect={navigateToDetail}
                            onDelete={(id) => {
                                 if(window.confirm('确定要删除这个菜谱吗？')) {
                                     setRecipes(prev => prev.filter(r => r.id !== id));
                                 }
                            }}
                        />
                    ))}
                </div>
                {filteredRecipes.length === 0 && (
                    <div className="text-center py-20 text-stone-400">
                        <ChefHat size={64} className="mx-auto mb-4 opacity-20" />
                        <p>没有找到相关菜谱</p>
                        {isFilterActive && (
                            <button onClick={resetFilters} className="mt-4 text-orange-500 font-bold hover:underline">
                                清除筛选条件
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderPlanner = () => {
        let title = '';
        let gridContent = null;

        if (plannerMode === 'week') {
            const days = getWeekRange(currentDate);
            title = `${new Date(days[0]).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} - ${new Date(days[6]).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`;
            
            gridContent = (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {days.map((date) => {
                        const recipeIds = plan[date] || [];
                        const dayRecipes = recipeIds.map(id => recipes.find(r => r.id === id)).filter(Boolean) as Recipe[];
                        const isToday = date === new Date().toISOString().split('T')[0];
                        const dayCost = dayRecipes.reduce((sum, r) => sum + r.price, 0);

                        return (
                            <div key={date} className={`border rounded-[1.5rem] p-5 bg-white flex flex-col h-full transition-all duration-300 hover:shadow-lg ${isToday ? 'border-orange-400 ring-2 ring-orange-100 shadow-md' : 'border-stone-100 hover:border-orange-200'}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className={`font-bold text-lg ${isToday ? 'text-orange-600' : 'text-stone-700'}`}>
                                        {new Date(date).toLocaleDateString('zh-CN', { weekday: 'long' })}
                                        <span className={`block text-xs font-normal ${isToday ? 'text-orange-400' : 'text-stone-400'}`}>
                                            {new Date(date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                                        </span>
                                    </h4>
                                    {isToday && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">今天</span>}
                                </div>
                                <div className="space-y-3 mb-4 flex-1">
                                    {dayRecipes.map((recipe, idx) => (
                                        <div key={`${recipe.id}-${idx}`} className="relative group">
                                            <RecipeCard recipe={recipe} compact onSelect={navigateToDetail} />
                                            <button onClick={() => handleRemoveFromPlan(date, recipe.id)} className="absolute -top-2 -right-2 bg-white text-red-500 border border-red-100 rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-red-50 hover:scale-110">
                                                <Plus size={14} className="rotate-45" strokeWidth={3} />
                                            </button>
                                        </div>
                                    ))}
                                    {dayRecipes.length === 0 && (
                                        <button 
                                            onClick={() => { setSelectingForDate(date); setPlanModalCategory('全部'); setPlanModalSearch(''); }}
                                            className="w-full py-8 text-center bg-stone-50/50 rounded-2xl border border-dashed border-stone-200 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors group"
                                        >
                                            <PlusCircle size={24} className="mx-auto mb-2 text-stone-300 group-hover:text-orange-400 transition-colors" />
                                            <span className="text-stone-400 text-xs font-medium group-hover:text-orange-500">添加菜品</span>
                                        </button>
                                    )}
                                </div>
                                <div className="mt-auto pt-3 flex justify-between items-center border-t border-stone-50">
                                    <div className="text-xs text-stone-400 font-medium">
                                        {dayRecipes.length > 0 && <span>预估 <span className="text-stone-600 font-bold">¥{dayCost}</span></span>}
                                    </div>
                                    <button onClick={() => { setSelectingForDate(date); setPlanModalCategory('全部'); setPlanModalSearch(''); }} className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1.5 rounded-lg hover:bg-stone-200 hover:text-stone-700 transition-colors">+</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        } else if (plannerMode === 'month') {
            const days = getMonthDays(currentDate);
            title = `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`;
            
            gridContent = (
                <div className="bg-white rounded-[2rem] border border-stone-200 overflow-hidden shadow-sm animate-in fade-in duration-500">
                    <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50">
                        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                            <div key={d} className="py-4 text-center text-sm font-bold text-stone-500">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 auto-rows-fr bg-stone-100 gap-px border-b border-stone-200">
                        {/* Empty cells for offset */}
                        {Array.from({ length: new Date(days[0]).getDay() }).map((_, i) => <div key={`empty-${i}`} className="h-28 md:h-36 bg-white"></div>)}
                        {days.map(date => {
                            const recipeIds = plan[date] || [];
                            const dayRecipes = recipeIds.map(id => recipes.find(r => r.id === id)).filter(Boolean) as Recipe[];
                            const isToday = date === new Date().toISOString().split('T')[0];
                            return (
                                <div key={date} 
                                     onClick={() => { setSelectingForDate(date); setPlanModalCategory('全部'); setPlanModalSearch(''); }}
                                     className={`h-28 md:h-36 bg-white p-2 hover:bg-orange-50 transition-colors cursor-pointer relative group flex flex-col ${isToday ? 'bg-orange-50/30' : ''}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-orange-500 text-white shadow-md' : 'text-stone-700'}`}>
                                            {new Date(date).getDate()}
                                        </span>
                                        {dayRecipes.length > 0 && <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 rounded-full font-bold">{dayRecipes.length}</span>}
                                    </div>
                                    <div className="space-y-1 overflow-y-auto no-scrollbar flex-1">
                                        {dayRecipes.map((r, i) => (
                                            <div key={i} className="text-[10px] text-stone-600 truncate bg-stone-50 border border-stone-100 rounded px-1.5 py-0.5">{r.title}</div>
                                        ))}
                                    </div>
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                                        <Plus className="text-stone-500 opacity-50" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        } else {
            // Year Mode (Stats Summary)
            title = `${currentDate.getFullYear()}年 总览`;
            const months = Array.from({length: 12}, (_, i) => i);
            
            // Calculate stats for each month
            const yearStats = months.map(month => {
                let meals = 0;
                let cost = 0;
                Object.keys(plan).forEach(dateStr => {
                    const d = new Date(dateStr);
                    if (d.getFullYear() === currentDate.getFullYear() && d.getMonth() === month) {
                        const ids = plan[dateStr];
                        meals += ids.length;
                        ids.forEach(id => {
                            const r = recipes.find(rec => rec.id === id);
                            if(r) cost += r.price;
                        })
                    }
                });
                return { name: `${month + 1}月`, meals, cost };
            });

            gridContent = (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {yearStats.map(stat => (
                            <div key={stat.name} className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-stone-400 mb-2 text-xs uppercase tracking-wider">{stat.name}</h4>
                                <div className="text-2xl font-black text-stone-800">{stat.meals} <span className="text-xs font-normal text-stone-400">餐</span></div>
                                <div className="text-sm font-medium text-orange-500">¥{stat.cost}</div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm h-80">
                        <h3 className="font-bold text-lg mb-6 text-stone-700 flex items-center gap-2"><BarChart2 size={20} className="text-teal-500"/> 年度用餐趋势</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={yearStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis dataKey="name" stroke="#bbb" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis yAxisId="left" stroke="#bbb" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                <YAxis yAxisId="right" orientation="right" stroke="#orange" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} cursor={{stroke: '#eee', strokeWidth: 2}} />
                                <Line yAxisId="left" type="monotone" dataKey="meals" stroke="#2A9D8F" strokeWidth={4} dot={{r: 4, fill:'#2A9D8F', strokeWidth: 2, stroke:'#fff'}} name="用餐数" />
                                <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#E76F51" strokeWidth={4} dot={{r: 4, fill:'#E76F51', strokeWidth: 2, stroke:'#fff'}} name="预算" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-8">
                {/* Responsive Header for Mobile Compatibility - Changed from sticky to relative */}
                <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-[2rem] border border-stone-100 shadow-sm relative z-10">
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="flex gap-1 bg-stone-100 p-1.5 rounded-2xl w-full sm:w-auto justify-center">
                            {(['week', 'month', 'year'] as PlannerViewMode[]).map(m => (
                                <button 
                                    key={m}
                                    onClick={() => setPlannerMode(m)}
                                    className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold transition-all ${plannerMode === m ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                                >
                                    {m === 'week' ? '周' : m === 'month' ? '月' : '年'}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-2xl border border-stone-100 w-full sm:w-auto justify-between">
                            <button 
                                onClick={() => setCurrentDate(new Date())} 
                                className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors whitespace-nowrap"
                            >
                                今天
                            </button>
                            <button onClick={() => changeDate(-1)} className="p-1 hover:bg-white rounded-full transition-colors text-stone-400 hover:text-stone-600"><ChevronLeft size={20}/></button>
                            <span className="font-bold text-stone-800 text-xs sm:text-sm text-center flex-1">{title}</span>
                            <button onClick={() => changeDate(1)} className="p-1 hover:bg-white rounded-full transition-colors text-stone-400 hover:text-stone-600"><ChevronRight size={20}/></button>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                        <button 
                            onClick={handleAutoPlan}
                            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-orange-200 hover:shadow-xl hover:-translate-y-0.5 transition-all font-bold text-sm flex-1 md:flex-none justify-center active:scale-95"
                        >
                            <Sparkles size={18} />
                            <span>随机生成下周菜单</span>
                        </button>
                    </div>
                </header>

                {gridContent}
            </div>
        );
    };

    const renderShoppingList = () => {
        const availableCategories = new Set<string>();
        if (shoppingMode === 'weekly') {
            shoppingItems.forEach(i => availableCategories.add(i.category));
        } else {
            dailyShoppingItems.forEach(day => day.items.forEach(i => availableCategories.add(i.category)));
        }
        const sortedCategories = Object.keys(SHOPPING_CATEGORY_MAP).filter(c => availableCategories.has(c));

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-stone-800 tracking-tight">采买清单</h2>
                        <p className="text-stone-500 mt-2 font-medium">
                            已自动汇总 <span className="text-orange-600 font-bold">主要新鲜食材</span>。
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="bg-white border border-stone-200 p-1.5 rounded-2xl flex gap-1 shadow-sm">
                            <button 
                                onClick={() => setShoppingMode('weekly')}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${shoppingMode === 'weekly' ? 'bg-stone-800 text-white shadow-md' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'}`}
                            >
                                <List size={16} /> 周清单
                            </button>
                            <button 
                                onClick={() => setShoppingMode('daily')}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${shoppingMode === 'daily' ? 'bg-stone-800 text-white shadow-md' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'}`}
                            >
                                <CalendarDays size={16} /> 日清单
                            </button>
                        </div>
                        <button className="p-3 text-stone-400 hover:text-teal-600 hover:bg-teal-50 rounded-2xl transition-colors ml-auto border border-stone-200 hover:border-teal-200" onClick={() => window.print()} title="打印">
                            <Download size={20}/>
                        </button>
                    </div>
                </header>

                {shoppingItems.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[2.5rem] border border-stone-100 shadow-sm">
                        <div className="bg-orange-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-300">
                            <ShoppingCart size={48} />
                        </div>
                        <h3 className="text-xl font-bold text-stone-800 mb-2">清单空空如也</h3>
                        <p className="text-stone-400 mb-8 max-w-xs mx-auto">先去规划一下这周吃什么，清单会自动生成的。</p>
                        <button onClick={() => setView(ViewState.PLANNER)} className="text-white font-bold bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-full shadow-lg hover:shadow-orange-200 transition-all">前往规划</button>
                    </div>
                ) : (
                    <>
                        {shoppingMode === 'weekly' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sortedCategories.map(cat => (
                                    <div key={cat} className="bg-white rounded-[1.5rem] shadow-sm border border-stone-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                                        <div className="bg-stone-50 px-5 py-4 border-b border-stone-100 font-bold text-stone-600 uppercase text-xs tracking-wider flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                                            {SHOPPING_CATEGORY_MAP[cat]}
                                        </div>
                                        <ul className="divide-y divide-stone-50 flex-1">
                                            {shoppingItems.filter(i => i.category === cat).map((item, idx) => (
                                                <li 
                                                    key={`${item.name}-${idx}`} 
                                                    onClick={() => toggleShoppingItem(item.name)}
                                                    className={`flex items-start gap-4 px-5 py-4 hover:bg-orange-50/30 transition-colors cursor-pointer group ${item.checked ? 'bg-stone-50/50 opacity-50' : ''}`}
                                                >
                                                    <div className={`mt-0.5 w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${item.checked ? 'bg-teal-500 border-teal-500 scale-90' : 'border-stone-300 group-hover:border-teal-400 bg-white'}`}>
                                                         {item.checked && <CheckCircle size={14} className="text-white" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`font-bold text-[15px] ${item.checked ? 'line-through text-stone-400' : 'text-stone-700'}`}>{item.name}</div>
                                                        <div className="text-xs text-orange-500 font-medium mt-1 break-words bg-orange-50 inline-block px-1.5 py-0.5 rounded-md">{item.details}</div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-10">
                                {dailyShoppingItems.map((day, dIdx) => (
                                    <div key={day.date} className="relative pl-6 border-l-2 border-stone-100">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white bg-orange-400 shadow-sm"></div>
                                        <div className="mb-4 flex items-baseline gap-3">
                                            <h3 className="font-bold text-xl text-stone-800">
                                                {new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'long' })}
                                            </h3>
                                            <span className="text-stone-400 font-medium text-sm">{new Date(day.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {day.items.map((item, idx) => (
                                                <div 
                                                    key={`${day.date}-${item.name}-${idx}`}
                                                    onClick={() => toggleShoppingItem(item.name, true, day.date)}
                                                    className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${item.checked ? 'border-stone-100 bg-stone-50 opacity-60' : 'border-stone-200 hover:border-orange-300 hover:shadow-md'}`}
                                                >
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${item.checked ? 'bg-stone-400 border-stone-400' : 'border-stone-300 bg-white group-hover:border-teal-400'}`}>
                                                        {item.checked && <CheckCircle size={12} className="text-white" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className={`font-bold text-sm ${item.checked ? 'line-through text-stone-400' : 'text-stone-700'}`}>{item.name}</div>
                                                        <div className="text-xs text-orange-500 font-medium mt-0.5">{item.details}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    const renderStats = () => {
        const COLORS = ['#F4A261', '#2A9D8F', '#E76F51', '#E9C46A', '#264653', '#AAB3AB', '#FFB4A2'];
        const { title, relevantRecipes, chartData, periodDescription } = statsAnalysis;
        const totalCalories = relevantRecipes.reduce((sum, r) => sum + r.calories, 0);
        const totalPrice = relevantRecipes.reduce((sum, r) => sum + r.price, 0);
        const mealCount = relevantRecipes.length;

        return (
             <div className="space-y-8 animate-in fade-in duration-500">
                {/* Mobile Optimized Stats Header - Changed from sticky to relative */}
                <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-[2rem] border border-stone-100 shadow-sm relative z-10">
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                         <div className="flex gap-1 bg-stone-100 p-1.5 rounded-2xl w-full sm:w-auto justify-center">
                            <button onClick={() => setStatsMode('week')} className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold transition-all ${statsMode === 'week' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>周</button>
                            <button onClick={() => setStatsMode('month')} className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold transition-all ${statsMode === 'month' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>月</button>
                            <button onClick={() => setStatsMode('year')} className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold transition-all ${statsMode === 'year' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>年</button>
                        </div>
                        <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-2xl border border-stone-100 w-full sm:w-auto justify-between">
                            <button onClick={() => setStatsDate(new Date())} className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors whitespace-nowrap">今天</button>
                            <button onClick={() => changeStatsDate(-1)} className="p-1 hover:bg-white rounded-full transition-colors text-stone-400 hover:text-stone-600"><ChevronLeft size={20}/></button>
                            <span className="font-bold text-stone-800 text-xs sm:text-sm text-center flex-1">{title}</span>
                            <button onClick={() => changeStatsDate(1)} className="p-1 hover:bg-white rounded-full transition-colors text-stone-400 hover:text-stone-600"><ChevronRight size={20}/></button>
                        </div>
                    </div>
                </header>

                {mealCount === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2rem] border border-stone-100 shadow-sm">
                        <BarChart2 size={48} className="mx-auto mb-4 text-stone-300" />
                        <h3 className="text-lg font-bold text-stone-600">本时段暂无数据</h3>
                        <p className="text-stone-400 mt-2 mb-6">请先在饮食日历中添加安排。</p>
                        <button onClick={() => setView(ViewState.PLANNER)} className="text-white font-bold bg-orange-500 hover:bg-orange-600 px-6 py-2.5 rounded-full shadow-lg hover:shadow-orange-200 transition-all">去规划</button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Stats Cards */}
                            <div className="bg-white p-5 rounded-[2rem] border border-stone-100 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><Flame size={24}/></div>
                                <div>
                                    <div className="text-2xl font-black text-stone-800">{totalCalories.toLocaleString()}</div>
                                    <div className="text-xs text-stone-400 font-bold uppercase">总卡路里 (kcal)</div>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-[2rem] border border-stone-100 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center"><CircleDollarSign size={24}/></div>
                                <div>
                                    <div className="text-2xl font-black text-stone-800">¥{totalPrice.toLocaleString()}</div>
                                    <div className="text-xs text-stone-400 font-bold uppercase">总预算 (CNY)</div>
                                </div>
                            </div>
                             <div className="bg-white p-5 rounded-[2rem] border border-stone-100 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center"><ChefHat size={24}/></div>
                                <div>
                                    <div className="text-2xl font-black text-stone-800">{mealCount}</div>
                                    <div className="text-xs text-stone-400 font-bold uppercase">用餐次数</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Chart Area */}
                            <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm h-[28rem] flex flex-col col-span-full">
                                <h3 className="font-bold text-lg mb-4 text-stone-700 flex items-center gap-2">
                                    <Activity size={20} className="text-orange-500"/> 
                                    {statsMode === 'week' ? '本周热量趋势' : statsMode === 'month' ? '本月热量趋势' : '年度热量趋势'}
                                </h3>
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                            <XAxis dataKey="name" stroke="#bbb" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                            <YAxis stroke="#bbb" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                            <Tooltip cursor={{fill: '#f5f5f5'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                                            <Bar dataKey="calories" fill="#F4A261" radius={[4, 4, 0, 0]} name="热量 (kcal)" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <Layout 
            currentView={view} 
            setView={setView} 
            onAddRecipe={handleAddRecipe}
            onExport={handleExportData}
            onImport={handleImportData}
        >
            {view === ViewState.DASHBOARD && renderDashboard()}
            {view === ViewState.RECIPES && renderRecipes()}
            {view === ViewState.PLANNER && renderPlanner()}
            {view === ViewState.SHOPPING && renderShoppingList()}
            {view === ViewState.STATS && renderStats()}
            
            {/* Add Recipe Modal */}
            {showAddRecipeModal && (
                <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black flex items-center gap-2 text-stone-800">
                                <Utensils size={28} className="text-orange-500" /> 
                                添加新菜谱
                            </h3>
                            <button onClick={() => setShowAddRecipeModal(false)} className="text-stone-400 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-full p-2 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-stone-500 mb-6 text-sm">
                            请输入菜谱名称，创建后您可以在详情页补充更多信息。
                        </p>
                        
                        <input
                            value={newRecipeTitle}
                            onChange={(e) => setNewRecipeTitle(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-none mb-6 text-stone-800 placeholder:text-stone-400 transition-all text-base font-bold"
                            placeholder="例如：红烧排骨"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') performAddRecipe();
                            }}
                        />
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={performAddRecipe}
                                disabled={!newRecipeTitle.trim()}
                                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-2xl font-bold hover:shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 flex justify-center items-center gap-2"
                            >
                                <Plus size={20} />
                                创建菜谱
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Selection Modal */}
            {selectingForDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300">
                     <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-white flex-shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-stone-800">添加菜品</h3>
                                <p className="text-stone-400 text-sm mt-1">
                                    {new Date(selectingForDate).toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <button onClick={() => setSelectingForDate(null)} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-800">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Search and Filters */}
                        <div className="p-4 space-y-4 bg-stone-50 border-b border-stone-100 flex-shrink-0">
                             <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="搜索菜品名称..." 
                                    value={planModalSearch}
                                    onChange={(e) => setPlanModalSearch(e.target.value)}
                                    className="w-full bg-white border-none rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-orange-400 shadow-sm transition-all text-sm"
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                <button 
                                    onClick={() => setPlanModalCategory('全部')}
                                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${planModalCategory === '全部' ? 'bg-stone-800 text-white shadow-md' : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'}`}
                                >
                                    全部
                                </button>
                                {RECIPE_CATEGORIES.map(cat => (
                                    <button 
                                        key={cat}
                                        onClick={() => setPlanModalCategory(cat)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${planModalCategory === cat ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-stone-600 hover:bg-orange-50 hover:text-orange-600 border border-stone-200'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-stone-50/50">
                            {modalFilteredRecipes.map(r => (
                                <RecipeCard 
                                    key={r.id} 
                                    recipe={r} 
                                    compact 
                                    onSelect={() => handleSelectRecipeForPlan(r)}
                                />
                            ))}
                            {modalFilteredRecipes.length === 0 && (
                                <div className="col-span-full text-center py-12 text-stone-400">
                                    <ChefHat size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>没有找到匹配的菜谱</p>
                                </div>
                            )}
                        </div>
                     </div>
                </div>
            )}
        </Layout>
    );
};

const App: React.FC = () => {
    const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);
    const [plan, setPlan] = useState<WeeklyPlan>({});
    const [preferences, setPreferences] = useState<UserPreference>({
        id: '1',
        name: 'User',
        dislikes: [],
        allergies: []
    });

    const handleUpdateRecipe = (updatedRecipe: Recipe) => {
        setRecipes(prev => prev.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
    };

    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={
                    <MainScreen 
                        recipes={recipes} 
                        setRecipes={setRecipes} 
                        plan={plan} 
                        setPlan={setPlan} 
                        preferences={preferences} 
                        setPreferences={setPreferences} 
                    />
                } />
                <Route path="/recipe/:id" element={
                    <RecipeDetail recipes={recipes} onUpdateRecipe={handleUpdateRecipe} />
                } />
            </Routes>
        </HashRouter>
    );
};

export default App;