import { ReactNode } from 'react';
import {
  LayoutDashboard,
  ChefHat,
  ShoppingCart,
  Package,
  Users,
  Clock,
  Receipt,
  BarChart3,
  Bell,
  Megaphone,
  HeartHandshake,
  Truck,
  Utensils,
  ClipboardList,
  TrendingUp,
  MessageSquare,
  Settings,
  Tag,
  Star,
  Briefcase,
  UserPlus,
  Building2,
  Sparkles,
} from 'lucide-react';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

export const API_PATHS = {
  auth: {
    login: '/api/v1/auth/login',
    refresh: '/api/v1/auth/refresh',
    logout: '/api/v1/auth/logout',
  },
  owner: {
    dashboard: '/api/v1/owner/dashboard',
    approvalsPending: '/api/v1/owner/approvals/pending',
    approve: (id: string) => `/api/v1/owner/approvals/${id}/approve`,
    reject: (id: string) => `/api/v1/owner/approvals/${id}/reject`,
  },
  kitchen: {
    liveOrders: '/api/v1/kitchen/orders/live',
    stationLoad: '/api/v1/kitchen/station-load',
    updateOrderStatus: (orderId: string) => `/api/v1/kitchen/orders/${orderId}/status`,
    prepList: (date: string) => `/api/v1/kitchen/prep-list?date=${date}`,
    shortageRequest: '/api/v1/kitchen/shortage-requests',
    wasteLogs: '/api/v1/kitchen/waste-logs',
    handoverNotes: '/api/v1/kitchen/handover-notes',
  },
  ops: {
    commandCenter: (date: string) => `/api/v1/ops/command-center?date=${date}`,
    serviceTimeline: (date: string) => `/api/v1/ops/service-timeline?date=${date}`,
    dayClose: '/api/v1/ops/day-close',
    dayCloseSummary: (date: string) => `/api/v1/ops/day-close-summary?date=${date}`,
    checklists: '/api/v1/ops/checklists',
    checklistsHistory: '/api/v1/ops/checklists/history',
  },
  orders: {
    list: (statusOrParams?: string | { status?: string; channel?: string; paymentMethod?: string; from?: string; to?: string; search?: string }) => {
      const params = typeof statusOrParams === 'string' ? { status: statusOrParams } : statusOrParams || {};
      const query = new URLSearchParams();
      if (params.status) query.append('status', params.status);
      if (params.channel) query.append('channel', params.channel);
      if (params.paymentMethod) query.append('paymentMethod', params.paymentMethod);
      if (params.from) query.append('from', params.from);
      if (params.to) query.append('to', params.to);
      if (params.search) query.append('search', params.search);
      const queryString = query.toString();
      return `/api/v1/orders${queryString ? `?${queryString}` : ''}`;
    },
    updateStatus: (orderId: string) => `/api/v1/orders/${orderId}/status`,
  },
  menu: {
    items: '/api/v1/menu/items',
    categories: '/api/v1/menu/categories',
    toggleItem: (id: string) => `/api/v1/menu/items/${id}/toggle`,
    recipeItems: (itemId: string) => `/api/v1/menu/items/${itemId}/recipe-items`,
    recipeItem: (itemId: string, recipeId: string) => `/api/v1/menu/items/${itemId}/recipe-items/${recipeId}`,
    recipeImportSources: (itemId: string) => `/api/v1/menu/items/${itemId}/recipe-items/import-sources`,
    importRecipeItems: (itemId: string) => `/api/v1/menu/items/${itemId}/recipe-items/import`,
  },
  raffle: {
    requestOtp: '/api/v1/public/raffle/request-otp',
    verify: '/api/v1/public/raffle/verify',
    spin: '/api/v1/public/raffle/spin',
  },
  raffleAdmin: {
    entries: (page: number, limit: number, search?: string) => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      return `/api/v1/raffle/entries?${params.toString()}`;
    },
    stats: '/api/v1/raffle/stats',
    redeem: (spinId: string) => `/api/v1/raffle/spins/${spinId}/redeem`,
    unredeem: (spinId: string) => `/api/v1/raffle/spins/${spinId}/unredeem`,
    resolve: (code: string) => `/api/v1/raffle/resolve/${encodeURIComponent(code)}`,
  },
  inventory: {
    stock: '/api/v1/inventory/stock',
    lowStock: '/api/v1/inventory/alerts/low-stock',
    movements: '/api/v1/inventory/movements',
    ingredients: '/api/v1/inventory/ingredients',
    ingredient: (id: string) => `/api/v1/inventory/ingredients/${id}`,
  },
  finance: {
    dailySummary: (date: string) => `/api/v1/finance/daily-summary?date=${date}`,
    expenses: '/api/v1/expenses',
  },
  staff: {
    shifts: (weekStart: string) => `/api/v1/shifts?weekStart=${weekStart}`,
    attendance: (date: string) => `/api/v1/attendance?date=${date}`,
    clockIn: '/api/v1/attendance/clock-in',
    clockOut: '/api/v1/attendance/clock-out',
  },
  reports: {
    dashboard: (date: string) => `/api/v1/reports/dashboard?date=${date}`,
    dashboardRange: (from: string, to: string) => `/api/v1/reports/dashboard?from=${from}&to=${to}`,
    weekly: (weekStart: string) => `/api/v1/reports/weekly?weekStart=${weekStart}`,
    summary: (period: string, date: string) => `/api/v1/reports/summary?period=${period}&date=${date}`,
    summaryRange: (from: string, to: string) => `/api/v1/reports/summary?from=${from}&to=${to}`,
  },
  alerts: {
    list: '/api/v1/alerts',
    summary: '/api/v1/alerts/summary',
    acknowledge: (id: string) => `/api/v1/alerts/${id}/acknowledge`,
    resolve: (id: string) => `/api/v1/alerts/${id}/resolve`,
  },
  campaigns: {
    list: '/api/v1/campaigns',
    create: '/api/v1/campaigns',
    launch: (id: string) => `/api/v1/campaigns/${id}/launch`,
  },
  customers: {
    list: '/api/v1/customers',
    dashboard: '/api/v1/customers/dashboard',
    upcomingBirthdays: '/api/v1/customers/upcoming-birthdays',
    insights: (id: string) => `/api/v1/customers/${encodeURIComponent(id)}/insights`,
  },
  loyalty: {
    summary: '/api/v1/loyalty/summary',
    transactions: '/api/v1/loyalty/transactions',
  },
  feedback: {
    list: '/api/v1/feedback/tickets',
    resolve: (id: string) => `/api/v1/feedback/tickets/${id}/resolve`,
  },
  purchasing: {
    orders: '/api/v1/purchase-orders',
    receive: (id: string) => `/api/v1/purchase-orders/${id}/receive`,
    suppliers: '/api/v1/suppliers',
  },
  growth: {
    dashboard: '/api/v1/growth/dashboard',
    churnRisk: '/api/v1/growth/churn-risk',
  },
  engagement: {
    daily: (date: string) => `/api/v1/engagement?date=${date}`,
    dailyPaged: (date: string, page: number, limit: number, search?: string) => {
      let url = `/api/v1/engagement?date=${date}&page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      return url;
    },
    upsert: (customerId: string) => `/api/v1/engagement/${customerId}`,
    analytics: (from: string, to: string) => `/api/v1/engagement/analytics?from=${from}&to=${to}`,
    dailySummary: (date: string) => `/api/v1/engagement/daily-summary?date=${date}`,
  },
  sales: {
    dashboard: (date: string) => `/api/v1/sales/dashboard?date=${date}`,
    logAcquisition: '/api/v1/sales/acquisitions',
    acquisitions: (date: string, page: number, limit: number) => `/api/v1/sales/acquisitions?date=${date}&page=${page}&limit=${limit}`,
    leads: (status?: string, page?: number, limit?: number) => {
      let url = `/api/v1/sales/leads?page=${page ?? 1}&limit=${limit ?? 20}`;
      if (status) url += `&status=${status}`;
      return url;
    },
    createLead: '/api/v1/sales/leads',
    updateLead: (id: string) => `/api/v1/sales/leads/${id}`,
    addInteraction: '/api/v1/sales/interactions',
    myTarget: (date: string) => `/api/v1/sales/targets/me?date=${date}`,
    branchTargets: (date: string) => `/api/v1/sales/targets?date=${date}`,
    analytics: (from: string, to: string) => `/api/v1/sales/analytics?from=${from}&to=${to}`,
    executives: '/api/v1/sales/executives',
    upsertTarget: '/api/v1/sales/targets',
    myWeeklyPlan: (weekStart?: string) => weekStart
      ? `/api/v1/sales/weekly-plan/me?weekStart=${weekStart}`
      : '/api/v1/sales/weekly-plan/me',
    upsertWeeklyPlan: '/api/v1/sales/weekly-plan',
    submitWeeklyPlan: (id: string) => `/api/v1/sales/weekly-plan/${id}/submit`,
    resubmitWeeklyPlan: (id: string) => `/api/v1/sales/weekly-plan/${id}/resubmit`,
    myWeeklyTask: (date: string) => `/api/v1/sales/weekly-tasks/me?date=${date}`,
    pendingWeeklyPlans: (weekStart?: string) => weekStart
      ? `/api/v1/sales/weekly-plans/pending?weekStart=${weekStart}`
      : '/api/v1/sales/weekly-plans/pending',
    approveWeeklyPlan: (id: string) => `/api/v1/sales/weekly-plans/${id}/approve`,
    rejectWeeklyPlan: (id: string) => `/api/v1/sales/weekly-plans/${id}/reject`,
  },
  promotions: {
    list: '/api/v1/promotions',
    active: '/api/v1/promotions/active',
    analytics: (from: string, to: string) => `/api/v1/promotions/analytics?from=${from}&to=${to}`,
    create: '/api/v1/promotions',
    update: (id: string) => `/api/v1/promotions/${id}`,
    activate: (id: string) => `/api/v1/promotions/${id}/activate`,
    pause: (id: string) => `/api/v1/promotions/${id}/pause`,
    deactivate: (id: string) => `/api/v1/promotions/${id}/deactivate`,
    delete: (id: string) => `/api/v1/promotions/${id}`,
  },
};

export const ROLE_DASHBOARD: Record<string, string> = {
  OWNER: '/owner',
  KITCHEN_STAFF: '/kitchen',
  OPERATIONS_MANAGER: '/ops',
  GROWTH_LEAD: '/growth',
  SALES_EXECUTIVE: '/sales',
};

export const ORDER_STATUSES = ['NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'] as const;
export const ORDER_STATUS_FILTERS = ['', ...ORDER_STATUSES] as const;

export const ORDER_STATUS_FLOW: Record<string, string> = {
  NEW: 'PREPARING',
  PREPARING: 'READY',
};

export const ORDER_GROUP_BY_OPTIONS = ['NONE', 'STATUS', 'CHANNEL', 'PAYMENT_METHOD', 'DATE'] as const;

export const ORDER_STATUS_TRANSITIONS: Record<string, string> = {
  NEW: 'PREPARING',
  PREPARING: 'READY',
  READY: 'COMPLETED',
};

export const ROLE_NAV_ITEMS: Record<string, { label: string; href: string; icon: React.ReactNode }[]> = {
  OWNER: [
    { label: 'Dashboard', href: '/owner', icon: <LayoutDashboard size={20} /> },
    { label: 'Orders', href: '/owner/orders', icon: <ShoppingCart size={20} /> },
    { label: 'Customers', href: '/owner/customers', icon: <Users size={20} /> },
    { label: 'Menu', href: '/owner/menu', icon: <Utensils size={20} /> },
    { label: 'Inventory', href: '/owner/inventory', icon: <Package size={20} /> },
    { label: 'Finance', href: '/owner/finance', icon: <Receipt size={20} /> },
    { label: 'Special Orders', href: '/ops/special-orders', icon: <Star size={20} /> },
    { label: 'Staff', href: '/owner/staff', icon: <Users size={20} /> },
    { label: 'Checklists', href: '/ops/checklists', icon: <ClipboardList size={20} /> },
    { label: 'Reports', href: '/owner/reports', icon: <BarChart3 size={20} /> },
    { label: 'Alerts', href: '/owner/alerts', icon: <Bell size={20} /> },
    { label: 'Promotions', href: '/owner/promotions', icon: <Tag size={20} /> },
    { label: 'Engagement', href: '/owner/engagement', icon: <HeartHandshake size={20} /> },
    { label: 'Sales', href: '/owner/sales', icon: <Briefcase size={20} /> },
    { label: 'Raffle', href: '/owner/raffle', icon: <Sparkles size={20} /> },
    { label: 'Settings', href: '/owner/settings', icon: <Settings size={20} /> },
  ],
  KITCHEN_STAFF: [
    { label: 'Live Board', href: '/kitchen', icon: <ChefHat size={20} /> },
    { label: 'Prep List', href: '/kitchen/prep', icon: <ClipboardList size={20} /> },
    { label: 'Stock Alerts', href: '/kitchen/stock', icon: <Package size={20} /> },
    { label: 'Waste Log', href: '/kitchen/waste', icon: <Receipt size={20} /> },
    { label: 'Handover', href: '/kitchen/handover', icon: <Clock size={20} /> },
    { label: 'Checklists', href: '/ops/checklists', icon: <ClipboardList size={20} /> },
  ],
  OPERATIONS_MANAGER: [
    { label: 'Command Center', href: '/ops', icon: <LayoutDashboard size={20} /> },
    { label: 'Orders', href: '/ops/orders', icon: <ShoppingCart size={20} /> },
    { label: 'Inventory', href: '/ops/inventory', icon: <Package size={20} /> },
    { label: 'Purchasing', href: '/ops/purchasing', icon: <Truck size={20} /> },
    { label: 'Special Orders', href: '/ops/special-orders', icon: <Star size={20} /> },
    { label: 'Expenses', href: '/ops/expenses', icon: <Receipt size={20} /> },
    { label: 'Staff', href: '/ops/staff', icon: <Users size={20} /> },
    { label: 'Alerts', href: '/ops/alerts', icon: <Bell size={20} /> },
    { label: 'Checklists', href: '/ops/checklists', icon: <ClipboardList size={20} /> },
    { label: 'Day Close', href: '/ops/day-close', icon: <Clock size={20} /> },
  ],
  GROWTH_LEAD: [
    { label: 'Dashboard', href: '/growth', icon: <TrendingUp size={20} /> },
    { label: 'POS', href: '/growth/pos', icon: <ShoppingCart size={20} /> },
    { label: 'Customers', href: '/growth/customers', icon: <Users size={20} /> },
    { label: 'Engagement', href: '/growth/engagement', icon: <HeartHandshake size={20} /> },
    { label: 'Special Orders', href: '/growth/special-orders', icon: <Star size={20} /> },
    { label: 'Campaigns', href: '/growth/campaigns', icon: <Megaphone size={20} /> },
    { label: 'Loyalty', href: '/growth/loyalty', icon: <HeartHandshake size={20} /> },
    { label: 'Promotions', href: '/growth/promotions', icon: <Tag size={20} /> },
    { label: 'Feedback', href: '/growth/feedback', icon: <MessageSquare size={20} /> },
    { label: 'Churn Risk', href: '/growth/churn', icon: <Bell size={20} /> },
    { label: 'Raffle', href: '/growth/raffle', icon: <Sparkles size={20} /> },
    { label: 'Checklists', href: '/ops/checklists', icon: <ClipboardList size={20} /> },
  ],
  SALES_EXECUTIVE: [
    { label: 'Dashboard', href: '/sales', icon: <LayoutDashboard size={20} /> },
    { label: 'Customers', href: '/sales/customers', icon: <UserPlus size={20} /> },
    { label: 'Businesses', href: '/sales/businesses', icon: <Building2 size={20} /> },
    { label: 'POS', href: '/growth/pos', icon: <ShoppingCart size={20} /> },
  ],
};
