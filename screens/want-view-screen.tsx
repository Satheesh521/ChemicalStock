import { useCallback } from 'react';
import {
    Alert,
    StyleSheet
} from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { WantView } from '@/components/want-view';

export type WantItem = {
  id: string;
  chemicalName: string;
  startDate: string;
  endDate: string;
  totalStock: string;
};

export type WantViewScreenProps = {
  items: WantItem[];
  onSelectItem?: (item: WantItem) => void;
  onDeleteItem?: (id: string) => void;
  onItemsChange?: (items: WantItem[]) => void;
};

export default function WantViewScreen({
  items,
  onSelectItem,
  onDeleteItem,
  onItemsChange,
}: WantViewScreenProps) {
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
        onPress: () => {
          const updatedItems = items.filter(i => i.id !== id);
          onItemsChange?.(updatedItems);
          onDeleteItem?.(id);
        },
      },
    ]);
  }, [items, onDeleteItem, onItemsChange]);

  const handleSelectItem = useCallback((item: WantItem) => {
    onSelectItem?.(item);
  }, [onSelectItem]);

  return (
    <ThemedView style={styles.container}>
      <WantView
        items={items}
        onSelectItem={handleSelectItem}
        onDeleteItem={handleDeleteItem}
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
