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
import type { WantItem } from '@/components/want-form';
import type { StockOutItem } from '@/context/want-context-supabase';

export type WantViewProps = {
  items: WantItem[];
  stockOutItems?: StockOutItem[];
  onSelectItem: (item: WantItem) => void;
  onDeleteItem: (id: string) => void;
  formatDate: (d?: string) => string;
};

export function WantView({
  items,
  stockOutItems = [],
  onSelectItem,
  onDeleteItem,
  formatDate,
}: WantViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);
  const [activeTab, setActiveTab] = useState<'chemicals' | 'stockout'>('chemicals');

  // Search suggestions logic - Google-style search (starts with, not contains)
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || !focusedInput) {
      return [];
    }
    
    const query = searchQuery.toLowerCase().trim();
    return items
      .filter(chemical => 
        chemical.chemicalName.toLowerCase().startsWith(query)
      )
      .slice(0, 8); // Limit to 8 suggestions
  }, [searchQuery, items, focusedInput]);

  // Search input handlers
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setShowSuggestions(text.trim().length > 0);
  };

  const handleSearchFocus = () => {
    setFocusedInput(true);
    if (searchQuery.trim().length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleSearchBlur = () => {
    // Delay hiding suggestions to allow selection
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
  const calculateRemaining = (total: number, ...deductions: number[]): number => {
    // Convert to integers (multiply by 10000 for precision) to avoid floating point errors
    const factor = 10000;
    let result = Math.round(total * factor);
    
    for (const deduction of deductions) {
      result -= Math.round(deduction * factor);
    }
    
    // Convert back to decimal
    return result / factor;
  };

  // Format stock value to always show exactly 3 decimal places
  const formatStockValue = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0.000';
    return Number(value).toFixed(3);
  };

  // Convert unit to kg for calculations
  const convertUnitToKg = (value: number, unit: 'kg' | 'g' | 'mg'): number => {
    if (unit === 'kg') return value;
    if (unit === 'g') return value / 1000;
    if (unit === 'mg') return value / 1000000;
    return value;
  };

  // Convert kg to the target unit
  const convertKgToUnit = (kg: number, unit: 'kg' | 'g' | 'mg'): number => {
    if (unit === 'kg') return kg;
    if (unit === 'g') return kg * 1000;
    if (unit === 'mg') return kg * 1000000;
    return kg;
  };

  // Filter items based on search query - Google-style search (starts with, not contains)
  const filteredChemicals = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }

    const query = searchQuery.toLowerCase().trim();
    return items.filter(item =>
      item.chemicalName.toLowerCase().startsWith(query)
    );
  }, [items, searchQuery]);

  // Calculate remaining stock for chemicals tab (total - all stock outs)
  const chemicalsWithRemaining = useMemo(() => {
    return filteredChemicals.map((chemical: any) => {
      const totalStock = parseFloat(chemical.totalStock) || 0; // WantItem.totalStock is always plain kg
      
      // Sum all stock outs for this chemical (convert all to kg for calculation)
      const stockOuts = stockOutItems
        .filter(item => item.chemicalName.toLowerCase() === chemical.chemicalName.toLowerCase())
        .map(item => convertUnitToKg(parseFloat(item.stockValue), item.stockUnit));
      
      const totalStockOut = stockOuts.reduce((sum, val) => sum + val, 0);
      const remainingStock = calculateRemaining(totalStock, totalStockOut);
      
      // Handle NaN and ensure valid number
      const safeRemainingStock = isNaN(remainingStock) ? 0 : remainingStock;
      
      return {
        ...chemical,
        remainingStock: formatStockValue(safeRemainingStock),
        totalStockOut: formatStockValue(totalStockOut),
      };
    });
  }, [filteredChemicals, stockOutItems]);

  const filteredStockOut = useMemo(() => {
    if (!searchQuery.trim()) {
      return stockOutItems;
    }

    const query = searchQuery.toLowerCase().trim();
    return stockOutItems.filter(item =>
      item.chemicalName.toLowerCase().startsWith(query)
    );
  }, [stockOutItems, searchQuery]);

  // Calculate remaining stock for each stock out item (sum all stock outs for that chemical)
  const getStockOutWithRemaining = useMemo(() => {
    return filteredStockOut.map((stockOut: any) => {
      const matchingChemical = items.find(
        item => item.chemicalName.toLowerCase() === stockOut.chemicalName.toLowerCase()
      );
      const totalStock = matchingChemical ? parseFloat(matchingChemical.totalStock) : 0;
      
      // Sum all stock outs for this chemical name (convert all to kg for calculation)
      const stockOuts = stockOutItems
        .filter(item => item.chemicalName.toLowerCase() === stockOut.chemicalName.toLowerCase())
        .map(item => convertUnitToKg(parseFloat(item.stockValue), item.stockUnit));
      
      const totalStockOut = stockOuts.reduce((sum, val) => sum + val, 0);
      const remainingStockKg = calculateRemaining(totalStock, totalStockOut);
      
      // Convert remaining stock to the unit used in this stock out
      const remainingInUnit = convertKgToUnit(remainingStockKg, stockOut.stockUnit || 'kg');
      
      // Use the original stock out value (no conversion needed)
      const originalStockValue = parseFloat(stockOut.stockValue);
      
      return {
        ...stockOut,
        remainingStock: formatStockValue(remainingInUnit),
        displayStock: formatStockValue(originalStockValue),
        stockUnit: stockOut.stockUnit,
      };
    });
  }, [filteredStockOut, items, stockOutItems]);

  const renderSearchBox = () => (
    <View style={styles.searchContainer}>
      <ThemedText type="title" style={styles.viewTitle}>
        Chemical Stock Maintains
      </ThemedText>
      
      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chemicals' && styles.activeTab]}
          onPress={() => setActiveTab('chemicals')}>
          <ThemedText
            style={[styles.tabText, activeTab === 'chemicals' && styles.activeTabText]}>
            Chemicals
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stockout' && styles.activeTab]}
          onPress={() => setActiveTab('stockout')}>
          <ThemedText
            style={[styles.tabText, activeTab === 'stockout' && styles.activeTabText]}>
            Stock Out
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <View style={{ position: 'relative' }}>
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
                    onPress={() => handleSelectSuggestion(item.chemicalName)}
                  >
                    <ThemedText style={styles.suggestionText}>
                      {item.chemicalName}
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

      {activeTab === 'chemicals' && (
        <>
          <ThemedText style={styles.resultCount}>
            {chemicalsWithRemaining.length} {chemicalsWithRemaining.length === 1 ? 'item' : 'items'}
          </ThemedText>

          {/* Column headers for Chemicals */}
          <ThemedView style={[styles.row, styles.headerRow]}>
            <ThemedText style={[styles.cell, { flex: 2 }]} type="subtitle">
              Chemical
            </ThemedText>
            <ThemedText style={styles.cell} type="subtitle">
              Total
            </ThemedText>
            <ThemedText style={styles.cell} type="subtitle">
              Current Stock
            </ThemedText>
          </ThemedView>
        </>
      )}

      {activeTab === 'stockout' && (
        <>
          <ThemedText style={styles.resultCount}>
            {getStockOutWithRemaining.length} {getStockOutWithRemaining.length === 1 ? 'item' : 'items'}
          </ThemedText>

          {/* Column headers for Stock Out */}
          <ThemedView style={[styles.row, styles.headerRow]}>
            <ThemedText style={[styles.cell, { flex: 2 }]} type="subtitle">
              Chemical
            </ThemedText>
            <ThemedText style={styles.cell} type="subtitle">
              Stock Out
            </ThemedText>
            <ThemedText style={[styles.cell, { textAlign: 'right' }]} type="subtitle">
              Date
            </ThemedText>
          </ThemedView>
        </>
      )}
    </View>
  );

  const renderChemicalItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => onSelectItem(item)}>
      <ThemedView style={styles.row}>
        <ThemedText style={[styles.cell, { flex: 2 }]} type="defaultSemiBold">
          {item.chemicalName}
        </ThemedText>
        <ThemedText style={styles.cell}>
          {item.totalStock} kg
        </ThemedText>
        <ThemedText style={[
          styles.cell, 
          { 
            color: parseFloat(item.remainingStock) > 0 ? '#49d137' : parseFloat(item.remainingStock) === parseFloat(item.totalStock) ? '#000' : '#ff4d4d',
            fontWeight: '600'
          }
        ]}>
          {item.remainingStock} kg
        </ThemedText>
        <TouchableOpacity
          onPress={() => onDeleteItem(item.id)}
          style={styles.deleteBtn}>
          <ThemedText style={styles.deleteText}>Del</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </TouchableOpacity>
  );

  const renderStockOutItem = ({ item }: { item: any }) => (
    <ThemedView style={styles.row}>
      <ThemedText style={[styles.cell, { flex: 2 }]} type="defaultSemiBold">
        {item.chemicalName}
      </ThemedText>
      <ThemedText style={[
        styles.cell,
        (item.stockUnit || 'kg').toLowerCase() === 'mg' && {
          fontSize: 12,
          fontWeight: '700',
          color: '#ffffff',
          backgroundColor: 'rgba(0,0,0,0.3)',
          paddingHorizontal: 4,
          paddingVertical: 2,
          borderRadius: 4
        }
      ]}>
        {item.displayStock || formatStockValue(parseFloat(item.stockValue))} {(item.stockUnit || 'kg').toLowerCase()}
      </ThemedText>
      <ThemedText style={[styles.cell, { textAlign: 'right', fontSize: 12, opacity: 0.7 }]}>
        {formatDate(item.dateOut)}
      </ThemedText>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDeleteItem(item.id)}>
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
        ListEmptyComponent={
          <ThemedView style={styles.empty}>
            {(activeTab === 'chemicals' ? items.length : stockOutItems.length) === 0 ? (
              <ThemedText>
                {activeTab === 'chemicals'
                  ? 'No chemicals added yet.'
                  : 'No stock out records yet.'}
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  viewTitle: {
    color: '#49d137',
    marginBottom: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#49d137',
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#49d137',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#49d137',
  },
  activeTabText: {
    color: '#fff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#49d137',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
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
  resultCount: {
    fontSize: 12,
    color: '#000',
    marginTop: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#49d137',
    borderTopWidth: 0,
    borderRadius: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 1000,
    maxHeight: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionsList: {
    flexGrow: 0,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  suggestionSeparator: {
    height: 1,
    backgroundColor: '#eee',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
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
    marginHorizontal: 4,
  },
  headerRow: {
    backgroundColor: '#051133',
    borderTopWidth: 1,
    borderColor: '#ddd',
    marginTop: 12,
    marginHorizontal: 0,
    borderRadius: 0,
  },
  cell: {
    flex: 1,
  },
  deleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ff4d4d',
    borderRadius: 4,
  },
  deleteText: {
    color: 'white',
  },
  empty: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
