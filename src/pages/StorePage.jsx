import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Filter,
  Star,
  Plus,
  AlertTriangle,
  Check,
  ShieldCheck,
  X,
  Sparkles,
  Heart,
  PlusCircle
} from 'lucide-react';
import api from '../services/api.js';
import { useCart } from '../context/CartContext.jsx';
import { usePet } from '../context/PetContext.jsx';
import { MarketplacePage } from './MarketplacePage.jsx';

export const StorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'pets' ? 'pets' : 'supplies';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [targetSpecies, setTargetSpecies] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Quick view modal
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const { addToCart, setIsCartOpen } = useCart();
  const { selectedPet } = usePet();

  useEffect(() => {
    const fetchProducts = async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          api.get('/products'),
          api.get('/products/categories/list')
        ]);
        if (prodRes.data?.success) setProducts(prodRes.data.data);
        if (catRes.data?.success) setCategories(['All', ...catRes.data.data]);
      } catch (err) {
        console.error(err);
      } finally {
        if (!silent) setLoading(false);
      }
    };
    fetchProducts(false);

    const handleUpdate = () => {
      fetchProducts(true);
    };
    window.addEventListener('petcare_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('petcare_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Sync tab with URL search parameter
  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'pets') {
      setSearchParams({ tab: 'pets' });
    } else {
      setSearchParams({});
    }
  };

  // Helper to get ingredients as array
  const getIngredients = (product) => {
    if (!product.ingredients) return [];
    if (Array.isArray(product.ingredients)) return product.ingredients;
    return typeof product.ingredients === 'string'
      ? product.ingredients.split(',').map((s) => s.trim())
      : [];
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;

    // Strict species filter: Selecting Dogs Only shows ONLY dog items, Selecting Cats Only shows ONLY cat items
    let matchSpecies = true;
    if (targetSpecies === 'dog') {
      const isCatItem =
        p.targetPet?.toLowerCase() === 'cat' ||
        p.category?.toLowerCase().includes('cat') ||
        p.title.toLowerCase().includes('cat') ||
        p.title.toLowerCase().includes('kitten') ||
        p.title.toLowerCase().includes('feline');
      const isDogItem =
        p.targetPet?.toLowerCase() === 'dog' ||
        p.category?.toLowerCase().includes('dog') ||
        p.title.toLowerCase().includes('dog') ||
        p.title.toLowerCase().includes('canine') ||
        p.title.toLowerCase().includes('puppy') ||
        (Array.isArray(p.targetSpecies) && p.targetSpecies.includes('dog'));
      matchSpecies = isDogItem && !isCatItem;
    } else if (targetSpecies === 'cat') {
      const isDogItem =
        p.targetPet?.toLowerCase() === 'dog' ||
        p.category?.toLowerCase().includes('dog') ||
        p.title.toLowerCase().includes('dog') ||
        p.title.toLowerCase().includes('canine') ||
        p.title.toLowerCase().includes('puppy');
      const isCatItem =
        p.targetPet?.toLowerCase() === 'cat' ||
        p.category?.toLowerCase().includes('cat') ||
        p.title.toLowerCase().includes('cat') ||
        p.title.toLowerCase().includes('kitten') ||
        p.title.toLowerCase().includes('feline') ||
        (Array.isArray(p.targetSpecies) && p.targetSpecies.includes('cat'));
      matchSpecies = isCatItem && !isDogItem;
    }

    const matchSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSpecies && matchSearch;
  });

  // Check if product contains allergens for active pet
  const checkAllergenWarning = (product) => {
    if (!selectedPet || !selectedPet.allergies || selectedPet.allergies.length === 0) return null;
    const ingList = getIngredients(product);
    if (ingList.length === 0) return null;

    const matched = selectedPet.allergies.filter((allergy) =>
      ingList.some((ing) => ing.toLowerCase().includes(allergy.toLowerCase()))
    );

    if (matched.length > 0) {
      return `Contains ${matched.join(', ')} (${selectedPet.name} is allergic)`;
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Store Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => switchTab('pets')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'pets'
                ? 'bg-[#20351F] text-white shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Heart className="w-4 h-4 text-amber-400" />
            <span>🐾 Buy & Sell Pets</span>
          </button>

          <button
            onClick={() => switchTab('supplies')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'supplies'
                ? 'bg-[#20351F] text-white shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#DCE7D5]" />
            <span>🍖 Food & Pet Supplies</span>
          </button>
        </div>

        {activeTab === 'supplies' ? (
          <button
            onClick={() => setIsCartOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#20351F] hover:bg-[#152414] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#DCE7D5]" />
            <span>Open Shopping Cart</span>
          </button>
        ) : (
          <Link
            to="/marketplace?action=sell"
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Sell a Pet</span>
          </Link>
        )}
      </div>

      {/* If Tab is "pets", show Marketplace directly! */}
      {activeTab === 'pets' ? (
        <MarketplacePage />
      ) : (
        /* FOOD & SUPPLIES VIEW */
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20351F] tracking-tight">
              Pet Nutrition, Treats & Health Essentials
            </h1>
            <p className="text-sm text-stone-600 mt-0.5">
              Specialist-approved premium dog food, grain-free cat formulas, supplements, and dental care.
            </p>
          </div>

          {/* Allergy Safety Alert Banner */}
          {selectedPet && selectedPet.allergies.length > 0 && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F0F4ED] border border-[#78936D]/30 flex items-center justify-between gap-3 text-xs text-[#20351F]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#78936D] shrink-0" />
                <span>
                  <strong className="font-bold">Active Allergy Guard for {selectedPet.name}:</strong> Recipes containing <span className="underline font-bold text-rose-700">{selectedPet.allergies.join(', ')}</span> are automatically flagged with safety warnings.
                </span>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search food, treats, flea meds, supplements, toys..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                />
              </div>

              {/* Species Filter */}
              <div className="flex items-center gap-1.5">
                {['all', 'dog', 'cat'].map((sp) => (
                  <button
                    key={sp}
                    onClick={() => setTargetSpecies(sp)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                      targetSpecies === sp
                        ? 'bg-[#20351F] text-white shadow-xs'
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {sp === 'all' ? 'All Pets' : `${sp} Only`}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-stone-800 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-[#20351F] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-stone-500 font-medium">Loading catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8">
              <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#20351F]">No products found</h3>
              <p className="text-xs text-stone-500 mt-1">Try clearing your search query or selecting another category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const allergenWarning = checkAllergenWarning(product);
                return (
                  <div
                    key={product._id}
                    className="group rounded-3xl bg-white border border-stone-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                  >
                    <div className="relative aspect-square bg-stone-50 overflow-hidden cursor-pointer" onClick={() => setQuickViewProduct(product)}>
                      <img
                        src={product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500'}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.targetPet && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-bold text-[#20351F] shadow-xs">
                          {product.targetPet}
                        </span>
                      )}
                      {allergenWarning && (
                        <div className="absolute top-3 right-3 p-1.5 rounded-full bg-rose-600 text-white shadow-xs" title={allergenWarning}>
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-stone-400">
                          <span>{product.brand}</span>
                          <div className="flex items-center text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                            <span className="font-semibold text-stone-700">{product.rating}</span>
                          </div>
                        </div>

                        <h3
                          onClick={() => setQuickViewProduct(product)}
                          className="font-bold text-sm text-[#20351F] line-clamp-2 hover:text-[#C8643D] transition-colors cursor-pointer mt-1"
                        >
                          {product.title}
                        </h3>

                        {allergenWarning && (
                          <p className="text-[10px] text-rose-600 font-semibold mt-1 bg-rose-50 p-1 rounded-md">
                            ⚠️ {allergenWarning}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                        <div>
                          <span className="text-base font-extrabold text-[#20351F]">
                            ${product.price.toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={() => addToCart(product)}
                          className="p-2 rounded-xl bg-[#20351F] hover:bg-[#152414] text-white transition-colors cursor-pointer shadow-xs"
                          title="Add to Cart"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* QUICK VIEW MODAL FOR SUPPLIES */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-base font-bold text-[#20351F]">{quickViewProduct.title}</h3>
              <button onClick={() => setQuickViewProduct(null)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="aspect-square rounded-2xl bg-stone-50 overflow-hidden">
                <img
                  src={quickViewProduct.image || quickViewProduct.images?.[0] || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500'}
                  alt={quickViewProduct.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-3 text-xs text-stone-600 flex flex-col justify-between">
                <div>
                  <p className="text-stone-400 font-semibold">{quickViewProduct.brand}</p>
                  <p className="text-lg font-extrabold text-[#20351F] mt-1">
                    ${quickViewProduct.price.toFixed(2)}
                  </p>
                  <p className="mt-2 text-stone-600 leading-relaxed">{quickViewProduct.description}</p>
                </div>

                <button
                  onClick={() => {
                    addToCart(quickViewProduct);
                    setQuickViewProduct(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#20351F] hover:bg-[#152414] text-white font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Bag</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
