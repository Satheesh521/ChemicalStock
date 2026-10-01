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
import { chemicalService } from '@/services/chemicalService';
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
      // Use centralized service to get authoritative current_stock (computed from aggregates)
      const chems = await chemicalService.getChemicals();
      const mapped = (chems || []).map((c: any) => ({
        id: c.id,
        chemicalName: c.name || c.chemical_name || 'Unknown Chemical',
        current_stock: Number(c.current_stock) || 0,
        total_stock: Number(c.total_stock) || 0,
        min_threshold: Number(c.min_threshold) || 25,
        startDate: c.start_date,
        endDate: c.end_date,
      }));

      setItems(mapped);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Calculate alerts based on current_stock and min_threshold
  const alerts = useMemo(() => {
    const filtered = items.filter((c: any) =>
      searchQuery.trim() === '' || c.chemicalName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered
      .map((c: any) => {
        const current = Number(c.current_stock) || Number(c.total_stock) || 0;
        const threshold = Number(c.min_threshold) || 25;
        // Determine status
        let status: 'out' | 'low' | 'ok' = 'ok';
        if (current <= 0) status = 'out';
        else if (current > 0 && current <= threshold) status = 'low';

        return {
          id: c.id,
          chemicalName: c.chemicalName,
          remainingStock: current,
          min_threshold: threshold,
          startDate: c.startDate,
          endDate: c.endDate,
          status,
        };
      })
      .filter((a: any) => a.status === 'out' || a.status === 'low')
      .sort((a: any, b: any) => a.remainingStock - b.remainingStock);
  }, [items, searchQuery]);

  // Always display 3 decimal places per requirement
  const formatValue = (value: number | undefined): string => {
    if (value === undefined || value === null || isNaN(value)) return '0.000';
    return Number(value).toFixed(3);
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
          {item.chemicalName || 'Unknown Chemical'}
        </ThemedText>
        <ThemedText style={styles.cell}>
          {formatValue(item.remainingStock)} kg
        </ThemedText>
        <ThemedText style={[styles.cell, { textAlign: 'right' }]}>
          {item.status === 'out' ? '⛔ Out of Stock' : `⚠️ Low Stock (<= ${item.min_threshold} kg)`}
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
