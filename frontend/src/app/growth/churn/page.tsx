'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Bell, UserX } from 'lucide-react';

interface ChurnCustomer {
  id: string;
  name: string;
  phone: string;
  totalVisits: number;
  totalSpent: number;
  lastVisitAt: string;
}

export default function GrowthChurnPage() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<ChurnCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    get('/api/v1/growth/churn-risk', token)
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
        <Bell className="text-gold" /> Churn Risk
      </h1>
      <p className="text-sm text-text-secondary">
        Customers with 3+ visits who haven't returned in over 30 days
      </p>

      {customers.length === 0 ? (
        <div className="text-center py-12">
          <UserX size={48} className="mx-auto text-green-300 mb-3" />
          <p className="text-text-tertiary font-medium">No churn risk detected!</p>
          <p className="text-sm text-text-tertiary mt-1">All regular customers are active</p>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((c) => {
            const daysSince = Math.floor(
              (Date.now() - new Date(c.lastVisitAt).getTime()) / (1000 * 60 * 60 * 24),
            );
            return (
              <Card key={c.id} className="border-border-default">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-text-primary">{c.name}</h3>
                      <p className="text-xs text-text-secondary mt-0.5">{c.phone}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-text-secondary">
                        <span>{c.totalVisits} visits</span>
                        <span>Spent {formatCurrency(c.totalSpent)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-error">{daysSince}d</span>
                      <p className="text-xs text-text-tertiary">since last visit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
