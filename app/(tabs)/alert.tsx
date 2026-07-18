 import { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

export default function AlertScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [stockOutItems, setStockOutItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [chemicalsData, stockOutData] = await Promise.all([
        supabase.from('chemicals').select('*').eq('is_active', true),
        supabase.from('stock_out').select('*')
      ]);

      if (chemicalsData.data) setItems(chemicalsData.data);
      if (stockOutData.data) setStockOutItems(stockOutData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Calculate alerts for stock below 25kg threshold
  const alerts = useMemo(() => {
    const filteredItems = items.filter(chemical =>
      searchQuery.trim() === '' || chemical.chemicalName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return filteredItems
      .map(chemical => {
        const totalStock = parseFloat(chemical.totalStock) || 0;
        
        // Sum all stock outs for this chemical (convert all to kg for calculation)
        const totalStockOut = stockOutItems
          .filter(item => item.chemicalName.toLowerCase() === chemical.chemicalName.toLowerCase())
          .reduce((sum, item) => {
            const stockValue = parseFloat(item.stockValue) || 0;
            const unit = item.stockUnit;
            // Convert to kg for calculation
            if (unit === 'kg') return sum + stockValue;
            if (unit === 'g') return sum + (stockValue / 1000);
            if (unit === 'mg') return sum + (stockValue / 1000000);
            return sum;
          }, 0);
        
        const remainingStock = totalStock - totalStockOut;
        
        // Handle NaN and ensure valid number
        const safeRemainingStock = isNaN(remainingStock) ? 0 : remainingStock;
        
        // Alert threshold: 25kg
        const ALERT_THRESHOLD = 25;
        
        const hasAlert = safeRemainingStock < ALERT_THRESHOLD;
        
        return {
          id: chemical.id,
          chemicalName: chemical.chemicalName,
          totalStock,
          remainingStock: safeRemainingStock,
          startDate: chemical.startDate,
          endDate: chemical.endDate,
          hasAlert,
        };
      })
      .filter(alert => alert.hasAlert)
      .sort((a, b) => a.remainingStock - b.remainingStock); // Sort by lowest stock first
  }, [items, stockOutItems, searchQuery]);

  const formatValue = (value: number | undefined): string => {
    if (value === undefined || value === null || isNaN(value)) return '0';
    const formatted = value.toFixed(6).replace(/\.?0+$/, '');
    return formatted || '0';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <ThemedText type="defaultSemiBold" style={styles.navTitle}>
          Alerts: {alerts.length}
        </ThemedText>
      </View>

      <ThemedText type="title" style={styles.headerTitle}>
        Stock Alerts
      </ThemedText>

      {/* Search Box */}
      <View style={styles.searchBox}>
        <TextInput
          placeholder="Search by chemical name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          placeholderTextColor="#999"
        />
        {searchQuery !== '' && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearBtn}>
            <ThemedText style={styles.clearText}>✕</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <ThemedView style={[styles.row, styles.headerRow]}>
        <ThemedText style={[styles.cell, { flex: 2 }]} type="subtitle">
          Chemical
        </ThemedText>
        <ThemedText style={styles.cell} type="subtitle">
          Stock
        </ThemedText>
        <ThemedText style={[styles.cell, { textAlign: 'right' }]} type="subtitle">
          Status
        </ThemedText>
      </ThemedView>
    </View>
  );

  const renderAlertItem = ({ item }: { item: any }) => (
    <TouchableOpacity>
      <ThemedView style={styles.row}>
        <ThemedText style={[styles.cell, { flex: 2 }]} type="defaultSemiBold">
          {item.chemicalName}
        </ThemedText>
        <ThemedText style={styles.cell}>
          {formatValue(item.remainingStock)} kg
        </ThemedText>
        <ThemedText style={[styles.cell, { textAlign: 'right' }]}>
          🔴 Below 25kg
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderAlertItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader()}
        ItemSeparatorComponent={() => <ThemedView style={{ height: 1 }} />}
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyIcon}>✅</ThemedText>
            <ThemedText style={styles.emptyText}>All chemicals are well stocked!</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              No alerts at this time
            </ThemedText>
          </ThemedView>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    padding: 30,
    gap: 8,
    backgroundColor: '#f5f5f5',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#d3d3d3',
    marginBottom: 12,
  },
  navTitle: {
    fontSize: 14,
    color: '#d3d3d3',
  },
  headerTitle: {
    color: '#d3d3d3',
    marginBottom: 12,
  },
  listContent: {
    padding: 12,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0e3305',
    borderRadius: 6,
    marginVertical: 4,
  },
  headerRow: {
    borderTopWidth: 1,
    borderColor: '#ddd',
    marginTop: 12,
    backgroundColor: '#051133',
  },
  cell: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#49d137',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
  },
  clearBtn: {
    paddingLeft: 8,
    paddingVertical: 8,
  },
  clearText: {
    fontSize: 18,
    color: '#999',
  },
});
