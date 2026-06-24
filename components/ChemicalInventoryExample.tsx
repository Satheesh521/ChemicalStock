/**
 * Example React Component: Chemical Inventory Management
 * Demonstrates complete usage of chemical service and custom hooks
 * 
 * Features:
 * - Add new chemicals
 * - View chemical list with stock levels
 * - Record stock in/out transactions
 * - View transaction history
 * - View and manage alerts
 */

import type {
  CreateChemicalInput,
  CreateStockInInput,
  CreateStockOutInput,
} from '@/lib/types';
import { useChemicalData, useChemicalDataEffect } from '@/lib/useChemicalData';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, View } from 'react-native';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ChemicalInventoryScreen() {
  const {
    chemicals,
    selectedChemical,
    loadChemicals,
    addNewChemical,
    selectChemical,
    chemicalState,
    lowStockChemicals,
    stockInHistory,
    recordStockIn,
    loadStockInHistory,
    stockOutHistory,
    recordStockOut,
    loadStockOutHistory,
    alerts,
    loadAlerts,
    markAlertRead,
    markAllRead,
    alertState,
    unreadAlertCount,
    transactionState,
    historyState,
  } = useChemicalData();

  // Load initial data on mount
  useChemicalDataEffect(loadChemicals, loadAlerts);

  // Local state for forms
  const [activeTab, setActiveTab] = useState<
    'chemicals' | 'add-chemical' | 'stock-in' | 'stock-out' | 'alerts'
  >('chemicals');

  const [newChemicalForm, setNewChemicalForm] = useState<CreateChemicalInput>({
    chemical_name: '',
    chemical_formula: '',
    cas_number: '',
    hazard_class: '',
    total_stock: 0,
    current_stock: 0,
    unit: 'mL',
    min_threshold: 10,
    location: '',
  });

  const [stockInForm, setStockInForm] = useState<CreateStockInInput>({
    chemical_id: '',
    quantity: 0,
    unit: 'mL',
    supplier: '',
    purpose: '',
    department: '',
    requested_by: '',
    approved_by: '',
  });

  const [stockOutForm, setStockOutForm] = useState<CreateStockOutInput>({
    chemical_id: '',
    quantity: 0,
    unit: 'mL',
    purpose: '',
    department: '',
    requested_by: '',
    approved_by: '',
  });

  // =========================================================================
  // HANDLERS: ADD CHEMICAL
  // =========================================================================

  const handleAddChemical = async () => {
    if (
      !newChemicalForm.chemical_name ||
      !newChemicalForm.chemical_formula
    ) {
      Alert.alert('Validation Error', 'Please fill in required fields');
      return;
    }

    try {
      await addNewChemical(newChemicalForm);
      Alert.alert('Success', 'Chemical added successfully');
      setNewChemicalForm({
        chemical_name: '',
        chemical_formula: '',
        cas_number: '',
        hazard_class: '',
        total_stock: 0,
        current_stock: 0,
        unit: 'mL',
        min_threshold: 10,
        location: '',
      });
      setActiveTab('chemicals');
    } catch (error) {
      Alert.alert('Error', `Failed to add chemical: ${error}`);
    }
  };

  // =========================================================================
  // HANDLERS: STOCK IN
  // =========================================================================

  const handleRecordStockIn = async () => {
    if (!stockInForm.chemical_id || stockInForm.quantity <= 0) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      await recordStockIn(stockInForm);
      Alert.alert('Success', 'Stock in recorded successfully');
      setStockInForm({
        chemical_id: '',
        quantity: 0,
        unit: 'mL',
        supplier: '',
        purpose: '',
        department: '',
        requested_by: '',
        approved_by: '',
      });
      setActiveTab('chemicals');
    } catch (error) {
      Alert.alert('Error', `Failed to record stock in: ${error}`);
    }
  };

  // =========================================================================
  // HANDLERS: STOCK OUT
  // =========================================================================

  const handleRecordStockOut = async () => {
    if (!stockOutForm.chemical_id || stockOutForm.quantity <= 0) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      await recordStockOut(stockOutForm);
      Alert.alert('Success', 'Stock out recorded successfully');
      setStockOutForm({
        chemical_id: '',
        quantity: 0,
        unit: 'mL',
        purpose: '',
        department: '',
        requested_by: '',
        approved_by: '',
      });
      setActiveTab('chemicals');
    } catch (error) {
      Alert.alert('Error', `Failed to record stock out: ${error}`);
    }
  };

  // =========================================================================
  // HANDLERS: CHEMICAL SELECTION
  // =========================================================================

  const handleSelectChemical = async (chemicalId: string) => {
    await selectChemical(chemicalId);
    await loadStockInHistory(chemicalId);
    await loadStockOutHistory(chemicalId);
  };

  // =========================================================================
  // HANDLERS: ALERTS
  // =========================================================================

  const handleMarkAlertRead = async (alertId: string) => {
    try {
      await markAlertRead(alertId);
    } catch (error) {
      Alert.alert('Error', 'Failed to mark alert as read');
    }
  };

  // =========================================================================
  // RENDER: TAB NAVIGATION
  // =========================================================================

  const renderTabNavigation = () => (
    <View style={{ flexDirection: 'row', padding: 10, gap: 10 }}>
      {(['chemicals', 'add-chemical', 'stock-in', 'stock-out', 'alerts'] as const).map(
        (tab) => (
          <Text
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              padding: 10,
              backgroundColor: activeTab === tab ? '#007AFF' : '#E0E0E0',
              color: activeTab === tab ? '#FFF' : '#000',
              borderRadius: 5,
              flex: 1,
              textAlign: 'center',
            }}
          >
            {tab === 'add-chemical' && 'Add'}
            {tab === 'stock-in' && 'Stock In'}
            {tab === 'stock-out' && 'Stock Out'}
            {tab === 'chemicals' && `Chemicals (${chemicals.length})`}
            {tab === 'alerts' && `Alerts ${unreadAlertCount > 0 ? `(${unreadAlertCount})` : ''}`}
          </Text>
        )
      )}
    </View>
  );

  // =========================================================================
  // RENDER: CHEMICALS TAB
  // =========================================================================

  const renderChemicalsTab = () => (
    <ScrollView style={{ padding: 10 }}>
      {chemicalState.loading && (
        <View style={{ alignItems: 'center', padding: 20 }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text>Loading chemicals...</Text>
        </View>
      )}

      {chemicalState.error && (
        <View style={{ backgroundColor: '#FFEBEE', padding: 10, borderRadius: 5 }}>
          <Text style={{ color: '#C62828' }}>Error: {chemicalState.error}</Text>
        </View>
      )}

      {lowStockChemicals.length > 0 && (
        <View style={{ backgroundColor: '#FFF3E0', padding: 10, marginBottom: 10, borderRadius: 5 }}>
          <Text style={{ fontWeight: 'bold', color: '#F57C00' }}>
            ⚠️ {lowStockChemicals.length} chemicals have low stock
          </Text>
        </View>
      )}

      {chemicals.length === 0 ? (
        <Text style={{ textAlign: 'center', color: '#999', padding: 20 }}>
          No chemicals found. Add one to get started!
        </Text>
      ) : (
        chemicals.map((chemical) => (
          <View
            key={chemical.id}
            style={{
              backgroundColor: '#F5F5F5',
              padding: 10,
              marginBottom: 10,
              borderRadius: 5,
              borderLeftWidth: 4,
              borderLeftColor:
                chemical.current_stock <= chemical.min_threshold
                  ? '#FF6B6B'
                  : '#4CAF50',
            }}
          >
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
              {chemical.chemical_name}
            </Text>
            <Text style={{ color: '#666', fontSize: 12 }}>
              Formula: {chemical.chemical_formula}
            </Text>
            <Text style={{ color: '#666', fontSize: 12 }}>
              CAS: {chemical.cas_number}
            </Text>
            <Text style={{ marginTop: 5 }}>
              Stock: {chemical.current_stock} / {chemical.total_stock} {chemical.unit}
            </Text>
            <Text style={{ fontSize: 12, color: '#999' }}>
              Location: {chemical.location}
            </Text>
            <Text
              onPress={() => handleSelectChemical(chemical.id)}
              style={{
                marginTop: 5,
                color: '#007AFF',
                fontWeight: 'bold',
              }}
            >
              View Details & History →
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );

  // =========================================================================
  // RENDER: ADD CHEMICAL TAB
  // =========================================================================

  const renderAddChemicalTab = () => (
    <ScrollView style={{ padding: 10 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
        Add New Chemical
      </Text>

      <TextInput
        placeholder="Chemical Name *"
        value={newChemicalForm.chemical_name}
        onChangeText={(text) =>
          setNewChemicalForm({ ...newChemicalForm, chemical_name: text })
        }
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Chemical Formula *"
        value={newChemicalForm.chemical_formula}
        onChangeText={(text) =>
          setNewChemicalForm({ ...newChemicalForm, chemical_formula: text })
        }
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="CAS Number"
        value={newChemicalForm.cas_number}
        onChangeText={(text) =>
          setNewChemicalForm({ ...newChemicalForm, cas_number: text })
        }
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Hazard Class"
        value={newChemicalForm.hazard_class}
        onChangeText={(text) =>
          setNewChemicalForm({ ...newChemicalForm, hazard_class: text })
        }
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Current Stock"
        keyboardType="decimal-pad"
        value={String(newChemicalForm.current_stock)}
        onChangeText={(text) =>
          setNewChemicalForm({
            ...newChemicalForm,
            current_stock: parseFloat(text) || 0,
          })
        }
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Total Stock"
        keyboardType="decimal-pad"
        value={String(newChemicalForm.total_stock)}
        onChangeText={(text) =>
          setNewChemicalForm({
            ...newChemicalForm,
            total_stock: parseFloat(text) || 0,
          })
        }
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Min Threshold"
        keyboardType="decimal-pad"
        value={String(newChemicalForm.min_threshold)}
        onChangeText={(text) =>
          setNewChemicalForm({
            ...newChemicalForm,
            min_threshold: parseFloat(text) || 0,
          })
        }
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Location"
        value={newChemicalForm.location}
        onChangeText={(text) =>
          setNewChemicalForm({ ...newChemicalForm, location: text })
        }
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <Text
        onPress={handleAddChemical}
        disabled={transactionState.loading}
        style={{
          backgroundColor: transactionState.loading ? '#CCC' : '#007AFF',
          color: '#FFF',
          padding: 12,
          borderRadius: 5,
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        {transactionState.loading ? 'Adding...' : 'Add Chemical'}
      </Text>

      {transactionState.error && (
        <View style={{ backgroundColor: '#FFEBEE', padding: 10, marginTop: 10, borderRadius: 5 }}>
          <Text style={{ color: '#C62828' }}>Error: {transactionState.error}</Text>
        </View>
      )}
    </ScrollView>
  );

  // =========================================================================
  // RENDER: STOCK IN TAB
  // =========================================================================

  const renderStockInTab = () => (
    <ScrollView style={{ padding: 10 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
        Record Stock In
      </Text>

      <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>
        Select Chemical *
      </Text>
      <ScrollView
        horizontal
        style={{
          marginBottom: 10,
          maxHeight: 100,
        }}
      >
        {chemicals.map((chemical) => (
          <Text
            key={chemical.id}
            onPress={() =>
              setStockInForm({ ...stockInForm, chemical_id: chemical.id })
            }
            style={{
              backgroundColor:
                stockInForm.chemical_id === chemical.id
                  ? '#007AFF'
                  : '#E0E0E0',
              color:
                stockInForm.chemical_id === chemical.id ? '#FFF' : '#000',
              padding: 10,
              marginRight: 5,
              borderRadius: 5,
              minWidth: 150,
              textAlign: 'center',
            }}
          >
            {chemical.chemical_name}
          </Text>
        ))}
      </ScrollView>

      <TextInput
        placeholder="Quantity *"
        keyboardType="decimal-pad"
        value={String(stockInForm.quantity)}
        onChangeText={(text) =>
          setStockInForm({
            ...stockInForm,
            quantity: parseFloat(text) || 0,
          })
        }
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Supplier"
        value={stockInForm.supplier}
        onChangeText={(text) =>
          setStockInForm({ ...stockInForm, supplier: text })
        }
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Purpose"
        value={stockInForm.purpose}
        onChangeText={(text) =>
          setStockInForm({ ...stockInForm, purpose: text })
        }
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Department"
        value={stockInForm.department}
        onChangeText={(text) =>
          setStockInForm({ ...stockInForm, department: text })
        }
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Requested By"
        value={stockInForm.requested_by}
        onChangeText={(text) =>
          setStockInForm({ ...stockInForm, requested_by: text })
        }
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Approved By"
        value={stockInForm.approved_by || ''}
        onChangeText={(text) =>
          setStockInForm({ ...stockInForm, approved_by: text || null })
        }
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <Text
        onPress={handleRecordStockIn}
        disabled={transactionState.loading}
        style={{
          backgroundColor: transactionState.loading ? '#CCC' : '#4CAF50',
          color: '#FFF',
          padding: 12,
          borderRadius: 5,
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        {transactionState.loading ? 'Recording...' : 'Record Stock In'}
      </Text>

      {transactionState.error && (
        <View style={{ backgroundColor: '#FFEBEE', padding: 10, marginTop: 10, borderRadius: 5 }}>
          <Text style={{ color: '#C62828' }}>Error: {transactionState.error}</Text>
        </View>
      )}
    </ScrollView>
  );

  // =========================================================================
  // RENDER: STOCK OUT TAB
  // =========================================================================

  const renderStockOutTab = () => (
    <ScrollView style={{ padding: 10 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
        Record Stock Out
      </Text>

      <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>
        Select Chemical *
      </Text>
      <ScrollView
        horizontal
        style={{
          marginBottom: 10,
          maxHeight: 100,
        }}
      >
        {chemicals.map((chemical) => (
          <Text
            key={chemical.id}
            onPress={() =>
              setStockOutForm({ ...stockOutForm, chemical_id: chemical.id })
            }
            style={{
              backgroundColor:
                stockOutForm.chemical_id === chemical.id
                  ? '#007AFF'
                  : '#E0E0E0',
              color:
                stockOutForm.chemical_id === chemical.id ? '#FFF' : '#000',
              padding: 10,
              marginRight: 5,
              borderRadius: 5,
              minWidth: 150,
              textAlign: 'center',
            }}
          >
            {chemical.chemical_name}
          </Text>
        ))}
      </ScrollView>

      <TextInput
        placeholder="Quantity *"
        keyboardType="decimal-pad"
        value={String(stockOutForm.quantity)}
        onChangeText={(text) =>
          setStockOutForm({
            ...stockOutForm,
            quantity: parseFloat(text) || 0,
          })
        }
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Purpose"
        value={stockOutForm.purpose}
        onChangeText={(text) =>
          setStockOutForm({ ...stockOutForm, purpose: text })
        }
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Department"
        value={stockOutForm.department}
        onChangeText={(text) =>
          setStockOutForm({ ...stockOutForm, department: text })
        }
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Requested By"
        value={stockOutForm.requested_by}
        onChangeText={(text) =>
          setStockOutForm({ ...stockOutForm, requested_by: text })
        }
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Approved By"
        value={stockOutForm.approved_by || ''}
        onChangeText={(text) =>
          setStockOutForm({ ...stockOutForm, approved_by: text || null })
        }
        style={{
          borderWidth: 1,
          borderColor: '#DDD',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <Text
        onPress={handleRecordStockOut}
        disabled={transactionState.loading}
        style={{
          backgroundColor: transactionState.loading ? '#CCC' : '#FF9800',
          color: '#FFF',
          padding: 12,
          borderRadius: 5,
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        {transactionState.loading ? 'Recording...' : 'Record Stock Out'}
      </Text>

      {transactionState.error && (
        <View style={{ backgroundColor: '#FFEBEE', padding: 10, marginTop: 10, borderRadius: 5 }}>
          <Text style={{ color: '#C62828' }}>Error: {transactionState.error}</Text>
        </View>
      )}
    </ScrollView>
  );

  // =========================================================================
  // RENDER: ALERTS TAB
  // =========================================================================

  const renderAlertsTab = () => (
    <ScrollView style={{ padding: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <Text style={{ fontWeight: 'bold' }}>
          Alerts {unreadAlertCount > 0 && `(${unreadAlertCount} unread)`}
        </Text>
        {unreadAlertCount > 0 && (
          <Text
            onPress={markAllRead}
            style={{ color: '#007AFF', fontWeight: 'bold' }}
          >
            Mark All Read
          </Text>
        )}
      </View>

      {alertState.loading && (
        <View style={{ alignItems: 'center', padding: 20 }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text>Loading alerts...</Text>
        </View>
      )}

      {alertState.error && (
        <View style={{ backgroundColor: '#FFEBEE', padding: 10, borderRadius: 5 }}>
          <Text style={{ color: '#C62828' }}>Error: {alertState.error}</Text>
        </View>
      )}

      {alerts.length === 0 ? (
        <Text style={{ textAlign: 'center', color: '#999', padding: 20 }}>
          No alerts. Your inventory is in good shape! ✓
        </Text>
      ) : (
        alerts.map((alert) => (
          <View
            key={alert.id}
            style={{
              backgroundColor: alert.is_read ? '#F5F5F5' : '#E3F2FD',
              padding: 10,
              marginBottom: 10,
              borderRadius: 5,
              borderLeftWidth: 4,
              borderLeftColor:
                alert.alert_type === 'low_stock' ? '#FF6B6B' : '#FFA726',
            }}
          >
            <Text
              style={{
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: 12,
                color:
                  alert.alert_type === 'low_stock' ? '#FF6B6B' : '#FFA726',
              }}
            >
              {alert.alert_type}
            </Text>
            <Text style={{ marginTop: 5 }}>{alert.message}</Text>
            <Text style={{ fontSize: 12, color: '#999', marginTop: 3 }}>
              {new Date(alert.created_at).toLocaleDateString()}
            </Text>
            {!alert.is_read && (
              <Text
                onPress={() => handleMarkAlertRead(alert.id)}
                style={{
                  marginTop: 5,
                  color: '#007AFF',
                  fontWeight: 'bold',
                  fontSize: 12,
                }}
              >
                Mark as Read
              </Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );

  // =========================================================================
  // RENDER: MAIN
  // =========================================================================

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      {renderTabNavigation()}
      {activeTab === 'chemicals' && renderChemicalsTab()}
      {activeTab === 'add-chemical' && renderAddChemicalTab()}
      {activeTab === 'stock-in' && renderStockInTab()}
      {activeTab === 'stock-out' && renderStockOutTab()}
      {activeTab === 'alerts' && renderAlertsTab()}
    </View>
  );
}
