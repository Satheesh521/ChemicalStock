import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
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

export type UserRole = 'admin' | 'supervisor' | 'viewer';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
};

interface WantContextType {
  // Chemicals data
  items: WantItem[];
  addItem: (item: Omit<WantItem, 'id'>) => Promise<void>;
  updateItem: (id: string, item: Partial<WantItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  loading: boolean;

  // Stock outs data
  stockOutItems: StockOutItem[];
  addStockOut: (item: Omit<StockOutItem, 'id'>) => Promise<void>;
  updateStockOut: (id: string, item: Partial<StockOutItem>) => Promise<void>;
  deleteStockOut: (id: string) => Promise<void>;
  stockOutLoading: boolean;

  // User data
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authLoading: boolean;
}

const WantContext = createContext<WantContextType | undefined>(undefined);

export function WantProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WantItem[]>([]);
  const [stockOutItems, setStockOutItems] = useState<StockOutItem[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [stockOutLoading, setStockOutLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Initialize and fetch data
  useEffect(() => {
    initializeAuth();
    setupRealtimeSubscriptions();
    fetchChemicals();
    fetchStockOuts();
  }, []);

  // Initialize authentication
  const initializeAuth = async () => {
    try {
      setAuthLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      Alert.alert('Error', 'Failed to initialize authentication');
    } finally {
      setAuthLoading(false);
    }
  };

  // Fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) setUser(data);
    } catch (error) {
      console.error('Profile fetch error:', error);
      Alert.alert('Error', 'Failed to fetch user profile');
    }
  };

  // Setup real-time subscriptions
  const setupRealtimeSubscriptions = () => {
    // Chemicals real-time subscription
    const chemicalsChannel = supabase
      .channel('chemicals_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chemicals' },
        (payload) => {
          console.log('Chemicals change:', payload);
          fetchChemicals();
        }
      )
      .subscribe();

    // Stock outs real-time subscription
    const stockOutsChannel = supabase
      .channel('stock_outs_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stock_outs' },
        (payload) => {
          console.log('Stock outs change:', payload);
          fetchStockOuts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chemicalsChannel);
      supabase.removeChannel(stockOutsChannel);
    };
  };

  // Fetch chemicals
  const fetchChemicals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chemicals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData: WantItem[] = data.map(item => ({
        id: item.id,
        chemicalName: item.chemical_name,
        startDate: item.start_date,
        endDate: item.end_date,
        totalStock: item.total_stock,
      }));

      setItems(transformedData);
    } catch (error) {
      console.error('Chemicals fetch error:', error);
      Alert.alert('Error', 'Failed to fetch chemicals');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stock outs
  const fetchStockOuts = async () => {
    try {
      setStockOutLoading(true);
      const { data, error } = await supabase
        .from('stock_outs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData: StockOutItem[] = data.map(item => ({
        id: item.id,
        chemicalName: item.chemical_name,
        stockValue: item.stock_value,
        stockUnit: item.stock_unit,
        mcNo: item.mc_no,
        dateOut: item.date_out,
      }));

      setStockOutItems(transformedData);
    } catch (error) {
      console.error('Stock outs fetch error:', error);
      Alert.alert('Error', 'Failed to fetch stock outs');
    } finally {
      setStockOutLoading(false);
    }
  };

  // Add chemical
  const addItem = async (item: Omit<WantItem, 'id'>) => {
    if (!user) {
      Alert.alert('Error', 'Please login to add chemicals');
      return;
    }

    if (user.role !== 'admin') {
      Alert.alert('Permission Denied', 'Only admins can add chemicals');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('chemicals')
        .insert({
          chemical_name: item.chemicalName,
          total_stock: item.totalStock,
          start_date: item.startDate,
          end_date: item.endDate,
          created_by: user.id,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Add chemical error:', error);
      Alert.alert('Error', 'Failed to add chemical');
    } finally {
      setLoading(false);
    }
  };

  // Update chemical
  const updateItem = async (id: string, item: Partial<WantItem>) => {
    if (!user) {
      Alert.alert('Error', 'Please login to update chemicals');
      return;
    }

    if (user.role !== 'admin') {
      Alert.alert('Permission Denied', 'Only admins can update chemicals');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('chemicals')
        .update({
          chemical_name: item.chemicalName,
          total_stock: item.totalStock,
          start_date: item.startDate,
          end_date: item.endDate,
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Update chemical error:', error);
      Alert.alert('Error', 'Failed to update chemical');
    } finally {
      setLoading(false);
    }
  };

  // Delete chemical
  const deleteItem = async (id: string) => {
    if (!user) {
      Alert.alert('Error', 'Please login to delete chemicals');
      return;
    }

    if (user.role !== 'admin') {
      Alert.alert('Permission Denied', 'Only admins can delete chemicals');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('chemicals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete chemical error:', error);
      Alert.alert('Error', 'Failed to delete chemical');
    } finally {
      setLoading(false);
    }
  };

  // Add stock out
  const addStockOut = async (item: Omit<StockOutItem, 'id'>) => {
    if (!user) {
      Alert.alert('Error', 'Please login to add stock outs');
      return;
    }

    if (user.role === 'viewer') {
      Alert.alert('Permission Denied', 'Viewers cannot add stock outs');
      return;
    }

    try {
      setStockOutLoading(true);
      const { error } = await supabase
        .from('stock_outs')
        .insert({
          chemical_name: item.chemicalName,
          stock_value: item.stockValue,
          stock_unit: item.stockUnit,
          mc_no: item.mcNo,
          date_out: item.dateOut,
          added_by: user.id,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Add stock out error:', error);
      Alert.alert('Error', 'Failed to add stock out');
    } finally {
      setStockOutLoading(false);
    }
  };

  // Update stock out
  const updateStockOut = async (id: string, item: Partial<StockOutItem>) => {
    if (!user) {
      Alert.alert('Error', 'Please login to update stock outs');
      return;
    }

    if (user.role !== 'admin') {
      Alert.alert('Permission Denied', 'Only admins can update stock outs');
      return;
    }

    try {
      setStockOutLoading(true);
      const { error } = await supabase
        .from('stock_outs')
        .update({
          chemical_name: item.chemicalName,
          stock_value: item.stockValue,
          stock_unit: item.stockUnit,
          mc_no: item.mcNo,
          date_out: item.dateOut,
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Update stock out error:', error);
      Alert.alert('Error', 'Failed to update stock out');
    } finally {
      setStockOutLoading(false);
    }
  };

  // Delete stock out
  const deleteStockOut = async (id: string) => {
    if (!user) {
      Alert.alert('Error', 'Please login to delete stock outs');
      return;
    }

    if (user.role !== 'admin') {
      Alert.alert('Permission Denied', 'Only admins can delete stock outs');
      return;
    }

    try {
      setStockOutLoading(true);
      const { error } = await supabase
        .from('stock_outs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete stock out error:', error);
      Alert.alert('Error', 'Failed to delete stock out');
    } finally {
      setStockOutLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setAuthLoading(true);
      
      // Sign in with Supabase
      const { data: { user: authUser }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          Alert.alert('Error', 'Invalid email or password');
        } else {
          Alert.alert('Error', 'Authentication failed');
        }
        return;
      }

      if (!authUser) {
        Alert.alert('Error', 'Login failed');
        return;
      }

      // Fetch user profile
      await fetchUserProfile(authUser.id);
      
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Something went wrong, try again');
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const value: WantContextType = {
    // Chemicals
    items,
    addItem,
    updateItem,
    deleteItem,
    loading,

    // Stock outs
    stockOutItems,
    addStockOut,
    updateStockOut,
    deleteStockOut,
    stockOutLoading,

    // User
    user,
    setUser,
    login,
    logout,
    authLoading,
  };

  return (
    <WantContext.Provider value={value}>
      {children}
    </WantContext.Provider>
  );
}

export function useWant() {
  const context = useContext(WantContext);
  if (context === undefined) {
    throw new Error('useWant must be used within a WantProvider');
  }
  return context;
}
