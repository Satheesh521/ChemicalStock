/**
 * Stock Out Screen - Fixed UI & Clean Code
 */

import { supabase } from '@/lib/supabase';
import { stockOutService } from '@/services/stockOutService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type StockOutItem = {
  id: string;
  chemical_name: string;
  mc_no: string;
  stock_kg: number;
  stock_g: number;
  stock_mg: number;
  date_out: string;
};

const StockOutScreen = () => {
  const router = useRouter();
  const [chemicalName, setChemicalName] = useState('');
  const [mcNo, setMcNo] = useState('');
  const [chemicals, setChemicals] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [kg, setKg] = useState('');
  const [gram, setGram] = useState('');
  const [mg, setMg] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [stockOuts, setStockOuts] = useState<StockOutItem[]>([]);
  const [currentTime, setCurrentTime] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // FIX: Add user authentication check to prevent crash
  const fetchChemicalsList = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not authenticated, skipping chemicals fetch');
        setChemicals([]);
        return;
      }

      const { data, error } = await supabase
        .from('chemicals')
        .select('id, name, current_stock, unit')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      setChemicals(data || []);
    } catch (e) {
      console.error('Failed to load chemicals for autocomplete', e);
      setChemicals([]);
    }
  };

  // FIX: Add user authentication check and better error handling to prevent crash
  const fetchStockOuts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not authenticated, skipping stock outs fetch');
        setStockOuts([]);
        return;
      }

      await fetchChemicalsList();
      const data = await stockOutService.getStockOuts();
      setStockOuts(data);
    } catch (error: any) {
      console.error('Fetch Stock Outs Error:', error);
      Alert.alert('Error', error.message || 'Failed to load data');
      setStockOuts([]); // Set empty array on error to prevent crash
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockOuts();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

  // FIX: Stock Out Quantity & Precision Handling - Ensure state resets properly and suggestions close
  const resetForm = () => {
    setChemicalName('');
    setMcNo('');
    setKg('');
    setGram('');
    setMg('');
    setSelectedDate(new Date());
    setEditingId(null);
    setShowSuggestions(false); // FIX: Close auto-complete suggestions on reset
  };

  // FIX: Stock Out Quantity & Precision Handling - Combine Kg/G/Mg into precise decimal value
  const handleSaveStockOut = async () => {
    if (!chemicalName.trim() || !mcNo.trim()) {
      Alert.alert('Error', 'Chemical Name and Mc/No are required');
      return;
    }

    const parsedKg = parseFloat(kg) || 0;
    const parsedGram = parseFloat(gram) || 0;
    const parsedMg = parseFloat(mg) || 0;

    if (parsedKg < 0 || parsedGram < 0 || parsedMg < 0) {
      Alert.alert('Validation', 'Stock quantities must be non-negative');
      return;
    }

    // FIX: Combine all units into a single precise decimal value in Kilograms
    const totalStockKg = parsedKg + (parsedGram / 1000) + (parsedMg / 1000000);

    setSubmitting(true);
    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDateOut = `${year}-${month}-${day}`;

      const payload = {
        chemical_name: chemicalName.trim(),
        mc_no: mcNo.trim(),
        stock_kg: parsedKg,
        stock_g: parsedGram,
        stock_mg: parsedMg,
        total_stock_kg: totalStockKg, // FIX: Added precise total in kg
        date_out: formattedDateOut,
      };

      if (editingId) {
        await stockOutService.updateStockOut(editingId, payload);
        Alert.alert('Success', 'Updated Successfully!');
      } else {
        await stockOutService.addStockOut(payload);
        Alert.alert('Success', 'Added Successfully!');
      }

      // FIX: Ensure state resets properly after submission
      resetForm();
      setShowSuggestions(false); // FIX: Close auto-complete suggestions
      await fetchStockOuts();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: StockOutItem) => {
    setChemicalName(item.chemical_name);
    setMcNo(item.mc_no);
    setKg(item.stock_kg.toString());
    setGram(item.stock_g.toString());
    setMg(item.stock_mg.toString());
    setSelectedDate(new Date(item.date_out));
    setEditingId(item.id);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Confirm', 'Delete this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await stockOutService.deleteStockOut(id);
            setStockOuts((prev) => prev.filter((item) => item.id !== id));
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const renderHeader = () => (
    <View style={styles.formContainer}>
      <View style={styles.header}>
        <Text style={styles.stockCount}>Stock Outs: {stockOuts.length}</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchStockOuts}>
          <Text style={styles.refreshText}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/')}>
          <Text style={styles.quickActionText}>View Inventory</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionBtnSecondary}
          onPress={() => router.push('/want')}
        >
          <Text style={styles.quickActionTextSecondary}>Add Chemical</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>
        {editingId ? 'Edit Stock Out' : 'Stock Out — Remove Chemical'}
      </Text>

      <View style={styles.row}>
        <View style={[styles.inputContainer, { zIndex: 1000 }]}>
          <Text style={styles.label}>Chemical Name *</Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              style={styles.input}
              placeholder="Enter chemical name"
              value={chemicalName}
              onChangeText={(text) => {
                setChemicalName(text);
                setShowSuggestions(text.trim().length > 0);
              }}
              onFocus={() => setShowSuggestions(chemicalName.trim().length > 0)}
            />

            {showSuggestions && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  data={chemicals
                    .filter(
                      (c) => c.name && c.name.toLowerCase().includes(chemicalName.toLowerCase())
                    )
                    .slice(0, 8)}
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="always"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => {
                        setChemicalName(item.name);
                        setShowSuggestions(false); // FIX: Close suggestions cleanly on selection
                      }}
                    >
                      <Text style={{ fontWeight: '600', color: '#333' }}>{item.name}</Text>
                      <Text style={{ color: '#6b7280', fontSize: 12 }}>
                        {Number(item.current_stock || 0).toFixed(3)} {item.unit || 'kg'}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mc/No *</Text>
          <TextInput style={styles.input} placeholder="Mc/No" value={mcNo} onChangeText={setMcNo} />
        </View>
      </View>

      <Text style={styles.label}>Stock Out Quantity</Text>
      <View style={styles.unitsRow}>
        <View style={styles.unitInput}>
          <TextInput
            style={styles.smallInput}
            placeholder="0"
            keyboardType="numeric"
            value={kg}
            onChangeText={setKg}
          />
          <Text style={styles.unit}>kg</Text>
        </View>
        <View style={styles.unitInput}>
          <TextInput
            style={styles.smallInput}
            placeholder="0"
            keyboardType="numeric"
            value={gram}
            onChangeText={setGram}
          />
          <Text style={styles.unit}>g</Text>
        </View>
        <View style={styles.unitInput}>
          <TextInput
            style={styles.smallInput}
            placeholder="0"
            keyboardType="numeric"
            value={mg}
            onChangeText={setMg}
          />
          <Text style={styles.unit}>mg</Text>
        </View>
      </View>

      <Text style={styles.label}>Date</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          onChange={(event: any, date?: Date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}

      <Text style={styles.label}>Current Time</Text>
      <View style={[styles.input, styles.timeDisplay]}>
        <Text style={styles.timeText}>{currentTime}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.addButton} onPress={handleSaveStockOut} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>
              {editingId ? 'Update Stock Out' : 'Add Stock Out'}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={stockOuts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshing={loading}
        onRefresh={fetchStockOuts}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{item.chemical_name}</Text>
            <Text style={styles.tableCell}>{item.mc_no}</Text>
            <Text style={styles.tableCell}>
              {item.stock_kg}kg {item.stock_g}g {item.stock_mg}mg
            </Text>
            <Text style={[styles.tableCell, { flex: 1.2 }]}>{item.date_out}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>Del</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No records found</Text>}
        contentContainerStyle={{ padding: 16 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  formContainer: { marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  quickActions: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  quickActionBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  quickActionBtnSecondary: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#2E7D32' },
  quickActionText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  quickActionTextSecondary: { color: '#2E7D32', fontWeight: '600', fontSize: 13 },
  stockCount: { fontSize: 16, fontWeight: '600', color: '#2E7D32' },
  refreshBtn: { backgroundColor: '#81C784', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  refreshText: { color: '#fff', fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1B5E20', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16, zIndex: 10 },
  inputContainer: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#81C784', borderRadius: 10, padding: 12, backgroundColor: '#fff', fontSize: 16 },
  dateText: { color: '#333', fontSize: 16 },
  timeText: { color: '#2E7D32', fontSize: 16, fontWeight: '600' },
  unitsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  unitInput: { flex: 1, alignItems: 'center' },
  smallInput: { borderWidth: 1, borderColor: '#81C784', borderRadius: 10, padding: 12, textAlign: 'center', backgroundColor: '#fff', fontSize: 16 },
  unit: { marginTop: 4, fontSize: 12, color: '#666' },
  timeDisplay: { backgroundColor: '#F1F8E9' },
  buttonRow: { flexDirection: 'row', gap: 12, marginVertical: 20 },
  addButton: { flex: 1, backgroundColor: '#2E7D32', paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resetButton: { flex: 1, backgroundColor: '#9E9E9E', paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  resetButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  tableCell: { flex: 1, color: '#333', fontSize: 14 },
  editBtn: { backgroundColor: '#42A5F5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  editText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#EF5350', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  deleteText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 9999,
    elevation: 8,
    marginTop: 4,
  },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
});

export default StockOutScreen;