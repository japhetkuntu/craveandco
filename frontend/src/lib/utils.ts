import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const TECH_PATTERNS = [
  /property .+ should not exist/i,
  /must be a (string|number|boolean|array|integer|uuid)/i,
  /must be one of the following values/i,
  /should not be empty/i,
  /is not valid/i,
  /must be an? /i,
  /must match/i,
  /cannot be empty/i,
];

/** Convert a raw API error into a user-friendly message. */
export function friendlyError(status: number, message: unknown): string {
  if (status >= 500) return 'Something went wrong on our end. Please try again.';
  if (status === 401) return 'Please sign in to continue.';
  if (status === 403) return "You don't have permission to do this.";
  if (status === 404) return 'The requested item could not be found.';

  if (Array.isArray(message)) {
    const msgs = (message as unknown[]).map(String);
    if (msgs.every((m) => TECH_PATTERNS.some((p) => p.test(m)))) {
      if (msgs.some((m) => /property phone should not exist/i.test(m)) || msgs.some((m) => /property name should not exist/i.test(m))) {
        return 'Please submit a valid phone number and optional name.';
      }
      return 'Please check your details and try again.';
    }
    return msgs[0];
  }

  const msg = typeof message === 'string' ? message : String(message || '');
  if (TECH_PATTERNS.some((p) => p.test(msg))) {
    return 'Please check your details and try again.';
  }

  return msg || 'An unexpected error occurred.';
}

export function buildQueryString(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.append(key, String(value));
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export function formatCurrency(amount: number) {
  return `GH₵ ${amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString('en-GH', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function printPurchaseOrderInvoice(
  po: {
    id: string;
    supplier: { name: string };
    createdAt?: string;
    orderedAt?: string;
    receivedAt?: string;
    notes?: string;
    items: Array<{ ingredient?: { name: string }; quantity: number; unitCost: number }>;
    totalAmount: number;
    status?: string;
  },
  branchName?: string,
) {
  const createdAt = po.createdAt || po.orderedAt;
  const orderDate = new Date(createdAt || '').toLocaleDateString('en-GH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const orderTime = new Date(createdAt || '').toLocaleTimeString('en-GH', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const receivedAt = po.receivedAt
    ? new Date(po.receivedAt).toLocaleDateString('en-GH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : undefined;

  const itemsHtml = po.items.map((item) => {
    const name = item.ingredient?.name || 'Item';
    const lineTotal = item.quantity * item.unitCost;
    return `
      <tr>
        <td style="padding:10px;border:1px solid #e5e7eb;">${name}</td>
        <td style="padding:10px;border:1px solid #e5e7eb;text-align:right;">${item.quantity}</td>
        <td style="padding:10px;border:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.unitCost)}</td>
        <td style="padding:10px;border:1px solid #e5e7eb;text-align:right;">${formatCurrency(lineTotal)}</td>
      </tr>`;
  }).join('');

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Purchase Order Invoice</title>
  <style>
    body { font-family: Inter, system-ui, sans-serif; color: #111827; margin: 0; padding: 24px; background: #f8fafc; }
    .invoice { max-width: 800px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 24px; box-shadow: 0 20px 70px rgba(15, 23, 42, 0.08); }
    .header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; }
    .brand { font-size: 24px; font-weight: 800; letter-spacing: 0.04em; }
    .meta { text-align: right; }
    .meta p { margin: 0; font-size: 12px; color: #6b7280; }
    .section-title { margin: 24px 0 12px; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #6b7280; }
    .box { background: #f8fafc; border-radius: 16px; padding: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { padding: 12px 14px; border: 1px solid #e5e7eb; }
    th { background: #f8fafc; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; }
    td { font-size: 14px; }
    .total-row td { border-top: 2px solid #111827; font-weight: 700; }
    .small { font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <div class="brand">Crave & Co</div>
        <p class="small">Purchase Order Invoice</p>
      </div>
      <div class="meta">
        <p>PO #: ${po.id}</p>
        <p>Date: ${orderDate}</p>
        <p>Time: ${orderTime}</p>
        ${receivedAt ? `<p>Received: ${receivedAt}</p>` : ''}
        ${po.status ? `<p>Status: ${po.status}</p>` : ''}
      </div>
    </div>

    <div class="section-title">Supplier</div>
    <div class="box">
      <p style="margin:0;font-weight:700;">${po.supplier.name}</p>
    </div>

    <div class="section-title">Branch</div>
    <div class="box">
      <p style="margin:0;font-weight:700;">${branchName || 'Crave & Co Branch'}</p>
    </div>

    <div class="section-title">Items</div>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align:right;">Qty</th>
          <th style="text-align:right;">Unit Cost</th>
          <th style="text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="3" style="text-align:right;">Grand Total</td>
          <td style="text-align:right;">${formatCurrency(po.totalAmount)}</td>
        </tr>
      </tfoot>
    </table>

    ${po.notes ? `<div class="section-title">Notes</div><div class="box"><p style="margin:0;">${po.notes}</p></div>` : ''}

    <p class="small" style="margin-top:24px;">Generated by Crave & Co — for vendor compliance and internal records.</p>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
