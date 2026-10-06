import { useMemo, useState, useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { WantItem } from '@/components/want-form';

type StockOutItem = {
  id: string;
  chemicalName?: string;
  chemical_name?: string;
  stockValue?: string;
  stock_value?: string;
  stockUnit?: string;
  stock_unit?: string;
  dateOut?: string;
  date_out?: string;
  created_at?: string;
};

export type WantViewProps = {
  items: WantItem[];
  stockOutItems?: StockOutItem[];
  onSelectItem: (item: WantItem) => void;
  onDeleteItem: (id: string) => void;
  onDeleteStockOutItem?: (id: string) => void;
  formatDate: (d?: string) => string;
  onRefreshData?: () => Promise<void> | void;
};

export function WantView({
  items = [],
  stockOutItems = [],
  onSelectItem,
  onDeleteItem,
  onDeleteStockOutItem,
  formatDate,
  onRefreshData,
}: WantViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);
  const [activeTab, setActiveTab] = useState<'chemicals' | 'stockout'>('chemicals');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (onRefreshData) {
      await onRefreshData();
    } else {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    setRefreshing(false);
  }, [onRefreshData]);

  const getChemName = (item: any): string => {
    return (item?.chemicalName || item?.chemical_name || item?.name || '').trim();
  };

  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || !focusedInput) return [];
    const query = searchQuery.toLowerCase().trim();
    return items
      .filter(chemical => getChemName(chemical).toLowerCase().startsWith(query))
      .slice(0, 8);
  }, [searchQuery, items, focusedInput]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setShowSuggestions(text.trim().length > 0);
  };

  const handleSearchFocus = () => {
    setFocusedInput(true);
    if (searchQuery.trim().length > 0) setShowSuggestions(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      setFocusedInput(false);
      setShowSuggestions(false);
    }, 200);
  };

  const handleSelectSuggestion = (chemicalName: string) => {
    setSearchQuery(chemicalName);
    setShowSuggestions(false);
    setFocusedInput(false);
  };

  const formatStockValue = (value: number | undefined): string => {
    if (value === undefined || value === null || isNaN(value)) return '0.000';
    return Number(value).toFixed(3);
  };

  const filteredChemicals = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase().trim();
    return items.filter(item => getChemName(item).toLowerCase().startsWith(query));
  }, [items, searchQuery]);

  // ✅ FIXED: Database handles the stock updates, directly parse values without double-subtracting
  const chemicalsWithRemaining = useMemo(() => {
    return filteredChemicals.map((chemical: any) => {
      // original total stock setup when added
      const totalStockVal = parseFloat(chemical.totalStock ?? chemical.total_stock ?? chemical.total ?? '0') || 0;
      // current available stock directly from database
      const currentStockVal = parseFloat(chemical.currentStock ?? chemical.current_stock ?? chemical.remainingStock ?? totalStockVal) || 0;

      return {
        ...chemical,
        displayTotalStock: totalStockVal,
        remainingStock: formatStockValue(currentStockVal),
      };
    });
  }, [filteredChemicals]);

  const filteredStockOut = useMemo(() => {
    if (!searchQuery.trim()) return stockOutItems;
    const query = searchQuery.toLowerCase().trim();
    return stockOutItems.filter(item => getChemName(item).toLowerCase().startsWith(query));
  }, [stockOutItems, searchQuery]);

  const getStockOutWithRemaining = useMemo(() => {
    return filteredStockOut.map((stockOut: any) => {
      const kg = parseFloat(stockOut.stock_kg || stockOut.kg || '0') || 0;
      const g = parseFloat(stockOut.stock_g || stockOut.g || '0') || 0;
      const mg = parseFloat(stockOut.stock_mg || stockOut.mg || '0') || 0;

      let stockVal = parseFloat(stockOut.stockValue || stockOut.stock_value || '0');
      let unit = stockOut.stockUnit || stockOut.stock_unit || 'kg';

      if (stockVal === 0 && (kg > 0 || g > 0 || mg > 0)) {
        stockVal = kg + (g / 1000) + (mg / 1000000);
        unit = 'kg';
      }

      return {
        ...stockOut,
        displayStock: formatStockValue(stockVal),
        stockUnit: unit,
      };
    });
  }, [filteredStockOut]);

  const renderSearchBox = () => (
    <View style={styles.searchContainer}>
      <ThemedText type="title" style={styles.viewTitle}>
        Chemical Stock Maintenance
      </ThemedText>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chemicals' && styles.activeTab]}
          onPress={() => setActiveTab('chemicals')}>
          <ThemedText style={[styles.tabText, activeTab === 'chemicals' && styles.activeTabText]}>
            Chemicals
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stockout' && styles.activeTab]}
          onPress={() => setActiveTab('stockout')}>
          <ThemedText style={[styles.tabText, activeTab === 'stockout' && styles.activeTabText]}>
            Stock Out
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <View style={{ position: 'relative', flex: 1 }}>
          <TextInput
            placeholder="Search by chemical name..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            style={styles.searchInput}
            placeholderTextColor="#999"
          />
          {showSuggestions && searchSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={searchSuggestions}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSuggestion(getChemName(item))}
                  >
                    <ThemedText style={styles.suggestionText}>
                      {getChemName(item)}
                    </ThemedText>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.suggestionSeparator} />}
                style={styles.suggestionsList}
              />
            </View>
          )}
        </View>
        {searchQuery !== '' && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setShowSuggestions(false);
            }}
            style={styles.clearBtn}
          >
            <ThemedText style={styles.clearText}>✕</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {activeTab === 'chemicals' ? (
        <>
          <ThemedText style={styles.resultCount}>
            {chemicalsWithRemaining.length} {chemicalsWithRemaining.length === 1 ? 'item' : 'items'}
          </ThemedText>
          <ThemedView style={[styles.row, styles.headerRow]}>
            <ThemedText style={[styles.cell, { flex: 2 }]} type="subtitle">Chemical</ThemedText>
            <ThemedText style={styles.cell} type="subtitle">Total</ThemedText>
            <ThemedText style={styles.cell} type="subtitle">Current Stock</ThemedText>
          </ThemedView>
        </>
      ) : (
        <>
          <ThemedText style={styles.resultCount}>
            {getStockOutWithRemaining.length} {getStockOutWithRemaining.length === 1 ? 'item' : 'items'}
          </ThemedText>
          <ThemedView style={[styles.row, styles.headerRow]}>
            <ThemedText style={[styles.cell, { flex: 2 }]} type="subtitle">Chemical</ThemedText>
            <ThemedText style={styles.cell} type="subtitle">Stock Out</ThemedText>
            <ThemedText style={[styles.cell, { textAlign: 'right' }]} type="subtitle">Date</ThemedText>
          </ThemedView>
        </>
      )}
    </View>
  );

  const renderChemicalItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => onSelectItem(item)}>
      <ThemedView style={styles.row}>
        <ThemedText style={[styles.cell, { flex: 2 }]} type="defaultSemiBold">
          {getChemName(item) || 'N/A'}
        </ThemedText>
        <ThemedText style={styles.cell}>
          {item.displayTotalStock} kg
        </ThemedText>
        <ThemedText style={[
          styles.cell,
          {
            color: parseFloat(item.remainingStock) > 0 ? '#49d137' : '#ff4d4d',
            fontWeight: '600'
          }
        ]}>
          {item.remainingStock} kg
        </ThemedText>
        <TouchableOpacity onPress={() => onDeleteItem(item.id)} style={styles.deleteBtn}>
          <ThemedText style={styles.deleteText}>Del</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </TouchableOpacity>
  );

  const renderStockOutItem = ({ item }: { item: any }) => (
    <ThemedView style={styles.row}>
      <ThemedText style={[styles.cell, { flex: 2 }]} type="defaultSemiBold">
        {getChemName(item) || 'N/A'}
      </ThemedText>
      <ThemedText style={styles.cell}>
        {item.displayStock} {item.stockUnit}
      </ThemedText>
      <ThemedText style={[styles.cell, { textAlign: 'right', fontSize: 12, opacity: 0.7 }]}>
        {formatDate(item.date_out || item.dateOut || item.created_at)}
      </ThemedText>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDeleteStockOutItem ? onDeleteStockOutItem(item.id) : onDeleteItem(item.id)}
      >
        <ThemedText style={styles.deleteText}>Del</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  const data = activeTab === 'chemicals' ? chemicalsWithRemaining : getStockOutWithRemaining;
  const renderItem = activeTab === 'chemicals' ? renderChemicalItem : renderStockOutItem;

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={i => i.id}
        ListHeaderComponent={renderSearchBox()}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <ThemedView style={{ height: 1, backgroundColor: '#eee' }} />}
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#49d137']}
            tintColor="#49d137"
          />
        }
        ListEmptyComponent={
          <ThemedView style={styles.empty}>
            {(activeTab === 'chemicals' ? items.length : stockOutItems.length) === 0 ? (
              <ThemedText>
                {activeTab === 'chemicals' ? 'No chemicals added yet.' : 'No stock out records yet.'}
              </ThemedText>
            ) : (
              <ThemedText>No results matching "{searchQuery}"</ThemedText>
            )}
          </ThemedView>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchContainer: { padding: 16, backgroundColor: '#f5f5f5', justifyContent: 'center' },
  viewTitle: { color: '#49d137', marginBottom: 8 },
  tabContainer: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#49d137', borderRadius: 6, alignItems: 'center' },
  activeTab: { backgroundColor: '#49d137' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#49d137' },
  activeTabText: { color: '#fff' },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#49d137', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#f9f9f9' },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#000' },
  clearBtn: { paddingLeft: 8, paddingVertical: 8 },
  clearText: { fontSize: 18, color: '#999' },
  resultCount: { fontSize: 12, color: '#000', marginTop: 4 },
  suggestionsContainer: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#49d137', borderTopWidth: 0, borderRadius: 4, zIndex: 1000, maxHeight: 200, elevation: 5 },
  suggestionsList: { flexGrow: 0 },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  suggestionSeparator: { height: 1, backgroundColor: '#eee' },
  suggestionText: { fontSize: 14, color: '#333' },
  row: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0e3305', borderRadius: 6, marginVertical: 4, marginHorizontal: 4 },
  headerRow: { backgroundColor: '#051133', borderTopWidth: 1, borderColor: '#ddd', marginTop: 12, marginHorizontal: 0, borderRadius: 0 },
  cell: { flex: 1 },
  deleteBtn: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#ff4d4d', borderRadius: 4 },
  deleteText: { color: 'white' },
  empty: { padding: 32, alignItems: 'center', backgroundColor: '#f5f5f5' },
});