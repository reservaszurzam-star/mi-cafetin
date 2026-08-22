import React, { useState, useEffect } from 'react';
import { Layers, AlertTriangle, Plus } from 'lucide-react';
import { useAppStore } from "../../hooks/StoreContext";
import { cn } from "../../lib/utils";
import { Recipe, WasteRecord, INITIAL_RECIPES, INITIAL_WASTES } from "./recipeTypes";
import { RecipesListTab } from "./RecipesListTab";
import { WasteLogTab } from "./WasteLogTab";
import { RecipeModal } from "./RecipeModal";
import { WasteModal } from "./WasteModal";

export default function RecipesView() {
  const { products } = useAppStore();
  const [activeTab, setActiveTab] = useState<'recipes' | 'waste'>('recipes');

  // Estado persistido en LocalStorage
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('cafetin_recipes_list');
    return saved ? JSON.parse(saved) : INITIAL_RECIPES;
  });

  const [wastes, setWastes] = useState<WasteRecord[]>(() => {
    const saved = localStorage.getItem('cafetin_wastes_list');
    return saved ? JSON.parse(saved) : INITIAL_WASTES;
  });

  // Modales
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showWasteModal, setShowWasteModal] = useState(false);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('cafetin_recipes_list', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('cafetin_wastes_list', JSON.stringify(wastes));
  }, [wastes]);

  // Handlers Recetas
  const handleSaveRecipe = (recipeData: Omit<Recipe, 'id'>) => {
    if (editingRecipe) {
      setRecipes(prev => prev.map(r => r.id === editingRecipe.id ? { ...recipeData, id: editingRecipe.id } : r));
    } else {
      const newRec: Recipe = {
        ...recipeData,
        id: `rec-${Date.now()}`
      };
      setRecipes(prev => [newRec, ...prev]);
    }
    setShowRecipeModal(false);
    setEditingRecipe(null);
  };

  const handleDeleteRecipe = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este escandallo?')) {
      setRecipes(prev => prev.filter(r => r.id !== id));
    }
  };

  // Handlers Mermas
  const handleSaveWaste = (wasteData: Omit<WasteRecord, 'id'>) => {
    const newWaste: WasteRecord = {
      ...wasteData,
      id: `w-${Date.now()}`
    };
    setWastes(prev => [newWaste, ...prev]);
    setShowWasteModal(false);
  };

  const handleDeleteWaste = (id: string) => {
    setWastes(prev => prev.filter(w => w.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header Superior */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
              Cocina & Costos
            </span>
            <span className="text-xs text-stone-400 font-bold">· Fichas Técnicas</span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-amber-500" />
            Recetas, Escandallos & Control de Mermas
          </h2>
          <p className="text-xs font-semibold text-stone-500 mt-0.5">
            Estructura de costos de insumos, márgenes de ganancia bruta por plato y control de desperdicios
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200">
            <button
              onClick={() => setActiveTab('recipes')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5",
                activeTab === 'recipes' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Escandallos ({recipes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('waste')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5",
                activeTab === 'waste' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Mermas ({wastes.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (activeTab === 'recipes') {
                setEditingRecipe(null);
                setShowRecipeModal(true);
              } else {
                setShowWasteModal(true);
              }
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-2xl flex items-center gap-2 shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'recipes' ? 'Nuevo Escandallo' : 'Registrar Merma'}</span>
          </button>
        </div>
      </div>

      {/* Contenido por Tab */}
      {activeTab === 'recipes' && (
        <RecipesListTab
          recipes={recipes}
          onOpenCreate={() => {
            setEditingRecipe(null);
            setShowRecipeModal(true);
          }}
          onOpenEdit={(r) => {
            setEditingRecipe(r);
            setShowRecipeModal(true);
          }}
          onDelete={handleDeleteRecipe}
        />
      )}

      {activeTab === 'waste' && (
        <WasteLogTab
          wastes={wastes}
          onOpenCreate={() => setShowWasteModal(true)}
          onDelete={handleDeleteWaste}
        />
      )}

      {/* Modales */}
      <RecipeModal
        isOpen={showRecipeModal}
        onClose={() => {
          setShowRecipeModal(false);
          setEditingRecipe(null);
        }}
        onSave={handleSaveRecipe}
        editingRecipe={editingRecipe}
        products={products}
      />

      <WasteModal
        isOpen={showWasteModal}
        onClose={() => setShowWasteModal(false)}
        onSave={handleSaveWaste}
      />
    </div>
  );
}
