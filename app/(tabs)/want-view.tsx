import { WantView } from '@/components/want-view';
import { supabase } from '@/lib/supabase';
import { stockOutService } from '@/services/stockOutService';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export default function WantViewScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [stockOutItems, setStockOutItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const chemicals = await stockOutService.getAllActiveChemicals();
      const mappedChemicals = (chemicals || []).map(c => ({
        id: c.id,
        chemicalName: c.name,
        totalStock: String(c.current_stock || 0),
      }));

      const outs = await stockOutService.getStockOuts();
      const mappedOuts = (outs || []).map((o: any) => ({
        id: o.id,
        chemical_name: o.chemical_name,
        stockValue: String(o.quantity || o.stock_kg || 0),
        stockUnit: o.unit || 'kg',
        dateOut: o.date_out,
        created_at: o.created_at,
      }));

      setItems(mappedChemicals);
      setStockOutItems(mappedOuts);
    } catch (error: any) {
      console.error('Failed to load WantView data', error);
      Alert.alert('Error', error?.message || 'Failed to load data');
      setItems([]);
      setStockOutItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Realtime subscription to stock_out changes to keep UI in sync
    let sub: any = null;
    try {
      sub = (supabase as any)
        .channel
        ? (supabase as any)
          .channel('public:stock_out')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_out' }, () => {
            fetchData();
          })
          .subscribe()
        : (supabase as any).from('stock_out').on('*', () => fetchData()).subscribe();
    } catch (e) {
      // best-effort fallback: poll every 10s
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }

    return () => {
      try {
        if (sub && sub.unsubscribe) sub.unsubscribe();
        if (sub && sub.remove) sub.remove();
      } catch (e) {
        // ignore
      }
    };
  }, [fetchData]);

  const handleDeleteItem = async (id: string) => {
    if (!id) {
      Alert.alert('Error', 'Invalid record id');
      return;
    }

    Alert.alert('Confirm', 'Delete this stock out record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await stockOutService.deleteStockOut(id);
            setStockOutItems(prev => prev.filter(i => i.id !== id));
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const handleSelectItem = (item: any) => {
    // Could open an edit/view modal in future
    console.log('Selected chemical', item);
  };

  const formatDate = (d?: string) => {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString();
  };

  return (
    <WantView
      items={items}
      stockOutItems={stockOutItems}
      onSelectItem={handleSelectItem}
      onDeleteItem={handleDeleteItem}
      formatDate={formatDate}
    />
  );
}