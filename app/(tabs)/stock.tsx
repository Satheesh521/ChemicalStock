/**
 * Stock Screen
 * Stock IN/OUT transaction management
 */

import { useAuth } from '@/context/AuthContext';
import type { Database } from '@/lib/supabase';
import { chemicalService } from '@/services/chemicalService';
import { stockService } from '@/services/stockService';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
type Chemical = Database['public']['Tables']['chemicals']['Row'];
type StockTransaction = Database['public']['Tables']['stock_out']['Row'];

export default function StockScreen() {
  const { user } = useAuth();
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [selectedChemical, setSelectedChemical] = useState<Chemical | null>(null);
  const [transactionType, setTransactionType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showChemicalList, setShowChemicalList] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      const [chems, trans] = await Promise.all([
        chemicalService.getChemicals(),
        stockService.getAllTransactions(10),
      ]);
      setChemicals(chems);
      setTransactions(trans);
    } catch (error) {
      Alert.alert('Error', 'Could not load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!selectedChemical || !quantity) {
      Alert.alert('Error', 'Fill chemical and quantity');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Enter valid quantity');
      return;
    }

    setSubmitting(true);
    try {
      if (transactionType === 'IN') {
        await stockService.addStockIn(
          selectedChemical.id,
          qty,
          reason || 'Supply',
          user?.email || 'Unknown'
        );
        Alert.alert('Success', 'Stock IN recorded');
      } else {
        if (qty > selectedChemical.current_stock) {
          Alert.alert(
            'Error',
            `Insufficient stock. Available: ${selectedChemical.current_stock} ${selectedChemical.unit}`
          );
          return;
        }
        await stockService.addStockOut(
          selectedChemical.id,
          qty,
          reason || 'Usage',
          user?.email || 'Unknown'
        );
        Alert.alert('Success', 'Stock OUT recorded');
      }

      // Reset form and refresh
      setQuantity('');
      setReason('');
      setSelectedChemical(null);
      await fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not record');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>📦 Stock Transaction</Text>

          {/* Chemical Selector */}
          <Text style={styles.label}>Select Chemical *</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowChemicalList(!showChemicalList)}
          >
            <Text style={styles.selectorText}>
              {selectedChemical ? selectedChemical.name : 'Select chemical...'}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>

          {showChemicalList && (
            <View style={styles.dropdown}>
              {chemicals.map((chem) => (
                <Pressable
                  key={chem.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedChemical(chem);
                    setShowChemicalList(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{chem.name}</Text>
                  <Text style={styles.dropdownStock}>Stock: {chem.current_stock} {chem.unit}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Selected Chemical Info */}
          {selectedChemical && (
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Current Stock:</Text>
                <Text style={styles.infoValue}>
                  {selectedChemical.current_stock} {selectedChemical.unit}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Minimum:</Text>
                <Text style={styles.infoValue}>{selectedChemical.min_threshold}</Text>
              </View>
            </View>
          )}

          {/* Transaction Type */}
          <Text style={styles.label}>Type *</Text>
          <View style={styles.typeContainer}>
            <Pressable
              style={[styles.typeBtn, transactionType === 'IN' && styles.typeBtnActive]}
              onPress={() => setTransactionType('IN')}
            >
              <Text style={[styles.typeText, transactionType === 'IN' && styles.typeTextActive]}>
                📥 IN (Supply)
              </Text>
            </Pressable>
            <Pressable
              style={[styles.typeBtn, transactionType === 'OUT' && styles.typeBtnActive]}
              onPress={() => setTransactionType('OUT')}
            >
              <Text style={[styles.typeText, transactionType === 'OUT' && styles.typeTextActive]}>
                📤 OUT (Usage)
              </Text>
            </Pressable>
          </View>

          {/* Quantity Input */}
          <Text style={styles.label}>Quantity ({selectedChemical?.unit || 'kg'}) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
            editable={!submitting}
          />

          {/* Reason Input */}
          <Text style={styles.label}>Reason</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder={transactionType === 'IN' ? 'Supply, purchase, etc.' : 'Usage, testing, etc.'}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={2}
            editable={!submitting}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {transactionType === 'IN' ? 'Record Stock IN' : 'Record Stock OUT'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        {transactions.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>📋 Transaction History</Text>
            {transactions.map((trans) => (
              <View key={trans.id} style={styles.transactionItem}>
                <View style={styles.transContent}>
                  <View style={styles.transHeader}>
                    <Text style={styles.transType}>
                      {trans.type === 'IN' ? '📥 IN' : '📤 OUT'} - {trans.reason}
                    </Text>
                    <Text
                      style={[
                        styles.transBadge,
                        trans.type === 'IN' ? styles.inBadge : styles.outBadge,
                      ]}
                    >
                      {trans.quantity}
                    </Text>
                  </View>
                  <Text style={styles.transTime}>
                    {new Date(trans.created_at).toLocaleString()}
                  </Text>
                  <Text style={styles.transUser}>By: {trans.performed_by}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {transactions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No transactions</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DCDCDC',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 12,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
  },
  selectorText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  selectorArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 10,
    marginTop: 4,
    backgroundColor: '#fff',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  dropdownStock: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B5E20',
  },
  infoValue: {
    fontSize: 12,
    color: '#1B5E20',
    fontWeight: '700',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  typeBtnActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  typeTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A1A',
    backgroundColor: '#F9F9F9',
  },
  textarea: {
    height: 60,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  historySection: {
    marginBottom: 20,
  },
  transactionItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DCDCDC',
  },
  transContent: {
    gap: 8,
  },
  transHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  transBadge: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  inBadge: {
    backgroundColor: '#C8E6C9',
    color: '#2E7D32',
  },
  outBadge: {
    backgroundColor: '#FFCDD2',
    color: '#D32F2F',
  },
  transTime: {
    fontSize: 12,
    color: '#999',
  },
  transUser: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
});
