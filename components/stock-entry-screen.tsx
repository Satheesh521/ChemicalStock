import { Camera, CameraView } from 'expo-camera';
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
  Vibration,
  View,
} from 'react-native';

interface StockEntryData {
  chemicalName: string;
  batchNumber: string;
  quantity: string;
  unit: string;
  date: string;
  vendor: string;
  location: string;
  notes: string;
}

interface QRData {
  chemicalName?: string;
  batchNumber?: string;
  quantity?: string;
  unit?: string;
  date?: string;
  vendor?: string;
  location?: string;
  notes?: string;
}

export default function StockEntryScreen() {
  const [formData, setFormData] = useState<StockEntryData>({
    chemicalName: '',
    batchNumber: '',
    quantity: '',
    unit: 'kg',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    location: '',
    notes: '',
  });

  const [showQRScanner, setShowQRScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false); // ✅ NEW: show success banner

  useEffect(() => {
    const getCameraPermissions = async () => {
      const permission = await Camera.getCameraPermissionsAsync();
      setHasPermission(permission.status === 'granted');
    };
    getCameraPermissions();
  }, []);

  const requestCameraPermission = async () => {
    const permission = await Camera.requestCameraPermissionsAsync();
    setHasPermission(permission.status === 'granted');
    if (permission.status === 'granted') {
      setShowQRScanner(true);
    } else {
      Alert.alert('Permission Denied', 'Camera permission is required to scan QR codes.');
    }
  };

  // ✅ FIXED: No Alert popup — directly fills form and closes scanner
  const handleQRCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    console.log('🔍 QR Code Scanned - Raw Data:', data); // Debug log
    setScanned(true);
    Vibration.vibrate(100);

    try {
      const qrData: QRData = parseQRData(data);
      console.log('✅ QR Data Parsed Successfully:', qrData); // Debug log

      // ✅ Fill form directly
      updateFormWithQRData(qrData);
      console.log('📝 Form Updated with QR Data'); // Debug log

      // ✅ Close scanner immediately — no popup
      setShowQRScanner(false);
      setScanned(false);
      console.log('📷 Scanner Closed'); // Debug log

      // ✅ Show small success banner on form (not a blocking Alert)
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 3000);
      console.log('🎉 Success Banner Shown (3 seconds)'); // Debug log

    } catch (error) {
      console.error('❌ QR Scan Error:', error); // Debug log
      // Only show alert for actual errors
      setScanned(false);
      Alert.alert(
        '❌ Invalid QR Code',
        'The QR code format is not valid. Please try again.',
        [
          { text: 'Try Again', onPress: () => setScanned(false) },
          { text: 'Cancel', onPress: () => setShowQRScanner(false) },
        ]
      );
    }
  };

  const parseQRData = (data: string): QRData => {
    try {
      if (data.startsWith('{') && data.endsWith('}')) {
        const parsed = JSON.parse(data);
        return validateQRData(parsed);
      }

      if (data.startsWith('CHEM:')) {
        const parts = data.substring(5).split('|');
        return validateQRData({
          chemicalName: parts[0],
          batchNumber: parts[1],
          quantity: parts[2],
          unit: parts[3] || 'kg',
          date: parts[4],
          vendor: parts[5],
          location: parts[6],
          notes: parts[7],
        });
      }

      return validateQRData({ chemicalName: data });
    } catch (error) {
      throw new Error('Invalid QR code format');
    }
  };

  const validateQRData = (data: any): QRData => {
    const result: QRData = {};
    // FIXED: Use 'in' operator to check for property existence, not truthiness
    if ('chemicalName' in data && typeof data.chemicalName === 'string') result.chemicalName = data.chemicalName.trim();
    if ('batchNumber'  in data && typeof data.batchNumber  === 'string') result.batchNumber  = data.batchNumber.trim();
    if ('quantity'     in data && typeof data.quantity     === 'string') result.quantity     = data.quantity.trim();
    if ('unit'         in data && typeof data.unit         === 'string') result.unit         = data.unit.trim();
    if ('date'         in data && typeof data.date         === 'string') result.date         = data.date.trim();
    if ('vendor'       in data && typeof data.vendor       === 'string') result.vendor       = data.vendor.trim();
    if ('location'     in data && typeof data.location     === 'string') result.location     = data.location.trim();
    if ('notes'        in data && typeof data.notes        === 'string') result.notes        = data.notes.trim();
    return result;
  };

  const updateFormWithQRData = (qrData: QRData) => {
    console.log('🔄 Updating Form with QR Data:', qrData); // Debug log
    
    // FIXED: Force update all fields that exist in QR data, even if empty
    const newFormData = { ...formData };
    if (qrData.chemicalName !== undefined) newFormData.chemicalName = qrData.chemicalName;
    if (qrData.batchNumber !== undefined) newFormData.batchNumber = qrData.batchNumber;
    if (qrData.quantity !== undefined) newFormData.quantity = qrData.quantity;
    if (qrData.unit !== undefined) newFormData.unit = qrData.unit;
    if (qrData.date !== undefined) newFormData.date = qrData.date;
    if (qrData.vendor !== undefined) newFormData.vendor = qrData.vendor;
    if (qrData.location !== undefined) newFormData.location = qrData.location;
    if (qrData.notes !== undefined) newFormData.notes = qrData.notes;
    
    console.log('✅ New Form Data:', newFormData); // Debug log
    setFormData(newFormData);
    
    // Force a re-render by triggering a state update
    setTimeout(() => {
      console.log('🔄 Forced form update check:', formData); // Debug log
    }, 100);
  };

  const handleInputChange = (field: keyof StockEntryData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.chemicalName.trim()) {
      Alert.alert('Validation Error', 'Chemical Name is required.');
      return false;
    }
    if (!formData.batchNumber.trim()) {
      Alert.alert('Validation Error', 'Batch Number is required.');
      return false;
    }
    if (!formData.quantity.trim()) {
      Alert.alert('Validation Error', 'Quantity is required.');
      return false;
    }
    const quantity = parseFloat(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Validation Error', 'Quantity must be a positive number.');
      return false;
    }
    if (!formData.date.trim()) {
      Alert.alert('Validation Error', 'Date is required.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert(
        '✅ Success',
        'Stock entry has been saved successfully!',
        [
          { text: 'OK', onPress: () => handleClear() },
          { text: 'Add Another', style: 'default' },
        ]
      );
    } catch (error) {
      Alert.alert('❌ Error', 'Failed to save stock entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setScanSuccess(false);
    setFormData({
      chemicalName: '',
      batchNumber: '',
      quantity: '',
      unit: 'kg',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      location: '',
      notes: '',
    });
  };

  const openQRScanner = async () => {
    if (hasPermission === false) {
      await requestCameraPermission();
    } else {
      setShowQRScanner(true);
      setScanned(false);
    }
  };

  const QRScannerModal = () => (
    <Modal
      visible={showQRScanner}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setShowQRScanner(false)}
    >
      <View style={styles.scannerContainer}>
        <View style={styles.scannerHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowQRScanner(false)}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.scannerTitle}>Scan QR Code</Text>
          <View style={{ width: 24 }} />
        </View>

        {hasPermission === null ? (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>Requesting camera permission...</Text>
          </View>
        ) : hasPermission === false ? (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionIcon}>📷</Text>
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionSubtext}>
              Please enable camera permissions to scan QR codes
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanned ? undefined : handleQRCodeScanned}
            />

            {/* Scanner overlay */}
            <View style={styles.overlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                <View style={styles.scanLine} />
              </View>
            </View>

            <View style={styles.scannerFooter}>
              <Text style={styles.scannerInstruction}>
                Align QR code within the frame
              </Text>
              <Text style={styles.scannerSubInstruction}>
                Auto-detects and fills form instantly
              </Text>
            </View>
          </>
        )}
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>📦 Stock Entry (In)</Text>

        {/* ✅ QR Scanner Button */}
        <TouchableOpacity style={styles.qrButton} onPress={openQRScanner}>
          <Text style={styles.qrButtonText}>📷 Scan QR Code</Text>
        </TouchableOpacity>

        {/* ✅ Success Banner — shows instead of Alert popup */}
        {scanSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>
              ✅ QR Scanned! Form filled automatically.
            </Text>
          </View>
        )}

        {/* Form Fields */}
        <View style={styles.field}>
          <Text style={styles.label}>Chemical Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.chemicalName}
            onChangeText={(value) => handleInputChange('chemicalName', value)}
            placeholder="Enter chemical name"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Batch Number *</Text>
          <TextInput
            style={styles.input}
            value={formData.batchNumber}
            onChangeText={(value) => handleInputChange('batchNumber', value)}
            placeholder="Enter batch number"
          />
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.field, { flex: 2 }]}>
            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={styles.input}
              value={formData.quantity}
              onChangeText={(value) => handleInputChange('quantity', value)}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Unit</Text>
            <TextInput
              style={styles.input}
              value={formData.unit}
              onChangeText={(value) => handleInputChange('unit', value)}
              placeholder="kg"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Date *</Text>
          <TextInput
            style={styles.input}
            value={formData.date}
            onChangeText={(value) => handleInputChange('date', value)}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Vendor</Text>
          <TextInput
            style={styles.input}
            value={formData.vendor}
            onChangeText={(value) => handleInputChange('vendor', value)}
            placeholder="Enter vendor name"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={formData.location}
            onChangeText={(value) => handleInputChange('location', value)}
            placeholder="Enter storage location"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(value) => handleInputChange('notes', value)}
            placeholder="Enter additional notes"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClear}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Stock In</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <QRScannerModal />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  qrButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // ✅ NEW: Success banner style
  successBanner: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  successBannerText: {
    color: '#155724',
    fontSize: 14,
    fontWeight: '600',
  },

  field: {
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#6c757d',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // QR Scanner Styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -150 }],
    width: 300,
    height: 300,
  },
  scanFrame: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(0, 123, 255, 0.3)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#007AFF',
  },
  topLeft:    { top: -1,    left: -1,  borderTopWidth: 3,    borderLeftWidth: 3  },
  topRight:   { top: -1,    right: -1, borderTopWidth: 3,    borderRightWidth: 3 },
  bottomLeft: { bottom: -1, left: -1,  borderBottomWidth: 3, borderLeftWidth: 3  },
  bottomRight:{ bottom: -1, right: -1, borderBottomWidth: 3, borderRightWidth: 3 },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#007AFF',
    transform: [{ translateY: -1 }],
  },
  scannerFooter: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scannerInstruction: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  scannerSubInstruction: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionIcon:       { fontSize: 64, marginBottom: 20 },
  permissionTitle:      { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  permissionSubtext:    { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  permissionButton:     { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  permissionButtonText: { color: '#fff', fontWeight: '600' },
  permissionText:       { color: '#fff', fontSize: 16, textAlign: 'center' },
});