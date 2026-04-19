'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { Card, CardContent, CardActions } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, AlertTriangle, Send } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface LowStockItem {
  id: string;
  name: string;
  unit: string;
  onHand: number;
  reorderLevel: number;
  belowReorder?: boolean;
}

export default function KitchenStockPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!token) return;
    get(API_PATHS.inventory.lowStock, token)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const requestRestock = async (ingredientId: string, ingredient: string) => {
    if (!token) return;
    setRequesting(ingredientId);
    try {
      await post(API_PATHS.kitchen.shortageRequest, { ingredientId, reason: `Low stock: ${ingredient}` }, token);
      toast('success', 'Shortage request sent', `Shortage request sent for ${ingredient}.`);
    } catch (err) {
      console.error(err);
      toast('error', 'Could not send request', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setRequesting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Package className="text-gold" /> Stock Alerts
          </h1>
          <p className="text-sm text-text-secondary mt-1">Review low stock ingredients and request restock directly from the kitchen.</p>
        </div>
        {items.length > 0 && (
          <Button size="sm" variant="secondary" onClick={() => {
            items.forEach((item) => requestRestock(item.id, item.name));
          }}>
            <Send size={14} /> Request all
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-green-300 mb-3" />
          <p className="text-text-tertiary">All stock levels are good!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isLow = item.belowReorder ?? item.onHand < item.reorderLevel;
            return (
              <Card key={item.id} className="border-border-default">
                <CardContent className="px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-gold" />
                        <h3 className="text-base font-semibold text-text-primary">{item.name}</h3>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">
                        <span className={isLow ? 'font-bold text-error' : 'font-bold text-success'}>{item.onHand} {item.unit}</span>
                        {' '}remaining · reorder at {item.reorderLevel}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardActions className="px-4 pb-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => requestRestock(item.id, item.name)}
                    loading={requesting === item.id}
                    className="min-w-[110px]"
                    aria-label={`Request restock for ${item.name}`}
                  >
                    <Send size={14} /> Request
                  </Button>
                </CardActions>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
