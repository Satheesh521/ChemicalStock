/**
 * Stock Out Screen - Supabase Connected (Full CRUD)
 */

import { stockOutService } from '@/services/stockOutService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    ScrollView,
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

  const fetchStockOuts = async () => {
    setLoading(true);
    try {
      const data = await stockOutService.getStockOuts();
      setStockOuts(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load data');
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
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (date: Date) => 
    date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

  const resetForm = () => {
    setChemicalName(''); setMcNo(''); setKg(''); setGram(''); setMg('');
    setSelectedDate(new Date());
    setEditingId(null);
  };

  const handleSaveStockOut = async () => {
    if (!chemicalName.trim() || !mcNo.trim()) {
      Alert.alert('Error', 'Chemical Name and Mc/No are required');
      return;
    }

    const parsedKg = parseFloat(kg);
    const parsedGram = parseFloat(gram);
    const parsedMg = parseFloat(mg);

    if ([parsedKg, parsedGram, parsedMg].some(value => Number.isNaN(value) || value < 0)) {
      Alert.alert('Validation', 'Stock quantities must be numeric and non-negative');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        chemical_name: chemicalName.trim(),
        mc_no: mcNo.trim(),
        stock_kg: parsedKg || 0,
        stock_g: parsedGram || 0,
        stock_mg: parsedMg || 0,
        date_out: selectedDate.toISOString().split('T')[0],
      };

      if (editingId) {
        await stockOutService.updateStockOut(editingId, payload);
        Alert.alert('Success', 'Updated Successfully!');
      } else {
        await stockOutService.addStockOut(payload);
        Alert.alert('Success', 'Added Successfully!');
      }

      resetForm();
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
            setStockOuts(prev => prev.filter(item => item.id !== id));
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.stockCount}>Stock Outs: {stockOuts.length}</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchStockOuts}>
            <Text style={styles.refreshText}>↻ Refresh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.quickActionText}>View Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtnSecondary} onPress={() => router.push('/(tabs)/want')}>
            <Text style={styles.quickActionTextSecondary}>Add Chemical</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>
          {editingId ? 'Edit Stock Out' : 'Stock Out — Remove Chemical'}
        </Text>

        {/* Form Fields */}
        <View style={styles.row}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Chemical Name *</Text>
            <TextInput style={styles.input} placeholder="Enter chemical name" value={chemicalName} onChangeText={setChemicalName} />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mc/No *</Text>
            <TextInput style={styles.input} placeholder="Mc/No" value={mcNo} onChangeText={setMcNo} />
          </View>
        </View>

        <Text style={styles.label}>Stock Out Quantity</Text>
        <View style={styles.unitsRow}>
          <View style={styles.unitInput}>
            <TextInput style={styles.smallInput} placeholder="0" keyboardType="numeric" value={kg} onChangeText={setKg} />
            <Text style={styles.unit}>kg</Text>
          </View>
          <View style={styles.unitInput}>
            <TextInput style={styles.smallInput} placeholder="0" keyboardType="numeric" value={gram} onChangeText={setGram} />
            <Text style={styles.unit}>g</Text>
          </View>
          <View style={styles.unitInput}>
            <TextInput style={styles.smallInput} placeholder="0" keyboardType="numeric" value={mg} onChangeText={setMg} />
            <Text style={styles.unit}>mg</Text>
          </View>
        </View>

        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker value={selectedDate} mode="date" onChange={(event: any, date?: Date) => { setShowDatePicker(false); if (date) setSelectedDate(date); }} />
        )}

        <Text style={styles.label}>Current Time</Text>
        <View style={[styles.input, styles.timeDisplay]}>
          <Text style={styles.timeText}>{currentTime}</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.addButton} onPress={handleSaveStockOut} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.addButtonText}>{editingId ? 'Update Stock Out' : 'Add Stock Out'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2E7D32" style={{ margin: 30 }} />
        ) : (
          <FlatList
            data={stockOuts}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.chemical_name}</Text>
                <Text style={styles.tableCell}>{item.mc_no}</Text>
                <Text style={styles.tableCell}>{item.stock_kg}kg {item.stock_g}g {item.stock_mg}mg</Text>
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
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 16 },
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
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
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
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
});

export default StockOutScreen;