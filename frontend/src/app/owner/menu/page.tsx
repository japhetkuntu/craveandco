'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { API_PATHS } from '@/lib/constants';
import { get, post, patch, del } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Utensils, Plus, ToggleLeft, ToggleRight, Trash2, BookOpen, Tag } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';

interface MenuOptionValue {
  id: string;
  label: string;
  priceAdjustment?: number;
}

interface MenuOption {
  id: string;
  name: string;
  label?: string;
  required: boolean;
  multiple: boolean;
  values: MenuOptionValue[];
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  available: boolean;
  category: { id: string; name: string };
  options?: MenuOption[];
}

interface Category {
  id: string;
  name: string;
}

interface RecipeItem {
  id: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  ingredient: {
    id: string;
    name: string;
    unit: string;
    currentCost: number;
  };
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentCost: number;
}

export default function OwnerMenuPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
  });
  const [newItemOptions, setNewItemOptions] = useState<MenuOption[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [editItemData, setEditItemData] = useState({ name: '', description: '', price: 0 });
  const [editItemOptions, setEditItemOptions] = useState<MenuOption[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeSaving, setRecipeSaving] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeImportLoading, setRecipeImportLoading] = useState(false);
  const [recipeError, setRecipeError] = useState('');
  const [recipeImportError, setRecipeImportError] = useState('');
  const [recipeImportSources, setRecipeImportSources] = useState<MenuItem[]>([]);
  const [recipeImportSourceId, setRecipeImportSourceId] = useState('');
  const [recipeForm, setRecipeForm] = useState({ ingredientName: '', quantity: 0, unit: '', unitCost: 0 });
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);

  const createOption = () => ({
    id: `opt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: '',
    label: '',
    required: false,
    multiple: false,
    values: [
      {
        id: `val-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        label: '',
        priceAdjustment: 0,
      },
    ],
  });

  const createValue = () => ({
    id: `val-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    label: '',
    priceAdjustment: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, categoriesRes, ingredientsRes] = await Promise.all([
        get('/api/v1/menu/items', token ?? undefined),
        get('/api/v1/menu/categories', token ?? undefined),
        get(`${API_PATHS.inventory.ingredients}?limit=100`, token ?? undefined),
      ]);
      setItems(itemsRes);
      setCategories(categoriesRes);
      setIngredients(ingredientsRes);
      if (categoriesRes.length > 0 && !newItem.categoryId) {
        setNewItem((prev) => ({ ...prev, categoryId: categoriesRes[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchRecipeImportSources = async (itemId: string) => {
    setRecipeImportError('');
    try {
      const sources = await get(API_PATHS.menu.recipeImportSources(itemId), token ?? undefined);
      setRecipeImportSources(sources);
      if (sources.length > 0) {
        setRecipeImportSourceId(sources[0].id);
      }
    } catch (err: any) {
      setRecipeImportError(err.message || 'Failed to load import sources');
    }
  };

  const fetchRecipeData = async (item: MenuItem) => {
    setSelectedMenuItem(item);
    setRecipeLoading(true);
    setRecipeError('');
    try {
      const recipeRes = await get(API_PATHS.menu.recipeItems(item.id), token ?? undefined);
      setRecipeItems(recipeRes);
      setEditingRecipeId(null);
      setRecipeForm({ ingredientName: '', quantity: 0, unit: '', unitCost: 0 });
      if (recipeRes.length === 0) {
        await fetchRecipeImportSources(item.id);
      } else {
        setRecipeImportSources([]);
        setRecipeImportSourceId('');
      }
    } catch (err: any) {
      setRecipeError(err.message || 'Failed to load recipe details');
    } finally {
      setRecipeLoading(false);
    }
  };

  const openRecipeEditor = async (item: MenuItem) => {
    await fetchRecipeData(item);
  };

  const closeRecipeEditor = () => {
    setSelectedMenuItem(null);
    setRecipeItems([]);
    setRecipeImportSources([]);
    setRecipeImportSourceId('');
    setRecipeImportError('');

    setRecipeForm({ ingredientName: '', quantity: 0, unit: '', unitCost: 0 });
    setEditingRecipeId(null);
    setRecipeError('');
  };

  const refreshRecipe = async () => {
    if (!selectedMenuItem) return;
    try {
      const recipeRes = await get(API_PATHS.menu.recipeItems(selectedMenuItem.id), token ?? undefined);
      setRecipeItems(recipeRes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecipeFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedMenuItem) return;
    if (!recipeForm.ingredientName.trim() || recipeForm.quantity <= 0) {
      setRecipeError('Ingredient name and quantity are required');
      return;
    }

    setRecipeSaving(true);
    setRecipeError('');
    try {
      const payload = {
        ingredientName: recipeForm.ingredientName.trim(),
        quantity: Number(recipeForm.quantity),
        unit: recipeForm.unit.trim() || undefined,
        unitCost: recipeForm.unitCost !== undefined ? Number(recipeForm.unitCost) : undefined,
      };

      if (editingRecipeId) {
        await patch(API_PATHS.menu.recipeItem(selectedMenuItem.id, editingRecipeId), payload, token ?? undefined);
      } else {
        await post(API_PATHS.menu.recipeItems(selectedMenuItem.id), payload, token ?? undefined);
      }

      await refreshRecipe();
      setRecipeForm({ ingredientName: '', quantity: 0, unit: '', unitCost: 0 });
      setEditingRecipeId(null);
    } catch (err: any) {
      setRecipeError(err.message || 'Failed to save recipe item');
    } finally {
      setRecipeSaving(false);
    }
  };

  const startRecipeEdit = (recipeItem: RecipeItem) => {
    setEditingRecipeId(recipeItem.id);
    setRecipeForm({
      ingredientName: recipeItem.ingredient.name,
      quantity: recipeItem.quantity,
      unit: recipeItem.unit || recipeItem.ingredient.unit,
      unitCost: Number(recipeItem.ingredient.currentCost),
    });
    setRecipeError('');
  };

  const cancelRecipeEdit = () => {
    setEditingRecipeId(null);
    setRecipeForm({ ingredientName: '', quantity: 0, unit: '', unitCost: 0 });
    setRecipeError('');
  };

  const updateOption = (options: MenuOption[], index: number, next: Partial<MenuOption>) => {
    return options.map((option, idx) => (idx === index ? { ...option, ...next } : option));
  };

  const updateOptionValue = (
    options: MenuOption[],
    optionIndex: number,
    valueIndex: number,
    next: Partial<MenuOptionValue>,
  ) => {
    return options.map((option, idx) => {
      if (idx !== optionIndex) return option;
      return {
        ...option,
        values: option.values.map((value, vIdx) => (vIdx === valueIndex ? { ...value, ...next } : value)),
      };
    });
  };

  const addNewItemOption = () => {
    setNewItemOptions((current) => [...current, createOption()]);
  };

  const removeNewItemOption = (index: number) => {
    setNewItemOptions((current) => current.filter((_, idx) => idx !== index));
  };

  const addNewItemOptionValue = (index: number) => {
    setNewItemOptions((current) =>
      current.map((option, idx) =>
        idx !== index ? option : { ...option, values: [...option.values, createValue()] },
      ),
    );
  };

  const removeNewItemOptionValue = (optionIndex: number, valueIndex: number) => {
    setNewItemOptions((current) =>
      current.map((option, idx) => {
        if (idx !== optionIndex) return option;
        return { ...option, values: option.values.filter((_, vIdx) => vIdx !== valueIndex) };
      }),
    );
  };

  const addEditItemOption = () => {
    setEditItemOptions((current) => [...current, createOption()]);
  };

  const removeEditItemOption = (index: number) => {
    setEditItemOptions((current) => current.filter((_, idx) => idx !== index));
  };

  const addEditItemOptionValue = (index: number) => {
    setEditItemOptions((current) =>
      current.map((option, idx) =>
        idx !== index ? option : { ...option, values: [...option.values, createValue()] },
      ),
    );
  };

  const removeEditItemOptionValue = (optionIndex: number, valueIndex: number) => {
    setEditItemOptions((current) =>
      current.map((option, idx) => {
        if (idx !== optionIndex) return option;
        return { ...option, values: option.values.filter((_, vIdx) => vIdx !== valueIndex) };
      }),
    );
  };

  const importRecipeItems = async () => {
    if (!token || !selectedMenuItem || !recipeImportSourceId) return;
    setRecipeImportLoading(true);
    setRecipeImportError('');
    try {
      await post(
        API_PATHS.menu.importRecipeItems(selectedMenuItem.id),
        { sourceMenuItemId: recipeImportSourceId },
        token ?? undefined,
      );
      await refreshRecipe();
      setRecipeImportSources([]);
      setRecipeImportSourceId('');
    } catch (err: any) {
      setRecipeImportError(err.message || 'Failed to import recipe items');
    } finally {
      setRecipeImportLoading(false);
    }
  };

  const deleteRecipeItem = async (recipeItemId: string) => {
    if (!token || !selectedMenuItem) return;
    setRecipeError('');
    try {
      await del(API_PATHS.menu.recipeItem(selectedMenuItem.id, recipeItemId), token ?? undefined);
      await refreshRecipe();
    } catch (err: any) {
      setRecipeError(err.message || 'Failed to delete recipe item');
    }
  };

  const toggleAvailability = async (id: string) => {
    try {
      await patch(`/api/v1/menu/items/${id}/availability`, {}, token ?? undefined);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, available: !item.available } : item)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const startEditItem = (item: MenuItem) => {
    setEditError('');
    setEditItem(item);
    setEditItemData({
      name: item.name,
      description: item.description ?? '',
      price: item.price,
    });
    setEditItemOptions(item.options ?? []);
  };

  const closeEditItem = () => {
    setEditItem(null);
    setEditError('');
    setEditItemData({ name: '', description: '', price: 0 });
    setEditItemOptions([]);
  };

  const handleEditItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editItem) return;
    if (!editItemData.name.trim() || editItemData.price <= 0) {
      setEditError('Name and price are required');
      return;
    }
    setEditSaving(true);
    setEditError('');
    try {
      const updatedItem = await patch(
        `/api/v1/menu/items/${editItem.id}`,
        {
          name: editItemData.name.trim(),
          description: editItemData.description.trim(),
          price: Number(editItemData.price),
          options: editItemOptions.map((option) => ({
            id: option.id,
            name: option.name.trim(),
            label: option.label?.trim(),
            required: option.required,
            multiple: option.multiple,
            values: option.values.map((value) => ({
              id: value.id,
              label: value.label.trim(),
              priceAdjustment: Number(value.priceAdjustment || 0),
            })),
          })),
        },
        token ?? undefined,
      );
      setItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
      if (selectedMenuItem?.id === updatedItem.id) {
        setSelectedMenuItem(updatedItem);
      }
      closeEditItem();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update menu item');
    } finally {
      setEditSaving(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setSaving(true);
    setError('');
    try {
      await post('/api/v1/menu/categories', { name: newCategory.trim() }, token ?? undefined);
      setNewCategory('');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim() || newItem.price <= 0 || !newItem.categoryId) return;
    setSaving(true);
    setError('');
    try {
      await post(
        '/api/v1/menu/items',
        {
          name: newItem.name.trim(),
          description: newItem.description.trim(),
          price: Number(newItem.price),
          categoryId: newItem.categoryId,
          options: newItemOptions.map((option) => ({
            id: option.id,
            name: option.name.trim(),
            label: option.label?.trim(),
            required: option.required,
            multiple: option.multiple,
            values: option.values.map((value) => ({
              id: value.id,
              label: value.label.trim(),
              priceAdjustment: Number(value.priceAdjustment || 0),
            })),
          })),
        },
        token ?? undefined,
      );
      setNewItem({ ...newItem, name: '', description: '', price: 0 });
      setNewItemOptions([]);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create menu item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await del(`/api/v1/menu/items/${id}`, token ?? undefined);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = activeCategory
    ? items.filter((item) => item.category?.name === activeCategory)
    : items;

  if (loading) {
    return (
      <PageSkeleton />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Utensils className="text-gold" /> Menu Management
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Full menu management for your branch, including categories, items, availability, and recipe costing.
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={() => setActiveCategory('')}>
          <BookOpen size={18} /> Show All Categories
        </Button>
      </div>

      {error && (
        <div className="rounded-3xl bg-error-muted p-4 text-sm text-error">{error}</div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_0.7fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Category</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreateCategory}>
                <label className="block">
                  <span className="text-sm font-medium text-text-secondary">Category Name</span>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    required
                    className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                    placeholder="Breakfast, Main, Dessert"
                  />
                </label>
                <Button type="submit" loading={saving} className="w-full">
                  <Plus size={18} /> Add Category
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Menu Item</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreateItem}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-text-secondary">Item Name</span>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      required
                      className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-text-secondary">Category</span>
                    <select
                      value={newItem.categoryId}
                      onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
                      required
                      className="mt-2 w-full rounded-2xl border border-border-default bg-surface-raised px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-text-secondary">Price</span>
                    <input
                      type="number"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                      required
                      min={0}
                      step={0.01}
                      className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-text-secondary">Description</span>
                    <input
                      type="text"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                    />
                  </label>
                </div>
                <div className="rounded-3xl border border-border-default bg-surface-base p-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">Variations</h3>
                      <p className="text-xs text-text-secondary">Add optional or required choices for this item.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addNewItemOption}
                      className="rounded-2xl border border-border-default bg-white px-3 py-2 text-sm font-semibold text-text-secondary hover:border-gold hover:text-gold"
                    >
                      Add Option
                    </button>
                  </div>
                  {newItemOptions.length === 0 ? (
                    <p className="text-sm text-text-tertiary">No variations configured.</p>
                  ) : (
                    <div className="space-y-4">
                      {newItemOptions.map((option, optionIndex) => (
                        <div key={option.id} className="rounded-3xl border border-slate-200 bg-white p-4 space-y-4">
                          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <label className="block flex-1">
                              <span className="text-sm font-medium text-text-secondary">Option name</span>
                              <input
                                type="text"
                                value={option.name}
                                onChange={(e) => setNewItemOptions(updateOption(newItemOptions, optionIndex, { name: e.target.value }))}
                                className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                                placeholder="Soup type, Protein style"
                              />
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <label className="flex items-center gap-2 text-sm text-text-secondary">
                                <input
                                  type="checkbox"
                                  checked={option.required}
                                  onChange={(e) => setNewItemOptions(updateOption(newItemOptions, optionIndex, { required: e.target.checked }))}
                                  className="h-4 w-4 rounded border-border-default text-gold focus:ring-gold"
                                />
                                Required
                              </label>
                              <label className="flex items-center gap-2 text-sm text-text-secondary">
                                <input
                                  type="checkbox"
                                  checked={option.multiple}
                                  onChange={(e) => setNewItemOptions(updateOption(newItemOptions, optionIndex, { multiple: e.target.checked }))}
                                  className="h-4 w-4 rounded border-border-default text-gold focus:ring-gold"
                                />
                                Multiple
                              </label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-semibold text-text-primary">Option values</span>
                              <button
                                type="button"
                                onClick={() => addNewItemOptionValue(optionIndex)}
                                className="rounded-2xl border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-secondary hover:border-gold hover:text-gold"
                              >
                                Add Value
                              </button>
                            </div>
                            {option.values.map((value, valueIndex) => (
                              <div key={value.id} className="grid gap-3 md:grid-cols-[1fr_0.8fr_0.4fr] items-end">
                                <label className="block">
                                  <span className="text-sm font-medium text-text-secondary">Value</span>
                                  <input
                                    type="text"
                                    value={value.label}
                                    onChange={(e) => setNewItemOptions(updateOptionValue(newItemOptions, optionIndex, valueIndex, { label: e.target.value }))}
                                    className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                                    placeholder="Light broth, Grilled, Fried"
                                  />
                                </label>
                                <label className="block">
                                  <span className="text-sm font-medium text-text-secondary">Extra</span>
                                  <input
                                    type="number"
                                    value={value.priceAdjustment}
                                    onChange={(e) => setNewItemOptions(updateOptionValue(newItemOptions, optionIndex, valueIndex, { priceAdjustment: Number(e.target.value) }))}
                                    className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                                    placeholder="0"
                                    step="0.01"
                                    min="0"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => removeNewItemOptionValue(optionIndex, valueIndex)}
                                  className="rounded-2xl border border-border-default bg-white px-3 py-2 text-sm text-error hover:border-error"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeNewItemOption(optionIndex)}
                            className="rounded-2xl border border-border-default bg-white px-3 py-2 text-sm text-error hover:border-error"
                          >
                            Remove Option
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button type="submit" loading={saving} className="w-full">
                  <Plus size={18} /> Add Menu Item
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag size={18} /> Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between gap-3 p-4 rounded-3xl bg-surface-raised shadow-sm">
                  <div>
                    <p className="font-semibold text-text-primary">{category.name}</p>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-text-secondary">No categories yet. Add one to get started.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className={!item.available ? 'opacity-80' : ''}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-text-primary">{item.name}</h3>
                  <p className="text-xs text-text-secondary">{item.category?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEditItem(item)}
                    className="rounded-full p-2 text-text-secondary hover:text-gold transition-colors"
                    aria-label="Edit item"
                  >
                    <Tag size={20} />
                  </button>
                  <button
                    onClick={() => toggleAvailability(item.id)}
                    className="rounded-full p-2 text-text-secondary hover:text-gold transition-colors"
                    aria-label="Toggle availability"
                  >
                    {item.available ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="rounded-full p-2 text-error hover:text-error transition-colors"
                    aria-label="Delete item"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-text-secondary">{item.description || 'No description added yet.'}</p>
              {item.options?.length ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-surface-elevated px-3 py-1 text-xs text-text-secondary">
                  <span>{item.options.length} variation{item.options.length > 1 ? 's' : ''}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gold">{formatCurrency(item.price)}</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    item.available ? 'bg-success-muted text-success' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <Button variant="ghost" size="sm" className="w-full" onClick={() => openRecipeEditor(item)}>
                <BookOpen size={18} /> Manage Recipe
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedMenuItem && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-auto bg-black/40 p-4">
          <div className="w-full max-w-6xl rounded-[32px] bg-white shadow-2xl max-h-[calc(100vh-4rem)] overflow-hidden">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Recipe for {selectedMenuItem.name}</h2>
                <p className="text-sm text-text-secondary mt-1">Manage ingredients, unit costs, and recipe totals for this menu item.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={closeRecipeEditor}>
                  Close
                </Button>
              </div>
            </div>
            <div className="space-y-6 overflow-y-auto p-6 max-h-[calc(90%-5.5rem)]">
              {recipeError && (
                <div className="rounded-3xl bg-error-muted p-4 text-sm text-error">{recipeError}</div>
              )}

              {recipeItems.length === 0 && (
                <div className="rounded-3xl border border-slate-200 bg-amber-50 p-4 text-sm text-slate-800">
                  <p className="font-semibold">Import cost items from another menu item</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Select an existing menu item with cost items to import into this item. This action is only available when this item has no cost items yet.
                  </p>
                  {recipeImportError && (
                    <p className="mt-2 text-sm text-error">{recipeImportError}</p>
                  )}
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="flex-1">
                      <span className="block text-sm font-medium text-text-secondary">Source menu item</span>
                      <select
                        value={recipeImportSourceId}
                        onChange={(e) => setRecipeImportSourceId(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-border-default bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-gold focus:ring-2 focus:ring-gold"
                      >
                        {recipeImportSources.length === 0 ? (
                          <option value="">No available source items</option>
                        ) : (
                          recipeImportSources.map((source) => (
                            <option key={source.id} value={source.id}>
                              {source.name} — {source.category.name}
                            </option>
                          ))
                        )}
                      </select>
                    </label>
                    <Button
                      variant="primary"
                      onClick={importRecipeItems}
                      disabled={recipeImportSources.length === 0 || !recipeImportSourceId || recipeImportLoading}
                      loading={recipeImportLoading}
                    >
                      Import Cost Items
                    </Button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-surface-raised p-4">
                {recipeLoading ? (
                  <PageSkeleton />
                ) : (
                  <div className="min-w-[500px]">
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 text-sm font-semibold text-slate-600 pb-3 border-b border-slate-200">
                      <div>Ingredient</div>
                      <div className="text-right">Quantity</div>
                      <div className="text-right">Unit</div>
                      <div className="text-right">Unit Cost</div>
                      <div className="text-right">Total Cost</div>
                    </div>
                    {recipeItems.length === 0 ? (
                      <p className="mt-4 text-sm text-slate-500">No recipe items added yet.</p>
                    ) : (
                      recipeItems.map((recipeItem) => (
                        <div
                          key={recipeItem.id}
                          className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-slate-200 py-3 text-sm text-slate-700"
                        >
                          <div>{recipeItem.ingredient.name}</div>
                          <div className="text-right">{recipeItem.quantity}</div>
                          <div className="text-right">{recipeItem.unit || recipeItem.ingredient.unit}</div>
                          <div className="text-right">{formatCurrency(recipeItem.ingredient.currentCost)}</div>
                          <div className="text-right font-semibold">
                            {formatCurrency(Number(recipeItem.ingredient.currentCost) * recipeItem.quantity)}
                          </div>
                          <div className="col-span-full flex flex-wrap items-center gap-2 pt-2">
                            <Button variant="ghost" size="sm" onClick={() => startRecipeEdit(recipeItem)}>
                              Edit
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => deleteRecipeItem(recipeItem.id)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                <Card className="p-0">
                  <CardHeader>
                    <CardTitle>{editingRecipeId ? 'Edit Recipe Item' : 'Add Recipe Item'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4" onSubmit={handleRecipeFormSubmit}>
                      <label className="block">
                        <span className="text-sm font-medium text-text-secondary">Ingredient</span>
                        <input
                          type="text"
                          list="ingredient-options"
                          value={recipeForm.ingredientName}
                          onChange={(e) => {
                            const nextValue = e.target.value;
                            const existing = ingredients.find((ingredient) => ingredient.name.toLowerCase() === nextValue.toLowerCase());
                            setRecipeForm({
                              ...recipeForm,
                              ingredientName: nextValue,
                              unit: existing?.unit ?? recipeForm.unit,
                              unitCost: existing?.currentCost ?? recipeForm.unitCost,
                            });
                          }}
                          required
                          className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                          placeholder="Enter ingredient name"
                        />
                        <datalist id="ingredient-options">
                          {ingredients.map((ingredient) => (
                            <option key={ingredient.id} value={ingredient.name} />
                          ))}
                        </datalist>
                        <p className="text-xs text-text-secondary mt-2">Select an existing ingredient or type a new name to create it automatically.</p>
                      </label>
                      <div className="grid gap-4 md:grid-cols-3">
                        <label className="block">
                          <span className="text-sm font-medium text-text-secondary">Quantity</span>
                          <input
                            type="number"
                            value={recipeForm.quantity}
                            onChange={(e) => setRecipeForm({ ...recipeForm, quantity: Number(e.target.value) })}
                            required
                            min={0}
                            step={0.01}
                            className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-text-secondary">Unit</span>
                          <input
                            type="text"
                            value={recipeForm.unit}
                            onChange={(e) => setRecipeForm({ ...recipeForm, unit: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-text-secondary">Unit Cost</span>
                          <input
                            type="number"
                            value={recipeForm.unitCost}
                            onChange={(e) => setRecipeForm({ ...recipeForm, unitCost: Number(e.target.value) })}
                            className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                            min={0}
                            step={0.01}
                          />
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button type="submit" loading={recipeSaving}>
                          {editingRecipeId ? 'Save Recipe Item' : 'Add Recipe Item'}
                        </Button>
                        {editingRecipeId && (
                          <Button type="button" variant="secondary" onClick={cancelRecipeEdit}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border border-slate-200 p-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>Recipe items</span>
                      <span>{recipeItems.length} total</span>
                    </div>
                    <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      Total Recipe Cost: <span className="font-semibold text-slate-900">
                        {formatCurrency(recipeItems.reduce((sum, recipeItem) => sum + Number(recipeItem.ingredient.currentCost) * recipeItem.quantity, 0))}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-auto bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-[32px] bg-white shadow-2xl max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Edit {editItem.name}</h2>
                <p className="text-sm text-text-secondary mt-1">Update the menu item details and save.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={closeEditItem}>
                  Close
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
              {editError && (
                <div className="rounded-3xl bg-error-muted p-4 text-sm text-error">{editError}</div>
              )}
              <form className="space-y-4" onSubmit={handleEditItemSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-text-secondary">Item Name</span>
                    <input
                      type="text"
                      value={editItemData.name}
                      onChange={(e) => setEditItemData({ ...editItemData, name: e.target.value })}
                      required
                      className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-text-secondary">Price</span>
                    <input
                      type="number"
                      value={editItemData.price}
                      onChange={(e) => setEditItemData({ ...editItemData, price: Number(e.target.value) })}
                      required
                      min={0}
                      step={0.01}
                      className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-text-secondary">Description</span>
                  <textarea
                    value={editItemData.description}
                    onChange={(e) => setEditItemData({ ...editItemData, description: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                    rows={4}
                  />
                </label>
                <div className="rounded-3xl border border-border-default bg-surface-base p-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">Variations</h3>
                      <p className="text-xs text-text-secondary">Edit the option groups and values available for this menu item.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addEditItemOption}
                      className="rounded-2xl border border-border-default bg-white px-3 py-2 text-sm font-semibold text-text-secondary hover:border-gold hover:text-gold"
                    >
                      Add Option
                    </button>
                  </div>
                  {editItemOptions.length === 0 ? (
                    <p className="text-sm text-text-tertiary">No variations configured.</p>
                  ) : (
                    <div className="space-y-4">
                      {editItemOptions.map((option, optionIndex) => (
                        <div key={option.id} className="rounded-3xl border border-slate-200 bg-white p-4 space-y-4">
                          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <label className="block flex-1">
                              <span className="text-sm font-medium text-text-secondary">Option name</span>
                              <input
                                type="text"
                                value={option.name}
                                onChange={(e) => setEditItemOptions(updateOption(editItemOptions, optionIndex, { name: e.target.value }))}
                                className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                                placeholder="Soup type, Protein style"
                              />
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <label className="flex items-center gap-2 text-sm text-text-secondary">
                                <input
                                  type="checkbox"
                                  checked={option.required}
                                  onChange={(e) => setEditItemOptions(updateOption(editItemOptions, optionIndex, { required: e.target.checked }))}
                                  className="h-4 w-4 rounded border-border-default text-gold focus:ring-gold"
                                />
                                Required
                              </label>
                              <label className="flex items-center gap-2 text-sm text-text-secondary">
                                <input
                                  type="checkbox"
                                  checked={option.multiple}
                                  onChange={(e) => setEditItemOptions(updateOption(editItemOptions, optionIndex, { multiple: e.target.checked }))}
                                  className="h-4 w-4 rounded border-border-default text-gold focus:ring-gold"
                                />
                                Multiple
                              </label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-semibold text-text-primary">Option values</span>
                              <button
                                type="button"
                                onClick={() => addEditItemOptionValue(optionIndex)}
                                className="rounded-2xl border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-secondary hover:border-gold hover:text-gold"
                              >
                                Add Value
                              </button>
                            </div>
                            {option.values.map((value, valueIndex) => (
                              <div key={value.id} className="grid gap-3 md:grid-cols-[1fr_0.8fr_0.4fr] items-end">
                                <label className="block">
                                  <span className="text-sm font-medium text-text-secondary">Value</span>
                                  <input
                                    type="text"
                                    value={value.label}
                                    onChange={(e) => setEditItemOptions(updateOptionValue(editItemOptions, optionIndex, valueIndex, { label: e.target.value }))}
                                    className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                                    placeholder="Light broth, Grilled, Fried"
                                  />
                                </label>
                                <label className="block">
                                  <span className="text-sm font-medium text-text-secondary">Extra</span>
                                  <input
                                    type="number"
                                    value={value.priceAdjustment}
                                    onChange={(e) => setEditItemOptions(updateOptionValue(editItemOptions, optionIndex, valueIndex, { priceAdjustment: Number(e.target.value) }))}
                                    className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                                    placeholder="0"
                                    step="0.01"
                                    min="0"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => removeEditItemOptionValue(optionIndex, valueIndex)}
                                  className="rounded-2xl border border-border-default bg-white px-3 py-2 text-sm text-error hover:border-error"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEditItemOption(optionIndex)}
                            className="rounded-2xl border border-border-default bg-white px-3 py-2 text-sm text-error hover:border-error"
                          >
                            Remove Option
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" loading={editSaving}>
                    Save Changes
                  </Button>
                  <Button type="button" variant="secondary" onClick={closeEditItem}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
