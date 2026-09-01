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
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
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

// Isolated live clock component to prevent parent re-renders and TextInput focus loss
const LiveClock = () => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={clockStyles.timeDisplay}>
      <Text style={clockStyles.timeText}>{time}</Text>
    </View>
  );
};

const clockStyles = StyleSheet.create({
  timeDisplay: { backgroundColor: '#F1F8E9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#81C784' },
  timeText: { color: '#2E7D32', fontSize: 16, fontWeight: '600', textAlign: 'center' },
});

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    fetchChemicalsList();
  }, []);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

  const resetForm = () => {
    setChemicalName('');
    setMcNo('');
    setKg('');
    setGram('');
    setMg('');
    setSelectedDate(new Date());
    setEditingId(null);
    setShowSuggestions(false);
  };

  const handleSaveStockOut = async () => {
    if (submitting) return;

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

    const totalStockKg = parsedKg + (parsedGram / 1000) + (parsedMg / 1000000);

    if (totalStockKg <= 0) {
      Alert.alert('Validation', 'Please enter a valid stock out quantity');
      return;
    }

    // ✅ VALIDATION: Check existing stock quantity before saving
    const selectedChem = chemicals.find(
      (c) => c.name.toLowerCase() === chemicalName.trim().toLowerCase()
    );

    if (selectedChem) {
      const currentAvailable = parseFloat(selectedChem.current_stock) || 0;
      if (totalStockKg > currentAvailable) {
        Alert.alert(
          'Insufficient Stock!',
          `Available stock for ${selectedChem.name} is ${currentAvailable.toFixed(3)} ${selectedChem.unit || 'kg'}. You cannot remove ${totalStockKg.toFixed(3)} kg.`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDateOut = `${year}-${month}-${day}`;

      const payload = {
        chemical_id: selectedChem ? selectedChem.id : null,
        chemical_name: chemicalName.trim(),
        mc_no: mcNo.trim(),
        stock_kg: parsedKg,
        stock_g: parsedGram,
        stock_mg: parsedMg,
        date_out: formattedDateOut,
      };

      if (editingId) {
        await stockOutService.updateStockOut(editingId, payload);
        Alert.alert('Success', 'Updated Successfully!');
      } else {
        await stockOutService.addStockOut(payload);
        Alert.alert('Success', 'Stock Out recorded and inventory updated!');
      }

      resetForm();
      setShowSuggestions(false);
      router.push('/want');
    } catch (error: any) {
      console.error('Stock Out Error:', error);
      Alert.alert('Error', error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.formContainer}>
      <View style={styles.header}>
        <Text style={styles.stockCount}>Stock Out Entry</Text>
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
        <View style={[styles.inputContainer, { zIndex: showSuggestions ? 9999 : 1, elevation: Platform.OS === 'android' ? 10 : 0 }]}>
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
                        setShowSuggestions(false);
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
      <LiveClock />

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        {renderHeader()}
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  unitsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  unitInput: { flex: 1, alignItems: 'center' },
  smallInput: { borderWidth: 1, borderColor: '#81C784', borderRadius: 10, padding: 12, textAlign: 'center', backgroundColor: '#fff', fontSize: 16 },
  unit: { marginTop: 4, fontSize: 12, color: '#666' },
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