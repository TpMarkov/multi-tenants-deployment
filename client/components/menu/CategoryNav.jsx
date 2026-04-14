"use client";

import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function CategoryNav({ categories }) {
  const [active, setActive] = useState(categories[0]?._id);

  const scrollToCategory = (id) => {
    setActive(id);
    const el = document.getElementById(`category-${id}`);
    if (el) {
      const offset = 120; // header height + nav height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav className="sticky top-[73px] z-10 bg-white border-b flex overflow-x-auto no-scrollbar py-2 px-4 gap-4">
      {categories.map((cat) => (
        <button
          key={cat._id}
          onClick={() => scrollToCategory(cat._id)}
          className={cn(
            "whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
            active === cat._id 
              ? "bg-slate-900 text-white" 
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          {cat.name}
        </button>
      ))}
    </nav>
  );
}
