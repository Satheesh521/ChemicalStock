import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  StyleSheet,
} from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { WantView } from '@/components/want-view';
import { supabase } from '@/lib/supabase';

export default function WantViewScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [stockOutItems, setStockOutItems] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [chemicalsData, stockOutData] = await Promise.all([
        supabase.from('chemicals').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('stock_out').select('*').eq('user_id', user.id)
      ]);

      if (chemicalsData.data) setItems(chemicalsData.data);
      if (stockOutData.data) setStockOutItems(stockOutData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Refresh data when tab is focused
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  // FIX: Delete UI Refresh Delay - Added user_id filtering and immediate state update
  const deleteItem = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      // Immediate local state update for instant UI refresh
      setItems(prev => prev.filter(item => item.id !== id));

      // Delete from Supabase with user_id filter for RLS compliance
      const { error } = await supabase.from('chemicals').delete().eq('id', id).eq('user_id', user.id);
      
      if (error) {
        // Revert local state if delete failed
        await fetchData();
        throw error;
      }

      // Re-fetch to ensure consistency
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      // FIX: Added Foreign Key constraint error handling
      if (error?.message?.includes('foreign key') || error?.code === '23503') {
        Alert.alert('Error', 'Cannot delete: This chemical has related stock records. Delete stock records first.');
      } else {
        Alert.alert('Error', error.message || 'Failed to delete');
      }
      await fetchData(); // Re-fetch on error to restore correct state
    }
  };

  // FIX: Delete UI Refresh Delay - Added user_id filtering, immediate state update, and Foreign Key error handling
  const deleteStockOut = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      // Immediate local state update for instant UI refresh
      setStockOutItems(prev => prev.filter(item => item.id !== id));

      // Delete from Supabase with user_id filter for RLS compliance
      const { error } = await supabase.from('stock_out').delete().eq('id', id).eq('user_id', user.id);
      
      if (error) {
        // Revert local state if delete failed
        await fetchData();
        throw error;
      }

      // Re-fetch to ensure consistency
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting stock out:', error);
      // FIX: Added Foreign Key constraint error handling
      if (error?.message?.includes('foreign key') || error?.code === '23503') {
        Alert.alert('Error', 'Cannot delete: This stock record has related data. Delete related records first.');
      } else {
        Alert.alert('Error', error.message || 'Failed to delete');
      }
      await fetchData(); // Re-fetch on error to restore correct state
    }
  };

  const formatDate = useCallback((d?: string) => {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString();
  }, []);

  // FIX: Delete UI Refresh Delay - Force immediate state filter and fetchData re-fetch
  const handleDeleteItem = useCallback((id: string) => {
    Alert.alert('Confirm', 'Delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(id);
            Alert.alert('Success', 'Entry deleted from Supabase ');
          } catch (error: any) {
            // Error is already handled in deleteItem with Foreign Key constraint check
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete';
            if (!errorMessage.includes('foreign key') && !errorMessage.includes('related')) {
              Alert.alert('Error', `Failed to delete: ${errorMessage}`);
            }
          }
        }, 
      },
    ]);
  }, [deleteItem]);

  // FIX: Delete UI Refresh Delay - Force immediate state filter and fetchData re-fetch
  const handleDeleteStockOut = useCallback((id: string) => {
    Alert.alert('Confirm', 'Delete this stock out record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteStockOut(id);
            Alert.alert('Success', 'Record deleted from Supabase ');
          } catch (error: any) {
            // Error is already handled in deleteStockOut with Foreign Key constraint check
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete';
            if (!errorMessage.includes('foreign key') && !errorMessage.includes('related')) {
              Alert.alert('Error', `Failed to delete: ${errorMessage}`);
            }
          }
        },
      },
    ]);
  }, [deleteStockOut]);

  const handleDelete = useCallback((id: string) => {
    // Check if this is a chemical or stock out item
    const isChemical = items.some(item => item.id === id);
    if (isChemical) {
      handleDeleteItem(id);
    } else {
      handleDeleteStockOut(id);
    }
  }, [items, handleDeleteItem, handleDeleteStockOut]);

  return (
    <ThemedView style={styles.container}>
      <WantView
        items={items}
        stockOutItems={stockOutItems}
        onSelectItem={() => {}}
        onDeleteItem={handleDelete}
        formatDate={formatDate}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
