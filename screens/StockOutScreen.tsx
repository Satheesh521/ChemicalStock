/**
 * StockOutScreen.tsx
 *
 * Full-screen Stock Out form that lets a user:
 *  • Search and select a chemical from a searchable dropdown
 *  • Auto-fill the Mc/No field from the selected chemical
 *  • Enter stock-out quantity in kg / g / mg
 *  • See the current date and a live-updating clock
 *  • Submit the record via stockOutService.addStockOut()
 *  • Reset the form
 *
 * NOTE: react-native-element-dropdown is not installed in this project.
 *       A self-contained searchable dropdown is implemented using only
 *       React Native core components (same pattern as stock-out-form.tsx).
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ── Services ──────────────────────────────────────────────────────────────────
import { chemicalService } from '../services/chemicalService';
import { stockOutService } from '../services/stockOutService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Minimal shape returned by chemicalService.getChemicals() */
interface Chemical {
  id: string;
  name: string;
  cas_number?: string | null;
  /** The machine / catalog number field, stored as cas_number in DB */
  mc_no?: string | null;
  current_stock?: number;
  unit?: string;
  [key: string]: any; // allow extra DB columns
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format a Date as "Jul 16, 2026"
 */
function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a Date as "10:12:47 pm"
 */
function formatDisplayTime(date: Date): string {
  return date
    .toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
    .toLowerCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function StockOutScreen() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [loadingChemicals, setLoadingChemicals] = useState(false);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChemical, setSelectedChemical] = useState<Chemical | null>(null);
  const [mcNo, setMcNo] = useState('');
  const [stockKg, setStockKg] = useState('');
  const [stockG, setStockG] = useState('');
  const [stockMg, setStockMg] = useState('');

  // ── Dropdown state ──────────────────────────────────────────────────────────
  const [dropdownVisible, setDropdownVisible] = useState(false);
  /** Guard: prevents blur from hiding list before a suggestion tap fires */
  const isSelectingRef = useRef(false);

  // ── Clock state ─────────────────────────────────────────────────────────────
  const [now, setNow] = useState(new Date());

  // ── Submission state ─────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────

  /** Load chemicals on mount */
  useEffect(() => {
    loadChemicals();
  }, []);

  /** Live clock: tick every second */
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Data loading
  // ─────────────────────────────────────────────────────────────────────────

  const loadChemicals = async () => {
    try {
      setLoadingChemicals(true);
      const data = await chemicalService.getChemicals();
      setChemicals(data as Chemical[]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load chemicals');
    } finally {
      setLoadingChemicals(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Dropdown helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** Filtered list based on the current search query */
  const filteredChemicals: Chemical[] = chemicals.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleSearchFocus = () => {
    setDropdownVisible(true);
  };

  const handleSearchBlur = () => {
    // Delay so that onPressIn on a suggestion fires first
    setTimeout(() => {
      if (!isSelectingRef.current) {
        setDropdownVisible(false);
      }
      isSelectingRef.current = false;
    }, 300);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setDropdownVisible(true);
    // If user clears input, deselect
    if (!text.trim()) {
      setSelectedChemical(null);
      setMcNo('');
    }
  };

  /**
   * Select a chemical from the dropdown.
   * Auto-fills Mc/No from `cas_number` (used as machine/catalog number).
   */
  const handleSelectChemical = useCallback((chemical: Chemical) => {
    isSelectingRef.current = true;
    setSelectedChemical(chemical);
    setSearchQuery(chemical.name);
    setDropdownVisible(false);
    // Auto-fill Mc/No: prefer explicit mc_no field, fall back to cas_number
    setMcNo(chemical.mc_no ?? chemical.cas_number ?? '');
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    if (!selectedChemical) {
      Alert.alert('Validation', 'Please select a chemical.');
      return false;
    }
    if (!mcNo.trim()) {
      Alert.alert('Validation', 'Mc/No is required.');
      return false;
    }

    const kg = parseFloat(stockKg) || 0;
    const g = parseFloat(stockG) || 0;
    const mg = parseFloat(stockMg) || 0;

    if (kg === 0 && g === 0 && mg === 0) {
      Alert.alert('Validation', 'Enter a stock-out quantity in at least one unit (kg, g, or mg).');
      return false;
    }
    return true;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────────────────────────────────

  const handleAddStockOut = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      await stockOutService.addStockOut({
        chemical_name: selectedChemical!.name,
        mc_no: mcNo.trim(),
        stock_kg: parseFloat(stockKg) || 0,
        stock_g: parseFloat(stockG) || 0,
        stock_mg: parseFloat(stockMg) || 0,
        date_out: new Date().toISOString().split('T')[0],
      });

      Alert.alert('Success', 'Stock out recorded successfully.');
      handleReset();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add stock out.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Reset
  // ─────────────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setSearchQuery('');
    setSelectedChemical(null);
    setMcNo('');
    setStockKg('');
    setStockG('');
    setStockMg('');
    setDropdownVisible(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
      >
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Stock Out</Text>
          <Text style={styles.headerSubtitle}>Remove Chemical from Stock</Text>
        </View>

        <View style={styles.card}>

          {/* ── Chemical Name (Searchable Dropdown) ──────────────────────── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Chemical Name <Text style={styles.required}>*</Text>
            </Text>

            {/* Input wrapper — position:relative so dropdown overlaps below */}
            <View style={[styles.dropdownWrapper, { zIndex: 100 }]}>
              <TextInput
                style={[
                  styles.input,
                  dropdownVisible && filteredChemicals.length > 0 && styles.inputDropdownOpen,
                ]}
                placeholder="Search chemical name..."
                placeholderTextColor="#aaa"
                value={searchQuery}
                onChangeText={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                returnKeyType="search"
              />

              {/* Loading indicator inside input area */}
              {loadingChemicals && (
                <ActivityIndicator
                  size="small"
                  color="#2e7d32"
                  style={styles.inputLoader}
                />
              )}

              {/* Dropdown list */}
              {dropdownVisible && (
                <View style={styles.dropdown}>
                  {filteredChemicals.length === 0 ? (
                    <View style={styles.dropdownEmpty}>
                      <Text style={styles.dropdownEmptyText}>
                        {chemicals.length === 0
                          ? 'No chemicals found. Add chemicals first.'
                          : 'No records found'}
                      </Text>
                    </View>
                  ) : (
                    <FlatList
                      data={filteredChemicals}
                      keyExtractor={(item) => item.id}
                      keyboardShouldPersistTaps="always"
                      nestedScrollEnabled
                      style={styles.dropdownList}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPressIn={() => handleSelectChemical(item)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.dropdownItemName}>{item.name}</Text>
                          {(item.cas_number || item.mc_no) ? (
                            <Text style={styles.dropdownItemSub}>
                              Mc/No: {item.mc_no ?? item.cas_number}
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                      )}
                      ItemSeparatorComponent={() => (
                        <View style={styles.dropdownSeparator} />
                      )}
                    />
                  )}
                </View>
              )}
            </View>
          </View>

          {/* ── Mc/No ────────────────────────────────────────────────────── */}
          <View style={[styles.fieldGroup, { zIndex: 1 }]}>
            <Text style={styles.label}>
              Mc/No <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Auto-filled from chemical selection"
              placeholderTextColor="#aaa"
              value={mcNo}
              onChangeText={setMcNo}
              returnKeyType="next"
            />
          </View>

          {/* ── Stock Out Quantity ────────────────────────────────────────── */}
          <View style={[styles.fieldGroup, { zIndex: 1 }]}>
            <Text style={styles.label}>Stock Out Quantity</Text>
            <Text style={styles.labelHint}>Enter value in only one unit; leave others at 0</Text>
            <View style={styles.unitRow}>
              {/* kg */}
              <View style={styles.unitCell}>
                <Text style={styles.unitLabel}>kg</Text>
                <TextInput
                  style={styles.unitInput}
                  placeholder="0"
                  placeholderTextColor="#aaa"
                  value={stockKg}
                  onChangeText={setStockKg}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                />
              </View>

              {/* g */}
              <View style={styles.unitCell}>
                <Text style={styles.unitLabel}>g</Text>
                <TextInput
                  style={styles.unitInput}
                  placeholder="0"
                  placeholderTextColor="#aaa"
                  value={stockG}
                  onChangeText={setStockG}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                />
              </View>

              {/* mg */}
              <View style={styles.unitCell}>
                <Text style={styles.unitLabel}>mg</Text>
                <TextInput
                  style={styles.unitInput}
                  placeholder="0"
                  placeholderTextColor="#aaa"
                  value={stockMg}
                  onChangeText={setStockMg}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>

          {/* ── Date ─────────────────────────────────────────────────────── */}
          <View style={[styles.fieldGroup, { zIndex: 1 }]}>
            <Text style={styles.label}>Date</Text>
            <View style={[styles.input, styles.readonlyField]}>
              <Text style={styles.readonlyText}>{formatDisplayDate(now)}</Text>
            </View>
          </View>

          {/* ── Current Time (live) ───────────────────────────────────────── */}
          <View style={[styles.fieldGroup, { zIndex: 1 }]}>
            <Text style={styles.label}>Current Time</Text>
            <View style={[styles.input, styles.readonlyField, styles.timeField]}>
              <Text style={styles.readonlyText}>{formatDisplayTime(now)}</Text>
            </View>
          </View>

          {/* ── Action Buttons ────────────────────────────────────────────── */}
          <View style={[styles.buttonRow, { zIndex: 1 }]}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={handleAddStockOut}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnText}>Add Stock Out</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={handleReset}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Text style={styles.btnText}>Reset</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const GREEN = '#2e7d32';       // dark green — primary brand colour
const GREEN_LIGHT = '#49d137'; // bright green — borders / accents
const WHITE = '#ffffff';
const BG = '#f0f4f0';          // very subtle green-tinted background

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: BG,
  },

  scrollContent: {
    paddingBottom: 48,
  },

  // ── Header bar ───────────────────────────────────────────────────────────
  header: {
    backgroundColor: GREEN,
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },

  // ── Card ─────────────────────────────────────────────────────────────────
  card: {
    margin: 16,
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 20,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  // ── Field ─────────────────────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  labelHint: {
    fontSize: 11,
    color: '#888',
    marginBottom: 6,
    marginTop: -4,
  },
  required: {
    color: '#e53935',
  },

  // ── Text Input ────────────────────────────────────────────────────────────
  input: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#fafafa',
  },
  inputDropdownOpen: {
    borderColor: GREEN_LIGHT,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  inputLoader: {
    position: 'absolute',
    right: 12,
    top: 13,
  },

  // ── Read-only display fields ───────────────────────────────────────────────
  readonlyField: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
  },
  timeField: {
    backgroundColor: '#e8f5e9',
    borderColor: GREEN_LIGHT,
  },
  readonlyText: {
    fontSize: 15,
    color: '#333',
  },

  // ── Searchable Dropdown ───────────────────────────────────────────────────
  dropdownWrapper: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: GREEN_LIGHT,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 220,
    overflow: 'hidden',
    // shadow
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 200,
  },
  dropdownList: {
    flexGrow: 0,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: WHITE,
  },
  dropdownItemName: {
    fontSize: 15,
    color: '#111',
    fontWeight: '500',
  },
  dropdownItemSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  dropdownSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  dropdownEmpty: {
    padding: 20,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  // ── Multi-unit quantity row ───────────────────────────────────────────────
  unitRow: {
    flexDirection: 'row',
    gap: 10,
  },
  unitCell: {
    flex: 1,
    alignItems: 'center',
  },
  unitLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  unitInput: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: GREEN_LIGHT,
    borderRadius: 8,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    fontSize: 16,
    textAlign: 'center',
    color: '#111',
    backgroundColor: '#fafafa',
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: GREEN_LIGHT,
  },
  btnSecondary: {
    backgroundColor: '#9e9e9e',
  },
  btnText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
