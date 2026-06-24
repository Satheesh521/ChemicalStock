/**
 * BEFORE → AFTER: Dashboard Implementation Guide
 * 
 * Shows exactly how to fix your existing dashboard code patterns
 * 
 * File: app/(tabs)/index.tsx
 */

// ============================================
// ❌ BEFORE: Unsafe Code (CRASHES)
// ============================================

/* 
ISSUE 1: No null checks on Firebase data
ISSUE 2: .toLowerCase() on undefined property
ISSUE 3: parseFloat on nullable values
ISSUE 4: Rendering before data is loaded

export default function ChemicalListScreen() {
  const [chemicals, setChemicals] = useState([]);

  useEffect(() => {
    loadChemicals();
  }, []);

  const loadChemicals = async () => {
    // No error handling!
    const { data } = await supabase
      .from('chemicals')
      .select('*');
    
    // CAN CRASH: data might be null
    setChemicals(data);
  };

  // CAN CRASH: name might be undefined
  const filteredChemicals = useMemo(() => {
    return chemicals.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chemicals, searchQuery]);

  // CAN CRASH: current_stock might not be a number
  const renderChemicalItem = ({ item }) => (
    <Text>
      {item.name} - {item.current_stock.toFixed(2)} {item.unit}
    </Text>
  );

  return (
    <FlatList
      data={chemicals}
      renderItem={renderChemicalItem}
      keyExtractor={item => item.id}
    />
  );
}
*/

// ============================================
// ✅ AFTER: Safe Code (NO CRASHES)
// ============================================

import { supabase } from '@/lib/supabase';
import { formatStock } from '@/utils/stockCalculation';
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

// ==== STATE TYPES ====
interface Chemical {
  id: number | string;
  name?: string;
  quantity?: string | number;
  current_stock?: number;
  unit?: string;
  reorder_level?: number;
}

interface ScreenState {
  chemicals: Chemical[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  searchQuery: string;
}

// ==== SAFE HELPERS ====

/**
 * Safe property access with fallback
 */
function safeGet(obj, prop, defaultValue = null) {
  try {
    if (!obj || typeof obj !== 'object') return defaultValue;
    const value = obj[prop];
    return value !== null && value !== undefined ? value : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safe string lowercase with null check
 */
function safeLowercase(str) {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase();
}

// ==== MAIN COMPONENT ====
export default function ChemicalListScreen() {
  // State - all in one object for clarity
  const [state, setState] = useState<ScreenState>({
    chemicals: [],
    loading: true,
    error: null,
    refreshing: false,
    searchQuery: '',
  });

  // ========================================
  // EFFECT 1: Initial Load
  // ========================================
  useEffect(() => {
    let isMounted = true;

    const fetchChemicals = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        console.log('🔄 Fetching chemicals...');

        // STEP 1: Fetch with error handling
        const { data, error } = await supabase
          .from('chemicals')
          .select('*')
          .order('created_at', { ascending: false });

        // STEP 2: Check for DB error
        if (error) {
          console.error('❌ Database error:', error);
          if (isMounted) {
            setState(prev => ({
              ...prev,
              chemicals: [],
              error: error.message,
              loading: false,
            }));
          }
          return;
        }

        // STEP 3: Validate data is array
        if (!Array.isArray(data)) {
          console.error('❌ Invalid data:', data);
          if (isMounted) {
            setState(prev => ({
              ...prev,
              chemicals: [],
              error: 'Server returned invalid data',
              loading: false,
            }));
          }
          return;
        }

        // STEP 4: Filter valid items
        const validChemicals = data.filter(item => {
          // Must have id and name
          if (!item || !item.id || !item.name) {
            console.warn('⚠️ Skipping invalid item:', item);
            return false;
          }
          return true;
        });

        console.log(`✅ Loaded ${validChemicals.length}/${data.length} chemicals`);

        if (isMounted) {
          setState(prev => ({
            ...prev,
            chemicals: validChemicals,
            error: null,
            loading: false,
          }));
        }

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('❌ Exception:', err);

        if (isMounted) {
          setState(prev => ({
            ...prev,
            chemicals: [],
            error: `Error: ${msg}`,
            loading: false,
          }));
        }
      }
    };

    fetchChemicals();

    // Cleanup on unmount
    return () => {
      isMounted = false;
    };
  }, []);

  // ========================================
  // EFFECT 2: Refresh
  // ========================================
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

      const validChemicals = (data || []).filter(item => item && item.id && item.name);

      setState(prev => ({
        ...prev,
        chemicals: validChemicals,
        refreshing: false,
      }));

    } catch (err) {
      Alert.alert('Error', 'Failed to refresh');
      setState(prev => ({ ...prev, refreshing: false }));
    }
  };

  // ========================================
  // COMPUTE: Filtered list with safe access
  // ========================================
  const filteredChemicals = useMemo(() => {
    if (!state.chemicals || state.chemicals.length === 0) {
      return [];
    }

    let result = state.chemicals;

    // Apply search filter SAFELY
    if (state.searchQuery) {
      const query = safeLowercase(state.searchQuery);

      result = result.filter(item => {
        // SAFE: Get name with null check
        const name = safeLowercase(safeGet(item, 'name', ''));

        // SAFE: Comparison
        return name.includes(query);
      });
    }

    return result;
  }, [state.chemicals, state.searchQuery]);

  // ========================================
  // GUARD 1: Loading State
  // ========================================
  if (state.loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  // ========================================
  // GUARD 2: Error State
  // ========================================
  if (state.error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ fontSize: 14, color: '#dc3545', textAlign: 'center' }}>
          ❌ {state.error}
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          style={{
            marginTop: 15,
            backgroundColor: '#007bff',
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 5,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            🔄 Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ========================================
  // GUARD 3: Empty State
  // ========================================
  if (state.chemicals.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ fontSize: 14, color: '#999' }}>
          No chemicals found
        </Text>
      </View>
    );
  }

  // ========================================
  // GUARD 4: No Search Results
  // ========================================
  if (state.searchQuery && filteredChemicals.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ fontSize: 14, color: '#999' }}>
          No results for "{state.searchQuery}"
        </Text>
      </View>
    );
  }

  // ========================================
  // NOW SAFE TO RENDER
  // ========================================
  return (
    <View style={{ flex: 1 }}>
      {/* Search */}
      <TextInput
        placeholder="Search chemicals..."
        value={state.searchQuery}
        onChangeText={query =>
          setState(prev => ({ ...prev, searchQuery: query }))
        }
        style={styles.searchInput}
      />

      {/* List */}
      <FlatList
        data={filteredChemicals}
        renderItem={({ item }) => (
          <View style={styles.chemicalCard}>
            {/* Name - SAFE ACCESS */}
            <Text style={styles.chemicalName}>
              {safeGet(item, 'name', 'Unknown')}
            </Text>

            {/* Stock - SAFE FORMATTING */}
            <Text style={styles.stockText}>
              Stock: {formatStock(safeGet(item, 'current_stock', 0))}{' '}
              {safeGet(item, 'unit', 'kg')}
            </Text>

            {/* Reorder - SAFE FORMATTING */}
            <Text style={styles.reorderText}>
              Reorder: {formatStock(safeGet(item, 'reorder_level', 0))}{' '}
              {safeGet(item, 'unit', 'kg')}
            </Text>
          </View>
        )}
        keyExtractor={item => String(safeGet(item, 'id', Math.random()))}
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

// ========================================
// STYLES
// ========================================
const styles = StyleSheet.create({
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
    padding: 10,
    fontSize: 14,
  },
  chemicalCard: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 12,
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: 6,
  },
  chemicalName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  stockText: {
    fontSize: 12,
    color: '#28a745',
    marginBottom: 2,
  },
  reorderText: {
    fontSize: 12,
    color: '#666',
  },
});

/*
// ========================================
// COMPARISON: Key Fixes
// ========================================

BEFORE (UNSAFE):
❌ No loading/error states
❌ .toLowerCase() without null checks
❌ .toFixed() on undefined
❌ No data validation
❌ Can't recover from errors

AFTER (SAFE):
✅ Full loading/error/empty states
✅ Use safeGet() for property access
✅ Use formatStock() from utils
✅ Filter out invalid items on load
✅ Retry button for error recovery
✅ Search updates without crashing
✅ Numeric operations are safe
✅ All edge cases handled

CRASH PATTERNS FIXED:
1. name.toLowerCase() → safeLowercase(safeGet(item, 'name'))
2. current_stock.toFixed() → formatStock(safeGet(item, 'current_stock'))
3. No null array check → Validate data is array before use
4. No error handling → try/catch with user feedback
5. Render before load → Full loading/error guard states
*/
