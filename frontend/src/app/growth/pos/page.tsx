'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post, del, patch } from '@/lib/api';
import { formatCurrency, formatTime } from '@/lib/utils';
import {
  ShoppingCart, Plus, Minus, Trash2, CreditCard, Search,
  User, X, Check, ChevronRight, Receipt, Hash,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────── */

interface MenuItem {
  id: string;
  name: string;
  price: number;
  available: boolean;
  category: { id: string; name: string };
}

interface Category { id: string; name: string; }

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
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
  items: { id: string; menuItemId: string; menuItem: { name: string }; quantity: number; unitPrice: number; notes?: string }[];
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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loyaltyBalance, setLoyaltyBalance] = useState<number | null>(null);
  const [useLoyaltyDiscount, setUseLoyaltyDiscount] = useState(false);
  const [guestName, setGuestName] = useState('');
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

  /* ─── Data fetching ─── */

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [items, cats, pts, custs, orders] = await Promise.all([
        get('/api/v1/menu/items', token),
        get('/api/v1/menu/categories', token),
        get('/api/v1/growth/payment-types', token),
        get('/api/v1/customers', token),
        get('/api/v1/orders', token),
      ]);
      setMenuItems(items.filter((i: MenuItem) => i.available));
      setCategories(cats);
      setPaymentTypes(pts);
      setCustomers(custs);
      setOpenOrders(orders.filter((o: Order) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED'));
    } catch (err) {
      console.error('Failed to load POS data:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (view === 'pos' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
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

  /* ─── Cart operations ─── */

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id);
      if (existing) {
        return prev.map(c => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: Number(item.price), quantity: 1 }];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart(prev =>
      prev.map(c => {
        if (c.menuItemId !== menuItemId) return c;
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : c;
      }).filter(c => c.quantity > 0),
    );
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => prev.filter(c => c.menuItemId !== menuItemId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const discountRate = useLoyaltyDiscount ? 0.05 : 0;
  const discountedTotal = Number((cartTotal * (1 - discountRate)).toFixed(2));
  const discountAmount = Number((cartTotal - discountedTotal).toFixed(2));

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
    setCart(order.items.map(i => ({
      menuItemId: i.menuItemId,
      name: i.menuItem?.name || '',
      price: Number(i.unitPrice),
      quantity: i.quantity,
      notes: i.notes,
    })));
    setSelectedCustomer(order.customer || null);
    setGuestName(order.guestName || '');
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
        items: cart.map(c => ({ menuItemId: c.menuItemId, quantity: c.quantity, notes: c.notes })),
      }, token);
      setActiveOrderId(order.id);
      setCart([]);
      setSelectedCustomer(order.customer || selectedCustomer || null);
      setGuestName('');
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
      }, token);
      setShowPayment(false);
      setActiveOrderId(null);
      setCart([]);
      setReceiptReference('');
      setUseLoyaltyDiscount(false);
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

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone && c.phone.includes(customerSearch)),
  );

  /* ─── Render ─── */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(var(--vh,1vh)*100-5rem)] lg:min-h-[calc(var(--vh,1vh)*100-3rem)] flex flex-col min-h-0 pb-20 lg:pb-0">
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
        <div className="flex-1 overflow-y-auto py-4 lg:pb-0">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {openOrders.map(order => (
              <div
                key={order.id}
                className="bg-surface-raised rounded-2xl border border-border-subtle shadow-sm p-4 hover:shadow-md transition-all cursor-pointer"
                onClick={() => loadOrder(order)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-gold-muted text-gold text-[10px] font-bold px-2 py-0.5 rounded-full">
                      #{order.id.slice(-4).toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.status === 'NEW' ? 'bg-info-muted text-info'
                        : order.status === 'PREPARING' ? 'bg-amber-100 text-amber-700'
                        : order.status === 'READY' ? 'bg-success-muted text-success'
                        : 'bg-surface-elevated text-text-secondary'
                    }`}>
                      {order.status}
                    </span>
                    <span className="text-[10px] text-text-tertiary">
                      {order.channel.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs text-text-tertiary">{formatTime(order.createdAt)}</span>
                </div>
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
                    <span className="text-sm font-bold text-gold">{formatCurrency(Number(order.total))}</span>
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
                    onClick={() => addToCart(item)}
                    className={`relative flex min-h-[100px] sm:min-h-[115px] md:min-h-[125px] flex-col justify-between overflow-hidden bg-surface-raised rounded-[22px] border border-border-subtle p-3 sm:p-4 text-left transition-all duration-200 hover:border-gold hover:shadow-lg active:-translate-y-0.5 ${
                      inCart ? 'border-gold shadow-sm ring-1 ring-gold' : ''
                    }`}
                  >
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
                    <div key={item.menuItemId} className="flex items-center gap-2 px-4 py-2 hover:bg-surface-base transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-primary truncate">{item.name}</p>
                        <p className="text-[10px] text-text-tertiary">{formatCurrency(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.menuItemId, -1)}
                          className="w-6 h-6 rounded-lg bg-surface-elevated hover:bg-surface-elevated flex items-center justify-center transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-text-primary">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menuItemId, 1)}
                          className="w-6 h-6 rounded-lg bg-gold-muted hover:bg-gold-muted text-gold flex items-center justify-center transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <p className="text-xs font-bold text-text-primary w-16 text-right">{formatCurrency(item.price * item.quantity)}</p>
                      <button
                        onClick={() => removeFromCart(item.menuItemId)}
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
            <div className="border-t border-border-subtle px-4 py-3 space-y-2 bg-surface-base/50">
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

      {confirmAction && (
        <div className="fixed inset-0 bg-white/50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="bg-surface-raised rounded-t-3xl lg:rounded-3xl w-full lg:max-w-md p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Start new order</h2>
                <p className="text-sm text-text-secondary mt-1">
                  {confirmAction.type === 'discard' && 'Clear the current cart and begin a fresh order?'}
                  {confirmAction.type === 'loadOrder' && 'Load this open order? Your current cart will be replaced.'}
                  {confirmAction.type === 'cancelOrder' && 'Cancel this open order? This cannot be undone.'}
                </p>
              </div>
              <button onClick={() => setConfirmAction(null)} className="text-text-tertiary hover:text-text-secondary p-2">
                <X size={20} />
              </button>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-3 rounded-xl bg-surface-elevated text-text-secondary font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'discard') confirmDiscardOrder();
                  if (confirmAction.type === 'loadOrder') confirmLoadOrder();
                  if (confirmAction.type === 'cancelOrder') confirmCancelOrder();
                }}
                className="flex-1 py-3 rounded-xl bg-gold text-white font-semibold text-sm hover:bg-gold-dark"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Payment Modal ─── */}
      {showPayment && (
        <div className="fixed inset-0 bg-white/50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="bg-surface-raised rounded-t-3xl lg:rounded-3xl w-full lg:max-w-md max-h-[calc(var(--vh,1vh)*80)] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Select Payment</h2>
                <p className="text-sm text-text-tertiary mt-0.5">
                  Subtotal: {formatCurrency(cartTotal || 0)}
                  {useLoyaltyDiscount ? (
                    <>
                      <span className="block text-text-secondary">Discount: -{formatCurrency(discountAmount)}</span>
                      <span className="block text-success">Total: {formatCurrency(discountedTotal)}</span>
                    </>
                  ) : (
                    <span className="block text-text-secondary">Total: {formatCurrency(cartTotal || 0)}</span>
                  )}
                </p>
              </div>
              <button onClick={() => setShowPayment(false)} className="text-text-tertiary hover:text-text-secondary p-2">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 space-y-3 pb-4">
              <input
                type="text"
                value={receiptReference}
                onChange={(e) => setReceiptReference(e.target.value)}
                placeholder="Receipt link / reference (optional)"
                className="w-full px-4 py-3 rounded-2xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
              />
              <label className="flex items-center gap-3 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={printReceipt}
                  onChange={(e) => setPrintReceipt(e.target.checked)}
                  className="w-4 h-4 rounded border border-border-default text-gold focus:ring-gold"
                />
                Print receipt after payment
              </label>

              <div className="rounded-3xl border border-border-default bg-surface-base p-4 text-sm text-text-secondary">
                {selectedCustomer ? (
                  <>
                    <p className="font-semibold text-text-primary">Loyalty points</p>
                    <p>{loyaltyBalance ?? 0} points available for {selectedCustomer.name}</p>
                    {loyaltyBalance !== null && loyaltyBalance >= 100 ? (
                      <label className="flex items-center gap-3 mt-3">
                        <input
                          type="checkbox"
                          checked={useLoyaltyDiscount}
                          onChange={(e) => setUseLoyaltyDiscount(e.target.checked)}
                          className="w-4 h-4 rounded border border-border-default text-gold focus:ring-gold"
                        />
                        <span>
                          Redeem 100 points for 5% off this order
                          {useLoyaltyDiscount && (
                            <strong className="text-text-primary"> (save {formatCurrency(discountAmount)})</strong>
                          )}
                        </span>
                      </label>
                    ) : (
                      <p className="mt-2 text-xs text-text-tertiary">
                        {loyaltyBalance === null ? 'Loading loyalty balance...' : 'Customer needs at least 100 points to redeem.'}
                      </p>
                    )}
                  </>
                ) : (
                  <p>Select a customer to enable loyalty discounts.</p>
                )}
              </div>
            </div>
            <div className="px-6 pb-6 grid grid-cols-2 gap-3">
              {paymentTypes.map(pt => (
                <button
                  key={pt.id}
                  onClick={() => payOrder(pt)}
                  disabled={saving}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-border-subtle hover:border-gold hover:bg-gold-muted transition-all active:scale-95"
                >
                  <CreditCard size={24} className="text-gold" />
                  <span className="text-sm font-semibold text-text-primary">{pt.name}</span>
                </button>
              ))}
              {paymentTypes.length === 0 && (
                <div className="col-span-2 text-center py-8 text-text-tertiary text-sm">
                  No payment types configured.<br />Ask admin to set up payment types.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Customer Search Modal ─── */}
      {showCustomerSearch && (
        <div className="fixed inset-0 bg-white/50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="bg-surface-raised rounded-t-3xl lg:rounded-3xl w-full lg:max-w-md max-h-[calc(var(--vh,1vh)*80)] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
              <h2 className="text-lg font-bold text-text-primary">Select Customer</h2>
              <button onClick={() => { setShowCustomerSearch(false); setCustomerSearch(''); }} className="text-text-tertiary hover:text-text-secondary p-2">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 pb-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  autoFocus
                  type="text"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 space-y-1 pb-3">
              {filteredCustomers.slice(0, 20).map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCustomer(c); setShowCustomerSearch(false); setCustomerSearch(''); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gold-muted transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center">
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
            </div>
            <div className="px-6 pb-6 border-t border-border-subtle pt-3">
              <button
                onClick={() => setShowNewCustomer(true)}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-border-default text-gold font-semibold text-sm hover:bg-gold-muted transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> New Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── New Customer Modal ─── */}
      {showNewCustomer && (
        <div className="fixed inset-0 bg-white/50 z-[60] flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="bg-surface-raised rounded-t-3xl lg:rounded-3xl w-full lg:max-w-sm p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">New Customer</h2>
            <div className="space-y-3">
              <input
                autoFocus
                type="text"
                value={newCustomerName}
                onChange={e => setNewCustomerName(e.target.value)}
                placeholder="Customer name *"
                className="w-full px-4 py-2.5 rounded-xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
              />
              <input
                type="tel"
                value={newCustomerPhone}
                onChange={e => setNewCustomerPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full px-4 py-2.5 rounded-xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowNewCustomer(false); setNewCustomerName(''); setNewCustomerPhone(''); }}
                className="flex-1 py-2.5 rounded-xl bg-surface-elevated text-text-secondary font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createCustomer}
                disabled={!newCustomerName.trim() || saving}
                className="flex-1 py-2.5 rounded-xl bg-gold text-white font-semibold text-sm hover:bg-gold-dark disabled:opacity-40 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
