'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { API_PATHS } from '@/lib/constants';
import { get, post, patch, del } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatCurrency, buildQueryString } from '@/lib/utils';
import { Utensils, Plus, ToggleLeft, ToggleRight, Trash2, BookOpen, Tag } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';

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
  groupedComponentIds?: string[];
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
  const groupedComponentsOptionId = '__meta_grouped_menu_components';
  const { token } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
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
  const [editItemData, setEditItemData] = useState({ name: '', description: '', price: 0, categoryId: '' });
  const [editItemOptions, setEditItemOptions] = useState<MenuOption[]>([]);
  const [editItemHiddenOptions, setEditItemHiddenOptions] = useState<MenuOption[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeSaving, setRecipeSaving] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeImportLoading, setRecipeImportLoading] = useState(false);
  const [recipeError, setRecipeError] = useState('');
  const [recipeImportError, setRecipeImportError] = useState('');
  const [recipeImportSources, setRecipeImportSources] = useState<MenuItem[]>([]);
  const [recipeImportSourceIds, setRecipeImportSourceIds] = useState<string[]>([]);
  const [recipeImportMode, setRecipeImportMode] = useState<'SNAPSHOT' | 'GROUPED'>('GROUPED');
  const [recipeGroupedSources, setRecipeGroupedSources] = useState<MenuItem[] | null>(null);
  const [groupedSourceRecipes, setGroupedSourceRecipes] = useState<Record<string, RecipeItem[]>>({});
  const [showRelinkPanel, setShowRelinkPanel] = useState(false);
  const [recipeForm, setRecipeForm] = useState({ ingredientName: '', quantity: 0, unit: '', unitCost: 0 });
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);

  const splitVisibleAndHiddenOptions = (options?: MenuOption[]) => {
    const visible: MenuOption[] = [];
    const hidden: MenuOption[] = [];

    (options ?? []).forEach((option) => {
      if (option.id === groupedComponentsOptionId) {
        hidden.push(option);
      } else {
        visible.push(option);
      }
    });

    return { visible, hidden };
  };

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

  const fetchIngredientSuggestions = async (search = '') => {
    try {
      const suggestions = await get(
        `${API_PATHS.inventory.ingredients}${buildQueryString({ page: 0, limit: 50, search: search.trim() || undefined })}`,
        token ?? undefined,
      );
      setIngredients(suggestions);
    } catch {
      setIngredients([]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        get('/api/v1/menu/items', token ?? undefined),
        get('/api/v1/menu/categories', token ?? undefined),
      ]);
      setItems(itemsRes);
      setCategories(categoriesRes);
      if (categoriesRes.length > 0) {
        setSelectedCategoryId((prev) => prev || categoriesRes[0].id);
      }
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
        setRecipeImportSourceIds([sources[0].id]);
      }
    } catch (err: any) {
      setRecipeImportError(err.message || 'Failed to load import sources');
    }
  };

  const fetchRecipeData = async (item: MenuItem) => {
    setSelectedMenuItem(item);
    setRecipeLoading(true);
    setRecipeError('');
    setRecipeGroupedSources(null);
    setShowRelinkPanel(false);
    try {
      const recipeRes = await get(
        `${API_PATHS.menu.recipeItems(item.id)}${buildQueryString({ page: 0, limit: 100 })}`,
        token ?? undefined,
      );
      setRecipeItems(recipeRes);
      setEditingRecipeId(null);
      setRecipeForm({ ingredientName: '', quantity: 0, unit: '', unitCost: 0 });

      const componentIds = item.groupedComponentIds ?? [];
      if (recipeRes.length === 0 && componentIds.length > 0) {
        // Item is grouped — restore banner from items already in state
        const allItems: MenuItem[] = items;
        const linked = componentIds
          .map((id) => allItems.find((m) => m.id === id))
          .filter((m): m is MenuItem => m !== undefined);
        setRecipeGroupedSources(linked);
        setRecipeImportSources([]);
        setRecipeImportSourceIds([]);
        await fetchGroupedSourceRecipes(linked);
      } else if (recipeRes.length === 0) {
        await fetchRecipeImportSources(item.id);
      } else {
        setRecipeImportSources([]);
        setRecipeImportSourceIds([]);
      }
    } catch (err: any) {
      setRecipeError(err.message || 'Failed to load recipe details');
    } finally {
      setRecipeLoading(false);
    }
  };

  const openRecipeEditor = async (item: MenuItem) => {
    await fetchRecipeData(item);
    await fetchIngredientSuggestions();
  };

  const fetchGroupedSourceRecipes = async (sources: MenuItem[]) => {
    const results: Record<string, RecipeItem[]> = {};
    await Promise.all(
      sources.map(async (source) => {
        try {
          const res = await get(
            `${API_PATHS.menu.recipeItems(source.id)}${buildQueryString({ page: 0, limit: 100 })}`,
            token ?? undefined,
          );
          results[source.id] = res;
        } catch {
          results[source.id] = [];
        }
      }),
    );
    setGroupedSourceRecipes(results);
  };

  const closeRecipeEditor = () => {
    setSelectedMenuItem(null);
    setRecipeItems([]);
    setRecipeImportSources([]);
    setRecipeImportSourceIds([]);
    setRecipeImportError('');
    setRecipeGroupedSources(null);
    setGroupedSourceRecipes({});
    setShowRelinkPanel(false);
    setRecipeForm({ ingredientName: '', quantity: 0, unit: '', unitCost: 0 });
    setEditingRecipeId(null);
    setRecipeError('');
  };

  const refreshRecipe = async (isGroupedItem?: boolean) => {
    if (!selectedMenuItem) return;
    try {
      const recipeRes = await get(
        `${API_PATHS.menu.recipeItems(selectedMenuItem.id)}${buildQueryString({ page: 0, limit: 100 })}`,
        token ?? undefined,
      );
      setRecipeItems(recipeRes);
      if (recipeRes.length === 0 && !isGroupedItem) {
        await fetchRecipeImportSources(selectedMenuItem.id);
      } else if (recipeRes.length > 0) {
        setRecipeGroupedSources(null);
        setGroupedSourceRecipes({});
        setRecipeImportSources([]);
        setRecipeImportSourceIds([]);
      }
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
    if (!token || !selectedMenuItem || recipeImportSourceIds.length === 0) return;
    setRecipeImportLoading(true);
    setRecipeImportError('');
    try {
      await post(
        API_PATHS.menu.importRecipeItems(selectedMenuItem.id),
        { sourceMenuItemIds: recipeImportSourceIds, importMode: recipeImportMode },
        token ?? undefined,
      );
      if (recipeImportMode === 'GROUPED') {
        const linkedItems = recipeImportSources.filter((s) => recipeImportSourceIds.includes(s.id));
        setRecipeGroupedSources(linkedItems);
        setShowRelinkPanel(false);
        setRecipeImportSourceIds([]);
        await refreshRecipe(true);
        await fetchGroupedSourceRecipes(linkedItems);
      } else {
        setRecipeGroupedSources(null);
        await refreshRecipe(false);
      }
      await fetchData();
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
      categoryId: item.category?.id ?? '',
    });
    const { visible, hidden } = splitVisibleAndHiddenOptions(item.options);
    setEditItemOptions(visible);
    setEditItemHiddenOptions(hidden);
  };

  const closeEditItem = () => {
    setEditItem(null);
    setEditError('');
    setEditItemData({ name: '', description: '', price: 0, categoryId: '' });
    setEditItemOptions([]);
    setEditItemHiddenOptions([]);
  };

  const handleEditItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editItem) return;
    if (!editItemData.name.trim() || editItemData.price <= 0 || !editItemData.categoryId) {
      setEditError('Name, price and category are required');
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
          categoryId: editItemData.categoryId,
          options: [
            ...editItemOptions.map((option) => ({
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
            ...editItemHiddenOptions,
          ],
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

  const handleCreateCategory = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    if (!newCategory.trim()) return false;
    setSaving(true);
    setError('');
    try {
      await post('/api/v1/menu/categories', { name: newCategory.trim() }, token ?? undefined);
      setNewCategory('');
      await fetchData();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const startEditCategory = (category: Category) => {
    setCategoryError('');
    setEditCategory(category);
    setEditCategoryName(category.name);
    setShowEditCategoryModal(true);
  };

  const closeEditCategory = () => {
    setShowEditCategoryModal(false);
    setEditCategory(null);
    setEditCategoryName('');
    setCategoryError('');
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editCategory) return;
    if (!editCategoryName.trim()) {
      setCategoryError('Category name is required');
      return;
    }
    setCategorySaving(true);
    setCategoryError('');
    try {
      const updated = await patch(
        `/api/v1/menu/categories/${editCategory.id}`,
        { name: editCategoryName.trim() },
        token ?? undefined,
      );
      setCategories((prev) => prev.map((cat) => (cat.id === updated.id ? updated : cat)));
      if (activeCategory === editCategory.name) {
        setActiveCategory(updated.name);
      }
      closeEditCategory();
    } catch (err: any) {
      setCategoryError(err.message || 'Failed to update category');
    } finally {
      setCategorySaving(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    if (!newItem.name.trim() || newItem.price <= 0 || !newItem.categoryId) return false;
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
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to create menu item');
      return false;
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

  const visibleOptionCountByItemId = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      const { visible } = splitVisibleAndHiddenOptions(item.options);
      map.set(item.id, visible.length);
    });
    return map;
  }, [items]);

  if (loading) {
    return (
      <PageSkeleton />
    );
  }

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Utensils className="text-[var(--color-gold)]" /> Menu Management
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Manage categories, items, availability and recipe costing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowCategoryModal(true)}>
            <Plus size={14} /> Add Category
          </Button>
          <Button size="sm" onClick={() => { setNewItem({ name: '', description: '', price: 0, categoryId: categories[0]?.id ?? '' }); setNewItemOptions([]); setError(''); setShowItemModal(true); }}>
            <Plus size={14} /> Add Item
          </Button>
        </div>
      </div>

      {error && <div className="rounded-2xl bg-error-muted p-4 text-sm text-error">{error}</div>}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Total Items</p>
          <p className="text-3xl font-bold font-mono text-text-primary mt-1">{items.length}</p>
        </div>
        <div className="rounded-2xl border border-success/30 bg-success-muted p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-success">Available</p>
          <p className="text-3xl font-bold font-mono text-success mt-1">{items.filter((i) => i.available).length}</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Unavailable</p>
          <p className="text-3xl font-bold font-mono text-text-primary mt-1">{items.filter((i) => !i.available).length}</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Categories</p>
          <p className="text-3xl font-bold font-mono text-text-primary mt-1">{categories.length}</p>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${!activeCategory ? 'bg-[var(--color-gold)] text-white shadow-sm' : 'bg-surface-raised border border-border-subtle text-text-secondary hover:text-text-primary'}`}
        >
          All Items
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.name)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${activeCategory === cat.name ? 'bg-[var(--color-gold)] text-white shadow-sm' : 'bg-surface-raised border border-border-subtle text-text-secondary hover:text-text-primary'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-border-subtle bg-surface-raised p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-text-primary">Categories</p>
            <p className="text-xs text-text-secondary">Rename categories or keep them organized.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowCategoryModal(true)}>
            Add Category
          </Button>
        </div>
        <div className="mt-4 grid gap-4">
          {categories.length === 0 ? (
            <div className="rounded-2xl border border-border-subtle bg-surface-input px-4 py-4 text-sm text-text-secondary">
              No categories yet. Add one to create menu groups.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
              <div>
                <label htmlFor="category-select" className="text-sm font-medium text-text-secondary">Select a category</label>
                <select
                  id="category-select"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border-subtle bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const category = categories.find((cat) => cat.id === selectedCategoryId);
                  if (category) startEditCategory(category);
                }}
                disabled={!selectedCategoryId}
              >
                Edit selected category
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Items grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-border-default bg-surface-raised flex flex-col items-center gap-2 py-16 text-center">
          <Utensils size={32} className="opacity-30" />
          <p className="text-sm font-semibold text-text-secondary">No items{activeCategory ? ` in ${activeCategory}` : ''}</p>
          <p className="text-xs text-text-tertiary">Add an item to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className={`rounded-3xl border border-border-default bg-surface-raised p-5 space-y-3 flex flex-col ${!item.available ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary truncate">{item.name}</h3>
                  <span className="inline-block mt-0.5 text-xs text-text-tertiary bg-surface-elevated px-2 py-0.5 rounded-full">{item.category?.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEditItem(item)}
                    className="rounded-full p-2 text-text-secondary hover:text-[var(--color-gold)] hover:bg-surface-elevated transition-colors"
                    title="Edit item"
                  >
                    <Tag size={16} />
                  </button>
                  <button
                    onClick={() => toggleAvailability(item.id)}
                    className="rounded-full p-2 text-text-secondary hover:text-[var(--color-gold)] hover:bg-surface-elevated transition-colors"
                    title="Toggle availability"
                  >
                    {item.available ? <ToggleRight size={20} className="text-success" /> : <ToggleLeft size={20} />}
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="rounded-full p-2 text-text-tertiary hover:text-error hover:bg-surface-elevated transition-colors"
                    title="Delete item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-text-secondary flex-1">{item.description || 'No description.'}</p>
              {(visibleOptionCountByItemId.get(item.id) || 0) > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-elevated px-3 py-1 text-xs text-text-secondary self-start">
                  {visibleOptionCountByItemId.get(item.id)} variation{(visibleOptionCountByItemId.get(item.id) || 0) > 1 ? 's' : ''}
                </span>
              ) : null}
              <div className="flex items-center justify-between pt-2 border-t border-border-subtle mt-auto">
                <span className="text-lg font-bold font-mono text-[var(--color-gold)]">{formatCurrency(item.price)}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.available ? 'bg-success-muted text-success' : 'bg-surface-elevated text-text-tertiary'}`}>
                  {item.available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <Button variant="ghost" size="sm" className="w-full" onClick={() => openRecipeEditor(item)}>
                <BookOpen size={16} /> Manage Recipe
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      <Modal
        open={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); setNewCategory(''); setError(''); }}
        title="Add Category"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowCategoryModal(false); setNewCategory(''); setError(''); }}>Cancel</Button>
            <Button type="submit" form="new-category-form" loading={saving}>Add Category</Button>
          </>
        }
      >
        {error && <div className="rounded-2xl bg-error-muted p-3 text-sm text-error mb-4">{error}</div>}
        <form
          id="new-category-form"
          onSubmit={async (e) => { const ok = await handleCreateCategory(e); if (ok) setShowCategoryModal(false); }}
          className="pt-1"
        >
          <label className="block">
            <span className="text-sm font-medium text-text-secondary">Category Name</span>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              required
              autoFocus
              className="mt-2 w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
              placeholder="e.g. Breakfast, Main Course, Dessert"
            />
          </label>
        </form>
      </Modal>

      <Modal
        open={showEditCategoryModal}
        onClose={closeEditCategory}
        title="Edit Category"
        footer={
          <>
            <Button variant="secondary" onClick={closeEditCategory}>Cancel</Button>
            <Button type="submit" form="edit-category-form" loading={categorySaving}>Save</Button>
          </>
        }
      >
        {categoryError && <div className="rounded-2xl bg-error-muted p-3 text-sm text-error mb-4">{categoryError}</div>}
        <form id="edit-category-form" onSubmit={handleEditCategory} className="pt-1">
          <label className="block">
            <span className="text-sm font-medium text-text-secondary">Category Name</span>
            <input
              type="text"
              value={editCategoryName}
              onChange={(e) => setEditCategoryName(e.target.value)}
              required
              autoFocus
              className="mt-2 w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
              placeholder="Category name"
            />
          </label>
        </form>
      </Modal>

      {/* Add Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-start sm:items-center justify-center overflow-auto bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-[32px] bg-white shadow-2xl max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Add Menu Item</h2>
                <p className="text-sm text-text-secondary mt-1">Fill in the details below and save.</p>
              </div>
              <Button variant="secondary" onClick={() => { setShowItemModal(false); setNewItemOptions([]); setError(''); }}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              {error && <div className="rounded-2xl bg-error-muted p-4 text-sm text-error">{error}</div>}
              <form
                id="new-item-form"
                onSubmit={async (e) => { const ok = await handleCreateItem(e); if (ok) setShowItemModal(false); }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-sm font-medium text-text-secondary">Item Name</span>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      required
                      className="mt-2 w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                      placeholder="e.g. Jollof Rice"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-text-secondary">Price (GHS)</span>
                    <input
                      type="number"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                      required
                      min={0}
                      step={0.01}
                      className="mt-2 w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-text-secondary">Category</span>
                    <select
                      value={newItem.categoryId}
                      onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
                      required
                      className="mt-2 w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                    >
                      {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-text-secondary">Description</span>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                    placeholder="Brief description (optional)"
                    rows={3}
                  />
                </label>
                {/* Variations */}
                <div className="rounded-2xl border border-border-default bg-surface-base p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Variations</p>
                      <p className="text-xs text-text-secondary">Optional or required choices for this item</p>
                    </div>
                    <button
                      type="button"
                      onClick={addNewItemOption}
                      className="rounded-2xl border border-border-default bg-surface-raised px-3 py-1.5 text-sm font-medium text-text-secondary hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors"
                    >
                      + Add Option
                    </button>
                  </div>
                  {newItemOptions.length === 0 ? (
                    <p className="text-sm text-text-tertiary">No variations yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {newItemOptions.map((option, optionIndex) => (
                        <div key={option.id} className="rounded-2xl border border-border-subtle bg-surface-raised p-4 space-y-3">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <label className="block flex-1">
                              <span className="text-xs font-medium text-text-secondary">Option name</span>
                              <input
                                type="text"
                                value={option.name}
                                onChange={(e) => setNewItemOptions(updateOption(newItemOptions, optionIndex, { name: e.target.value }))}
                                className="mt-1 w-full rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                                placeholder="e.g. Soup type"
                              />
                            </label>
                            <div className="flex flex-wrap items-center gap-3">
                              <label className="flex items-center gap-2 text-sm text-text-secondary">
                                <input type="checkbox" checked={option.required} onChange={(e) => setNewItemOptions(updateOption(newItemOptions, optionIndex, { required: e.target.checked }))} className="h-4 w-4 rounded" />
                                Required
                              </label>
                              <label className="flex items-center gap-2 text-sm text-text-secondary">
                                <input type="checkbox" checked={option.multiple} onChange={(e) => setNewItemOptions(updateOption(newItemOptions, optionIndex, { multiple: e.target.checked }))} className="h-4 w-4 rounded" />
                                Multiple
                              </label>
                              <button type="button" onClick={() => removeNewItemOption(optionIndex)} className="text-xs text-error hover:underline">Remove</button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-text-secondary">Values</span>
                              <button type="button" onClick={() => addNewItemOptionValue(optionIndex)} className="text-xs text-[var(--color-gold)] hover:underline">+ Add Value</button>
                            </div>
                            {option.values.map((value, valueIndex) => (
                              <div key={value.id} className="grid gap-2 grid-cols-[1fr_0.6fr_auto] items-center">
                                <input
                                  type="text"
                                  value={value.label}
                                  onChange={(e) => setNewItemOptions(updateOptionValue(newItemOptions, optionIndex, valueIndex, { label: e.target.value }))}
                                  className="rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                                  placeholder="Label"
                                />
                                <input
                                  type="number"
                                  value={value.priceAdjustment}
                                  onChange={(e) => setNewItemOptions(updateOptionValue(newItemOptions, optionIndex, valueIndex, { priceAdjustment: Number(e.target.value) }))}
                                  className="rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                                  placeholder="+0.00"
                                  step="0.01"
                                  min="0"
                                />
                                <button type="button" onClick={() => removeNewItemOptionValue(optionIndex, valueIndex)} className="rounded-xl border border-border-subtle px-2 py-2 text-xs text-error hover:border-error transition-colors">✕</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 pb-4">
                  <Button type="submit" loading={saving}>Add Item</Button>
                  <Button type="button" variant="secondary" onClick={() => { setShowItemModal(false); setNewItemOptions([]); setError(''); }}>Cancel</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Recipe Editor — fullscreen overlay */}
      {selectedMenuItem && (
        <div
          className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-start sm:items-center justify-center overflow-auto bg-black/40 p-4"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}
        >
          <div className="w-full max-w-6xl rounded-[32px] bg-white shadow-2xl max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col min-h-0">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Recipe — {selectedMenuItem.name}</h2>
                <p className="text-sm text-text-secondary mt-1">Manage ingredients, unit costs and totals.</p>
              </div>
              <Button variant="secondary" onClick={closeRecipeEditor}>Close</Button>
            </div>
            <div
              className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6"
              style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}
            >
              {recipeError && <div className="rounded-2xl bg-error-muted p-4 text-sm text-error">{recipeError}</div>}

              {/* Grouped banner — shown when item is grouped */}
              {recipeGroupedSources !== null && !showRelinkPanel && (() => {
                const allItems = recipeGroupedSources;
                const totalCost = allItems.reduce((sum, s) => {
                  const r = groupedSourceRecipes[s.id] ?? [];
                  return sum + r.reduce((s2, ri) => s2 + Number(ri.ingredient.currentCost) * ri.quantity, 0);
                }, 0);
                return (
                  <div className="rounded-2xl border border-[var(--color-gold)]/30 bg-surface-raised overflow-hidden">
                    <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border-subtle">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Grouped recipe</p>
                        <p className="text-xs text-text-tertiary mt-0.5">Food costs are resolved live from the linked items below.</p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          setShowRelinkPanel(true);
                          await fetchRecipeImportSources(selectedMenuItem!.id);
                          setRecipeImportSourceIds(recipeGroupedSources.map((s) => s.id));
                          setRecipeImportMode('GROUPED');
                        }}
                      >
                        Re-link
                      </Button>
                    </div>
                    {allItems.map((source) => {
                      const sourceRecipes = groupedSourceRecipes[source.id] ?? [];
                      const sourceCost = sourceRecipes.reduce((s2, ri) => s2 + Number(ri.ingredient.currentCost) * ri.quantity, 0);
                      return (
                        <div key={source.id} className="border-b border-border-subtle last:border-0">
                          <div className="flex items-center justify-between px-4 py-2.5 bg-surface-base">
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-gold)] shrink-0" />
                              <span className="text-sm font-medium text-text-primary">{source.name}</span>
                              <span className="text-xs text-text-tertiary">— {source.category.name}</span>
                            </div>
                            <span className="text-sm font-mono font-semibold text-text-primary">{formatCurrency(sourceCost)}</span>
                          </div>
                          {sourceRecipes.length > 0 && (
                            <table className="w-full text-xs min-w-[400px]">
                              <tbody className="divide-y divide-border-subtle">
                                {sourceRecipes.map((ri) => (
                                  <tr key={ri.id} className="bg-surface-raised">
                                    <td className="px-6 py-2 text-text-secondary pl-10">{ri.ingredient.name}</td>
                                    <td className="px-4 py-2 font-mono text-text-tertiary text-right">{ri.quantity} {ri.unit || ri.ingredient.unit}</td>
                                    <td className="px-4 py-2 font-mono text-text-tertiary text-right">@ {formatCurrency(ri.ingredient.currentCost)}</td>
                                    <td className="px-4 py-2 font-mono text-text-secondary text-right font-medium">{formatCurrency(Number(ri.ingredient.currentCost) * ri.quantity)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          {sourceRecipes.length === 0 && (
                            <p className="px-10 py-2 text-xs text-text-tertiary italic">No recipe items on this item yet.</p>
                          )}
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between px-4 py-3 bg-surface-base border-t border-border-default">
                      <span className="text-sm font-semibold text-text-secondary">Total Food Cost</span>
                      <span className="text-sm font-mono font-bold text-text-primary">{formatCurrency(totalCost)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Import / re-link panel */}
              {recipeItems.length === 0 && (recipeGroupedSources === null || showRelinkPanel) && (
                <div className="rounded-2xl border border-warning/30 bg-warning-muted p-4 text-sm">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <p className="font-semibold text-text-primary">{showRelinkPanel ? 'Update grouped link' : 'Build recipe from other menu items'}</p>
                    {showRelinkPanel && (
                      <Button variant="secondary" size="sm" onClick={() => setShowRelinkPanel(false)}>Cancel</Button>
                    )}
                  </div>
                  {!showRelinkPanel && <p className="mb-3 text-text-secondary">Use Grouped mode for live-linked combos, or Snapshot mode to copy current cost items once.</p>}
                  {recipeImportError && <p className="mb-2 text-error">{recipeImportError}</p>}
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={recipeImportMode === 'GROUPED' ? 'primary' : 'secondary'}
                        onClick={() => setRecipeImportMode('GROUPED')}
                      >
                        Grouped (Live Link)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={recipeImportMode === 'SNAPSHOT' ? 'primary' : 'secondary'}
                        onClick={() => setRecipeImportMode('SNAPSHOT')}
                      >
                        Snapshot (Copy Once)
                      </Button>
                    </div>
                    <p className="text-xs text-text-tertiary">
                      {recipeImportMode === 'GROUPED'
                        ? 'Grouped mode keeps this menu item synced to the latest recipes of selected source items.'
                        : 'Snapshot mode copies current source cost items and does not auto-sync later changes.'}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Select one or more menu items</p>
                    <div className="max-h-56 overflow-y-auto rounded-2xl border border-border-default bg-surface-input p-3 space-y-2">
                      {recipeImportSources.length === 0 ? (
                        <p className="text-sm text-text-tertiary">No available source items</p>
                      ) : recipeImportSources.map((source) => {
                        const checked = recipeImportSourceIds.includes(source.id);
                        return (
                          <label key={source.id} className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-raised px-3 py-2 cursor-pointer">
                            <span className="text-sm text-text-primary">{source.name} — {source.category.name}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const nextChecked = e.target.checked;
                                setRecipeImportSourceIds((prev) => {
                                  if (nextChecked) return [...prev, source.id];
                                  return prev.filter((id) => id !== source.id);
                                });
                              }}
                              className="h-4 w-4 rounded"
                            />
                          </label>
                        );
                      })}
                    </div>
                    <Button
                      onClick={importRecipeItems}
                      disabled={recipeImportSources.length === 0 || recipeImportSourceIds.length === 0 || recipeImportLoading}
                      loading={recipeImportLoading}
                    >
                      {recipeImportMode === 'GROUPED' ? 'Create Grouped Recipe Link' : 'Import Selected Cost Items'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Recipe table */}
              <div className="rounded-3xl border border-border-subtle bg-surface-raised overflow-hidden">
                {recipeLoading ? (
                  <PageSkeleton />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[520px]">
                      <thead>
                        <tr className="border-b border-border-subtle text-left">
                          <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Ingredient</th>
                          <th className="px-4 py-3 text-xs font-medium text-text-tertiary text-right">Qty</th>
                          <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Unit</th>
                          <th className="px-4 py-3 text-xs font-medium text-text-tertiary text-right">Unit Cost</th>
                          <th className="px-4 py-3 text-xs font-medium text-text-tertiary text-right">Total</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {recipeItems.length === 0 ? (
                          <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-text-tertiary">No recipe items added yet.</td></tr>
                        ) : (
                          recipeItems.map((recipeItem) => (
                            <tr key={recipeItem.id}>
                              <td className="px-4 py-3 font-medium text-text-primary">{recipeItem.ingredient.name}</td>
                              <td className="px-4 py-3 text-right font-mono text-text-secondary">{recipeItem.quantity}</td>
                              <td className="px-4 py-3 text-text-secondary">{recipeItem.unit || recipeItem.ingredient.unit}</td>
                              <td className="px-4 py-3 text-right font-mono text-text-secondary">{formatCurrency(recipeItem.ingredient.currentCost)}</td>
                              <td className="px-4 py-3 text-right font-mono font-semibold text-text-primary">{formatCurrency(Number(recipeItem.ingredient.currentCost) * recipeItem.quantity)}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2 justify-end">
                                  <Button variant="ghost" size="sm" onClick={() => startRecipeEdit(recipeItem)}>Edit</Button>
                                  <Button variant="danger" size="sm" onClick={() => deleteRecipeItem(recipeItem.id)}>Delete</Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {recipeItems.length > 0 && (
                        <tfoot>
                          <tr className="border-t border-border-default bg-surface-base">
                            <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-text-secondary">Total Recipe Cost</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-text-primary">
                              {formatCurrency(recipeItems.reduce((sum, ri) => sum + Number(ri.ingredient.currentCost) * ri.quantity, 0))}
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </div>

              {/* Add / Edit Recipe Item form */}
              <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
                <div className="px-4 py-3 border-b border-border-subtle">
                  <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">{editingRecipeId ? 'Edit Recipe Item' : 'Add Recipe Item'}</p>
                </div>
                <div className="p-4">
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
                          setRecipeForm({ ...recipeForm, ingredientName: nextValue, unit: existing?.unit ?? recipeForm.unit, unitCost: existing?.currentCost ?? recipeForm.unitCost });
                          void fetchIngredientSuggestions(nextValue);
                        }}
                        required
                        className="mt-2 w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                        placeholder="Enter ingredient name"
                      />
                      <datalist id="ingredient-options">
                        {ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.name} />)}
                      </datalist>
                      <p className="text-xs text-text-tertiary mt-1">Type a name or pick from existing ingredients.</p>
                    </label>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <label className="block">
                        <span className="text-sm font-medium text-text-secondary">Quantity</span>
                        <input type="number" value={recipeForm.quantity} onChange={(e) => setRecipeForm({ ...recipeForm, quantity: Number(e.target.value) })} required min={0} step={0.01} className="mt-2 w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]" />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-text-secondary">Unit</span>
                        <input type="text" value={recipeForm.unit} onChange={(e) => setRecipeForm({ ...recipeForm, unit: e.target.value })} className="mt-2 w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]" />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-text-secondary">Unit Cost (GHS)</span>
                        <input type="number" value={recipeForm.unitCost} onChange={(e) => setRecipeForm({ ...recipeForm, unitCost: Number(e.target.value) })} className="mt-2 w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]" min={0} step={0.01} />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button type="submit" loading={recipeSaving}>{editingRecipeId ? 'Save Changes' : 'Add to Recipe'}</Button>
                      {editingRecipeId && <Button type="button" variant="secondary" onClick={cancelRecipeEdit}>Cancel</Button>}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item — fullscreen overlay */}
      {editItem && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-start sm:items-center justify-center overflow-auto bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-[32px] bg-white shadow-2xl max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Edit — {editItem.name}</h2>
                <p className="text-sm text-text-secondary mt-1">Update details and save.</p>
              </div>
              <Button variant="secondary" onClick={closeEditItem}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              {editError && <div className="rounded-2xl bg-error-muted p-4 text-sm text-error">{editError}</div>}
              <form className="space-y-4" onSubmit={handleEditItemSubmit}>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-sm font-medium text-text-secondary">Item Name</span>
                    <input type="text" value={editItemData.name} onChange={(e) => setEditItemData({ ...editItemData, name: e.target.value })} required className="mt-2 w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-text-secondary">Price (GHS)</span>
                    <input type="number" value={editItemData.price} onChange={(e) => setEditItemData({ ...editItemData, price: Number(e.target.value) })} required min={0} step={0.01} className="mt-2 w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-text-secondary">Category</span>
                    <select
                      value={editItemData.categoryId}
                      onChange={(e) => setEditItemData({ ...editItemData, categoryId: e.target.value })}
                      required
                      className="mt-2 w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                    >
                      <option value="" disabled>Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-text-secondary">Description</span>
                  <textarea value={editItemData.description} onChange={(e) => setEditItemData({ ...editItemData, description: e.target.value })} className="mt-2 w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]" rows={3} />
                </label>
                <div className="rounded-2xl border border-border-default bg-surface-base p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Variations</p>
                      <p className="text-xs text-text-secondary">Edit option groups for this item</p>
                    </div>
                    <button type="button" onClick={addEditItemOption} className="rounded-2xl border border-border-default bg-surface-raised px-3 py-1.5 text-sm font-medium text-text-secondary hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors">
                      + Add Option
                    </button>
                  </div>
                  {editItemOptions.length === 0 ? (
                    <p className="text-sm text-text-tertiary">No variations configured.</p>
                  ) : (
                    <div className="space-y-4">
                      {editItemOptions.map((option, optionIndex) => (
                        <div key={option.id} className="rounded-2xl border border-border-subtle bg-surface-raised p-4 space-y-3">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <label className="block flex-1">
                              <span className="text-xs font-medium text-text-secondary">Option name</span>
                              <input type="text" value={option.name} onChange={(e) => setEditItemOptions(updateOption(editItemOptions, optionIndex, { name: e.target.value }))} className="mt-1 w-full rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]" placeholder="e.g. Soup type" />
                            </label>
                            <div className="flex flex-wrap items-center gap-3">
                              <label className="flex items-center gap-2 text-sm text-text-secondary">
                                <input type="checkbox" checked={option.required} onChange={(e) => setEditItemOptions(updateOption(editItemOptions, optionIndex, { required: e.target.checked }))} className="h-4 w-4 rounded" />
                                Required
                              </label>
                              <label className="flex items-center gap-2 text-sm text-text-secondary">
                                <input type="checkbox" checked={option.multiple} onChange={(e) => setEditItemOptions(updateOption(editItemOptions, optionIndex, { multiple: e.target.checked }))} className="h-4 w-4 rounded" />
                                Multiple
                              </label>
                              <button type="button" onClick={() => removeEditItemOption(optionIndex)} className="text-xs text-error hover:underline">Remove</button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-text-secondary">Values</span>
                              <button type="button" onClick={() => addEditItemOptionValue(optionIndex)} className="text-xs text-[var(--color-gold)] hover:underline">+ Add Value</button>
                            </div>
                            {option.values.map((value, valueIndex) => (
                              <div key={value.id} className="grid gap-2 grid-cols-[1fr_0.6fr_auto] items-center">
                                <input type="text" value={value.label} onChange={(e) => setEditItemOptions(updateOptionValue(editItemOptions, optionIndex, valueIndex, { label: e.target.value }))} className="rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]" placeholder="Label" />
                                <input type="number" value={value.priceAdjustment} onChange={(e) => setEditItemOptions(updateOptionValue(editItemOptions, optionIndex, valueIndex, { priceAdjustment: Number(e.target.value) }))} className="rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]" placeholder="+0.00" step="0.01" min="0" />
                                <button type="button" onClick={() => removeEditItemOptionValue(optionIndex, valueIndex)} className="rounded-xl border border-border-subtle px-2 py-2 text-xs text-error hover:border-error transition-colors">✕</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 pb-4">
                  <Button type="submit" loading={editSaving}>Save Changes</Button>
                  <Button type="button" variant="secondary" onClick={closeEditItem}>Cancel</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
