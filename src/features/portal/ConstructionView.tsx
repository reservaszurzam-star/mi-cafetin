import React from 'react';
import { HardHat } from 'lucide-react';

export default function ConstructionView({ title }: { title: string }) {
  return (
    <div className="flex-1 p-8 pt-6 pb-24 h-full flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 bg-stone-100 dark:bg-stone-900 rounded-full flex items-center justify-center mb-6">
        <HardHat className="w-12 h-12 text-amber-500" />
      </div>
      <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight mb-4">{title}</h1>
      <p className="text-stone-500 dark:text-stone-400 max-w-md mx-auto text-lg">
        Este módulo está en desarrollo. Pronto podrás disfrutar de estas nuevas herramientas.
      </p>
    </div>
  );
}

