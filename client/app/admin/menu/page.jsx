'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { useAdminStore } from '@/store/useAdminStore';
import { getCategories, getMenuItems, createCategory, createMenuItem, updateMenuItem, updateMenuItemAvailability, deleteMenuItem, deleteCategory } from '@/lib/api';
import { Plus, X, Loader2, UtensilsCrossed, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function Modal({ title, onClose, children, large = false }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-3xl p-6 ${large ? 'max-w-2xl' : 'max-w-md'} w-full shadow-2xl`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function MenuPage() {
  const { propertyId } = useAdminStore();
  const pid = propertyId || process.env.NEXT_PUBLIC_DEFAULT_PROPERTY_ID;

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items');
  const [showCatModal, setShowCatModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [catName, setCatName] = useState('');
  const [catSaving, setCatSaving] = useState(false);
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', categoryId: '', imageUrl: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [itemSaving, setItemSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [catRes, itemRes] = await Promise.all([getCategories(pid), getMenuItems(pid)]);
        setCategories(catRes.data.data || []);
        setItems(itemRes.data.data || []);
      } catch { toast.error('Failed to load menu'); }
      finally { setLoading(false); }
    };
    if (pid) fetch();
  }, [pid]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCatSaving(true);
    try {
      const res = await createCategory({ propertyId: pid, name: catName });
      setCategories(prev => [...prev, res.data.data]);
      setCatName('');
      setShowCatModal(false);
      toast.success('Category created!');
    } catch { toast.error('Failed to create category'); }
    finally { setCatSaving(false); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setItemForm(f => ({ ...f, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        description: item.description || '',
        price: item.price?.toString() || '',
        categoryId: typeof item.categoryId === 'string' ? item.categoryId : item.categoryId?._id || '',
        imageUrl: item.imageUrl || ''
      });
      setImagePreview(item.imageUrl || '');
    } else {
      setEditingItem(null);
      setItemForm({ name: '', description: '', price: '', categoryId: '', imageUrl: '' });
      setImagePreview('');
    }
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setItemSaving(true);
    try {
      const itemData = { 
        ...itemForm, 
        price: parseFloat(itemForm.price),
        categoryId: itemForm.categoryId,
        propertyId: pid
      };

      if (editingItem) {
        // Update existing item
        const res = await updateMenuItem(editingItem._id, itemData);
        setItems(prev => prev.map(i => i._id === editingItem._id ? res.data.data : i));
        toast.success('Menu item updated!');
      } else {
        // Create new item
        const res = await createMenuItem(itemData);
        setItems(prev => [...prev, res.data.data]);
        toast.success('Menu item created!');
      }
      
      setItemForm({ name: '', description: '', price: '', categoryId: '', imageUrl: '' });
      setImagePreview('');
      setShowItemModal(false);
      setEditingItem(null);
    } catch (err) { 
      toast.error(editingItem ? 'Failed to update item' : 'Failed to create item'); 
    }
    finally { setItemSaving(false); }
  };

  const handleDeleteItem = async (itemId, itemName) => {
    if (!confirm(`Delete "${itemName}"?`)) return;
    try {
      await deleteMenuItem(itemId);
      setItems(prev => prev.filter(i => i._id !== itemId));
      toast.success('Menu item deleted!');
    } catch { toast.error('Failed to delete item'); }
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (!confirm(`Delete "${catName}"? (Must have no items)`)) return;
    try {
      await deleteCategory(catId);
      setCategories(prev => prev.filter(c => c._id !== catId));
      toast.success('Category deleted!');
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Failed to delete category'); 
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await updateMenuItemAvailability(item._id, !item.isAvailable);
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, isAvailable: !i.isAvailable } : i));
    } catch { toast.error('Failed to update availability'); }
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c._id === (categoryId?._id || categoryId));
    return cat?.name || '—';
  };

  return (
    <>
      <TopBar title="Menu Management" />
      {showCatModal && (
        <Modal title="New Category" onClose={() => setShowCatModal(false)}>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category Name</label>
              <input value={catName} onChange={e => setCatName(e.target.value)} required
                placeholder="e.g. Breakfast, Cocktails"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={catSaving}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-60">
              {catSaving && <Loader2 className="h-4 w-4 animate-spin" />} Create Category
            </button>
          </form>
        </Modal>
      )}
      {showItemModal && (
        <Modal title={editingItem ? "Edit Menu Item" : "New Menu Item"} onClose={() => {
          setShowItemModal(false);
          setEditingItem(null);
        }} large>
          <form onSubmit={handleSaveItem} className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Item Name *</label>
              <input 
                type="text"
                value={itemForm.name} 
                onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
                required 
                placeholder="e.g. Avocado Toast"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea 
                value={itemForm.description} 
                onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Short description"
                rows={2}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Price ($) *</label>
              <input 
                type="number"
                step="0.01"
                value={itemForm.price} 
                onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))}
                required 
                placeholder="0.00"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category *</label>
              <select 
                value={itemForm.categoryId} 
                onChange={e => setItemForm(f => ({ ...f, categoryId: e.target.value }))} 
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select a category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Image</label>
              <input 
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {imagePreview && (
                <div className="mt-3 flex items-center gap-3">
                  <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setItemForm(f => ({ ...f, imageUrl: '' }));
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-semibold"
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>

            <button type="submit" disabled={itemSaving}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-60">
              {itemSaving && <Loader2 className="h-4 w-4 animate-spin" />} 
              {editingItem ? 'Update Item' : 'Create Item'}
            </button>
          </form>
        </Modal>
      )}

      <div className="flex-1 p-6">
        {/* Tabs + Actions */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1.5">
            {['items', 'categories'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                {tab}
              </button>
            ))}
          </div>
          <button onClick={() => activeTab === 'categories' ? setShowCatModal(true) : openItemModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm">
            <Plus className="h-4 w-4" />
            Add {activeTab === 'categories' ? 'Category' : 'Item'}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
          ) : activeTab === 'categories' ? (
            <div className="overflow-x-auto">
              {categories.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 opacity-25" />
                  <p className="font-semibold text-slate-500">No categories yet</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 text-left text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3.5 font-semibold">Name</th>
                    <th className="px-6 py-3.5 font-semibold">Items</th>
                    <th className="px-6 py-3.5 font-semibold">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {categories.map(cat => (
                      <tr key={cat._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{cat.name}</td>
                        <td className="px-6 py-4 text-slate-500">{items.filter(i => (i.categoryId?._id || i.categoryId) === cat._id).length} items</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteCategory(cat._id, cat.name)}
                            className="text-red-600 hover:text-red-700 font-semibold text-sm flex items-center gap-1"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {items.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 opacity-25" />
                  <p className="font-semibold text-slate-500">No menu items yet</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 text-left text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3.5 font-semibold">Image</th>
                    <th className="px-6 py-3.5 font-semibold">Name</th>
                    <th className="px-6 py-3.5 font-semibold">Category</th>
                    <th className="px-6 py-3.5 font-semibold">Price</th>
                    <th className="px-6 py-3.5 font-semibold">Available</th>
                    <th className="px-6 py-3.5 font-semibold">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map(item => (
                      <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="h-12 w-12 object-cover rounded-lg" />
                          ) : (
                            <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
                              {item.name[0]}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-slate-400 text-xs truncate max-w-xs">{item.description}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{getCategoryName(item.categoryId)}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">${item.price?.toFixed(2)}</td>
                        <td className="px-6 py-4"><Toggle checked={item.isAvailable} onChange={() => toggleAvailability(item)} /></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openItemModal(item)}
                              className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
                            >
                              <Edit2 className="h-4 w-4" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item._id, item.name)}
                              className="text-red-600 hover:text-red-700 font-semibold text-sm flex items-center gap-1"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
