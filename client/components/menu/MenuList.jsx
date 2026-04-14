"use client";

import MenuItem from './MenuItem';

export default function MenuList({ category, items }) {
  if (items.length === 0) return null;

  return (
    <section id={`category-${category._id}`} className="scroll-mt-32">
      <h2 className="text-xl font-bold mb-4 text-slate-800">{category.name}</h2>
      <div className="grid gap-4">
        {items.map(item => (
          <MenuItem key={item._id} item={item} />
        ))}
      </div>
    </section>
  );
}
