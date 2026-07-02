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

// ✅ App Types (used in components)
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

  // ✅ Helper: Convert DB row to WantItem
  const mapWantRow = (item: any): WantItem => ({
    id: item.id,
    chemicalName: item.chemical_name,
    startDate: item.start_date || '',
    endDate: item.end_date || '',
    totalStock: item.total_stock?.toString() || '0',
  });

  // ✅ Helper: Convert DB row to StockOutItem
  const mapStockOutRow = (item: any): StockOutItem => ({
    id: item.id,
    chemicalName: item.chemical_name,
    stockValue: item.stock_value?.toString() || '0',
    stockUnit: item.stock_unit,
    mcNo: item.mc_no,
    dateOut: item.date_out,
    timestamp: item.timestamp,
  });

  // Fetch Want Items
  const fetchItems = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('want')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const wantItems: WantItem[] = (data || []).map(mapWantRow);
      setItems(wantItems);
    } catch (err: any) {
      console.error('Load Want Items Error:', err);
      setError(err.message);
    }
  }, []);

  // Fetch Stock Outs
  const fetchStockOuts = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('stock_outs')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mappedItems: StockOutItem[] = (data || []).map(mapStockOutRow);
      setStockOutItems(mappedItems);
    } catch (err: any) {
      console.error('Load Stock Outs Error:', err);
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setUserId(null);
          return;
        }
        setUserId(user.id);
        await Promise.all([fetchItems(user.id), fetchStockOuts(user.id)]);
      } catch (err: any) {
        console.error('Init Error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    initializeData();
  }, [fetchItems, fetchStockOuts]);

  // ==================== WANT ITEM FUNCTIONS ====================
  const addItem = useCallback(async (data: any) => {
    if (!userId) throw new Error('User not authenticated');
    
    const insertData = {
      user_id: userId,
      chemical_name: data.name || data.chemicalName,
      start_date: data.start_date,
      end_date: data.end_date,
      total_stock: data.total_stock,
      unit: data.unit || 'kg',
      status: 'active',
    };

    const { data: result, error } = await supabase
      .from('want')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    const newItem = mapWantRow(result);
    setItems(prev => [newItem, ...prev]);
  }, [userId]);

  const updateItem = useCallback(async (id: string, data: any) => {
    if (!userId) throw new Error('User not authenticated');
    
    const updateData = {
      chemical_name: data.name || data.chemicalName,
      start_date: data.start_date,
      end_date: data.end_date,
      total_stock: data.total_stock,
      unit: data.unit || 'kg',
    };

    const { error } = await supabase
      .from('want')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    setItems(prev => prev.map(i =>
      i.id === id
        ? { ...i, ...data, chemicalName: data.name || data.chemicalName }
        : i
    ));
  }, [userId]);

  const deleteItem = useCallback(async (id: string) => {
    if (!userId) throw new Error('User not authenticated');
    const { error } = await supabase
      .from('want')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    setItems(prev => prev.filter(i => i.id !== id));
  }, [userId]);

  // ==================== STOCK OUT FUNCTIONS ====================
  const addStockOut = useCallback(async (item: any) => {
    if (!userId) throw new Error('User not authenticated');
    
    const insertData = {
      ...item,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('stock_outs')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    
    const newItem = mapStockOutRow(data);
    setStockOutItems(prev => [newItem, ...prev]);
  }, [userId]);

  const updateStockOut = useCallback(async (id: string, item: any) => {
    if (!userId) throw new Error('User not authenticated');
    const { error } = await supabase
      .from('stock_outs')
      .update(item)
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    setStockOutItems(prev => prev.map(i => i.id === id ? { ...i, ...item } : i));
  }, [userId]);

  const deleteStockOut = useCallback(async (id: string) => {
    if (!userId) throw new Error('User not authenticated');
    const { error } = await supabase
      .from('stock_outs')
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
// Mr.sk
