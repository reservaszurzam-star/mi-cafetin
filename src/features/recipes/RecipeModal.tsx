import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, X, Sparkles } from 'lucide-react';
import { Recipe, RecipeIngredient } from './recipeTypes';
import { Product } from '../../types';
import { formatMoney } from '../../lib/formatters';

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: Omit<Recipe, 'id'>) => void;
  editingRecipe?: Recipe | null;
  products: Product[];
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRecipe,
  products,
}) => {
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [sellingPrice, setSellingPrice] = useState<number>(25);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([
    { itemId: '1', itemName: '', unit: 'kg', quantity: 1, cost: 5 }
  ]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingRecipe) {
      setProductId(editingRecipe.productId);
      setSellingPrice(editingRecipe.sellingPrice);
      setIngredients(editingRecipe.ingredients);
      setNotes(editingRecipe.preparationNotes || '');
    } else {
      setProductId(products[0]?.id || '');
      setSellingPrice(products[0]?.price || 25);
      setIngredients([{ itemId: '1', itemName: '', unit: 'kg', quantity: 1, cost: 5 }]);
      setNotes('');
    }
  }, [editingRecipe, isOpen, products]);

  if (!isOpen) return null;

  const handleProductChange = (id: string) => {
    setProductId(id);
    const matched = products.find(p => p.id === id);
    if (matched) {
      setSellingPrice(matched.price);
    }
  };

  const handleAddIngredient = () => {
    setIngredients(prev => [
      ...prev,
      { itemId: String(Date.now()), itemName: '', unit: 'kg', quantity: 1, cost: 5 }
    ]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: any) => {
    setIngredients(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const totalCost = ingredients.reduce((sum, item) => sum + (item.cost || 0), 0);
  const marginPercent = sellingPrice > 0 ? ((sellingPrice - totalCost) / sellingPrice) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedProduct = products.find(p => p.id === productId);
    if (!matchedProduct || ingredients.length === 0) return;

    onSave({
      productId: matchedProduct.id,
      productName: matchedProduct.name,
      category: matchedProduct.category,
      sellingPrice,
      ingredients: ingredients.filter(i => i.itemName.trim() !== ''),
      totalCost,
      marginPercent: Number(marginPercent.toFixed(1)),
      preparationNotes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-2xl border border-stone-200 shadow-2xl animate-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              <Layers className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-lg text-stone-900 leading-tight">
                {editingRecipe ? 'Editar Ficha Técnica' : 'Crear Escandallo / Ficha Técnica'}
              </h3>
              <p className="text-xs text-stone-500 font-semibold">Costos de insumos y rentabilidad del plato</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Plato de la Carta *
              </label>
              <select
                value={productId}
                onChange={(e) => handleProductChange(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Precio de Venta (S/)
              </label>
              <input
                type="number"
                step="0.50"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Insumos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider">
                Insumos & Porciones
              </label>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Insumo
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {ingredients.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 bg-stone-50 p-2 rounded-xl border border-stone-200 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Nombre insumo"
                      value={item.itemName}
                      onChange={(e) => handleIngredientChange(index, 'itemName', e.target.value)}
                      required
                      className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-xs font-bold outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Und (kg, L)"
                      value={item.unit}
                      onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                      required
                      className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-xs font-bold text-center outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Cant."
                      value={item.quantity}
                      onChange={(e) => handleIngredientChange(index, 'quantity', Number(e.target.value))}
                      required
                      className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-xs font-bold text-center outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.10"
                      placeholder="Costo S/"
                      value={item.cost}
                      onChange={(e) => handleIngredientChange(index, 'cost', Number(e.target.value))}
                      required
                      className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-xs font-bold text-right outline-none"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(index)}
                        className="text-stone-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Notas de Preparación / Emplatado
            </label>
            <input
              type="text"
              placeholder="Ej: Cocción 50 minutos a fuego medio. Decorar con perejil fresco."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
            />
          </div>

          {/* Tarjeta de Rentabilidad y Margen */}
          <div className="grid grid-cols-3 gap-3 bg-stone-900 text-white p-4 rounded-2xl">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-stone-400 block">Costo Insumos</span>
              <span className="text-xl font-black font-mono text-rose-400">{formatMoney(totalCost)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-stone-400 block">Ganancia Bruta</span>
              <span className="text-xl font-black font-mono text-emerald-400">{formatMoney(sellingPrice - totalCost)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-stone-400 block">Margen %</span>
              <span className="text-xl font-black font-mono text-amber-400">{marginPercent.toFixed(1)}%</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs hover:bg-stone-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs shadow-md transition"
            >
              {editingRecipe ? 'Guardar Cambios' : 'Guardar Escandallo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
