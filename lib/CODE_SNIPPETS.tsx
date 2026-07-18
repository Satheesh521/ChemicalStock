/**
 * PRACTICAL CODE SNIPPETS
 * Copy-paste ready code for common chemical inventory operations
 * Each snippet is self-contained and production-ready
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useChemicalData } from '@/lib/useChemicalData';
import type {
  Chemical,
  StockIn,
  StockOut,
  CreateStockInInput,
  CreateStockOutInput,
} from '@/lib/types';

// ============================================================================
// SNIPPET 1: SIMPLE CHEMICAL LIST COMPONENT
// ============================================================================

/*
Use this to display all chemicals with basic info.

Usage:
<ChemicalListSimple onSelectChemical={handleSelect} />
*/

export function ChemicalListSimple({ onSelectChemical }: { onSelectChemical: (id: string) => void }) {
  const { chemicals, loadChemicals, chemicalState } = useChemicalData();

  useEffect(() => {
    loadChemicals();
  }, [loadChemicals]);

  if (chemicalState.loading) {
    return <ActivityIndicator size="large" color="#007AFF" />;
  }

  if (chemicalState.error) {
    return (
      <View style={{ padding: 20, backgroundColor: '#FFEBEE', borderRadius: 8 }}>
        <Text style={{ color: '#C62828' }}>Error: {chemicalState.error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={chemicals}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => onSelectChemical(item.id)}
          style={{
            padding: 15,
            borderBottomWidth: 1,
            borderBottomColor: '#EEE',
            backgroundColor: item.current_stock <= item.min_threshold ? '#FFF3E0' : '#FFF',
          }}
        >
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.chemical_name}</Text>
          <Text style={{ color: '#666', fontSize: 12 }}>{item.chemical_formula}</Text>
          <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text>Stock: {item.current_stock} {item.unit}</Text>
            {item.current_stock <= item.min_threshold && (
              <Text style={{ color: '#FF6B6B', fontWeight: 'bold' }}>⚠️ Low</Text>
            )}
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

// ============================================================================
// SNIPPET 2: STOCK IN FORM
// ============================================================================

/*
Self-contained form component for recording stock in.

Usage:
<StockInFormComponent chemicalId={selectedChemicalId} onSuccess={handleSuccess} />
*/

interface StockInFormProps {
  chemicalId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function StockInFormComponent({ chemicalId, onSuccess, onCancel }: StockInFormProps) {
  const { recordStockIn, transactionState } = useChemicalData();
  const [form, setForm] = useState<CreateStockInInput>({
    chemical_id: chemicalId,
    quantity: 0,
    unit: 'mL',
    supplier: '',
    purpose: '',
    department: '',
    requested_by: '',
    approved_by: undefined,
  });

  const handleSubmit = async () => {
    if (!form.quantity || !form.supplier) {
      Alert.alert('Validation', 'Please fill in all required fields');
      return;
    }

    try {
      await recordStockIn(form);
      Alert.alert('Success', 'Stock in recorded');
      onSuccess?.();
    } catch (error) {
      Alert.alert('Error', String(error));
    }
  };

  return (
    <ScrollView style={{ padding: 15 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 15 }}>Record Stock In</Text>

      <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Quantity *</Text>
      <TextInput
        placeholder="Enter quantity"
        keyboardType="decimal-pad"
        value={String(form.quantity)}
        onChangeText={text => setForm({ ...form, quantity: parseFloat(text) || 0 })}
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
        }}
      />

      <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Unit</Text>
      <TextInput
        value={form.unit}
        onChangeText={text => setForm({ ...form, unit: text })}
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
        }}
      />

      <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Supplier *</Text>
      <TextInput
        placeholder="Supplier name"
        value={form.supplier}
        onChangeText={text => setForm({ ...form, supplier: text })}
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
        }}
      />

      <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Purpose</Text>
      <TextInput
        placeholder="Purpose of purchase"
        value={form.purpose}
        onChangeText={text => setForm({ ...form, purpose: text })}
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
        }}
      />

      <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Department</Text>
      <TextInput
        placeholder="Department"
        value={form.department}
        onChangeText={text => setForm({ ...form, department: text })}
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
        }}
      />

      <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Requested By</Text>
      <TextInput
        placeholder="Your name"
        value={form.requested_by}
        onChangeText={text => setForm({ ...form, requested_by: text })}
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
        }}
      />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={transactionState.loading}
          style={{
            flex: 1,
            backgroundColor: transactionState.loading ? '#CCC' : '#4CAF50',
            padding: 12,
            borderRadius: 5,
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold', textAlign: 'center' }}>
            {transactionState.loading ? 'Saving...' : 'Save Stock In'}
          </Text>
        </TouchableOpacity>

        {onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            style={{
              flex: 1,
              backgroundColor: '#999',
              padding: 12,
              borderRadius: 5,
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: 'bold', textAlign: 'center' }}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {transactionState.error && (
        <Text style={{ color: '#C62828', marginTop: 10 }}>Error: {transactionState.error}</Text>
      )}
    </ScrollView>
  );
}

// ============================================================================
// SNIPPET 3: STOCK OUT FORM WITH VALIDATION
// ============================================================================

/*
Form component for recording stock out with real-time validation.

Usage:
<StockOutFormComponent chemicalId={selectedChemicalId} maxAvailable={100} />
*/

interface StockOutFormProps {
  chemicalId: string;
  maxAvailable: number;
  onSuccess?: () => void;
}

export function StockOutFormComponent({ chemicalId, maxAvailable, onSuccess }: StockOutFormProps) {
  const { recordStockOut, transactionState } = useChemicalData();
  const [form, setForm] = useState<CreateStockOutInput>({
    chemical_id: chemicalId,
    quantity: 0,
    unit: 'mL',
    purpose: '',
    department: '',
    requested_by: '',
    approved_by: undefined,
  });

  const quantityError =
    form.quantity > maxAvailable
      ? `Cannot withdraw ${form.quantity} units. Only ${maxAvailable} available.`
      : undefined;

  const handleSubmit = async () => {
    if (!form.quantity || !form.purpose) {
      Alert.alert('Validation', 'Please fill in required fields');
      return;
    }

    if (quantityError) {
      Alert.alert('Validation', quantityError);
      return;
    }

    try {
      await recordStockOut(form);
      Alert.alert('Success', 'Stock out recorded');
      onSuccess?.();
    } catch (error) {
      Alert.alert('Error', String(error));
    }
  };

  return (
    <ScrollView style={{ padding: 15 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Record Stock Out</Text>
      <Text style={{ color: '#666', marginBottom: 15 }}>
        Available: {maxAvailable} units
      </Text>

      <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Quantity *</Text>
      <TextInput
        placeholder="Enter quantity"
        keyboardType="decimal-pad"
        value={String(form.quantity)}
        onChangeText={text => setForm({ ...form, quantity: parseFloat(text) || 0 })}
        style={{
          borderWidth: quantityError ? 2 : 1,
          borderColor: quantityError ? '#FF6B6B' : '#DDD',
          padding: 10,
          marginBottom: 5,
          borderRadius: 5,
        }}
      />
      {quantityError && (
        <Text style={{ color: '#FF6B6B', fontSize: 12, marginBottom: 15 }}>
          ⚠️ {quantityError}
        </Text>
      )}

      <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Purpose *</Text>
      <TextInput
        placeholder="What is this used for?"
        value={form.purpose}
        onChangeText={text => setForm({ ...form, purpose: text })}
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
        }}
      />

      <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Department</Text>
      <TextInput
        placeholder="Department"
        value={form.department}
        onChangeText={text => setForm({ ...form, department: text })}
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
        }}
      />

      <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Requested By</Text>
      <TextInput
        placeholder="Your name"
        value={form.requested_by}
        onChangeText={text => setForm({ ...form, requested_by: text })}
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
        }}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={transactionState.loading || !!quantityError}
        style={{
          backgroundColor: quantityError || transactionState.loading ? '#CCC' : '#FF9800',
          padding: 12,
          borderRadius: 5,
        }}
      >
        <Text style={{ color: '#FFF', fontWeight: 'bold', textAlign: 'center' }}>
          {transactionState.loading ? 'Processing...' : 'Record Withdrawal'}
        </Text>
      </TouchableOpacity>

      {transactionState.error && (
        <Text style={{ color: '#C62828', marginTop: 10 }}>Error: {transactionState.error}</Text>
      )}
    </ScrollView>
  );
}

// ============================================================================
// SNIPPET 4: TRANSACTION HISTORY DISPLAY
// ============================================================================

/*
Component to display stock in/out history for a chemical.

Usage:
<TransactionHistory
  stockInHistory={inHistory}
  stockOutHistory={outHistory}
  loading={loading}
/>
*/

interface TransactionHistoryProps {
  stockInHistory: StockIn[];
  stockOutHistory: StockOut[];
  loading?: boolean;
}

export function TransactionHistory({
  stockInHistory,
  stockOutHistory,
  loading,
}: TransactionHistoryProps) {
  const [selectedType, setSelectedType] = useState<'in' | 'out'>('in');

  const displayedHistory = (
    selectedType === 'in'
      ? stockInHistory.map(item => ({ ...item, type: 'in' as const }))
      : stockOutHistory.map(item => ({ ...item, type: 'out' as const }))
  ) as any[];

  if (loading) {
    return <ActivityIndicator size="large" color="#007AFF" />;
  }

  return (
    <View>
      <View style={{ flexDirection: 'row', marginBottom: 15 }}>
        <TouchableOpacity
          onPress={() => setSelectedType('in')}
          style={{
            flex: 1,
            padding: 10,
            backgroundColor: selectedType === 'in' ? '#4CAF50' : '#EEE',
            borderRadius: 5,
            marginRight: 5,
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              color: selectedType === 'in' ? '#FFF' : '#000',
            }}
          >
            Stock In ({stockInHistory.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedType('out')}
          style={{
            flex: 1,
            padding: 10,
            backgroundColor: selectedType === 'out' ? '#FF9800' : '#EEE',
            borderRadius: 5,
            marginLeft: 5,
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              color: selectedType === 'out' ? '#FFF' : '#000',
            }}
          >
            Stock Out ({stockOutHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayedHistory}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 10,
              borderBottomWidth: 1,
              borderBottomColor: '#EEE',
              backgroundColor: item.type === 'in' ? '#E8F5E9' : '#FFF3E0',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: 'bold' }}>
                {item.type === 'in' ? '➕' : '➖'} {item.quantity} {item.unit}
              </Text>
              <Text style={{ color: '#666', fontSize: 12 }}>
                {new Date(item.created_at || new Date()).toLocaleDateString()}
              </Text>
            </View>
            {item.type === 'in' && (
              <Text style={{ color: '#666', fontSize: 12, marginTop: 3 }}>
                Supplier: {(item as StockIn).supplier}
              </Text>
            )}
            <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }}>
              {item.purpose || item.department || 'No details'}
            </Text>
          </View>
        )}
        scrollEnabled={false}
      />
    </View>
  );
}

// ============================================================================
// SNIPPET 5: ALERTS BADGE & BELL ICON
// ============================================================================

/*
Header component showing alert badge.

Usage:
<AlertsBadge unreadCount={5} onPress={goToAlerts} />
*/

interface AlertsBadgeProps {
  unreadCount: number;
  onPress?: () => void;
}

export function AlertsBadge({ unreadCount, onPress }: AlertsBadgeProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        position: 'relative',
        padding: 10,
      }}
    >
      <Text style={{ fontSize: 24 }}>🔔</Text>
      {unreadCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            backgroundColor: '#FF6B6B',
            borderRadius: 10,
            width: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ============================================================================
// SNIPPET 6: LOW STOCK WARNING BANNER
// ============================================================================

/*
Display banner for low stock chemicals.

Usage:
<LowStockBanner chemicals={lowStockChemicals} />
*/

interface LowStockBannerProps {
  chemicals: Chemical[];
}

export function LowStockBanner({ chemicals }: LowStockBannerProps) {
  if (chemicals.length === 0) return null;

  return (
    <View style={{ padding: 15, backgroundColor: '#FFF3E0', borderRadius: 8, marginBottom: 10 }}>
      <Text style={{ fontWeight: 'bold', color: '#F57C00', marginBottom: 8 }}>
        ⚠️ {chemicals.length} chemical{chemicals.length !== 1 ? 's' : ''} low on stock
      </Text>
      {chemicals.slice(0, 3).map(chemical => (
        <Text key={chemical.id} style={{ color: '#666', fontSize: 12, marginBottom: 3 }}>
          • {chemical.chemical_name}: {chemical.current_stock}/{chemical.total_stock}
        </Text>
      ))}
      {chemicals.length > 3 && (
        <Text style={{ color: '#666', fontSize: 12, marginTop: 5, fontStyle: 'italic' }}>
          +{chemicals.length - 3} more...
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// SNIPPET 7: ERROR BOUNDARY FOR ASYNC OPERATIONS
// ============================================================================

/*
Wrapper to handle errors from async chemical operations gracefully.

Usage:
<AsyncErrorHandler operation={addNewChemical} payload={formData}>
  {(execute, loading, error) => (
    <>
      <Button onPress={() => execute()} title="Add Chemical" disabled={loading} />
      {error && <Text>{error}</Text>}
    </>
  )}
</AsyncErrorHandler>
*/

interface AsyncErrorHandlerProps<T, R> {
  operation: (payload: T) => Promise<R>;
  payload: T;
  onSuccess?: (result: R) => void;
  onError?: (error: string) => void;
  children: (execute: () => void, loading: boolean, error: string | null) => React.ReactNode;
}

export function AsyncErrorHandler<T, R>({
  operation,
  payload,
  onSuccess,
  onError,
  children,
}: AsyncErrorHandlerProps<T, R>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await operation(payload);
      onSuccess?.(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [operation, payload, onSuccess, onError]);

  return <>{children(execute, loading, error)}</>;
}

// ============================================================================
// SNIPPET 8: DASHBOARD SUMMARY CARD
// ============================================================================

/*
Quick overview of inventory status.

Usage:
<InventorySummary
  totalChemicals={100}
  lowStockCount={5}
  totalUnits={1000}
  unreadAlerts={3}
/>
*/

interface InventorySummaryProps {
  totalChemicals: number;
  lowStockCount: number;
  totalUnits: number;
  unreadAlerts: number;
}

export function InventorySummary({
  totalChemicals,
  lowStockCount,
  totalUnits,
  unreadAlerts,
}: InventorySummaryProps) {
  return (
    <View
      style={{
        padding: 15,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        marginBottom: 15,
      }}
    >
      <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Inventory Status</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#007AFF' }}>
            {totalChemicals}
          </Text>
          <Text style={{ fontSize: 12, color: '#666', marginTop: 3 }}>Total</Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FF6B6B' }}>
            {lowStockCount}
          </Text>
          <Text style={{ fontSize: 12, color: '#666', marginTop: 3 }}>Low Stock</Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#4CAF50' }}>
            {totalUnits}
          </Text>
          <Text style={{ fontSize: 12, color: '#666', marginTop: 3 }}>Units</Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFA726' }}>
            {unreadAlerts}
          </Text>
          <Text style={{ fontSize: 12, color: '#666', marginTop: 3 }}>Alerts</Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// ADDITIONAL IMPORTS NEEDED FOR SNIPPETS
// ============================================================================

/*
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useChemicalData } from '@/lib/useChemicalData';
import type {
  Chemical,
  StockIn,
  StockOut,
  CreateStockInInput,
  CreateStockOutInput,
} from '@/lib/types';
*/
