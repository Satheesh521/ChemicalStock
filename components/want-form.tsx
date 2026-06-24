import DateTimePicker from '@react-native-community/datetimepicker';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export type WantItem = {
  id: string;
  chemicalName: string;
  startDate: string;
  endDate: string;
  totalStock: string;
};

export type WantFormProps = {
  chemicalName: string;
  setChemicalName: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  showStartPicker: boolean;
  setShowStartPicker: (b: boolean) => void;
  showEndPicker: boolean;
  setShowEndPicker: (b: boolean) => void;
  startDateObj?: Date;
  setStartDateObj: (d?: Date) => void;
  endDateObj?: Date;
  setEndDateObj: (d?: Date) => void;
  totalStock: string;
  setTotalStock: (v: string) => void;
  editingId: string | null;
  onAddOrUpdate: () => void;
  resetForm: () => void;
  resetAllChemicals?: () => void;
  formatDate: (d?: string) => string;
  items: WantItem[];
  onSelectItem: (item: WantItem) => void;
  onDeleteItem: (id: string) => void;
  handleStartDateChange: (date: Date) => void;
  handleEndDateChange: (date: Date) => void;
};

export function WantForm({
  chemicalName,
  setChemicalName,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  showStartPicker,
  setShowStartPicker,
  showEndPicker,
  setShowEndPicker,
  startDateObj,
  setStartDateObj,
  endDateObj,
  setEndDateObj,
  totalStock,
  setTotalStock,
  editingId,
  onAddOrUpdate,
  resetForm,
  resetAllChemicals,
  formatDate,
  items,
  onSelectItem,
  onDeleteItem,
  handleStartDateChange,
  handleEndDateChange,
}: WantFormProps) {
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <ThemedText type="defaultSemiBold" style={styles.navTitle}>
          Chemicals Added: {items.length}
        </ThemedText>
        {items.length > 0 && (
          <TouchableOpacity
            style={styles.resetAllBtn}
            onPress={resetAllChemicals}>
            <ThemedText style={styles.resetAllText}>Reset All</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <ThemedText type="title" style={styles.headerTitle}>
        Want — Add Chemical
      </ThemedText>

      <View style={styles.field}>
        <ThemedText style={styles.label}>Chemical name</ThemedText>
        <TextInput
          placeholder="Enter Chemical Name"
          value={chemicalName}
          onChangeText={setChemicalName}
          style={styles.input}
          returnKeyType="next"
        />
      </View>

      <View style={styles.fieldRow}>
        <View style={{ flex: 1, marginRight: 4 }}>
          <ThemedText style={styles.label}>Start date</ThemedText>
          <TouchableOpacity
            onPress={() => setShowStartPicker(true)}
            style={[styles.input, styles.dateInput]}>
            <Text style={{ color: '#000' }}>{startDate ? formatDate(startDate) : 'Pick date'}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, marginLeft: 4 }}>
          <ThemedText style={styles.label}>End date</ThemedText>
          <TouchableOpacity
            onPress={() => setShowEndPicker(true)}
            style={[styles.input, styles.dateInput]}>
              <Text style={{ color: '#000' }}>{endDate ? formatDate(endDate) : 'Pick date'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={startDateObj ?? new Date()}
          mode="date"
          display="default"
          onChange={(event: any, d?: Date) => {
            if (Platform.OS === 'android' && event?.type === 'dismissed') {
              setShowStartPicker(false);
              return;
            }
            setShowStartPicker(Platform.OS === 'ios');
            if (d) {
              handleStartDateChange(d);
              if (Platform.OS === 'android') setShowStartPicker(false);
            }
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDateObj ?? new Date()}
          mode="date"
          display="default"
          onChange={(event: any, d?: Date) => {
            if (Platform.OS === 'android' && event?.type === 'dismissed') {
              setShowEndPicker(false);
              return;
            }
            setShowEndPicker(Platform.OS === 'ios');
            if (d) {
              handleEndDateChange(d);
              if (Platform.OS === 'android') setShowEndPicker(false);
            }
          }}
        />
      )}

      <View style={styles.fieldInline}>
        <ThemedText style={styles.label}>Total stock</ThemedText>
        <TextInput
          placeholder="Enter Stock"
          value={totalStock}
          onChangeText={setTotalStock}
          keyboardType="numeric"
          style={[styles.input, { width: 140 }]}
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#49d137' }]}
          onPress={onAddOrUpdate}>
          <ThemedText style={styles.actionText} type="defaultSemiBold">
            {editingId ? 'Update' : 'Add'}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#999' }]}
          onPress={resetForm}>
          <ThemedText style={styles.actionText} type="defaultSemiBold">
            Reset
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ThemedView style={[styles.row, styles.headerRow]}>
        <ThemedText style={[styles.cell, { flex: 2 }]} type="subtitle">
          Chemical
        </ThemedText>
        <ThemedText style={styles.cell} type="subtitle">
          Start
        </ThemedText>
        <ThemedText style={styles.cell} type="subtitle">
          End
        </ThemedText>
        <ThemedText style={[styles.cell, { textAlign: 'right' }]} type="subtitle">
          Stock
        </ThemedText>
      </ThemedView>
    </View>
  );

  return (
    <FlatList
      data={items}
      keyExtractor={i => i.id}
      ListHeaderComponent={renderHeader()}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => onSelectItem(item)}>
          <ThemedView style={styles.row}>
            <ThemedText style={[styles.cell, { flex: 2 }]} type="defaultSemiBold">
              {item.chemicalName}
            </ThemedText>
            <ThemedText style={styles.cell}>{item.startDate}</ThemedText>
            <ThemedText style={styles.cell}>{item.endDate}</ThemedText>
            <ThemedText style={[styles.cell, { textAlign: 'right' }]}>
              {item.totalStock}
            </ThemedText>
            <TouchableOpacity
              onPress={() => onDeleteItem(item.id)}
              style={styles.deleteBtn}>
              <ThemedText style={styles.deleteText}>Del</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </TouchableOpacity>
      )}
      ItemSeparatorComponent={() => <ThemedView style={{ height: 1 }} />}
      contentContainerStyle={{ paddingBottom: 48 }}
      ListEmptyComponent={
        <ThemedView style={styles.empty}>
          <ThemedText>No entries yet — add one above.</ThemedText>
        </ThemedView>
      }
    />
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    padding: 30,
    gap: 8,
    backgroundColor: '#f5f5f5',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#49d137',
    marginBottom: 12,
  },
  navTitle: {
    fontSize: 14,
    color: '#49d137',
  },
  resetAllBtn: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  resetAllText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#49d137',
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 4,
    fontSize: 14,
    color: '#000',
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#49d137',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    color: '#000',
    flex: 1,
  },
  dateInput: {
    justifyContent: 'center',
    height: 44,
  },
  fieldInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0e3305',
    borderRadius: 6,
    marginVertical: 4,
  },
  headerRow: {
    borderTopWidth: 1,
    borderColor: '#ddd',
    marginTop: 12,
    backgroundColor: '#051133',
  },
  cell: {
    flex: 1,
  },
  deleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ff4d4d',
    borderRadius: 4,
  },
  deleteText: {
    color: 'white',
  },
  empty: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
