/**
 * Details Screen - Stock In Records Display with Edit/Delete
 */

import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type StockInRecord = {
  id: string;
  chemical_name: string;
  quantity: number;
  unit: string;
  vendor_name: string;
  batch_number: string;
  date_in: string;
  location: string;
  notes: string;
  price_per_kg?: number;
  box_price?: number;
  total_amount?: number;
  created_at: string;
};

export default function DetailsScreen() {
  const router = useRouter();
  const [stockInRecords, setStockInRecords] = useState<StockInRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<StockInRecord | null>(null);

  const fetchStockInRecords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStockInRecords([]);
        return;
      }

      const { data, error } = await supabase
        .from('stock_in')
        .select('*')
        .or(`user_id.eq.${user.id},added_by.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStockInRecords(data || []);
    } catch (error: any) {
      console.error('Fetch error:', error);
      Alert.alert('Error', error.message || 'Could not load stock in records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStockInRecords();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStockInRecords();
  };

  const handleCardPress = (record: StockInRecord) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  const handleCardLongPress = (record: StockInRecord) => {
    Alert.alert(
      'Manage Stock Entry',
      `Choose an action for ${record.chemical_name}`,
      [
        {
          text: 'Update / Edit',
          onPress: () => handleEditRecord(record),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteRecord(record.id),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleEditRecord = (record: StockInRecord) => {
    router.push({
      pathname: '/(tabs)/stockInScreen',
      params: { editData: JSON.stringify(record) },
    });
  };

  const handleDeleteRecord = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('stock_in').delete().eq('id', id);
            if (error) throw error;

            Alert.alert('Success', 'Record deleted successfully');
            fetchStockInRecords();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete record');
          }
        },
      },
    ]);
  };

  const filteredRecords = stockInRecords.filter(r =>
    (r.chemical_name && r.chemical_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.vendor_name && r.vendor_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.batch_number && r.batch_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stock In Details</Text>
        <Text style={styles.headerSubtitle}>Purchase History Records (Long press to edit/delete)</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by chemical, vendor, or batch..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.recordCard}
            onPress={() => handleCardPress(item)}
            onLongPress={() => handleCardLongPress(item)}
            delayLongPress={400}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Text style={styles.chemicalName}>{item.chemical_name || 'N/A'}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>IN</Text>
                </View>
              </View>
              <Text style={styles.recordDate}>
                {item.date_in ? new Date(item.date_in).toLocaleDateString() : 'N/A'}
              </Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.row}>
                <Text style={styles.label}>Quantity:</Text>
                <Text style={styles.value}>{item.quantity} {item.unit}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Vendor:</Text>
                <Text style={styles.value}>{item.vendor_name || 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Batch / Machine:</Text>
                <Text style={styles.value}>{item.batch_number || 'N/A'}</Text>
              </View>
              {item.total_amount ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Total Amount:</Text>
                  <Text style={[styles.value, { color: '#28A745', fontWeight: '700' }]}>
                    ₹{item.total_amount}
                  </Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No stock in records found</Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Stock In Full Details</Text>
            <Pressable onPress={() => setShowDetailModal(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedRecord && (
              <>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Chemical Name</Text>
                  <Text style={styles.detailValue}>{selectedRecord.chemical_name || 'N/A'}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Quantity & Unit</Text>
                  <Text style={styles.detailValue}>{selectedRecord.quantity} {selectedRecord.unit}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>1kg Price</Text>
                  <Text style={styles.detailValue}>
                    {selectedRecord.price_per_kg ? `₹${selectedRecord.price_per_kg}` : 'N/A'}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Box Price</Text>
                  <Text style={styles.detailValue}>
                    {selectedRecord.box_price ? `₹${selectedRecord.box_price}` : 'N/A'}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Total Amount</Text>
                  <Text style={[styles.detailValue, { color: '#28a745', fontWeight: '700' }]}>
                    {selectedRecord.total_amount ? `₹${selectedRecord.total_amount}` : 'N/A'}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Vendor Name</Text>
                  <Text style={styles.detailValue}>{selectedRecord.vendor_name || 'N/A'}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Batch / Machine Number</Text>
                  <Text style={styles.detailValue}>{selectedRecord.batch_number || 'N/A'}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{selectedRecord.location || 'N/A'}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>
                    {selectedRecord.date_in ? new Date(selectedRecord.date_in).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>

                {selectedRecord.notes ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <Text style={styles.detailValue}>{selectedRecord.notes}</Text>
                  </View>
                ) : null}

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Recorded On</Text>
                  <Text style={styles.detailValue}>
                    {selectedRecord.created_at ? new Date(selectedRecord.created_at).toLocaleString() : 'N/A'}
                  </Text>
                </View>

                {/* Direct Action Buttons inside Modal */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 30 }}>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: '#0052FF' }]}
                    onPress={() => {
                      setShowDetailModal(false);
                      handleEditRecord(selectedRecord);
                    }}
                  >
                    <Text style={styles.modalActionText}>Edit Record</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: '#DC3545' }]}
                    onPress={() => {
                      setShowDetailModal(false);
                      handleDeleteRecord(selectedRecord.id);
                    }}
                  >
                    <Text style={styles.modalActionText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#DCDCDC' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2E7D32' },
  headerSubtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  searchInput: { borderWidth: 1, borderColor: '#DCDCDC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  listContent: { paddingHorizontal: 16, paddingVertical: 12 },
  recordCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, padding: 12, borderWidth: 1, borderColor: '#DCDCDC', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  chemicalName: { fontSize: 16, fontWeight: '700', color: '#333' },
  badge: { backgroundColor: '#28a745', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  recordDate: { fontSize: 12, color: '#666' },
  cardContent: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { fontSize: 12, fontWeight: '600', color: '#666' },
  value: { fontSize: 12, color: '#333', textAlign: 'right', fontWeight: '500' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#999' },
  modalContainer: { flex: 1, backgroundColor: '#F5F5F5' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#DCDCDC' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2E7D32' },
  closeBtn: { fontSize: 24, color: '#666', paddingHorizontal: 8 },
  modalContent: { padding: 16 },
  detailSection: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#DCDCDC' },
  detailLabel: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 6 },
  detailValue: { fontSize: 15, color: '#333', fontWeight: '500' },
  modalActionBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalActionText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});