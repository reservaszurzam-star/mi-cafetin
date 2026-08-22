export type RecipeIngredient = {
  itemId: string;
  itemName: string;
  unit: string;
  quantity: number;
  cost: number;
};

export type Recipe = {
  id: string;
  productId: string;
  productName: string;
  category: string;
  sellingPrice: number;
  ingredients: RecipeIngredient[];
  totalCost: number;
  marginPercent: number;
  preparationNotes?: string;
};

export type WasteRecord = {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  cost: number;
  reason: 'Vencimiento' | 'Mal estado' | 'Error de cocina' | 'Derrame / Rotura' | 'Otro';
  date: string;
  responsible: string;
  notes?: string;
};

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rec-1',
    productId: '1',
    productName: 'Combo Familiar: 1 Pollo + Papas + Ensalada + Gaseosa 1.5L',
    category: 'Combos & Promos',
    sellingPrice: 72.0,
    ingredients: [
      { itemId: 'inv-1', itemName: 'Pollo Crudo Eviscerado', unit: 'und', quantity: 1, cost: 16.50 },
      { itemId: 'inv-2', itemName: 'Papa Amarilla / Canchán', unit: 'kg', quantity: 1.2, cost: 4.80 },
      { itemId: 'inv-3', itemName: 'Aceite Vegetal', unit: 'L', quantity: 0.3, cost: 2.10 },
      { itemId: 'inv-4', itemName: 'Carbón Vegetal', unit: 'kg', quantity: 0.8, cost: 2.40 },
      { itemId: 'inv-5', itemName: 'Gaseosa 1.5L', unit: 'und', quantity: 1, cost: 4.50 },
    ],
    totalCost: 30.30,
    marginPercent: 57.9,
    preparationNotes: 'Marinado de 12 horas. Cocción al carbón 55 minutos.'
  },
  {
    id: 'rec-2',
    productId: '2',
    productName: '1/2 Pollo a la Brasa + Papas Fritas + Ensalada',
    category: 'Pollos a la Brasa',
    sellingPrice: 38.0,
    ingredients: [
      { itemId: 'inv-1', itemName: 'Pollo Crudo Eviscerado', unit: 'und', quantity: 0.5, cost: 8.25 },
      { itemId: 'inv-2', itemName: 'Papa Amarilla / Canchán', unit: 'kg', quantity: 0.6, cost: 2.40 },
      { itemId: 'inv-3', itemName: 'Aceite Vegetal', unit: 'L', quantity: 0.15, cost: 1.05 },
    ],
    totalCost: 11.70,
    marginPercent: 69.2,
    preparationNotes: 'Acompañado con cremas caseras (ají y mayonesa).'
  },
  {
    id: 'rec-3',
    productId: 'cv-1',
    productName: 'Ceviche de Pescado',
    category: 'Entradas & Chaufa',
    sellingPrice: 27.0,
    ingredients: [
      { itemId: 'inv-6', itemName: 'Filete de Pescado Fresco', unit: 'kg', quantity: 0.22, cost: 7.70 },
      { itemId: 'inv-7', itemName: 'Limón Criollo', unit: 'kg', quantity: 0.15, cost: 0.90 },
      { itemId: 'inv-8', itemName: 'Cebolla Roja', unit: 'kg', quantity: 0.08, cost: 0.35 },
      { itemId: 'inv-9', itemName: 'Camote & Choclo', unit: 'porc', quantity: 1, cost: 1.80 },
    ],
    totalCost: 10.75,
    marginPercent: 60.2,
    preparationNotes: 'Corte en cubos de 2x2cm. Leche de tigre al momento.'
  }
];

export const INITIAL_WASTES: WasteRecord[] = [
  {
    id: 'w-1',
    itemId: 'inv-2',
    itemName: 'Papa Amarilla',
    quantity: 3.5,
    unit: 'kg',
    cost: 14.00,
    reason: 'Mal estado',
    date: '2026-08-18 11:30',
    responsible: 'Chef Principal',
    notes: 'Lote recibido con humedad excesiva.'
  },
  {
    id: 'w-2',
    itemId: 'inv-6',
    itemName: 'Filete de Pescado',
    quantity: 0.8,
    unit: 'kg',
    cost: 28.00,
    reason: 'Error de cocina',
    date: '2026-08-19 14:10',
    responsible: 'Cocinero de Turno',
    notes: 'Sobre-cocción en fritura.'
  }
];
