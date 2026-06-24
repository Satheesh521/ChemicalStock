/**
 * Safe Dashboard Template
 * 
 * Copy this pattern to all your screens that fetch data from Supabase/Firebase
 * Handles: loading, error, null data, type validation, safe property access
 * 
 * Usage: Use this as a reference for your index.tsx in (tabs) folder
 */

import { supabase } from '@/lib/supabase';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// ============================================
// TYPE DEFINITIONS - Keep them safe!
// ============================================

interface Chemical {
  id: number | string;
  name?: string;
  quantity?: string | number;
  current_stock?: number;
  unit?: string;
  reorder_level?: number;
  created_at?: string;
  [key: string]: any; // Catch unexpected fields
}

interface DashboardState {
  chemicals: Chemical[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  searchQuery: string;
}

// ============================================
// UTILITY FUNCTIONS - Safe helpers
// ============================================

/**
 * SAFE: Parse a value to float with fallback
 */
function safeParseFloat(value: any, defaultValue: number = 0): number {
  try {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    
    if (isNaN(num) || !isFinite(num)) {
      return defaultValue;
    }
    
    return num;
  } catch (err) {
    console.warn('⚠️ Error parsing value:', value, err);
    return defaultValue;
  }
}

/**
 * SAFE: Format stock value for display
 */
function safeFormatStock(value: any, decimals: number = 2): string {
  try {
    const num = safeParseFloat(value, 0);
    return num.toFixed(decimals);
  } catch (err) {
    console.error('❌ Format error:', err);
    return '0.00';
  }
}

/**
 * SAFE: Get string property with fallback
 */
function safeGetString(obj: any, prop: string, defaultValue: string = 'Unknown'): string {
  try {
    if (!obj || typeof obj !== 'object') {
      return defaultValue;
    }
    
    const value = obj[prop];
    
    if (value === null || value === undefined) {
      return defaultValue;
    }
    
    return String(value).trim();
  } catch (err) {
    console.warn(`⚠️ Error accessing ${prop}:`, err);
    return defaultValue;
  }
}

/**
 * SAFE: Validate chemical object
 */
function isValidChemical(item: any): item is Chemical {
  if (!item || typeof item !== 'object') {
    return false;
  }

  // Check required fields
  if (!item.id || !item.name) {
    console.warn('⚠️ Invalid chemical - missing id or name:', item);
    return false;
  }

  return true;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function SafeDashboard() {
  // =============
  // STATE
  // =============
  const [state, setState] = useState<DashboardState>({
    chemicals: [],
    loading: true,
    error: null,
    refreshing: false,
    searchQuery: '',
  });

  // =============
  // EFFECT: Initial Load
  // =============
  useEffect(() => {
    const initializeData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        console.log('🔄 Fetching chemicals from Supabase...');

        const { data, error } = await supabase
          .from('chemicals')
          .select('*')
          .order('created_at', { ascending: false });

        // CHECK 1: Database error?
        if (error) {
          console.error('❌ Database error:', error);
          setState(prev => ({
            ...prev,
            chemicals: [],
            error: `Database error: ${error.message}`,
            loading: false,
          }));
          return;
        }

        // CHECK 2: Data is valid array?
        if (!Array.isArray(data)) {
          console.error('❌ Unexpected data format:', typeof data);
          setState(prev => ({
            ...prev,
            chemicals: [],
            error: 'Server returned invalid data format',
            loading: false,
          }));
          return;
        }

        // CHECK 3: Filter valid chemicals only
        const validChemicals = data
          .filter((item, index) => {
            if (!isValidChemical(item)) {
              console.warn(`⚠️ Skipping invalid item at index ${index}`);
              return false;
            }
            return true;
          })
          .map(item => ({
            ...item,
            // Normalize problematic fields
            quantity: item.quantity ?? 0,
            current_stock: item.current_stock ?? 0,
            unit: item.unit ?? 'kg',
          }));

        console.log(`✅ Loaded ${validChemicals.length}/${data.length} valid chemicals`);

        setState(prev => ({
          ...prev,
          chemicals: validChemicals,
          error: null,
          loading: false,
        }));

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('❌ Exception during initialization:', err);

        setState(prev => ({
          ...prev,
          chemicals: [],
          error: `Exception: ${errorMsg}`,
          loading: false,
        }));
      }
    };

    initializeData();
  }, []);

  // =============
  // EFFECT: Refresh
  // =============
  const onRefresh = async () => {
    try {
      setState(prev => ({ ...prev, refreshing: true }));

      const { data, error } = await supabase
        .from('chemicals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        Alert.alert('Refresh Failed', error.message);
        setState(prev => ({ ...prev, refreshing: false }));
        return;
      }

      const validChemicals = (data || []).filter(isValidChemical);

      setState(prev => ({
        ...prev,
        chemicals: validChemicals,
        refreshing: false,
      }));

    } catch (err) {
      Alert.alert('Error', 'Failed to refresh data');
      setState(prev => ({ ...prev, refreshing: false }));
    }
  };

  // =============
  // COMPUTE: Filtered list
  // =============
  const filteredChemicals = useMemo(() => {
    let filtered = state.chemicals;

    if (state.searchQuery && state.chemicals.length > 0) {
      const query = state.searchQuery.toLowerCase();

      filtered = filtered.filter(item => {
        const name = safeGetString(item, 'name', '').toLowerCase();
        return name.includes(query);
      });
    }

    return filtered;
  }, [state.chemicals, state.searchQuery]);

  // =============
  // GUARD 1: Loading
  // =============
  if (state.loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 12, color: '#666', fontSize: 14 }}>
          Loading chemicals...
        </Text>
      </View>
    );
  }

  // =============
  // GUARD 2: Error
  // =============
  if (state.error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#dc3545', textAlign: 'center' }}>
          ❌ {state.error}
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          style={{
            marginTop: 20,
            backgroundColor: '#007bff',
            paddingHorizontal: 24,
            paddingVertical: 10,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            🔄 Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // =============
  // GUARD 3: No data
  // =============
  if (state.chemicals.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ fontSize: 14, color: '#999', textAlign: 'center' }}>
          📦 No chemicals in database yet
        </Text>
        <Text style={{ fontSize: 12, color: '#bbb', textAlign: 'center', marginTop: 8 }}>
          Add your first chemical to get started
        </Text>
      </View>
    );
  }

  // =============
  // GUARD 4: No search results
  // =============
  if (state.searchQuery && filteredChemicals.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ fontSize: 14, color: '#999', textAlign: 'center' }}>
          No results for "{state.searchQuery}"
        </Text>
      </View>
    );
  }

  // =============
  // NOW SAFE: Render data
  // =============
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        placeholder="Search by name..."
        value={state.searchQuery}
        onChangeText={query =>
          setState(prev => ({ ...prev, searchQuery: query }))
        }
        style={styles.searchInput}
      />

      {/* Chemical List */}
      <FlatList
        data={filteredChemicals}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.chemicalCard}>
            <View style={styles.chemicalHeader}>
              <Text style={styles.chemicalName}>
                {safeGetString(item, 'name')}
              </Text>
              <Text style={styles.chemicalUnit}>
                {safeGetString(item, 'unit')}
              </Text>
            </View>

            <View style={styles.chemicalBody}>
              <Text style={styles.stockValue}>
                Current: {safeFormatStock(item.current_stock)} {safeGetString(item, 'unit')}
              </Text>

              <Text style={styles.reorderValue}>
                Reorder: {safeFormatStock(item.reorder_level)} {safeGetString(item, 'unit')}
              </Text>
            </View>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={onRefresh}
          />
        }
      />
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  searchInput: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
  },
  chemicalCard: {
    backgroundColor: 'white',
    marginHorizontal: 12,
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
    elevation: 1,
  },
  chemicalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chemicalName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  chemicalUnit: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chemicalBody: {
    gap: 4,
  },
  stockValue: {
    fontSize: 13,
    color: '#28a745',
    fontWeight: '600',
  },
  reorderValue: {
    fontSize: 12,
    color: '#666',
  },
});
