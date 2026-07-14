import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { CameraView, useCameraPermissions } from 'expo-camera'; // ✅ Updated import
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabase';

interface StockEntryData {
  chemicalName: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  vendor: string;
  location: string;
  notes: string;
}

type EntryType = 'in' | 'out';

export default function QRDemo() {
  const [permission, requestPermission] = useCameraPermissions(); // ✅ New permission hook
  const [showScanner, setShowScanner] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entryType, setEntryType] = useState<EntryType>('in');
  const [userId, setUserId] = useState<string>('demo-user');
  const [savedEntries, setSavedEntries] = useState<any[]>([]);

  const [formData, setFormData] = useState<StockEntryData>({
    chemicalName: '',
    batchNumber: '',
    quantity: 0,
    unit: 'kg',
    expiryDate: '',
    vendor: '',
    location: '',
    notes: '',
  });

  // ✅ Request camera permission
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // Fetch saved entries on load and when entry type changes
  useEffect(() => {
    fetchSavedEntries();
  }, [entryType]);

  const fetchSavedEntries = async () => {
    try {
      const tableName = entryType === 'in' ? 'stock_in' : 'stock_out';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching entries:', error);
        return;
      }

      setSavedEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setShowScanner(false);
    try {
      const qrData = JSON.parse(data);

      // Parse expiryDate from ISO (YYYY-MM-DD) to DD/MM/YYYY for display
      let parsedExpiryDate = '';
      if (qrData.expiryDate) {
        const parts = qrData.expiryDate.split('-'); // ["2026","06","30"]
        if (parts.length === 3) {
          parsedExpiryDate = `${parts[2]}/${parts[1]}/${parts[0]}`; // "30/06/2026"
        } else {
          parsedExpiryDate = qrData.expiryDate;
        }
      }

      // Fill ALL form fields from QR data automatically (no Alert popup)
      setFormData(prev => ({
        ...prev,
        chemicalName: qrData.name       || prev.chemicalName,
        batchNumber:  qrData.batchNumber || qrData.batch || prev.batchNumber,
        quantity:     qrData.quantity    ?? qrData.qty   ?? prev.quantity,
        unit:         qrData.unit        || prev.unit,
        expiryDate:   parsedExpiryDate   || prev.expiryDate,
        vendor:       qrData.vendor      || prev.vendor,
        location:     qrData.location    || prev.location,
        notes:        qrData.notes       || prev.notes,
      }));
    } catch (e) {
      // If QR is plain text (not JSON), use it as chemical name
      setFormData(prev => ({ ...prev, chemicalName: data }));
    }
  };

  const convertDateToISO = (dateString: string): string => {
    if (!dateString) return new Date().toISOString().split('T')[0];
    const parts = dateString.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return new Date().toISOString().split('T')[0];
  };

  const handleSave = async () => {
    if (!formData.chemicalName.trim()) {
      Alert.alert('Error', 'Please enter chemical name');
      return;
    }
    if (!formData.batchNumber.trim()) {
      Alert.alert('Error', 'Please enter batch number');
      return;
    }
    if (formData.quantity <= 0) {
      Alert.alert('Error', 'Please enter valid quantity');
      return;
    }

    setLoading(true);
    try {
      const recordId = uuidv4();
      const isoDate = convertDateToISO(formData.expiryDate);
      const tableName = entryType === 'in' ? 'stock_in' : 'stock_out';
      
      const insertData = entryType === 'in' ? {
        id: recordId,
        chemical_name: formData.chemicalName.trim(),
        batch_number: formData.batchNumber.trim(),
        quantity: formData.quantity,
        unit: formData.unit,
        expiry_date: isoDate,
        vendor: formData.vendor.trim(),
        location: formData.location.trim(),
        notes: formData.notes.trim(),
        added_by: userId,
      } : {
        id: recordId,
        chemical_name: formData.chemicalName.trim(),
        batch_number: formData.batchNumber.trim(),
        quantity: formData.quantity,
        unit: formData.unit,
        mc_no: formData.batchNumber.trim(),
        date_out: isoDate,
        notes: formData.notes.trim(),
        added_by: userId,
      };

      const { error } = await supabase.from(tableName).insert([insertData]);

      if (error) {
        Alert.alert('Error', 'Failed to save: ' + error.message);
        return;
      }

      Alert.alert('Success ✅', `${entryType === 'in' ? 'Stock In' : 'Stock Out'} saved!`,
        [{ text: 'OK', onPress: () => { clearForm(); fetchSavedEntries(); } }]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      chemicalName: '',
      batchNumber: '',
      quantity: 0,
      unit: 'kg',
      expiryDate: '',
      vendor: '',
      location: '',
      notes: '',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const year = selectedDate.getFullYear();
      setFormData(prev => ({ ...prev, expiryDate: `${day}/${month}/${year}` }));
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{entryType === 'in' ? 'Stock Entry (In)' : 'Stock Out'}</Text>
        <Text style={styles.subtitle}>Scan QR or enter manually</Text>
      </View>

      {/* Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, entryType === 'in' && styles.toggleActive]}
          onPress={() => setEntryType('in')}
        >
          <Text style={[styles.toggleText, entryType === 'in' && styles.toggleTextActive]}>📥 Stock In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, entryType === 'out' && styles.toggleActive]}
          onPress={() => setEntryType('out')}
        >
          <Text style={[styles.toggleText, entryType === 'out' && styles.toggleTextActive]}>📤 Stock Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.scanButton} onPress={() => setShowScanner(true)}>
          <Text style={styles.scanButtonText}>📷 Scan QR Code</Text>
        </TouchableOpacity>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Stock Details</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Chemical Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.chemicalName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, chemicalName: text }))}
              placeholder="Enter chemical name"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Batch Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.batchNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, batchNumber: text }))}
              placeholder="Enter batch number"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.halfField]}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                value={formData.quantity === 0 ? '' : formData.quantity.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, quantity: parseFloat(text) || 0 }))}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.field, styles.halfField]}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.unit}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                >
                  <Picker.Item label="kg" value="kg" />
                  <Picker.Item label="g" value="g" />
                  <Picker.Item label="l" value="l" />
                  <Picker.Item label="ml" value="ml" />
                  <Picker.Item label="pcs" value="pcs" />
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Text>{formData.expiryDate || 'Select date'}</Text>
              <Text>📅</Text>
            </TouchableOpacity>
          </View>

          {entryType === 'in' && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Vendor</Text>
                <TextInput
                  style={styles.input}
                  value={formData.vendor}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, vendor: text }))}
                  placeholder="Enter vendor name"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                  placeholder="Enter storage location"
                />
              </View>
            </>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder="Enter notes"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.clearButton} onPress={clearForm}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, entryType === 'out' && styles.saveButtonOut]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.saveButtonText}>
                  {entryType === 'in' ? 'Save Stock In' : 'Save Stock Out'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Saved Entries Section */}
        <View style={styles.savedEntriesSection}>
          <Text style={styles.savedEntriesTitle}>
            {entryType === 'in' ? '📥 Stock In Entries' : '📤 Stock Out Entries'} ({savedEntries.length})
          </Text>
          {savedEntries.length === 0 ? (
            <Text style={styles.noEntriesText}>No entries yet</Text>
          ) : (
            savedEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryChemicalName}>{entry.chemical_name}</Text>
                  <Text style={styles.entryDate}>
                    {entryType === 'in' ? entry.expiry_date : entry.date_out}
                  </Text>
                </View>
                <View style={styles.entryDetails}>
                  <Text style={styles.entryDetail}>
                    <Text style={styles.detailLabel}>Batch:</Text> {entry.batch_number || entry.mc_no}
                  </Text>
                  <Text style={styles.entryDetail}>
                    <Text style={styles.detailLabel}>Qty:</Text> {entry.quantity} {entry.unit}
                  </Text>
                  {entryType === 'in' && entry.vendor && (
                    <Text style={styles.entryDetail}>
                      <Text style={styles.detailLabel}>Vendor:</Text> {entry.vendor}
                    </Text>
                  )}
                  {entryType === 'in' && entry.location && (
                    <Text style={styles.entryDetail}>
                      <Text style={styles.detailLabel}>Location:</Text> {entry.location}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ✅ Updated QR Scanner Modal with CameraView */}
      <Modal visible={showScanner} animationType="slide">
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <TouchableOpacity style={styles.closeScanner} onPress={() => setShowScanner(false)}>
            <Text style={styles.closeScannerText}>❌ Close Scanner</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#dee2e6' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  subtitle: { fontSize: 14, color: '#6c757d' },
  toggleContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', gap: 12 },
  toggleButton: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 2, borderColor: '#dee2e6', alignItems: 'center' },
  toggleActive: { borderColor: '#007AFF', backgroundColor: '#E3F2FD' },
  toggleText: { fontSize: 16, fontWeight: '600', color: '#6c757d' },
  toggleTextActive: { color: '#007AFF' },
  content: { flex: 1, padding: 20 },
  scanButton: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20 },
  scanButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  formSection: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
  field: { marginBottom: 16 },
  row: { flexDirection: 'row', gap: 16 },
  halfField: { flex: 1 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, padding: 12, fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  pickerContainer: { borderWidth: 1, borderColor: '#ced4da', borderRadius: 8 },
  dateButton: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, padding: 12 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  clearButton: { flex: 1, backgroundColor: '#6c757d', borderRadius: 8, padding: 16, alignItems: 'center' },
  clearButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  saveButton: { flex: 2, backgroundColor: '#28a745', borderRadius: 8, padding: 16, alignItems: 'center' },
  saveButtonOut: { backgroundColor: '#dc3545' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  scannerContainer: { flex: 1 },
  closeScanner: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.7)', padding: 20, borderRadius: 12, alignItems: 'center' },
  closeScannerText: { color: '#fff', fontSize: 18 },
  permissionText: { fontSize: 18, textAlign: 'center', marginTop: 100 },
  permissionButton: { backgroundColor: '#007AFF', margin: 20, padding: 16, borderRadius: 8, alignItems: 'center' },
  permissionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  savedEntriesSection: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginTop: 20 },
  savedEntriesTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#000' },
  noEntriesText: { fontSize: 14, color: '#6c757d', textAlign: 'center', paddingVertical: 20 },
  entryCard: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#dee2e6' },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  entryChemicalName: { fontSize: 16, fontWeight: '600', color: '#000', flex: 1 },
  entryDate: { fontSize: 12, color: '#6c757d' },
  entryDetails: { gap: 4 },
  entryDetail: { fontSize: 14, color: '#333' },
  detailLabel: { fontWeight: '600', color: '#495057' },
});