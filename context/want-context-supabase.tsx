import { supabase } from '@/lib/supabase';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

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
};

type WantContextType = {
  items: WantItem[];
  addItem: (item: any) => Promise<void>;
  updateItem: (id: string, item: any) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  setItems: (items: WantItem[]) => void;
  isLoading: boolean;
  error: string | null;
  // Stock outs data
  stockOutItems: StockOutItem[];
  addStockOut: (item: any) => Promise<void>;
  updateStockOut: (id: string, item: any) => Promise<void>;
  deleteStockOut: (id: string) => Promise<void>;
  stockOutLoading: boolean;
};

const WantContext = createContext<WantContextType | undefined>(undefined);

export function WantProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WantItem[]>([]);
  const [stockOutItems, setStockOutItems] = useState<StockOutItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stockOutLoading, setStockOutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ FIXED: Fetch from WANT table (not chemicals)
  const fetchItems = useCallback(async (uid: string) => {
    try {
      const { data: wantData, error: wantError } = await supabase
        .from('want')  // ✅ WANT table use panrom
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (wantError) throw wantError;

      const wantItems: WantItem[] = (wantData || []).map(item => ({
        id: item.id,
        chemicalName: item.chemical_name,
        startDate: item.start_date || '',
        endDate: item.end_date || '',
        totalStock: item.total_stock?.toString() || '0',
      }));

      setItems(wantItems);
      setError(null);
    } catch (err: any) {
      console.error('Load Error:', err);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setUserId(null);
          setIsLoading(false);
          return;
        }
        setUserId(user.id);

        await fetchItems(user.id);
      } catch (err: any) {
        console.error('Init Error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [fetchItems]);

  // ✅ FIXED: Insert to WANT table
  const addItem = useCallback(async (data: any) => {
    if (!userId) throw new Error('User not authenticated');

    const { data: result, error } = await supabase
      .from('want')  // ✅ WANT table
      .insert([{
        user_id: userId,
        chemical_name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        total_stock: data.total_stock,
        unit: data.unit || 'kg',
        status: 'active',
      }])
      .select()
      .single();

    if (error) throw error;

    const newItem: WantItem = {
      id: result.id,
      chemicalName: result.chemical_name,
      startDate: result.start_date || '',
      endDate: result.end_date || '',
      totalStock: result.total_stock?.toString() || '0',
    };

    setItems(prev => [newItem, ...prev]);
  }, [userId]);

  // ✅ FIXED: Update WANT table
  const updateItem = useCallback(async (id: string, data: any) => {
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('want')  // ✅ WANT table
      .update({
        chemical_name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        total_stock: data.total_stock,
        unit: data.unit || 'kg',
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    setItems(prev => prev.map(i => i.id === id 
      ? { ...i, chemicalName: data.name, startDate: data.start_date, endDate: data.end_date, totalStock: data.total_stock.toString() }
      : i
    ));
  }, [userId]);

  // ✅ FIXED: Delete from WANT table
  const deleteItem = useCallback(async (id: string) => {
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('want')  // ✅ WANT table
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    setItems(prev => prev.filter(i => i.id !== id));
  }, [userId]);

  return (
    <WantContext.Provider value={{
      items,
      addItem,
      updateItem,
      deleteItem,
      setItems,
      isLoading,
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
