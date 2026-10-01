import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { chemicalService } from '@/services/chemicalService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { formatStock } from '../../utils/stockCalculation';

interface Chemical {
  id: string;
  name: string;
  user_id: string;
  total_stock: number;
  current_stock: number;
  unit: string;
  min_threshold: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  hazard_class: string | null;
  created_at: string;
  stock_percentage: number;
}

export default function ChemicalListScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { filter } = useLocalSearchParams();
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>(
    filter === 'low' || filter === 'out' ? (filter as 'all' | 'low' | 'out') : 'all'
  );
  const [stockOutHistory, setStockOutHistory] = useState<any[]>([]);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [selectedChemical, setSelectedChemical] = useState<Chemical | null>(null);

  useEffect(() => {
    if (filter === 'low' || filter === 'out' || filter === 'all') {
      setFilterStatus(filter as 'all' | 'low' | 'out');
    }
  }, [filter]);

  useEffect(() => {
    loadChemicals();

    let unsub: (() => Promise<void>) | null = null;
    (async () => {
      try {
        unsub = await chemicalService.subscribeToChemicals(async () => {
          await loadChemicals(false);
        });
      } catch (e) {
        console.warn('Failed to subscribe to chemicals realtime updates', e);
      }
    })();

    return () => {
      if (unsub) unsub().catch(() => { });
    };
  }, [user]);

  const loadChemicals = async (showloader = true) => {
    try {
      if (showloader) {
        setLoading(true);
      }

      if (!user) {
        Alert.alert('Error', 'Please login to view chemicals');
        return;
      }

      const data = await chemicalService.getChemicals();
      const processedData = (data || []).map((chem: any) => {
        const currentStock = parseFloat(chem.current_stock) || 0;
        const minThreshold = parseFloat(chem.min_threshold) || 0;
        const maxStock = minThreshold * 3 || 1;
        const stockPercentage = currentStock > 0
          ? Math.min(Math.round((currentStock / maxStock) * 100), 100)
          : 0;

        return {
          ...chem,
          current_stock: currentStock,
          min_threshold: minThreshold,
          stock_percentage: stockPercentage,
          hazard_class: chem.hazard_class || 'Unknown',
        } as Chemical;
      });

      setChemicals(processedData);
    } catch (error: any) {
      console.error('Error loading chemicals:', error);
      Alert.alert('Error', 'Failed to load chemicals. Please try again.');
      setChemicals([]);
    } finally {
      if (showloader) setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChemicals(false);
  };

  const fetchStockOutHistory = async (chemicalId: string) => {
    try {
      const { data, error } = await supabase
        .from('stock_out')
        .select('*')
        .eq('chemical_id', chemicalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStockOutHistory(data || []);
    } catch (error: any) {
      console.error('Error fetching stock out history:', error);
      Alert.alert('Error', 'Failed to load stock out history');
    }
  };

  const handleViewStockOut = (chemical: Chemical) => {
    setSelectedChemical(chemical);
    fetchStockOutHistory(chemical.id);
    setShowStockOutModal(true);
  };

  const handleFilterPress = (nextFilter: 'all' | 'low' | 'out') => {
    setFilterStatus(nextFilter);
    router.setParams({ filter: nextFilter });
  };

  const filteredChemicals = useMemo(() => {
    let filtered = chemicals;

    if (searchQuery.trim()) {
      filtered = filtered.filter(chemical =>
        chemical.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (filterStatus) {
      case 'low':
        filtered = filtered.filter(c =>
          c.current_stock > 0 && c.current_stock <= c.min_threshold
        );
        break;
      case 'out':
        filtered = filtered.filter(c => c.current_stock <= 0);
        break;
    }

    return filtered;
  }, [chemicals, searchQuery, filterStatus]);

  const renderChemicalItem = ({ item }: { item: Chemical }) => (
    <TouchableOpacity style={styles.chemicalItem}>
      <View style={styles.chemicalHeader}>
        <View style={styles.chemicalInfo}>
          <ThemedText style={styles.chemicalName} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <View style={styles.dangerBadge}>
            <ThemedText style={styles.dangerText}>
              {(item.hazard_class || 'Unknown').toUpperCase()}
            </ThemedText>
          </View>
        </View>
        <View style={styles.stockInfo}>
          <ThemedText style={styles.stockValue}>
            {formatStock(item.current_stock)} {item.unit}
          </ThemedText>
          <View style={styles.stockBar}>
            <View
              style={[
                styles.stockProgress,
                {
                  width: `${item.stock_percentage}%`,
                  backgroundColor:
                    item.current_stock <= 0
                      ? '#dc3545'
                      : item.current_stock <= item.min_threshold
                        ? '#ffc107'
                        : '#28a745',
                },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.chemicalDetails}>
        <View style={styles.detailRow}>
          <ThemedText style={styles.detailLabel}>Total Stock:</ThemedText>
          <ThemedText style={styles.detailValue}>
            {formatStock(item.total_stock)} {item.unit}
          </ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText style={styles.detailLabel}>Current Stock:</ThemedText>
          <ThemedText style={[styles.detailValue, styles.currentStockValue]}>
            {formatStock(item.current_stock)} {item.unit}
          </ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText style={styles.detailLabel}>Min Threshold:</ThemedText>
          <ThemedText style={styles.detailValue}>
            {formatStock(item.min_threshold)} {item.unit}
          </ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText style={styles.detailLabel}>Stock %:</ThemedText>
          <ThemedText style={styles.detailValue}>
            {item.stock_percentage.toFixed(1)}%
          </ThemedText>
        </View>
      </View>

      {item.start_date && item.end_date && (
        <View style={styles.dateSection}>
          <ThemedText style={styles.dateText}>
            📅 {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
          </ThemedText>
        </View>
      )}

      <TouchableOpacity
        style={styles.stockOutButton}
        onPress={() => handleViewStockOut(item)}
      >
        <Ionicons name="list-outline" size={16} color="#2E7D32" />
        <ThemedText style={styles.stockOutButtonText}>View Stock Out History</ThemedText>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <ThemedText style={styles.headerTitle} type="title">
        Chemical Inventory
      </ThemedText>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6c757d" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search chemicals..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#6c757d"
        />
      </View>

      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'All', count: chemicals.length },
          {
            key: 'low',
            label: 'Low Stock',
            count: chemicals.filter(
              c => c.current_stock > 0 && c.current_stock <= c.min_threshold
            ).length,
          },
          {
            key: 'out',
            label: 'Out of Stock',
            count: chemicals.filter(c => c.current_stock <= 0).length,
          },
        ].map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              filterStatus === filter.key && styles.activeFilterTab,
            ]}
            onPress={() => handleFilterPress(filter.key as 'all' | 'low' | 'out')}
          >
            <ThemedText
              style={[
                styles.filterTabText,
                filterStatus === filter.key && styles.activeFilterTabText,
              ]}
            >
              {filter.label}
              {filter.count >= 0 && (
                <ThemedText style={styles.filterCount}> ({filter.count})</ThemedText>
              )}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <ThemedText style={styles.loadingText}>Loading chemicals...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={filteredChemicals}
        renderItem={renderChemicalItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="flask-outline" size={64} color="#6c757d" />
            <ThemedText style={styles.emptyText}>
              {searchQuery ? 'No chemicals found' : 'No chemicals available'}
            </ThemedText>
          </View>
        }
      />

      <Modal
        visible={showStockOutModal}
        animationType="slide"
        onRequestClose={() => setShowStockOutModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle} type="subtitle">
              Stock Out History
            </ThemedText>
            <TouchableOpacity onPress={() => setShowStockOutModal(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalChemicalInfo}>
            <ThemedText style={styles.modalChemicalName}>
              {selectedChemical?.name}
            </ThemedText>
            <ThemedText style={styles.modalChemicalStock}>
              Current: {formatStock(selectedChemical?.current_stock || 0)} {selectedChemical?.unit}
            </ThemedText>
          </View>

          <FlatList
            data={stockOutHistory}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
            ListEmptyComponent={
              <View style={styles.modalEmpty}>
                <Ionicons name="document-text-outline" size={48} color="#6c757d" />
                <ThemedText style={styles.modalEmptyText}>No stock out records</ThemedText>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.stockOutItem}>
                <View style={styles.stockOutItemHeader}>
                  <ThemedText style={styles.stockOutDate}>
                    {new Date(item.date_out).toLocaleDateString()}
                  </ThemedText>
                  <ThemedText style={styles.stockOutQuantity}>
                    -{item.stock_kg}kg {item.stock_g}g {item.stock_mg}mg
                  </ThemedText>
                </View>
                <ThemedText style={styles.stockOutMcNo}>
                  MC/No: {item.mc_no}
                </ThemedText>
              </View>
            )}
          />
        </View>
      </Modal>
    </ThemedView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6c757d',
  },
  listContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
    paddingVertical: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeFilterTab: {
    backgroundColor: '#49d137',
  },
  filterTabText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: '#fff',
  },
  filterCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  chemicalItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chemicalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  chemicalInfo: {
    flex: 1,
    marginRight: 16,
  },
  chemicalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  dangerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#dc354520',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  dangerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc3545',
  },
  stockInfo: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  stockValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#000',
  },
  stockBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  stockProgress: {
    height: '100%',
    borderRadius: 3,
  },
  chemicalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginRight: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  currentStockValue: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  dateSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateText: {
    fontSize: 12,
    color: '#6c757d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 16,
    textAlign: 'center',
  },
  stockOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  stockOutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalChemicalInfo: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalChemicalName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalChemicalStock: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '500',
  },
  modalList: {
    padding: 16,
  },
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  modalEmptyText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 12,
  },
  stockOutItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  stockOutItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stockOutDate: {
    fontSize: 14,
    color: '#6c757d',
  },
  stockOutQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc3545',
  },
  stockOutMcNo: {
    fontSize: 13,
    color: '#495057',
  },
});