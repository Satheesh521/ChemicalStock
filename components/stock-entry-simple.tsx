import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ChemicalData, QRScanner } from './qr-scanner';

interface StockEntryProps {
  onStockAdded: (stockData: StockEntryData) => void;
  onClose: () => void;
}

interface StockEntryData {
  chemicalName: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  vendor?: string;
  safetyLevel: 'low' | 'medium' | 'high' | 'extreme';
  entryDate: string;
  operator: string;
}

export function StockEntrySimple({ onStockAdded, onClose }: StockEntryProps) {
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<StockEntryData>({
    chemicalName: '',
    batchNumber: '',
    quantity: 0,
    unit: 'kg',
    expiryDate: '',
    vendor: '',
    safetyLevel: 'medium',
    entryDate: new Date().toISOString().split('T')[0],
    operator: 'Current User',
  });

  const handleQRScanSuccess = (qrData: ChemicalData) => {
    // Auto-fill form with QR data
    setFormData(prev => ({
      ...prev,
      chemicalName: qrData.name,
      batchNumber: qrData.batchNumber,
      quantity: qrData.quantity,
      unit: qrData.unit,
      expiryDate: qrData.expiryDate || '',
      vendor: qrData.vendor || '',
      safetyLevel: qrData.safetyLevel || 'medium',
    }));
    setShowQRScanner(false);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.chemicalName.trim()) {
      Alert.alert('❌ Error', 'Please enter chemical name');
      return;
    }

    if (formData.quantity <= 0) {
      Alert.alert('❌ Error', 'Quantity must be greater than 0');
      return;
    }

    if (formData.expiryDate) {
      const expiry = new Date(formData.expiryDate);
      if (isNaN(expiry.getTime())) {
        Alert.alert('❌ Error', 'Invalid expiry date format');
        return;
      }
      
      if (expiry < new Date()) {
        Alert.alert('⚠️ Warning', 'This chemical has expired!', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Anyway', onPress: () => submitStock() },
        ]);
        return;
      }
    }

    submitStock();
  };

  const submitStock = async () => {
    setLoading(true);
    
    try {
      // Simulate API call (replace with actual Django API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('✅ Success', 'Stock added successfully!');
      onStockAdded(formData);
      onClose();
    } catch (error) {
      console.error('Stock entry error:', error);
      Alert.alert('❌ Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSafetyColor = (level: string) => {
    switch (level) {
      case 'low': return '#28a745';
      case 'medium': return '#ffc107';
      case 'high': return '#fd7e14';
      case 'extreme': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getSafetyText = (level: string) => {
    switch (level) {
      case 'low': return '⚡ Low Risk';
      case 'medium': return '⚠️ Medium Risk';
      case 'high': return '🔥 High Risk';
      case 'extreme': return '☢️ Extreme Danger';
      default: return '❓ Unknown';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <ThemedText style={styles.title}>Add Chemical Stock</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* QR Scanner Section */}
        <View style={styles.qrSection}>
          <TouchableOpacity 
            style={styles.qrButton}
            onPress={() => setShowQRScanner(true)}
          >
            <Text style={styles.qrIcon}>📷</Text>
            <ThemedText style={styles.qrText}>Scan QR Code</ThemedText>
            <ThemedText style={styles.qrSubtext}>
              Auto-fill chemical details
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Chemical Information */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Chemical Information</ThemedText>
          
          <View style={styles.field}>
            <ThemedText style={styles.label}>Chemical Name *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.chemicalName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, chemicalName: text }))}
              placeholder="Enter chemical name"
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Batch Number</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.batchNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, batchNumber: text }))}
              placeholder="Enter batch number"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
              <ThemedText style={styles.label}>Quantity *</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.quantity.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, quantity: parseFloat(text) || 0 }))}
                placeholder="0"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={[styles.field, { flex: 1 }]}>
              <ThemedText style={styles.label}>Unit</ThemedText>
              <TouchableOpacity style={styles.input}>
                <Text style={styles.inputText}>{formData.unit}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Expiry Date</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.expiryDate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, expiryDate: text }))}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Vendor</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.vendor}
              onChangeText={(text) => setFormData(prev => ({ ...prev, vendor: text }))}
              placeholder="Enter vendor name"
            />
          </View>
        </View>

        {/* Safety Information */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Safety Information</ThemedText>
          
          <View style={styles.safetyContainer}>
            <TouchableOpacity 
              style={styles.safetySelector}
              onPress={() => {
                // Show safety level picker
                const levels: Array<'low' | 'medium' | 'high' | 'extreme'> = ['low', 'medium', 'high', 'extreme'];
                const currentIndex = levels.indexOf(formData.safetyLevel);
                const nextIndex = (currentIndex + 1) % levels.length;
                setFormData(prev => ({ ...prev, safetyLevel: levels[nextIndex] }));
              }}
            >
              <View style={[styles.safetyIndicator, { backgroundColor: getSafetyColor(formData.safetyLevel) }]} />
              <ThemedText style={styles.safetyText}>{getSafetyText(formData.safetyLevel)}</ThemedText>
              <Text style={styles.safetyArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Entry Information */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Entry Details</ThemedText>
          
          <View style={styles.field}>
            <ThemedText style={styles.label}>Entry Date</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: '#f8f9fa' }]}
              value={formData.entryDate}
              editable={false}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Operator</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: '#f8f9fa' }]}
              value={formData.operator}
              editable={false}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={loading}
          >
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.submitButtonText}>Add Stock</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* QR Scanner Modal */}
      <QRScanner
        visible={showQRScanner}
        onScanSuccess={handleQRScanSuccess}
        onClose={() => setShowQRScanner(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#6c757d',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  qrSection: {
    marginBottom: 24,
  },
  qrButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flexDirection: 'column',
  },
  qrIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  qrText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  qrSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputText: {
    fontSize: 16,
    color: '#000',
  },
  row: {
    flexDirection: 'row',
  },
  safetyContainer: {
    marginBottom: 16,
  },
  safetySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  safetyIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  safetyText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  safetyArrow: {
    color: '#6c757d',
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#28a745',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
