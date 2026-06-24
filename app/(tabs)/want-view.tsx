import { useCallback } from 'react';
import {
  Alert,
  StyleSheet,
} from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { WantView } from '@/components/want-view';
import { useWant } from '@/context/want-context-supabase';

export default function WantViewScreen() {
  const { items, deleteItem, stockOutItems, deleteStockOut } = useWant();

  const formatDate = useCallback((d?: string) => {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString();
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    Alert.alert('Confirm', 'Delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(id);
            Alert.alert('Success', 'Entry deleted from Supabase ✅');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete';
            Alert.alert('Error', `Failed to delete: ${errorMessage}`);
          }
        }, 
      },
    ]);
  }, [deleteItem]);

  const handleDeleteStockOut = useCallback((id: string) => {
    Alert.alert('Confirm', 'Delete this stock out record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteStockOut(id);
            Alert.alert('Success', 'Record deleted from Supabase ✅');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete';
            Alert.alert('Error', `Failed to delete: ${errorMessage}`);
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
