import DateTimePicker from '@react-native-community/datetimepicker';



import { useMemo, useRef, useState } from 'react';



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



import { formatStock } from '../utils/stockCalculation';







// ─────────────────────────────────────────────────────────────────────────────



// Types



// ─────────────────────────────────────────────────────────────────────────────



export type StockOutItem = {



  id: string;



  chemicalName: string;



  machineNo: string;



  stockValue: string;



  stockUnit: 'kg' | 'g' | 'mg';



  dateOut: string;



  timestamp: string; // New field for precise time (HH:MM:SS)



};







export type StockOutFormProps = {



  chemicalName: string;



  setChemicalName: (v: string) => void;



  machineNo: string;



  setMachineNo: (v: string) => void;



  stockKg: string;



  setStockKg: (v: string) => void;



  stockG: string;



  setStockG: (v: string) => void;



  stockMg: string;



  setStockMg: (v: string) => void;



  dateOut: string;



  setDateOut: (v: string) => void;



  showDatePicker: boolean;



  setShowDatePicker: (v: boolean) => void;



  dateOutObj?: Date;



  setDateOutObj: (v?: Date) => void;



  editingId?: string;



  onAddOrUpdate: () => void;



  resetForm: () => void;



  resetAllStockOuts?: () => void;



  formatDate: (d?: string) => string;



  formatDateTime: (dateString: string, timestamp: string) => string;



  items: StockOutItem[];



  onSelectItem: (item: StockOutItem) => void;



  onDeleteItem: (id: string) => void;



  onFocus: () => void;



  onBlur: () => void;



  showSuggestions: boolean;



  suggestions: StockOutItem[];



  onSelectSuggestion: (name: string) => void;



};







// ─────────────────────────────────────────────────────────────────────────────



// Helper Functions



// ─────────────────────────────────────────────────────────────────────────────







// ─────────────────────────────────────────────────────────────────────────────



// Component



// ─────────────────────────────────────────────────────────────────────────────



export function StockOutForm({



  chemicalName,



  setChemicalName,



  machineNo,



  setMachineNo,



  stockKg,



  setStockKg,



  stockG,



  setStockG,



  stockMg,



  setStockMg,



  dateOut,



  setDateOut,



  showDatePicker,



  setShowDatePicker,



  dateOutObj,



  setDateOutObj,



  editingId,



  onAddOrUpdate,



  resetForm,



  resetAllStockOuts,



  formatDate,



  formatDateTime,



  items,



  onSelectItem,



  onDeleteItem,



  onFocus,



  onBlur,



  suggestions,



  onSelectSuggestion,



}: StockOutFormProps) {







  // ── Local state: controls whether suggestion list is visible ───────────────



  const [focusedInput, setFocusedInput] = useState(false);







  // ── Ref guard: prevents blur from hiding list before onPressIn fires ───────



  const isSelectingRef = useRef(false);







  // ── Build filtered suggestion list ────────────────────────────────────────



  const chemicalSuggestions = useMemo(() => {



    if (!chemicalName.trim() || !focusedInput) return [];



    const query = chemicalName.toLowerCase().trim();



    return suggestions



      .filter(



        (item) =>



          item.chemicalName &&



          item.chemicalName.toLowerCase().includes(query)



      )



      .slice(0, 8);



  }, [chemicalName, suggestions, focusedInput]);







  // ─────────────────────────────────────────────────────────────────────────



  // ✅ FIX 1 + FIX 3 — handleSelect



  //    • Calls setChemicalName(name) IMMEDIATELY          → FIX 1



  //    • Calls setFocusedInput(false) right after         → FIX 3



  //    • Sets isSelectingRef so blur won't undo this      → race-condition fix



  // ─────────────────────────────────────────────────────────────────────────



  const handleSelect = (name: string) => {



    isSelectingRef.current = true; // block blur handler



    setChemicalName(name);         // ✅ FIX 1: immediate state update → fills TextInput



    setFocusedInput(false);        // ✅ FIX 3: hide suggestion list instantly



    onSelectSuggestion?.(name);    // notify parent if needed



  };







  // ── Input focus ────────────────────────────────────────────────────────────



  const handleInputFocus = () => {



    setFocusedInput(true);



    onFocus();



  };







  // ── Input blur — guarded with ref + 300ms delay ────────────────────────────



  const handleInputBlur = () => {



    setTimeout(() => {



      if (!isSelectingRef.current) {



        setFocusedInput(false);



        onBlur();



      }



      isSelectingRef.current = false; // reset guard after each cycle



    }, 300); // 300ms gives onPressIn time to fire before blur runs



  };







  // ── Input text change ──────────────────────────────────────────────────────



  const handleInputChange = (text: string) => {



    setChemicalName(text);



    setFocusedInput(text.trim().length > 0);



  };







  // ── Date picker ────────────────────────────────────────────────────────────



  const handleDatePicked = (event: any, selectedDate?: Date) => {



    if (Platform.OS === 'android') setShowDatePicker(false);



    if (selectedDate) {



      setDateOutObj(selectedDate);



      setDateOut(selectedDate.toISOString().split('T')[0]);



    }



  };







  // ─────────────────────────────────────────────────────────────────────────



  // List Header — contains the entire form UI



  // ─────────────────────────────────────────────────────────────────────────



  const renderHeader = () => (



    <View style={styles.headerContainer}>







      {/* Nav Bar */}



      <View style={styles.navBar}>



        <ThemedText type="defaultSemiBold" style={styles.navTitle}>



          Stock Outs Added: {items.length}



        </ThemedText>



        {items.length > 0 && (



          <TouchableOpacity style={styles.resetAllBtn} onPress={resetAllStockOuts}>



            <ThemedText style={styles.resetAllText}>Reset All</ThemedText>



          </TouchableOpacity>



        )}



      </View>







      <ThemedText type="title" style={styles.headerTitle}>



        Stock Out — Remove Chemical



      </ThemedText>







      {/* ── Chemical Name and Machine No Fields ── */}



      <View style={styles.field}>



        <ThemedText style={styles.label}>Chemical name</ThemedText>



        <View style={styles.twoFieldRow}>



          {/* position:relative + zIndex so dropdown overlaps content below */}



          <View style={{ position: 'relative', zIndex: 999, flex: 2, marginRight: 10 }}>







            {/* ✅ FIX 4: value={chemicalName} — bound to state so it reflects selection */}



            <TextInput



              placeholder="Enter chemical name"



              value={chemicalName}           // ✅ FIX 4: value binding



              onChangeText={handleInputChange}



              onFocus={handleInputFocus}



              onBlur={handleInputBlur}



              style={styles.input}



              returnKeyType="next"



            />







            {/* ── Suggestion dropdown ── */}



            {chemicalSuggestions.length > 0 && (



              <View style={styles.suggestionsContainer}>







                {/* ✅ FIX 2: keyboardShouldPersistTaps='always'



                    Without this, keyboard intercepts the first tap and



                    the suggestion press never registers */}



                <FlatList



                  data={chemicalSuggestions}



                  keyExtractor={(item) => item.id}



                  keyboardShouldPersistTaps="always"



                  renderItem={({ item }) => (



                    <TouchableOpacity



                      style={styles.suggestionItem}



                      // ✅ onPressIn fires BEFORE the TextInput blur event,



                      //    ensuring handleSelect runs before blur can hide the list.



                      onPressIn={() => handleSelect(item.chemicalName)}



                      activeOpacity={0.7}



                    >



                      <ThemedText style={styles.suggestionText}>



                        {item.chemicalName}



                      </ThemedText>



                    </TouchableOpacity>



                  )}



                  ItemSeparatorComponent={() => (



                    <View style={styles.suggestionSeparator} />



                  )}



                  style={styles.suggestionsList}



                />



              </View>



            )}



          </View>







          {/* Machine No Field */}



          <View style={styles.machineNoContainer}>



            <TextInput



              placeholder="Mc/No"



              value={machineNo}



              onChangeText={setMachineNo}



              style={styles.input}



              returnKeyType="next"



            />



          </View>



        </View>



      </View>







      {/* ── Stock Out kg / g / mg ── */}



      <View style={styles.field}>



        <ThemedText style={styles.label}>Stock Out</ThemedText>



        <View style={styles.multiUnitContainer}>



          <View style={styles.unitField}>



            <ThemedText style={styles.unitLabel}>kg</ThemedText>



            <TextInput



              placeholder="0"



              value={stockKg}



              onChangeText={setStockKg}



              style={styles.unitInput}



              keyboardType="decimal-pad"



              returnKeyType="next"



            />



          </View>



          <View style={styles.unitField}>



            <ThemedText style={styles.unitLabel}>g</ThemedText>



            <TextInput



              placeholder="0"



              value={stockG}



              onChangeText={setStockG}



              style={styles.unitInput}



              keyboardType="decimal-pad"



              returnKeyType="next"



            />



          </View>



          <View style={styles.unitField}>



            <ThemedText style={styles.unitLabel}>mg</ThemedText>



            <TextInput



              placeholder="0"



              value={stockMg}



              onChangeText={setStockMg}



              style={styles.unitInput}



              keyboardType="decimal-pad"



              returnKeyType="next"



            />



          </View>



        </View>



      </View>







      {/* ── Date Field ── */}



      <View style={styles.field}>



        <ThemedText style={styles.label}>Date</ThemedText>



        <TouchableOpacity



          onPress={() => setShowDatePicker(true)}



          style={[styles.input, styles.dateInput]}>



          <Text style={{ color: '#000' }}>



            {dateOut ? formatDate(dateOut) : 'Pick date'}



          </Text>



        </TouchableOpacity>



      </View>







      {/* ── Current Time Field ── */}



      <View style={styles.field}>



        <ThemedText style={styles.label}>Current Time</ThemedText>



        <View style={[styles.input, styles.timeInput]}>



          <Text style={{ color: '#000' }}>



            {new Date().toLocaleTimeString('en-US', {



              hour: '2-digit',



              minute: '2-digit',



              second: '2-digit',



              hour12: true



            })}



          </Text>



        </View>



      </View>







      {showDatePicker && (



        <DateTimePicker



          value={dateOutObj || new Date()}



          mode="date"



          display={Platform.OS === 'ios' ? 'spinner' : 'default'}



          onChange={handleDatePicked}



        />



      )}







      {/* ── Action Buttons ── */}



      <View style={styles.buttonRow}>



        <TouchableOpacity



          style={[styles.actionBtn, { backgroundColor: '#49d137' }]}



          onPress={onAddOrUpdate}>



          <ThemedText style={styles.actionText} type="defaultSemiBold">



            {editingId ? 'Update' : 'Add Stock Out'}



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







      {/* ── Table Column Headers ── */}



      <ThemedView style={[styles.row, styles.headerRow]}>



        <ThemedText style={[styles.cell, { flex: 2 }]}



          type="subtitle">Chemical</ThemedText>



        <ThemedText style={[styles.cell, { flex: 1, textAlign: 'center' }]}



          type="subtitle">Mc/No</ThemedText>



        <ThemedText style={[styles.cell, { flex: 1, textAlign: 'center' }]}



          type="subtitle">Stock</ThemedText>



        <ThemedText style={[styles.cell, { flex: 1.5, textAlign: 'right' }]}



          type="subtitle">Date</ThemedText>



        <View style={{ width: 44 }} />



      </ThemedView>



    </View>



  );







  // ─────────────────────────────────────────────────────────────────────────



  // Main render — outer FlatList shows the stock-out items table



  // ─────────────────────────────────────────────────────────────────────────



  return (



    <FlatList



      data={items}



      keyExtractor={(i) => i.id}



      keyboardShouldPersistTaps="always"  // ✅ also needed on outer list



      ListHeaderComponent={renderHeader()}



      renderItem={({ item }) => (



        <TouchableOpacity onPress={() => onSelectItem(item)}>



          <ThemedView style={styles.row}>



            <ThemedText



              style={[styles.cell, { flex: 2 }]}



              type="defaultSemiBold"



              numberOfLines={1}>



              {item.chemicalName}



            </ThemedText>







            <ThemedText



              style={[styles.cell, { flex: 1, textAlign: 'center' }]}



              numberOfLines={1}>



              {item.machineNo}



            </ThemedText>







            <ThemedText



              style={[styles.cell, { flex: 1, textAlign: 'center' }]}



              numberOfLines={1}>



              {formatStock(parseFloat(item.stockValue))} {item.stockUnit}



            </ThemedText>







            <ThemedText



              style={[styles.cell, { flex: 1.5, textAlign: 'right' }]}



              numberOfLines={1}>



              {item.timestamp ? formatDateTime(item.dateOut, item.timestamp) : formatDate(item.dateOut)}



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



          <ThemedText>No stock outs yet — add one above.</ThemedText>



        </ThemedView>



      }



    />



  );



}







// ─────────────────────────────────────────────────────────────────────────────



// Styles



// ─────────────────────────────────────────────────────────────────────────────



const styles = StyleSheet.create({



  headerContainer: {



    padding: 30,



    gap: 8,



    backgroundColor: '#f5f5f5',



  },



  empty: {



    flex: 1,



    justifyContent: 'center',



    alignItems: 'center',



    paddingVertical: 40,



  },







  // Suggestion dropdown



  suggestionsContainer: {



    position: 'absolute',



    top: '100%',



    left: 0,



    right: 0,



    backgroundColor: '#fff',



    borderWidth: 1,



    borderColor: '#49d137',



    borderTopWidth: 0,



    borderBottomLeftRadius: 8,



    borderBottomRightRadius: 8,



    zIndex: 1000,



    maxHeight: 200,



    elevation: 8,



    shadowColor: '#000',



    shadowOffset: { width: 0, height: 4 },



    shadowOpacity: 0.3,



    shadowRadius: 6,



    marginTop: 2,



  },



  suggestionItem: {



    padding: 15,



    paddingHorizontal: 20,



    backgroundColor: '#fff',



    minHeight: 50,



    justifyContent: 'center',



    width: '100%',



  },



  suggestionText: {



    fontSize: 16,



    color: '#000',



    fontWeight: '500',



  },



  suggestionSeparator: {



    height: 1,



    backgroundColor: '#f0f0f0',



  },



  suggestionsList: {



    flexGrow: 0,



    backgroundColor: 'transparent',



  },







  // Nav



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







  // Header + Fields



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



  timeInput: {



    justifyContent: 'center',



    height: 44,



    backgroundColor: '#e9ecef',



  },







  // Multi-unit



  multiUnitContainer: {



    flexDirection: 'row',



    gap: 10,



  },



  unitField: {



    flex: 1,



  },



  unitLabel: {



    fontSize: 12,



    marginBottom: 2,



    fontWeight: '600',



    color: '#49d137',



  },



  unitInput: {



    borderWidth: 1,



    borderColor: '#49d137',



    borderRadius: 6,



    padding: 10,



    fontSize: 14,



    backgroundColor: '#f9f9f9',



    textAlign: 'center',



  },







  // Buttons



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







  // Table



  row: {



    flexDirection: 'row',



    alignItems: 'center',



    paddingHorizontal: 12,



    paddingVertical: 10,



    overflow: 'hidden',



  },



  headerRow: {



    borderTopWidth: 1,



    borderColor: '#ddd',



    marginTop: 12,



    backgroundColor: '#051133',



  },



  cell: {



    flex: 1,



    fontSize: 13,



    overflow: 'hidden',



  },



  deleteBtn: {



    width: 44,



    paddingHorizontal: 6,



    paddingVertical: 4,



    backgroundColor: '#ff4d4d',



    borderRadius: 4,



    alignItems: 'center',



    marginLeft: 4,



  },



  deleteText: {



    color: 'white',



  },



  twoFieldRow: {



    flexDirection: 'row',



    alignItems: 'center',



  },



  machineNoContainer: {



    flex: 1,



  },



});