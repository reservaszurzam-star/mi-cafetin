import React from 'react';
import { PaymentMethod, ProductCategory } from '../../types';
import { 
  Banknote, Smartphone, CreditCard, Building2, ClipboardList, Coins 
} from 'lucide-react';

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Efectivo", "Yape", "Plin", "Tarjeta", "Transferencia", "A crédito", "Otro",
];

export const PAY_ICONS: Record<string, React.ReactNode> = {
  Efectivo: <Banknote className="w-5 h-5 text-emerald-600" />,
  Yape: <Smartphone className="w-5 h-5 text-purple-600" />,
  Plin: <Smartphone className="w-5 h-5 text-sky-500" />,
  Tarjeta: <CreditCard className="w-5 h-5 text-blue-600" />,
  Transferencia: <Building2 className="w-5 h-5 text-indigo-600" />,
  "A crédito": <ClipboardList className="w-5 h-5 text-amber-600" />,
  Otro: <Coins className="w-5 h-5 text-stone-600" />,
};

export const PAY_IMAGES: Record<string, React.ReactNode> = {
  Efectivo: <Banknote className="w-8 h-8 text-emerald-600" />,
  Yape: <img src="/payment-methods/yape.png" alt="Yape" className="w-8 h-8 object-contain rounded-md shadow-sm" />,
  Plin: <img src="/payment-methods/plin.png" alt="Plin" className="w-8 h-8 object-contain rounded-md shadow-sm" />,
  Tarjeta: <img src="/payment-methods/visa.jpg" alt="Tarjeta" className="w-8 h-8 object-contain rounded-md shadow-sm bg-white p-0.5" />,
  Transferencia: <img src="/payment-methods/transferencia.png" alt="Transferencia" className="w-8 h-8 object-contain rounded-md shadow-sm" />,
  "A crédito": <ClipboardList className="w-8 h-8 text-amber-600" />,
  Otro: <Coins className="w-8 h-8 text-stone-600" />,
};

export const POS_CATEGORIES: (ProductCategory | "Todos")[] = [
  "Todos",
  "Combos & Promos",
  "Pollos a la Brasa",
  "Parrillas & Mostros",
  "Entradas & Chaufa",
  "Guarniciones & Salsas",
  "Bebidas & Refrescos",
  "Postres",
  "Otros",
];
