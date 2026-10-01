import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const getLocalDate = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
};

export default function StockInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [editId, setEditId] = useState<string | null>(null);
  const [chemicalName, setChemicalName] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [pricePerKg, setPricePerKg] = useState('');
  const [boxPrice, setBoxPrice] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [date, setDate] = useState(getLocalDate());
  const [vendor, setVendor] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if editData param exists
  useEffect(() => {
    if (params.editData) {
      try {
        const item = JSON.parse(params.editData as string);
        setEditId(item.id);
        setChemicalName(item.chemical_name || '');
        setBatchNo(item.batch_number || '');
        setQuantity(item.quantity ? item.quantity.toString() : '');
        setUnit(item.unit || 'kg');
        setPricePerKg(item.price_per_kg ? item.price_per_kg.toString() : '');
        setBoxPrice(item.box_price ? item.box_price.toString() : '');
        setTotalAmount(item.total_amount ? item.total_amount.toString() : '');
        setDate(item.date_in || getLocalDate());
        setVendor(item.vendor_name || '');
        setLocation(item.location || '');
        setNotes(item.notes || '');
      } catch (err) {
        console.error('Failed to parse editData:', err);
      }
    }
  }, [params.editData]);

  // Auto calculate total amount based on Quantity and Price per Kg with 3 decimals
  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    const qty = parseFloat(val);
    const price = parseFloat(pricePerKg);
    if (!isNaN(qty) && !isNaN(price)) {
      setTotalAmount((qty * price).toFixed(3));
    } else {
      setTotalAmount('');
    }
  };

  const handlePricePerKgChange = (val: string) => {
    setPricePerKg(val);
    const qty = parseFloat(quantity);
    const price = parseFloat(val);
    if (!isNaN(qty) && !isNaN(price)) {
      setTotalAmount((qty * price).toFixed(3));
    } else {
      setTotalAmount('');
    }
  };

  // Clear Form
  const handleClear = () => {
    setEditId(null);
    setChemicalName('');
    setBatchNo('');
    setQuantity('');
    setUnit('kg');
    setPricePerKg('');
    setBoxPrice('');
    setTotalAmount('');
    setDate(getLocalDate());
    setVendor('');
    setLocation('');
    setNotes('');
  };

  // Save or Update Stock In Data
  const handleSave = async () => {
    if (!chemicalName.trim() || !quantity) {
      Alert.alert('Error', 'Please fill Chemical Name and Quantity fields');
      return;
    }

    setLoading(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        Alert.alert('Error', 'User not authenticated. Please log in again.');
        setLoading(false);
        return;
      }

      const userId = userData.user.id;

      const payload = {
        chemical_name: chemicalName.trim(),
        batch_number: batchNo.trim(),
        quantity: parseFloat(parseFloat(quantity || '0').toFixed(3)),
        unit: unit.trim().toLowerCase(),
        price_per_kg: pricePerKg ? parseFloat(parseFloat(pricePerKg).toFixed(3)) : null,
        box_price: boxPrice ? parseFloat(parseFloat(boxPrice).toFixed(3)) : null,
        total_amount: totalAmount ? parseFloat(parseFloat(totalAmount).toFixed(3)) : null,
        date_in: date,
        vendor_name: vendor.trim(),
        location: location.trim(),
        notes: notes.trim(),
        user_id: userId,
        added_by: userId,
      };

      if (editId) {
        // Update Operation
        const { error } = await supabase
          .from('stock_in')
          .update(payload)
          .eq('id', editId);

        if (error) throw error;

        Alert.alert('Success', 'Stock In entry updated successfully!');
      } else {
        // Insert Operation
        const { error } = await supabase.from('stock_in').insert([payload]);

        if (error) throw error;

        Alert.alert('Success', 'Stock In entry saved successfully!');
      }

      handleClear();
      router.push('/(tabs)/chemicals');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save stock in entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Text style={styles.title}>{editId ? 'Edit Stock Entry (In)' : 'Stock Entry (In)'}</Text>
        <Text style={styles.subtitle}>
          {editId ? 'Update details and save changes' : 'Scan QR or enter manually'}
        </Text>

        {/* QR Scan Button */}
        {!editId && (
          <TouchableOpacity style={styles.qrButton} onPress={() => Alert.alert('QR Scanner', 'Open Camera Scanner')}>
            <Ionicons name="camera-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.qrButtonText}>Scan QR Code</Text>
          </TouchableOpacity>
        )}

        {/* Main Form Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{editId ? 'Edit Details' : 'Stock Details'}</Text>

          {/* Chemical Name */}
          <Text style={styles.label}>Chemical Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter chemical name"
            value={chemicalName}
            onChangeText={setChemicalName}
          />

          {/* Batch / Machine Number */}
          <Text style={styles.label}>Batch/Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter batch or machine number"
            value={batchNo}
            onChangeText={setBatchNo}
          />

          {/* Quantity & Unit Row */}
          <View style={styles.row}>
            <View style={{ flex: 2, marginRight: 10 }}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.000"
                keyboardType="numeric"
                value={quantity}
                onChangeText={handleQuantityChange}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter unit"
                value={unit}
                onChangeText={setUnit}
              />
            </View>
          </View>

          {/* Price Fields Row */}
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>1kg Price</Text>
              <TextInput
                style={styles.input}
                placeholder="0.000"
                keyboardType="numeric"
                value={pricePerKg}
                onChangeText={handlePricePerKgChange}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Box Price</Text>
              <TextInput
                style={styles.input}
                placeholder="0.000"
                keyboardType="numeric"
                value={boxPrice}
                onChangeText={setBoxPrice}
              />
            </View>
          </View>

          {/* Calculated Total Amount */}
          <Text style={styles.label}>Total Amount</Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#E9ECEF' }]}
            placeholder="Auto calculated total"
            keyboardType="numeric"
            value={totalAmount}
            editable={false}
          />

          {/* Date */}
          <Text style={styles.label}>Date</Text>
          <View style={styles.dateContainer}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
              placeholder="Select date"
              value={date}
              onChangeText={setDate}
            />
            <Ionicons name="calendar-outline" size={20} color="#666" style={{ marginRight: 10 }} />
          </View>

          {/* Vendor */}
          <Text style={styles.label}>Vendor</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter vendor name"
            value={vendor}
            onChangeText={setVendor}
          />

          {/* Location */}
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter location"
            value={location}
            onChangeText={setLocation}
          />

          {/* Notes */}
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter notes (optional)"
            multiline={true}
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>{editId ? 'Cancel' : 'Clear'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                editId && { backgroundColor: '#0052FF' },
                loading && { opacity: 0.7 },
              ]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : editId ? 'Update Stock In' : 'Save Stock In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 16,
  },
  qrButton: {
    flexDirection: 'row',
    backgroundColor: '#0052FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  qrButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#212529',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    marginBottom: 14,
    backgroundColor: '#FFF',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    marginBottom: 14,
    backgroundColor: '#FFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#6C757D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  saveButton: {
    flex: 1.2,
    backgroundColor: '#28A745',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});