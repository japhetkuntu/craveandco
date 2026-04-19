'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PaginationControls } from '@/components/ui/pagination';
import { ClipboardList } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface PrepItem {
  menuItemId: string;
  menuItem: string;
  totalQuantity: number;
}

export default function KitchenPrepPage() {
  const { token } = useAuth();
  const [prep, setPrep] = useState<PrepItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const { toast } = useToast();

  useEffect(() => {
    if (!token) return;
    const today = new Date().toISOString().split('T')[0];
    get(`/api/v1/kitchen/prep-list${buildQueryString({ date: today, page, limit })}`, token)
      .then(setPrep)
      .catch((err) => {
        console.error(err);
        toast('error', 'Unable to load prep list', err instanceof Error ? err.message : 'Please try again.');
      })
      .finally(() => setLoading(false));
  }, [token, page, limit, toast]);

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
        <ClipboardList className="text-gold" /> Prep List
      </h1>
      <p className="text-sm text-text-secondary">
        {new Date().toLocaleDateString('en-GH', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      {prep.length === 0 ? (
        <p className="text-center text-text-tertiary py-12">No prep items for today</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {prep.map((item) => (
                <div
                  key={item.menuItemId}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="text-sm font-medium text-text-primary">{item.menuItem}</span>
                  <span className="text-lg font-bold text-gold">
                    ×{item.totalQuantity}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="px-4 pb-4">
            <PaginationControls
              page={page}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(value) => { setLimit(value); setPage(0); }}
              hasMore={prep.length === limit}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
