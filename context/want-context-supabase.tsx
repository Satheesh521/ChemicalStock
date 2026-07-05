// @ts-nocheck
// context/want-context-supabase.tsx
import { supabase } from '@/lib/supabase';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

// ✅ App Types
export type WantItem = {
  id: string;
  chemicalName: string;
  startDate: string;
  endDate: string;
  totalStock: string;
};

export type StockOutItem = {
  id: string;
  chemicalName: string;
  stockValue: string;
  stockUnit: 'kg' | 'g' | 'mg';
  mcNo: string;
  dateOut: string;
  timestamp?: string;
};

type WantContextType = {
  items: WantItem[];
  stockOutItems: StockOutItem[];
  addItem: (item: any) => Promise<void>;
  updateItem: (id: string, item: any) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  setItems: (items: WantItem[]) => void;

  addStockOut: (item: any) => Promise<void>;
  updateStockOut: (id: string, item: any) => Promise<void>;
  deleteStockOut: (id: string) => Promise<void>;

  isLoading: boolean;
  stockOutLoading: boolean;
  error: string | null;
};

const WantContext = createContext<WantContextType | undefined>(undefined);

export function WantProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WantItem[]>([]);
  const [stockOutItems, setStockOutItems] = useState<StockOutItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stockOutLoading, setStockOutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const mapWantRow = (item: any): WantItem => ({
    id: item.id,
    chemicalName: item.chemical_name,
    startDate: item.start_date || '',
    endDate: item.end_date || '',
    totalStock: item.total_stock?.toString() || '0',
  });

  const mapStockOutRow = (item: any): StockOutItem => ({
    id: item.id,
    chemicalName: item.chemical_name,
    stockValue: (item.stock_kg || 0).toString(),
    stockUnit: 'kg',
    mcNo: item.mc_no || '',
    dateOut: item.date_out,
    timestamp: item.timestamp,
  });

  const fetchItems = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('want')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems((data || []).map(mapWantRow));
    } catch (err: any) {
      console.error('Load Want Items Error:', err);
      setError(err.message);
    }
  }, []);

  const fetchStockOuts = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('stock_out')                    // FIXED
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setStockOutItems((data || []).map(mapStockOutRow));
    } catch (err: any) {
      console.error('Load Stock Outs Error:', err);
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);
        await Promise.all([fetchItems(user.id), fetchStockOuts(user.id)]);
      } catch (err: any) {
        console.error('Init Error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initializeData();
  }, [fetchItems, fetchStockOuts]);

  // Want Item functions (unchanged)
  const addItem = useCallback(async (data: any) => { /* ... same as before */ }, [userId]);
  const updateItem = useCallback(async (id: string, data: any) => { /* ... same */ }, [userId]);
  const deleteItem = useCallback(async (id: string) => { /* ... same */ }, [userId]);

  // STOCK OUT FUNCTIONS - FIXED
  const addStockOut = useCallback(async (item: any) => {
    if (!userId) throw new Error('User not authenticated');
    
    const insertData = {
      chemical_name: item.chemicalName,
      stock_kg: parseFloat(item.stockValue) || 0,
      stock_g: 0,
      stock_mg: 0,
      mc_no: item.machineNo || item.mcNo,
      date_out: item.dateOut,
      timestamp: item.timestamp,
      user_id: userId,
      performed_by: userId,
    };

    const { data, error } = await supabase
      .from('stock_out')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Insert Error:", error);
      throw error;
    }
    
    const newItem = mapStockOutRow(data);
    setStockOutItems(prev => [newItem, ...prev]);
  }, [userId]);

  const updateStockOut = useCallback(async (id: string, item: any) => {
    if (!userId) throw new Error('User not authenticated');
    const { error } = await supabase
      .from('stock_out')
      .update(item)
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
    setStockOutItems(prev => prev.map(i => i.id === id ? { ...i, ...item } : i));
  }, [userId]);

  const deleteStockOut = useCallback(async (id: string) => {
    if (!userId) throw new Error('User not authenticated');
    const { error } = await supabase
      .from('stock_out')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
    setStockOutItems(prev => prev.filter(i => i.id !== id));
  }, [userId]);

  return (
    <WantContext.Provider value={{
      items,
      stockOutItems,
      addItem,
      updateItem,
      deleteItem,
      setItems,
      addStockOut,
      updateStockOut,
      deleteStockOut,
      isLoading,
      stockOutLoading,
      error,
    }}>
      {children}
    </WantContext.Provider>
  );
}

export function useWant() {
  const context = useContext(WantContext);
  if (!context) throw new Error('useWant must be used within WantProvider');
  return context;
}