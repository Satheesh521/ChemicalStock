import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Camera, CameraView } from 'expo-camera';
import { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';

interface QRScannerProps {
  onScanSuccess: (data: ChemicalData) => void;
  onClose: () => void;
  visible: boolean;
}

export interface ChemicalData {
  name: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  qrCode: string;
  vendor?: string;
  safetyLevel?: 'low' | 'medium' | 'high' | 'extreme';
}

export function QRScanner({ onScanSuccess, onClose, visible }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const permission = await Camera.getCameraPermissionsAsync();
      if (permission.status === 'granted') {
        setHasPermission(true);
      } else {
        const newPermission = await Camera.requestCameraPermissionsAsync();
        setHasPermission(newPermission.status === 'granted');
      }
    };

    if (visible) {
      getCameraPermissions();
      setIsScanning(true);
    } else {
      setIsScanning(false);
    }
  }, [visible]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    Vibration.vibrate(100); // Haptic feedback

    try {
      // Parse QR code data
      const chemicalData = parseQRCode(data);
      
      // Validate data
      const validation = validateChemicalData(chemicalData);
      if (!validation.valid) {
        Alert.alert('❌ Invalid QR Code', validation.error);
        setScanned(false);
        return;
      }

      onScanSuccess(chemicalData);
      
      // Success feedback
      Alert.alert(
        '✅ Chemical Scanned',
        `${chemicalData.name}\nBatch: ${chemicalData.batchNumber}\nQuantity: ${chemicalData.quantity} ${chemicalData.unit}`,
        [
          { text: 'Scan Another', onPress: () => setScanned(false) },
          { text: 'Done', onPress: onClose },
        ]
      );
    } catch (error) {
      Alert.alert('❌ Scan Error', 'Invalid QR code format. Please try again.');
      setScanned(false);
    }
  };

  const parseQRCode = (qrData: string): ChemicalData => {
    // Support multiple QR code formats
    
    // Format 1: Custom chemical format
    if (qrData.startsWith('CHEM:')) {
      const parts = qrData.substring(5).split('|');
      return {
        name: parts[0] || 'Unknown Chemical',
        batchNumber: parts[1] || 'N/A',
        quantity: parseFloat(parts[2]) || 0,
        unit: parts[3] || 'kg',
        expiryDate: parts[4] || undefined,
        vendor: parts[5] || undefined,
        safetyLevel: (parts[6] as any) || 'medium',
        qrCode: qrData,
      };
    }
    
    // Format 2: JSON format
    if (qrData.startsWith('{') && qrData.endsWith('}')) {
      try {
        const parsed = JSON.parse(qrData);
        return {
          name: parsed.name || parsed.chemicalName || 'Unknown Chemical',
          batchNumber: parsed.batchNumber || parsed.batch || 'N/A',
          quantity: parseFloat(parsed.quantity) || 0,
          unit: parsed.unit || 'kg',
          expiryDate: parsed.expiryDate || parsed.expiry,
          vendor: parsed.vendor,
          safetyLevel: parsed.safetyLevel || parsed.danger || 'medium',
          qrCode: qrData,
        };
      } catch {
        throw new Error('Invalid JSON format');
      }
    }
    
    // Format 3: Simple text - assume it's chemical name
    return {
      name: qrData,
      batchNumber: 'QR-' + Date.now(),
      quantity: 0,
      unit: 'kg',
      safetyLevel: 'medium',
      qrCode: qrData,
    };
  };

  const validateChemicalData = (data: ChemicalData): { valid: boolean; error?: string } => {
    if (!data.name || data.name === 'Unknown Chemical') {
      return { valid: false, error: 'Missing chemical name' };
    }
    
    if (!data.quantity || data.quantity <= 0) {
      return { valid: false, error: 'Invalid quantity' };
    }
    
    if (!['kg', 'g', 'mg', 'l', 'ml'].includes(data.unit)) {
      return { valid: false, error: 'Invalid unit. Must be kg, g, mg, l, or ml' };
    }
    
    // Check expiry date if provided
    if (data.expiryDate) {
      const expiry = new Date(data.expiryDate);
      if (isNaN(expiry.getTime())) {
        return { valid: false, error: 'Invalid expiry date format' };
      }
      
      if (expiry < new Date()) {
        return { valid: false, error: '⚠️ Chemical has expired!' };
      }
    }
    
    return { valid: true };
  };

  if (!visible) return null;

  if (hasPermission === null) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Requesting camera permission...</ThemedText>
      </ThemedView>
    );
  }

  if (hasPermission === false) {
    return (
      <ThemedView style={styles.container}>
        <Text style={styles.errorIcon}>📷</Text>
        <ThemedText style={styles.errorText}>Camera access denied</ThemedText>
        <ThemedText style={styles.errorSubtext}>Please enable camera permissions to scan QR codes</ThemedText>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <ThemedText style={styles.buttonText}>Close</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <ThemedText style={styles.title}>Scan Chemical QR Code</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      
      <View style={styles.overlay}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          <View style={styles.scanLine} />
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText style={styles.instruction}>
          Align QR code within the frame
        </ThemedText>
        <ThemedText style={styles.subInstruction}>
          Supported formats: CHEM: format, JSON, or simple text
        </ThemedText>
        {scanned && (
          <TouchableOpacity 
            style={styles.scanAgainButton} 
            onPress={() => setScanned(false)}
          >
            <ThemedText style={styles.scanAgainText}>Scan Another</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
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
  closeIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
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
    borderColor: 'rgba(73, 209, 55, 0.3)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#49d137',
  },
  topLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#49d137',
    transform: [{ translateY: -1 }],
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  subInstruction: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  scanAgainButton: {
    backgroundColor: '#49d137',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  scanAgainText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  errorSubtext: {
    color: '#6c757d',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
