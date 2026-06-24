/**
 * Chemicals Screen - Fixed & Clean
 */

import { chemicalService } from '@/services/chemicalService';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

type Chemical = {
  id: string;
  name: string;
  cas_number?: string;
  current_stock: number;
  unit: string;
  min_threshold: number;
  location?: string;
  supplier?: string;
  hazard_class?: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
};

interface ChemicalForm {
  name: string;
  cas_number: string;
  quantity: string;
  unit: string;
  location: string;
  supplier: string;
  min_stock_level: string;
  safety_notes: string;
}

const initialForm: ChemicalForm = {
  name: '',
  cas_number: '',
  quantity: '',
  unit: 'kg',
  location: '',
  supplier: '',
  min_stock_level: '',
  safety_notes: '',
};

export default function ChemicalsScreen() {
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ChemicalForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchChemicals = async () => {
    try {
      const data = await chemicalService.getChemicals();
      setChemicals(data);
    } catch (error: any) {
      console.error('Fetch error:', error);
      Alert.alert('Error', error.message || 'Could not load chemicals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChemicals();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChemicals();
  };

  const handleAddPress = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const handleEditPress = (chemical: Chemical) => {
    setEditingId(chemical.id);
    setForm({
      name: chemical.name,
      cas_number: chemical.cas_number || '',
      quantity: chemical.current_stock?.toString() || '',
      unit: chemical.unit || 'kg',
      location: chemical.location || '',
      supplier: chemical.supplier || '',
      min_stock_level: chemical.min_threshold?.toString() || '',
      safety_notes: '',
    });
    setShowModal(true);
  };

  const handleDeletePress = (chemical: Chemical) => {
    Alert.alert('Confirm', `Delete ${chemical.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await chemicalService.deleteChemical(chemical.id);
            setChemicals(chemicals.filter(c => c.id !== chemical.id));
            Alert.alert('Success', 'Chemical deleted');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Delete failed');
          }
        },
      },
    ]);
  };

  const handleSaveChemical = async () => {
    if (!form.name || !form.quantity) {
      Alert.alert('Error', 'Name and Quantity are required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await chemicalService.updateChemical(editingId, form);
        Alert.alert('Success', 'Chemical updated!');
      } else {
        await chemicalService.addChemical(form);
        Alert.alert('Success', 'Chemical added successfully!');
      }

      setShowModal(false);
      setForm(initialForm);
      await fetchChemicals();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredChemicals = chemicals.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.cas_number && c.cas_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isLowStock = (chemical: Chemical) =>
    chemical.current_stock <= (chemical.min_threshold || 0);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or CAS number"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <FlatList
        data={filteredChemicals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.chemicalCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Text style={styles.chemicalName}>{item.name}</Text>
                {isLowStock(item) && <Text style={styles.warningBadge}>⚠️ Low Stock</Text>}
              </View>
              <View style={styles.actions}>
                <Pressable onPress={() => handleEditPress(item)}>
                  <Text style={styles.editBtn}>✏️</Text>
                </Pressable>
                <Pressable onPress={() => handleDeletePress(item)}>
                  <Text style={styles.deleteBtn}>🗑️</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.row}>
                <Text style={styles.label}>Stock:</Text>
                <Text style={[styles.value, isLowStock(item) && styles.lowStockText]}>
                  {item.current_stock} {item.unit} (Min: {item.min_threshold})
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Supplier:</Text>
                <Text style={styles.value}>{item.supplier || 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Location:</Text>
                <Text style={styles.value}>{item.location || 'N/A'}</Text>
              </View>
            </View>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⚗️</Text>
            <Text style={styles.emptyText}>No chemicals found</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleAddPress}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit Chemical' : 'Add New Chemical'}
            </Text>
            <Pressable onPress={() => setShowModal(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalForm}>
            <TextInput style={styles.input} placeholder="Name *" value={form.name} onChangeText={(text) => setForm({ ...form, name: text })} />
            <TextInput style={styles.input} placeholder="CAS Number" value={form.cas_number} onChangeText={(text) => setForm({ ...form, cas_number: text })} />
            <TextInput style={styles.input} placeholder="Quantity *" value={form.quantity} onChangeText={(text) => setForm({ ...form, quantity: text })} keyboardType="decimal-pad" />
            <TextInput style={styles.input} placeholder="Unit" value={form.unit} onChangeText={(text) => setForm({ ...form, unit: text })} />
            <TextInput style={styles.input} placeholder="Minimum Stock Level" value={form.min_stock_level} onChangeText={(text) => setForm({ ...form, min_stock_level: text })} keyboardType="decimal-pad" />
            <TextInput style={styles.input} placeholder="Supplier" value={form.supplier} onChangeText={(text) => setForm({ ...form, supplier: text })} />
            <TextInput style={styles.input} placeholder="Location" value={form.location} onChangeText={(text) => setForm({ ...form, location: text })} />

            <TouchableOpacity
              style={[styles.saveBtn, submitting && styles.saveDisabled]}
              onPress={handleSaveChemical}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  searchInput: { borderWidth: 1, borderColor: '#DCDCDC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  listContent: { paddingHorizontal: 16, paddingVertical: 12 },
  chemicalCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, padding: 12, borderWidth: 1, borderColor: '#DCDCDC' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  chemicalName: { fontSize: 16, fontWeight: '700' },
  warningBadge: { fontSize: 12, backgroundColor: '#FFE0B2', color: '#E65100', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  actions: { flexDirection: 'row', gap: 8 },
  editBtn: { fontSize: 18 },
  deleteBtn: { fontSize: 18 },
  cardContent: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { fontSize: 12, fontWeight: '600', color: '#666' },
  value: { fontSize: 12, color: '#333', textAlign: 'right' },
  lowStockText: { color: '#D32F2F', fontWeight: '600' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { fontSize: 32, color: '#fff', fontWeight: '700' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#999' },
  modalContainer: { flex: 1, backgroundColor: '#F5F5F5' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#DCDCDC' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  closeBtn: { fontSize: 24, color: '#666' },
  modalForm: { padding: 16 },
  input: { borderWidth: 1, borderColor: '#DCDCDC', borderRadius: 10, padding: 12, marginBottom: 12, backgroundColor: '#fff' },
  saveBtn: { backgroundColor: '#2E7D32', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  saveDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});