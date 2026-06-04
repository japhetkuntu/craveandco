'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post, del, patch } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { formatCurrency, formatTime } from '@/lib/utils';
import {
  ShoppingCart, Plus, Minus, Trash2, CreditCard, Search,
  User, X, Check, ChevronRight, Receipt,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────── */

interface MenuOptionValue {
  id: string;
  label: string;
  priceAdjustment?: number;
}

interface MenuOption {
  id: string;
  name: string;
  required: boolean;
  multiple: boolean;
  values: MenuOptionValue[];
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  available: boolean;
  category: { id: string; name: string };
  options?: MenuOption[];
  imageUrl?: string | null;
}

interface Category { id: string; name: string; }

interface SelectedOption {
  optionId: string;
  values: string[];
}

interface CartItem {
  key: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  selectedOptions?: SelectedOption[];
}

interface PaymentType {
  id: string;
  name: string;
  method: string;
  active: boolean;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  loyaltyPoints?: number;
}

interface Order {
  id: string;
  status: string;
  total: number;
  subtotal?: number;
  discountAmount?: number;
  channel: string;
  paymentMethod?: string;
  paymentLabel?: string;
  receiptUrl?: string;
  paidAt?: string;
  createdAt: string;
  guestName?: string;
  customer?: Customer;
  notes?: string;
  items: {
    id: string;
    menuItemId: string;
    menuItem: { name: string };
    quantity: number;
    unitPrice: number;
    notes?: string;
    selectedOptions?: SelectedOption[];
  }[];
}

/* ─── Component ─────────────────────────────────────── */

export default function GrowthPOSPage() {
  const { user, token } = useAuth();

  // Data
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [openOrders, setOpenOrders] = useState<Order[]>([]);

  // UI state
  const [activeCategory, setActiveCategory] = useState('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedVariantItem, setSelectedVariantItem] = useState<MenuItem | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loyaltyBalance, setLoyaltyBalance] = useState<number | null>(null);
  const [useLoyaltyDiscount, setUseLoyaltyDiscount] = useState(false);
  const [activePromos, setActivePromos] = useState<{ id: string; name: string; type: string; value: number; discountScope?: string }[]>([]);
  const [selectedPromoId, setSelectedPromoId] = useState<string>('');
  const [raffleCode, setRaffleCode] = useState('');
  const [raffleResolved, setRaffleResolved] = useState<{
    entry: { name: string; phone: string; customer?: { name: string } | null };
    spin: { rewardType: string; rewardLabel: string } | null;
    promotion: { id: string; name: string; type: string; value: number; discountScope: string } | null;
  } | null>(null);
  const [raffleResolving, setRaffleResolving] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [receiptReference, setReceiptReference] = useState('');
  const [printReceipt, setPrintReceipt] = useState(true);
  const [channel, setChannel] = useState<string>('DINE_IN');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [view, setView] = useState<'pos' | 'orders'>('pos');

  // Modals
  const [showPayment, setShowPayment] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'discard' | 'loadOrder' | 'cancelOrder';
    order?: Order;
    orderId?: string;
  } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const getOptionAdjustment = (item: MenuItem, selectedOptions?: SelectedOption[]) => {
    if (!item.options?.length || !selectedOptions?.length) return 0;
    const optionMap = new Map(item.options.map((option) => [option.id, option]));
    return selectedOptions.reduce((sum, selected) => {
      const option = optionMap.get(selected.optionId);
      if (!option || !Array.isArray(selected.values)) return sum;
      const valueMap = new Map(option.values.map((value) => [value.id, value]));
      return sum + selected.values.reduce((valueSum, valueId) => {
        const value = valueMap.get(valueId);
        return valueSum + (Number(value?.priceAdjustment || 0));
      }, 0);
    }, 0);
  };

  const formatSelectedOptions = (item: MenuItem, selectedOptions?: SelectedOption[]) => {
    if (!selectedOptions?.length || !item.options?.length) return [];
    const optionMap = new Map(item.options.map((option) => [option.id, option]));
    return selectedOptions.flatMap((selected) => {
      const option = optionMap.get(selected.optionId);
      if (!option) return [];
      const valueMap = new Map(option.values.map((value) => [value.id, value.label]));
      const labels = selected.values.map((valueId) => valueMap.get(valueId)).filter(Boolean);
      return labels.length ? [`${option.name}: ${labels.join(', ')}`] : [];
    });
  };

  const optionKey = (options?: SelectedOption[]) =>
    options
      ? options
          .map((option) => ({
            optionId: option.optionId,
            values: [...option.values].sort(),
          }))
          .sort((a, b) => a.optionId.localeCompare(b.optionId))
          .map((option) => `${option.optionId}:${option.values.join(',')}`)
          .join('|')
      : '';

  const openVariantSelector = (item: MenuItem) => {
    setSelectedVariantItem(item);
    setSelectedOptions((item.options || []).map((option) => ({ optionId: option.id, values: [] })));
  };

  const closeVariantSelector = () => {
    setSelectedVariantItem(null);
    setSelectedOptions([]);
  };

  const toggleSelectedOptionValue = (optionId: string, valueId: string, multiple: boolean) => {
    setSelectedOptions((current) =>
      current.map((option) => {
        if (option.optionId !== optionId) return option;
        const values = option.values || [];
        if (multiple) {
          return values.includes(valueId)
            ? { ...option, values: values.filter((id) => id !== valueId) }
            : { ...option, values: [...values, valueId] };
        }
        return { ...option, values: values.includes(valueId) ? [] : [valueId] };
      }),
    );
  };

  const isVariantSelectionValid = selectedVariantItem
    ? selectedVariantItem.options?.every((option) => {
        const selection = selectedOptions.find((selected) => selected.optionId === option.id);
        return !option.required || (selection?.values?.length ?? 0) > 0;
      }) ?? true
    : true;

  const confirmVariantSelection = () => {
    if (!selectedVariantItem) return;
    if (!isVariantSelectionValid) return;
    addToCart(selectedVariantItem, selectedOptions);
    closeVariantSelector();
  };

  const openItem = (item: MenuItem) => {
    if (item.options?.length) {
      openVariantSelector(item);
      return;
    }
    addToCart(item);
  };

  /* ─── Data fetching ─── */

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [items, cats, pts, custs, orders] = await Promise.all([
        get('/api/v1/menu/items', token),
        get('/api/v1/menu/categories', token),
        get('/api/v1/growth/payment-types', token),
        get('/api/v1/customers?limit=50', token),
        get('/api/v1/orders', token),
      ]);
      setMenuItems(items.filter((i: MenuItem) => i.available));
      setCategories(cats);
      setPaymentTypes(pts);
      setCustomers(custs);
      const STATUS_RANK: Record<string, number> = { READY: 0, PREPARING: 1, NEW: 2 };
      setOpenOrders(
        orders
          .filter((o: Order) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED')
          .sort((a: Order, b: Order) => (STATUS_RANK[a.status] ?? 3) - (STATUS_RANK[b.status] ?? 3)),
      );
      // Load active promotions
      try {
        const promos = await get('/api/v1/promotions/active', token);
        setActivePromos(promos);
      } catch { /* non-critical */ }
    } catch (err) {
      console.error('Failed to load POS data:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchCustomerSearchResults = useCallback(async () => {
    if (!token || !showCustomerSearch) return;
    setCustomerSearchLoading(true);
    try {
      const query = new URLSearchParams();
      if (customerSearch.trim()) query.append('search', customerSearch.trim());
      query.append('limit', '50');
      const custs = await get(`/api/v1/customers?${query.toString()}`, token);
      setCustomers(Array.isArray(custs) ? custs : []);
    } catch (err) {
      console.error('Failed to search customers:', err);
      setCustomers([]);
    } finally {
      setCustomerSearchLoading(false);
    }
  }, [customerSearch, showCustomerSearch, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!showCustomerSearch) return;
    fetchCustomerSearchResults();
  }, [fetchCustomerSearchResults, showCustomerSearch]);

  useEffect(() => {
    if (view !== 'pos' || !searchInputRef.current) return;
    // Skip on touch devices: focusing a search input on mount opens the soft keyboard
    // and shifts the entire POS layout. Counter staff on tablets can tap to focus.
    if (typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches) {
      return;
    }
    searchInputRef.current.focus();
  }, [view]);

  useEffect(() => {
    if (!token || !selectedCustomer) {
      setLoyaltyBalance(null);
      setUseLoyaltyDiscount(false);
      return;
    }

    get(`/api/v1/loyalty/balance/${selectedCustomer.id}`, token)
      .then((balance: { customerId: string; balance: number }) => {
        setLoyaltyBalance(balance.balance ?? 0);
      })
      .catch((error) => {
        console.error('Failed to load loyalty balance', error);
        setLoyaltyBalance(0);
      });
  }, [token, selectedCustomer]);

  useEffect(() => {
    if (loyaltyBalance !== null && loyaltyBalance < 100) {
      setUseLoyaltyDiscount(false);
    }
  }, [loyaltyBalance]);

  // Auto-refresh open orders every 10s so kitchen status stays live
  useEffect(() => {
    if (view !== 'orders') return;
    const id = window.setInterval(() => { fetchData(); }, 10_000);
    return () => window.clearInterval(id);
  }, [view, fetchData]);

  /* ─── Cart operations ─── */

  const addToCart = (item: MenuItem, options?: SelectedOption[]) => {
    setCart((prev) => {
      const optionSignature = optionKey(options);
      const itemKey = `${item.id}-${optionSignature}`;
      const existing = prev.find((c) => c.key === itemKey);
      const unitPrice = Number(item.price) + getOptionAdjustment(item, options);
      if (existing) {
        return prev.map((c) =>
          c.key === itemKey ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [
        ...prev,
        {
          key: itemKey,
          menuItemId: item.id,
          name: item.name,
          price: Number(unitPrice.toFixed(2)),
          quantity: 1,
          selectedOptions: options,
        },
      ];
    });
  };

  const updateQuantity = (itemKey: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.key !== itemKey) return c;
          const newQty = c.quantity + delta;
          return newQty > 0 ? { ...c, quantity: newQty } : c;
        })
        .filter((c) => c.quantity > 0),
    );
  };

  const removeFromCart = (itemKey: string) => {
    setCart((prev) => prev.filter((c) => c.key !== itemKey));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const discountRate = useLoyaltyDiscount ? 0.05 : 0;
  const selectedPromo = activePromos.find(p => p.id === selectedPromoId) ?? raffleResolved?.promotion ?? null;
  const promoDiscount = selectedPromo
    ? (() => {
        const scope = (selectedPromo as any).discountScope ?? 'ALL_ITEMS';
        const base = scope === 'FIRST_ITEM' && cart.length > 0
          ? Math.max(...cart.map(c => c.price))
          : cartTotal;
        return selectedPromo.type === 'PERCENTAGE'
          ? Number((base * selectedPromo.value / 100).toFixed(2))
          : Math.min(Number(selectedPromo.value), base);
      })()
    : 0;
  const afterPromoTotal = Number((cartTotal - promoDiscount).toFixed(2));
  const discountAmount = Number((afterPromoTotal * discountRate).toFixed(2));
  const discountedTotal = Number((afterPromoTotal - discountAmount).toFixed(2));

  /* ─── Order operations ─── */

  const showAlert = (type: 'success' | 'error' | 'info', message: string) => {
    setAlert({ type, message });
    window.setTimeout(() => setAlert(null), 4500);
  };

  const discardCurrentOrder = () => {
    setActiveOrderId(null);
    setCart([]);
    setSelectedCustomer(null);
    setGuestName('');
    setReceiptReference('');
    setPrintReceipt(true);
    setSelectedPromoId('');
    setRaffleCode('');
    setRaffleResolved(null);
    setConfirmAction(null);
  };

  const getReceiptHtml = (order: Order) => {
    const itemsHtml = order.items.map((item) => `
      <tr>
        <td style="padding: 8px;border-bottom:1px solid #ddd;">${item.menuItem?.name || ''}</td>
        <td style="padding: 8px;border-bottom:1px solid #ddd;text-align:center;">${item.quantity}</td>
        <td style="padding: 8px;border-bottom:1px solid #ddd;text-align:right;">${formatCurrency(item.unitPrice)}</td>
        <td style="padding: 8px;border-bottom:1px solid #ddd;text-align:right;">${formatCurrency(item.unitPrice * item.quantity)}</td>
      </tr>`).join('');

    return `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Crave & Co Receipt</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              color: #111;
              padding: 16px;
              width: 320px;
              margin: 0;
            }
            .receipt {
              width: 100%;
            }
            .header {
              text-align: center;
              margin-bottom: 16px;
            }
            .brand {
              font-size: 22px;
              font-weight: 900;
              letter-spacing: 1px;
              margin: 0;
            }
            .subtitle {
              font-size: 12px;
              margin: 6px 0 0;
              color: #555;
            }
            .divider {
              border-bottom: 1px dashed #999;
              margin: 12px 0;
            }
            .section {
              margin-bottom: 12px;
            }
            .section div {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              line-height: 1.5;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            th, td {
              padding: 4px 0;
            }
            th {
              text-align: left;
              font-size: 12px;
            }
            td.qty,
            td.price,
            td.total {
              text-align: right;
            }
            .totals {
              margin-top: 12px;
              font-size: 13px;
              font-weight: 700;
            }
            .totals div {
              display: flex;
              justify-content: space-between;
              margin-top: 4px;
            }
            .footer {
              text-align: center;
              font-size: 11px;
              color: #555;
              margin-top: 18px;
              line-height: 1.5;
            }
            .small { font-size: 11px; }
            .receipt-note { margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <p class="brand">CRAVE & CO.</p>
              <p class="subtitle">Restaurant · Taste the comfort</p>
              <p class="subtitle">Accra, Ghana · +233 24 000 0000</p>
              <p class="subtitle">hello@craveandco.com</p>
            </div>
            <div class="divider"></div>
            <div class="section">
              <div><span>Order</span><span>${order.id.slice(-6).toUpperCase()}</span></div>
              <div><span>Date</span><span>${new Date().toLocaleString('en-GH')}</span></div>
              <div><span>Type</span><span>${order.channel.replace('_', ' ')}</span></div>
              <div><span>Name</span><span>${order.customer?.name || order.guestName || 'Guest'}</span></div>
              ${order.receiptUrl ? `<div><span>Receipt</span><span>Yes</span></div>` : ''}
            </div>
            <div class="divider"></div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="qty">Qty</th>
                  <th class="price">Price</th>
                  <th class="total">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div class="divider"></div>
            <div class="totals">
              <div><span>Subtotal</span><span>${formatCurrency(order.subtotal ?? order.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0))}</span></div>
              ${(() => {
                const subtotal = order.subtotal ?? order.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
                const discount = order.discountAmount ?? Math.max(subtotal - Number(order.total), 0);
                return discount > 0
                  ? `<div><span>Discount</span><span>-${formatCurrency(discount)}</span></div><div><span>Total</span><span>${formatCurrency(order.total)}</span></div>`
                  : `<div><span>Total</span><span>${formatCurrency(order.total)}</span></div>`;
              })()}
              <div><span>Status</span><span>${order.status}</span></div>
              <div><span>Paid at</span><span>${order.paidAt ? new Date(order.paidAt).toLocaleString('en-GH') : 'N/A'}</span></div>
            </div>
            <div class="divider"></div>
            <div class="footer">
              <div class="receipt-note">Thank you for dining with Crave & Co. Visit us again!</div>
              <div class="small">Powered by Crave & Co. Restaurant | www.craveandco.com</div>
            </div>
          </div>
        </body>
      </html>`;
  };

  const printReceiptForOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showAlert('error', 'Unable to open receipt printer.');
      return;
    }
    printWindow.document.write(getReceiptHtml(order));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const loadOrderInternal = (order: Order) => {
    setActiveOrderId(order.id);
    setCart(order.items.map((i) => ({
      key: `${i.menuItemId}-${optionKey(i.selectedOptions)}`,
      menuItemId: i.menuItemId,
      name: i.menuItem?.name || '',
      price: Number(i.unitPrice),
      quantity: i.quantity,
      notes: i.notes,
      selectedOptions: i.selectedOptions,
    })));
    setSelectedCustomer(order.customer || null);
    setGuestName(order.guestName || '');
    setOrderNotes(order.notes || '');
    setView('pos');
    setConfirmAction(null);
  };

  const createOrder = async () => {
    if (!token || !user || cart.length === 0) return;
    setSaving(true);
    try {
      const order = await post('/api/v1/orders', {
        branchId: user.branchId,
        channel,
        customerId: selectedCustomer?.id,
        guestName: selectedCustomer ? undefined : guestName.trim() || undefined,
        notes: orderNotes.trim() || undefined,
        items: cart.map(c => ({
          menuItemId: c.menuItemId,
          quantity: c.quantity,
          notes: c.notes,
          selectedOptions: c.selectedOptions,
        })),
      }, token);
      setActiveOrderId(order.id);
      // Repopulate cart from the returned order so the payment modal shows correct totals
      setCart((order.items ?? []).map((i: Order['items'][number]) => ({
        key: `${i.menuItemId}-${optionKey(i.selectedOptions)}`,
        menuItemId: i.menuItemId,
        name: i.menuItem?.name || '',
        price: Number(i.unitPrice),
        quantity: i.quantity,
        notes: i.notes,
        selectedOptions: i.selectedOptions,
      })));
      setSelectedCustomer(order.customer || selectedCustomer || null);
      setGuestName('');
      setOrderNotes('');
      setUseLoyaltyDiscount(false);
      await fetchData();
      showAlert('success', 'Order created. Ready for payment.');
    } catch (err) {
      console.error('Failed to create order', err);
      showAlert('error', 'Failed to create order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const payOrder = async (paymentType: PaymentType) => {
    if (!token || !activeOrderId) return;
    setSaving(true);
    try {
      if (useLoyaltyDiscount && !selectedCustomer) {
        throw new Error('A customer must be selected to redeem loyalty points.');
      }
      const paidOrder = await post<Order>(`/api/v1/orders/${activeOrderId}/pay`, {
        paymentMethod: paymentType.method,
        paymentLabel: paymentType.name,
        receiptUrl: receiptReference.trim() || undefined,
        customerId: selectedCustomer?.id,
        redeemPoints: useLoyaltyDiscount ? 100 : undefined,
        promotionId: !raffleResolved ? (selectedPromoId || undefined) : undefined,
        raffleAccessCode: raffleResolved ? raffleCode.toUpperCase() : undefined,
      }, token);
      setShowPayment(false);
      setActiveOrderId(null);
      setCart([]);
      setReceiptReference('');
      setUseLoyaltyDiscount(false);
      setSelectedPromoId('');
      setRaffleCode('');
      setRaffleResolved(null);
      await fetchData();
      showAlert('success', 'Payment recorded. Order complete.');
      if (printReceipt) {
        printReceiptForOrder(paidOrder);
      }
    } catch (err) {
      console.error('Failed to pay order', err);
      showAlert('error', 'Failed to process payment. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!token) return;
    try {
      await post(`/api/v1/orders/${orderId}/cancel`, {}, token);
      if (activeOrderId === orderId) setActiveOrderId(null);
      await fetchData();
      showAlert('info', 'Order cancelled.');
    } catch (err) {
      console.error('Failed to cancel order', err);
      showAlert('error', 'Unable to cancel order.');
    } finally {
      setConfirmAction(null);
    }
  };

  const handleRaffleLookup = async () => {
    if (!token || !raffleCode.trim()) return;
    setRaffleResolving(true);
    setRaffleResolved(null);
    try {
      const result = await get(API_PATHS.raffleAdmin.resolve(raffleCode.trim().toUpperCase()), token);
      setRaffleResolved(result);
      if (result.promotion) {
        setSelectedPromoId(result.promotion.id);
      }
    } catch (err: any) {
      showAlert('error', err.message || 'Raffle code not found.');
    } finally {
      setRaffleResolving(false);
    }
  };

  const loadOrder = (order: Order) => {
    if (cart.length > 0 && order.id !== activeOrderId) {
      setConfirmAction({ type: 'loadOrder', order });
      return;
    }
    loadOrderInternal(order);
  };

  const confirmLoadOrder = () => {
    if (confirmAction?.type === 'loadOrder' && confirmAction.order) {
      loadOrderInternal(confirmAction.order);
    }
  };

  const confirmDiscardOrder = () => {
    if (confirmAction?.type === 'discard') {
      discardCurrentOrder();
    }
  };

  const confirmCancelOrder = () => {
    if (confirmAction?.type === 'cancelOrder' && confirmAction.orderId) {
      cancelOrder(confirmAction.orderId);
    }
  };

  const createCustomer = async () => {
    if (!token || !newCustomerName.trim()) return;
    setSaving(true);
    try {
      const customer = await post('/api/v1/customers', {
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || undefined,
      }, token);
      setSelectedCustomer(customer);
      setCustomers(prev => [...prev, customer]);
      setShowNewCustomer(false);
      setShowCustomerSearch(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      showAlert('success', 'Customer added to order.');
    } catch (err) {
      console.error('Failed to create customer', err);
      showAlert('error', 'Failed to add customer.');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Filtering ─── */

  const filteredItems = menuItems.filter(item => {
    if (activeCategory && item.category?.id !== activeCategory) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredCustomers = customers;

  /* ─── Render ─── */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col min-h-0 pb-20 lg:pb-0">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-surface-base/95 backdrop-blur-sm flex items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-text-primary hidden sm:block">POS</h1>
          <div className="flex bg-surface-elevated rounded-xl p-0.5">
            <button
              onClick={() => setView('pos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${view === 'pos' ? 'bg-surface-raised text-gold shadow-sm' : 'text-text-secondary'}`}
            >
              New Order
            </button>
            <button
              onClick={() => setView('orders')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all relative ${view === 'orders' ? 'bg-surface-raised text-gold shadow-sm' : 'text-text-secondary'}`}
            >
              Open Orders
              {openOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {openOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Channel selector */}
          <select
            value={channel}
            onChange={e => setChannel(e.target.value)}
            className="rounded-xl border border-border-default bg-surface-raised px-3 py-2 text-xs font-medium text-text-secondary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
          >
            <option value="DINE_IN">Dine-In</option>
            <option value="TAKEAWAY">Takeaway</option>
            <option value="DELIVERY">Delivery</option>
            <option value="PHONE">Phone</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
        </div>
      </div>

      {alert && (
        <div className={`px-4 py-3 rounded-2xl mb-3 mx-4 text-sm font-semibold ${
          alert.type === 'success' ? 'bg-success-muted text-success border border-success' :
          alert.type === 'error' ? 'bg-error-muted text-error border border-error' :
          'bg-info-muted text-info border border-info'
        }`}>
          {alert.message}
        </div>
      )}

      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface-raised/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('pos')}
            className={`flex-1 min-w-[110px] rounded-2xl border px-3 py-2 text-xs font-semibold transition-all ${view === 'pos' ? 'bg-gold text-white shadow-sm' : 'bg-surface-elevated text-text-secondary'}`}
          >
            New Order
          </button>
          <button
            onClick={() => setView('orders')}
            className={`flex-1 min-w-[110px] rounded-2xl border px-3 py-2 text-xs font-semibold transition-all relative ${view === 'orders' ? 'bg-gold text-white shadow-sm' : 'bg-surface-elevated text-text-secondary'}`}
          >
            Open Orders
            {openOrders.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-white text-gold text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                {openOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {view === 'orders' ? (
        /* ─── Open Orders View ─── */
        <div className="flex-1 overflow-y-auto py-4 lg:pb-0 space-y-4">
          {/* Ready-for-pickup alert */}
          {openOrders.some(o => o.status === 'READY') && (
            <div className="flex items-center gap-3 rounded-2xl bg-success-muted border border-success/30 px-4 py-3">
              <span className="text-xl">✅</span>
              <div>
                <p className="text-sm font-bold text-success">
                  {openOrders.filter(o => o.status === 'READY').length === 1
                    ? '1 order is ready for pickup!'
                    : `${openOrders.filter(o => o.status === 'READY').length} orders are ready for pickup!`}
                </p>
                <p className="text-xs text-success/70">Tap the order below to collect payment</p>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {openOrders.map(order => (
              <div
                key={order.id}
                className={`rounded-2xl border-2 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  order.status === 'READY'
                    ? 'border-success'
                    : order.status === 'PREPARING'
                    ? 'border-amber-300'
                    : 'border-info/30'
                }`}
                onClick={() => loadOrder(order)}
              >
                {/* Kitchen status banner */}
                <div className={`px-4 py-3 flex items-center gap-3 ${
                  order.status === 'READY' ? 'bg-success-muted'
                    : order.status === 'PREPARING' ? 'bg-amber-50'
                    : 'bg-info-muted'
                }`}>
                  <span className="text-2xl leading-none">
                    {order.status === 'READY' ? '✅' : order.status === 'PREPARING' ? '🔥' : '⏳'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold leading-tight ${
                      order.status === 'READY' ? 'text-success'
                        : order.status === 'PREPARING' ? 'text-amber-700'
                        : 'text-info'
                    }`}>
                      {order.status === 'READY' ? 'Ready for pickup!'
                        : order.status === 'PREPARING' ? 'Kitchen is cooking…'
                        : 'Waiting for kitchen'}
                    </p>
                    <p className="text-[10px] text-text-tertiary mt-0.5 truncate">
                      #{order.id.slice(-4).toUpperCase()} · {order.channel.replace('_', ' ')} · {new Date(order.createdAt).toLocaleString('en-GH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4 bg-surface-raised">
                  {(order.customer || order.guestName || order.receiptUrl) && (
                    <p className="text-xs text-text-secondary mb-2 flex flex-wrap items-center gap-1">
                      <User size={12} /> {order.customer ? order.customer.name : order.guestName || 'Guest'}
                      {order.receiptUrl && (
                        <span className="rounded-full bg-success-muted px-2 py-0.5 text-[10px] font-semibold text-success">
                          Receipt available
                        </span>
                      )}
                    </p>
                  )}
                  <div className="space-y-1 mb-3">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <p key={idx} className="text-xs text-text-secondary">
                        {item.quantity}× {item.menuItem?.name}
                      </p>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-text-tertiary">+{order.items.length - 3} more</p>
                    )}
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border-subtle">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary">Discount</span>
                      <span className="text-xs text-text-secondary">-{formatCurrency(Number(order.discountAmount || 0))}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-text-primary">Total</span>
                      <span className="text-sm font-bold text-[var(--color-gold)]">{formatCurrency(Number(order.total))}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmAction({ type: 'cancelOrder', orderId: order.id }); }}
                        className="text-error hover:text-error p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight size={14} className="text-text-tertiary" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {openOrders.length === 0 && (
              <div className="col-span-full text-center py-16 text-text-tertiary">
                <Receipt size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No open orders</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─── POS View ─── */
        <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden min-h-0 lg:pb-0">
          {/* Menu Section */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Search + Categories */}
            <div className="py-3 space-y-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search menu..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => setActiveCategory('')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    !activeCategory ? 'bg-gold text-white shadow-sm' : 'bg-surface-elevated text-text-secondary'
                  }`}
                >
                  All
                </button>
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(c.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      activeCategory === c.id ? 'bg-gold text-white shadow-sm' : 'bg-surface-elevated text-text-secondary'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 content-start pb-4">
              {filteredItems.map(item => {
                const inCart = cart.find(c => c.menuItemId === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => openItem(item)}
                    className={`relative flex min-h-[130px] sm:min-h-[145px] md:min-h-[155px] flex-col justify-between overflow-hidden bg-surface-raised rounded-[22px] border border-border-subtle p-3 sm:p-4 text-left transition-all duration-200 hover:border-gold hover:shadow-lg active:-translate-y-0.5 ${
                      inCart ? 'border-gold shadow-sm ring-1 ring-gold' : ''
                    }`}
                  >
                    {item.imageUrl ? (
                      <div className="mb-3 h-28 w-full overflow-hidden rounded-[18px] bg-surface-base">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                    ) : null}
                    {inCart && (
                      <span className="absolute top-3 right-3 z-10 bg-gold text-white text-[11px] font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg border-2 border-white">
                        {inCart.quantity}
                      </span>
                    )}
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-text-primary leading-tight line-clamp-3">{item.name}</p>
                      <p className="text-[11px] text-text-tertiary">{item.category?.name}</p>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-gold">{formatCurrency(Number(item.price))}</p>
                  </button>
                );
              })}
              {filteredItems.length === 0 && (
                <div className="col-span-full text-center py-12 text-text-tertiary text-sm">
                  No items found
                </div>
              )}
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:w-80 xl:w-96 bg-surface-raised lg:border-l border-t lg:border-t-0 border-border-subtle flex flex-col min-h-0 overflow-hidden">
            {/* Cart Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-gold" />
                <span className="text-sm font-semibold text-text-primary">
                  Cart {cartCount > 0 && <span className="text-gold">({cartCount})</span>}
                </span>
              </div>
              {activeOrderId && (
                <span className="bg-info-muted text-info text-[10px] font-bold px-2 py-0.5 rounded-full">
                  #{activeOrderId.slice(-4).toUpperCase()}
                </span>
              )}
            </div>

            {/* Customer */}
            <div className="px-4 py-2 border-b border-border-subtle">
              {selectedCustomer ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gold-muted flex items-center justify-center">
                      <User size={12} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">{selectedCustomer.name}</p>
                      {selectedCustomer.phone && <p className="text-[10px] text-text-tertiary">{selectedCustomer.phone}</p>}
                      <p className="text-[10px] text-text-tertiary">{selectedCustomer.loyaltyPoints ?? 0} pts</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} className="text-text-tertiary hover:text-text-secondary">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Order name or guest name"
                    className="w-full px-3 py-2 rounded-xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                  />
                  <button
                    onClick={() => setShowCustomerSearch(true)}
                    className="flex items-center gap-2 text-xs text-text-tertiary hover:text-gold py-1 w-full"
                  >
                    <User size={14} />
                    <span>Assign customer to order (optional)</span>
                  </button>
                  <p className="text-[10px] text-text-tertiary">
                    You can give the order a name even without a registered customer.
                  </p>
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-text-tertiary">
                  <ShoppingCart size={32} className="mb-2 opacity-30" />
                  <p className="text-xs">Tap items to add</p>
                </div>
              ) : (
                <div className="py-2">
                  {cart.map(item => (
                    <div key={`${item.menuItemId}-${optionKey(item.selectedOptions)}`} className="flex items-center gap-2 px-4 py-2 hover:bg-surface-base transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-primary truncate">{item.name}</p>
                        {item.selectedOptions?.length ? (
                          <div className="text-[10px] text-text-secondary space-y-1">
                            {formatSelectedOptions(menuItems.find((menu) => menu.id === item.menuItemId) as MenuItem, item.selectedOptions).map((label) => (
                              <p key={label}>{label}</p>
                            ))}
                            <p>{formatCurrency(item.price)} each</p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-text-tertiary">{formatCurrency(item.price)} each</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.key, -1)}
                          className="w-6 h-6 rounded-lg bg-surface-elevated hover:bg-surface-elevated flex items-center justify-center transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-text-primary">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.key, 1)}
                          className="w-6 h-6 rounded-lg bg-gold-muted hover:bg-gold-muted text-gold flex items-center justify-center transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <p className="text-xs font-bold text-text-primary w-16 text-right">{formatCurrency(item.price * item.quantity)}</p>
                      <button
                        onClick={() => removeFromCart(item.key)}
                        className="text-text-tertiary hover:text-error transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            <div className="space-y-3 border-t border-border-subtle px-4 py-3 bg-surface-base/50">
              <label className="block text-xs font-semibold text-text-secondary">Order notes</label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Allergies, delivery instructions, or special requests"
                className="w-full min-h-[90px] rounded-3xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-secondary">Total</span>
                <span className="text-lg font-bold text-text-primary">{formatCurrency(cartTotal)}</span>
              </div>

              {!activeOrderId ? (
                <button
                  onClick={createOrder}
                  disabled={cart.length === 0 || saving}
                  className="w-full py-3 rounded-xl bg-gold text-white font-semibold text-sm hover:bg-gold-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <Receipt size={16} />
                      Place Order
                    </>
                  )}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPayment(true)}
                    className="flex-1 py-3 rounded-xl bg-success text-white font-semibold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard size={16} />
                    Pay
                  </button>
                  <button
                    onClick={() => setConfirmAction({ type: 'discard' })}
                    className="px-4 py-3 rounded-xl bg-surface-elevated text-text-secondary font-semibold text-sm hover:bg-surface-elevated transition-all"
                  >
                    Start new order
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {!!confirmAction && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] overflow-hidden flex flex-col">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-xl font-semibold text-text-primary">
                {confirmAction?.type === 'cancelOrder' ? 'Cancel Order' : 'Start New Order'}
              </h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-text-secondary text-sm">
                {confirmAction?.type === 'discard' && 'Clear the current cart and begin a fresh order?'}
                {confirmAction?.type === 'loadOrder' && 'Load this open order? Your current cart will be replaced.'}
                {confirmAction?.type === 'cancelOrder' && 'Cancel this open order? This cannot be undone.'}
              </p>
            </div>
            <div className="border-t border-border-subtle px-6 py-4 flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-3 rounded-2xl bg-surface-elevated text-text-secondary font-semibold text-sm"
              >
                Keep current
              </button>
              <button
                onClick={() => {
                  if (confirmAction?.type === 'discard') confirmDiscardOrder();
                  if (confirmAction?.type === 'loadOrder') confirmLoadOrder();
                  if (confirmAction?.type === 'cancelOrder') confirmCancelOrder();
                }}
                className={`flex-1 py-3 rounded-2xl font-semibold text-sm text-white transition-all ${
                  confirmAction?.type === 'cancelOrder' ? 'bg-error hover:brightness-110' : 'bg-[var(--color-gold)] hover:brightness-110'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Take Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Take Payment</h2>
                <p className="text-sm text-text-secondary mt-1">Choose a payment method to complete the order.</p>
              </div>
              <button onClick={() => { setShowPayment(false); setSelectedPromoId(''); setRaffleCode(''); setRaffleResolved(null); }} className="shrink-0 rounded-2xl border border-border-subtle px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-raised transition-colors">Close</button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              {/* Order total summary */}
              <div className="rounded-2xl bg-surface-base p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="font-medium text-text-primary">{formatCurrency(cartTotal || 0)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Promo ({selectedPromo?.name})</span>
                    <span className="font-medium text-success">-{formatCurrency(promoDiscount)}</span>
                  </div>
                )}
                {useLoyaltyDiscount && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Loyalty Discount</span>
                    <span className="font-medium text-success">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t border-border-subtle pt-2">
                  <span className="text-text-primary">Total to Pay</span>
                  <span className="text-[var(--color-gold)]">{formatCurrency(useLoyaltyDiscount ? discountedTotal : (promoDiscount > 0 ? afterPromoTotal : (cartTotal || 0)))}</span>
                </div>
              </div>

              {/* Raffle Code input */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-text-secondary">Raffle Code</p>
                <p className="text-xs text-text-secondary">Only the latest unredeemed Spin &amp; Win reward is eligible for this order.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={raffleCode}
                    onChange={e => { setRaffleCode(e.target.value.toUpperCase()); setRaffleResolved(null); }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleRaffleLookup(); } }}
                    placeholder="Enter code (e.g. AB12CD)"
                    className="flex-1 h-12 rounded-2xl border border-border-default bg-surface-input px-4 text-sm text-text-primary font-mono tracking-widest uppercase outline-none focus:border-[var(--color-gold)]"
                  />
                  <button
                    type="button"
                    onClick={handleRaffleLookup}
                    disabled={!raffleCode.trim() || raffleResolving}
                    className="h-12 px-4 rounded-2xl bg-[var(--color-gold)] text-black text-sm font-semibold disabled:opacity-50 hover:brightness-105 transition-all shrink-0"
                  >
                    {raffleResolving ? '...' : 'Look up'}
                  </button>
                </div>
                {raffleResolved && (
                  raffleResolved.spin ? (
                    <div className={`rounded-2xl p-3 text-sm space-y-1 ${raffleResolved.promotion ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                      <p className="font-semibold text-text-primary">
                        🎉 {raffleResolved.entry.customer?.name ?? raffleResolved.entry.name} — latest reward: {raffleResolved.spin.rewardLabel}
                      </p>
                      {raffleResolved.promotion ? (
                        <p className="text-green-700 font-medium">
                          Auto-applied: {raffleResolved.promotion.name}{' '}
                          ({raffleResolved.promotion.type === 'PERCENTAGE'
                            ? `${raffleResolved.promotion.value}%`
                            : formatCurrency(raffleResolved.promotion.value)}{' '}
                          {(raffleResolved.promotion.discountScope ?? 'ALL_ITEMS') === 'FIRST_ITEM' ? 'off highest-priced item' : 'off order'})
                        </p>
                      ) : (
                        <p className="text-amber-700">No active promotion linked to this reward type.</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600 font-medium">No eligible latest reward found for this code.</p>
                  )
                )}
              </div>

              {/* Promotion selector */}
              {activePromos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-text-secondary">Apply Promotion</p>
                  <select
                    value={selectedPromoId}
                    onChange={e => { setSelectedPromoId(e.target.value); if (raffleResolved) setRaffleResolved(null); }}
                    className="h-12 w-full rounded-2xl border border-border-default bg-surface-input px-4 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                  >
                    <option value="">No promotion</option>
                    {activePromos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.type === 'PERCENTAGE' ? `${p.value}% off` : `${formatCurrency(p.value)} off`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <input
                type="text"
                value={receiptReference}
                onChange={(e) => setReceiptReference(e.target.value)}
                placeholder="Receipt link / reference (optional)"
                className="h-12 w-full rounded-2xl border border-border-default bg-surface-input px-4 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
              />
              <label className="flex items-center gap-3 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={printReceipt}
                  onChange={(e) => setPrintReceipt(e.target.checked)}
                  className="w-4 h-4 rounded border border-border-default accent-[var(--color-gold)]"
                />
                Print receipt after payment
              </label>

              <div className="rounded-3xl border border-border-default bg-surface-base p-4 text-sm text-text-secondary">
                {selectedCustomer ? (
                  <>
                    <p className="font-semibold text-text-primary">Loyalty Points</p>
                    <p className="mt-1">{loyaltyBalance ?? 0} points available for {selectedCustomer.name}</p>
                    {loyaltyBalance !== null && loyaltyBalance >= 100 ? (
                      <label className="flex items-center gap-3 mt-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useLoyaltyDiscount}
                          onChange={(e) => setUseLoyaltyDiscount(e.target.checked)}
                          className="w-4 h-4 rounded border border-border-default accent-[var(--color-gold)]"
                        />
                        <span>
                          Redeem 100 points for 5% off
                          {useLoyaltyDiscount && (
                            <strong className="text-text-primary"> (save {formatCurrency(discountAmount)})</strong>
                          )}
                        </span>
                      </label>
                    ) : (
                      <p className="mt-2 text-xs text-text-tertiary">
                        {loyaltyBalance === null ? 'Loading loyalty balance...' : 'Needs at least 100 points to redeem.'}
                      </p>
                    )}
                  </>
                ) : (
                  <p>Select a customer on the order to enable loyalty discounts.</p>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4">
              {paymentTypes.length === 0 ? (
                <p className="text-center text-sm text-text-tertiary py-2">
                  No payment types configured. Ask admin to set up payment types.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {paymentTypes.map(pt => (
                    <button
                      key={pt.id}
                      onClick={() => payOrder(pt)}
                      disabled={saving}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-border-subtle hover:border-[var(--color-gold)] hover:bg-[var(--color-gold)]/5 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <CreditCard size={24} className="text-[var(--color-gold)]" />
                      <span className="text-sm font-semibold text-text-primary">{pt.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Search Modal */}
      {showCustomerSearch && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Find Customer</h2>
                <p className="text-sm text-text-secondary mt-1">Search for a customer to attach to this order.</p>
              </div>
              <button onClick={() => { setShowCustomerSearch(false); setCustomerSearch(''); }} className="shrink-0 rounded-2xl border border-border-subtle px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-raised transition-colors">Close</button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="h-11 w-full rounded-2xl border border-border-default bg-surface-input pl-9 pr-4 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                />
              </div>
              <div className="space-y-1">
                {filteredCustomers.slice(0, 20).map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCustomer(c); setShowCustomerSearch(false); setCustomerSearch(''); }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-[var(--color-gold)]/5 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center shrink-0">
                      <User size={14} className="text-text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{c.name}</p>
                      <div className="text-xs text-text-tertiary flex flex-wrap gap-2">
                        {c.phone && <span>{c.phone}</span>}
                        <span>{c.loyaltyPoints ?? 0} pts</span>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredCustomers.length === 0 && (
                  <p className="text-center text-sm text-text-tertiary py-6">No customers found</p>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4">
              <button
                onClick={() => setShowNewCustomer(true)}
                className="w-full py-2.5 rounded-2xl border-2 border-dashed border-border-default text-[var(--color-gold)] font-semibold text-sm hover:bg-[var(--color-gold)]/5 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> New Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variant Selector Modal */}
      {!!selectedVariantItem && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-xl rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">{selectedVariantItem?.name || ''}</h2>
                <p className="text-sm text-text-secondary mt-1">Choose your options for this item.</p>
              </div>
              <button onClick={closeVariantSelector} className="shrink-0 rounded-2xl border border-border-subtle px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-raised transition-colors">Close</button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              {selectedVariantItem && (
                <div className="space-y-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-surface-base p-4">
                    <div>
                      <p className="text-xs text-text-secondary">Base price</p>
                      <p className="text-lg font-semibold text-text-primary">{formatCurrency(Number(selectedVariantItem.price))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Your selection</p>
                      <p className="text-lg font-semibold text-[var(--color-gold)]">{formatCurrency(Number((Number(selectedVariantItem.price) + getOptionAdjustment(selectedVariantItem, selectedOptions)).toFixed(2)))}</p>
                    </div>
                  </div>
                  {selectedVariantItem.options?.map((option) => {
                    const selected = selectedOptions.find((s) => s.optionId === option.id);
                    const selectedValues = selected?.values || [];
                    return (
                      <div key={option.id} className="space-y-3 rounded-3xl border border-border-default bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-text-primary">{option.name}</p>
                            <p className="text-xs text-text-secondary">{option.required ? 'Required' : 'Optional'} • {option.multiple ? 'Pick multiple' : 'Pick one'}</p>
                          </div>
                          {selectedValues.length > 0 && (
                            <span className="rounded-full bg-[var(--color-gold)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-gold)]">
                              {selectedValues.length} selected
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {option.values.map((value) => {
                            const isSelected = selectedValues.includes(value.id);
                            return (
                              <button
                                key={value.id}
                                type="button"
                                onClick={() => toggleSelectedOptionValue(option.id, value.id, option.multiple)}
                                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${isSelected ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/5 text-text-primary' : 'border-border-default bg-surface-raised text-text-secondary'}`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span>{value.label}</span>
                                  {value.priceAdjustment ? <span className="text-xs text-text-secondary">+{formatCurrency(value.priceAdjustment)}</span> : null}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4">
              <button
                type="button"
                onClick={confirmVariantSelection}
                disabled={!isVariantSelectionValid}
                className="w-full rounded-2xl bg-[var(--color-gold)] py-3.5 text-sm font-semibold text-white disabled:opacity-50 transition-all"
              >
                Add to cart{selectedVariantItem ? ` • ${formatCurrency(Number((Number(selectedVariantItem.price) + getOptionAdjustment(selectedVariantItem, selectedOptions)).toFixed(2)))}` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* New Customer (from POS) Modal */}
      {showNewCustomer && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-[60] flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] overflow-hidden flex flex-col">
            <div className="flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Add Customer</h2>
                <p className="text-sm text-text-secondary mt-1">Create a quick customer profile.</p>
              </div>
              <button onClick={() => { setShowNewCustomer(false); setNewCustomerName(''); setNewCustomerPhone(''); }} className="shrink-0 rounded-2xl border border-border-subtle px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-raised transition-colors">Close</button>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="text"
                value={newCustomerName}
                onChange={e => setNewCustomerName(e.target.value)}
                placeholder="Customer name *"
                className="h-12 w-full rounded-2xl border border-border-default bg-surface-input px-4 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
              />
              <input
                type="tel"
                value={newCustomerPhone}
                onChange={e => setNewCustomerPhone(e.target.value)}
                placeholder="Phone number (optional)"
                className="h-12 w-full rounded-2xl border border-border-default bg-surface-input px-4 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
              />
            </div>
            <div className="border-t border-border-subtle px-6 py-4 flex gap-3">
              <button
                onClick={() => { setShowNewCustomer(false); setNewCustomerName(''); setNewCustomerPhone(''); }}
                className="flex-1 py-3 rounded-2xl bg-surface-elevated text-text-secondary font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createCustomer}
                disabled={!newCustomerName.trim() || saving}
                className="flex-1 py-3 rounded-2xl bg-[var(--color-gold)] text-white font-semibold text-sm hover:brightness-110 disabled:opacity-40 transition-all flex items-center justify-center"
              >
                {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
