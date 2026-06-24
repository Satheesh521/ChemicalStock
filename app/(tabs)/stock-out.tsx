import { useMemo, useState } from 'react';

import { Alert } from 'react-native';



import { StockOutForm } from '@/components/stock-out-form';

import { ThemedView } from '@/components/themed-view';

import { useWant, type StockOutItem } from '@/context/want-context-supabase';

import { formatStock, preciseAdd } from '../../utils/stockCalculation';



export default function StockOutScreen() {

  const { stockOutItems, addStockOut, updateStockOut, deleteStockOut, items } = useWant();



  const [chemicalName, setChemicalName] = useState('');

  const [machineNo, setMachineNo] = useState('');

  const [stock, setStock] = useState('');

  const [stockKg, setStockKg] = useState('0');

  const [stockG, setStockG] = useState('0');

  const [stockMg, setStockMg] = useState('0');

  const [dateOut, setDateOut] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [dateOutObj, setDateOutObj] = useState<Date>();

  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  const [showSuggestions, setShowSuggestions] = useState(false);

  const [isSaving, setIsSaving] = useState(false);



  // Autocomplete suggestions logic

  const chemicalSuggestions = useMemo(() => {

    if (!chemicalName.trim()) {

      return [];

    }

    

    const query = chemicalName.toLowerCase().trim();

    return items

      .filter(chemical => 

        chemical.chemicalName.toLowerCase().includes(query)

      )

      .slice(0, 5); // Limit to 5 suggestions

  }, [chemicalName, items]);



  // Autocomplete functions

  const handleSelectSuggestion = (chemicalName: string) => {

    setChemicalName(chemicalName);

    setShowSuggestions(false);

  };



  const handleChemicalNameChange = (text: string) => {

    setChemicalName(text);

    setShowSuggestions(text.trim().length > 0);

  };



  const handleFocus = () => {

    if (chemicalName.trim().length > 0) {

      setShowSuggestions(true);

    }

  };



  const handleBlur = () => {

    // Delay hiding suggestions to allow selection

    setTimeout(() => setShowSuggestions(false), 200);

  };

  

  const toKg = (value: number, unit: 'kg'|'g'|'mg'): number => {

    if (unit === 'g')  return value / 1000;

    if (unit === 'mg') return value / 1_000_000;

    return value;

  };



  const formatDate = (dateString?: string) => {

    if (!dateString) return '';

    try {

      const date = new Date(dateString + 'T00:00:00');

      return date.toLocaleDateString('en-US', {

        month: 'short',

        day: '2-digit',

        year: 'numeric',

      });

    } catch {

      return dateString;

    }

  };



  const formatDateTime = (dateString: string, timestamp: string) => {

    try {

      // Format date: 2026-03-17

      const date = new Date(dateString + 'T00:00:00');

      const formattedDate = date.toLocaleDateString('en-US', {

        month: 'short',

        day: '2-digit',

        year: 'numeric',

      });

      

      // Return combined format: "Mar 17, 2026 06:45 PM"

      return `${formattedDate} ${timestamp}`;

    } catch {

      return `${dateString} ${timestamp}`;

    }

  };



  const resetForm = () => {

    setChemicalName('');

    setMachineNo('');

    setStock('');

    setStockKg('');

    setStockG('');

    setStockMg('');

    setDateOut('');

    setDateOutObj(undefined);

    setEditingId(undefined);

  };



  const resetAllStockOuts = () => {

    if (stockOutItems.length > 0) {

      Alert.alert(

        'Reset All',

        'Delete all stock out records?',

        [

          { text: 'Cancel', style: 'cancel' },

          {

            text: 'Delete All',

            style: 'destructive',

            onPress: async () => {

              try {

                setIsSaving(true);

                await Promise.all(

                  stockOutItems.map(item => deleteStockOut(item.id))

                );

                Alert.alert('Success', 'All records deleted from Supabase ✅');

                resetForm();

              } catch (error) {

                const errorMessage = error instanceof Error ? error.message : 'Failed to delete all';

                Alert.alert('Error', `Failed to delete all: ${errorMessage}`);

              } finally {

                setIsSaving(false);

              }

            }

          }

        ]

      );

    }

  };



  const handleAddOrUpdate = async () => {

    // Step 1: empty field check

    if (!chemicalName.trim()) {

      Alert.alert('Missing', 'Enter chemical name.'); return;

    }

    if (!dateOut) {

      Alert.alert('Missing', 'Select a date.'); return;

    }



    // Step 2: calculate total stock from all three units using precise arithmetic

    const kgNum  = parseFloat(stockKg)  || 0;

    const gNum   = parseFloat(stockG)   || 0;

    const mgNum  = parseFloat(stockMg)  || 0;



    // Use precise addition to avoid floating point errors

    const totalKgFromAllUnits = preciseAdd(kgNum, gNum / 1000, mgNum / 1_000_000);

    

    if (totalKgFromAllUnits <= 0) {

      Alert.alert('Missing', 'Enter stock amount > 0.'); return;

    }



    // Store as kg with exact precision - no rounding

    const stockValue = formatStock(totalKgFromAllUnits);

    const unit = 'kg';



    // Step 3: find chemical (case-insensitive)

    const chemical = items.find(

      i => i.chemicalName.toLowerCase() === chemicalName.trim().toLowerCase()

    );

    if (!chemical) {

      Alert.alert('Not Found', `"${chemicalName}" not in inventory.`);

      return;

    }



    // Step 4: calculate available stock

    // totalStock is ALWAYS plain kg number — just parseFloat

    const totalKg = parseFloat(chemical.totalStock) || 0;



    const alreadyUsedKg = stockOutItems

      .filter(s =>

        s.chemicalName.toLowerCase() === chemicalName.trim().toLowerCase()

        && s.id !== editingId

      )

      .reduce((sum, s) =>

        sum + toKg(parseFloat(s.stockValue) || 0, s.stockUnit), 0

      );



    const availableKg = totalKg - alreadyUsedKg;

    const newEntryKg  = totalKgFromAllUnits; // Use the combined total



    // Step 5: block if not enough stock

    if (newEntryKg > availableKg + 0.000001) {

      Alert.alert(

        '⚠️ Insufficient Stock',

        `Only ${availableKg.toFixed(3)} kg available for "${chemicalName}".\n` +

        `You tried to remove ${newEntryKg.toFixed(3)} kg.` 

      );

      return;

    }



    // Step 6: CAPTURE PRECISE TIMESTAMP when Add Stock Out is clicked

    const now = new Date();

    const timestamp = now.toLocaleTimeString('en-US', {

      hour: '2-digit',

      minute: '2-digit',

      second: '2-digit',

      hour12: true

    }); // Format: "06:45:32 PM"



    // Step 7: save with timestamp

    const newItem: StockOutItem = {

      id: editingId || Date.now().toString(),

      chemicalName: chemicalName.trim(),

      machineNo: machineNo.trim(),

      stockValue,

      stockUnit: unit,

      dateOut,

      timestamp, // Add precise timestamp

    };



    try {

      setIsSaving(true);

      if (editingId) {

        await updateStockOut(editingId, newItem);

        Alert.alert('Success', 'Stock out record updated to Supabase ✅');

      } else {

        await addStockOut(newItem);

        Alert.alert('Success', 'Stock out record saved to Supabase ✅');

      }

      resetForm();

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Failed to save';

      Alert.alert('Error', `Failed to save: ${errorMessage}`);

    } finally {

      setIsSaving(false);

    }

  };



  const handleDeleteItem = (id: string) => {

    Alert.alert(

      'Delete',

      'Delete this stock out record?',

      [

        { text: 'Cancel', style: 'cancel' },

        {

          text: 'Delete',

          style: 'destructive',

          onPress: async () => {

            try {

              await deleteStockOut(id);

              Alert.alert('Success', 'Stock out record deleted from Supabase ✅');

            } catch (error) {

              const errorMessage = error instanceof Error ? error.message : 'Failed to delete';

              Alert.alert('Error', `Failed to delete: ${errorMessage}`);

            }

          }

        }

      ]

    );

  };



  const handleSelectItem = (item: StockOutItem) => {

    setEditingId(item.id);

    setChemicalName(item.chemicalName);

    setMachineNo(item.machineNo);

    setDateOut(item.dateOut);

    setDateOutObj(new Date(item.dateOut + 'T00:00:00'));

    

    // Parse stock back to kg, g, mg based on unit

    const stockValue = parseFloat(item.stockValue);

    if (item.stockUnit === 'kg') {

      const kg = Math.floor(stockValue);

      const remaining = (stockValue - kg) * 1000;

      const g = Math.floor(remaining);

      const mg = Math.round(((remaining - g) * 1000));

      

      setStockKg(kg.toString());

      setStockG(g.toString());

      setStockMg(mg.toString());

    } else if (item.stockUnit === 'g') {

      setStockKg('0');

      setStockG(Math.floor(stockValue).toString());

      setStockMg(Math.round(((stockValue - Math.floor(stockValue)) * 1000)).toString());

    } else if (item.stockUnit === 'mg') {

      setStockKg('0');

      setStockG('0');

      setStockMg(stockValue.toString());

    }

  };



  return (

    <ThemedView style={{ flex: 1 }}>

      <StockOutForm

        chemicalName={chemicalName}

        setChemicalName={handleChemicalNameChange}

        machineNo={machineNo}

        setMachineNo={setMachineNo}

        stockKg={stockKg}

        setStockKg={setStockKg}

        stockG={stockG}

        setStockG={setStockG}

        stockMg={stockMg}

        setStockMg={setStockMg}

        dateOut={dateOut}

        setDateOut={setDateOut}

        showDatePicker={showDatePicker}

        setShowDatePicker={setShowDatePicker}

        dateOutObj={dateOutObj}

        setDateOutObj={setDateOutObj}

        editingId={editingId}

        onAddOrUpdate={handleAddOrUpdate}

        resetForm={resetForm}

        resetAllStockOuts={resetAllStockOuts}

        formatDate={formatDate}

        formatDateTime={formatDateTime}

        items={stockOutItems}

        onSelectItem={handleSelectItem}

        onDeleteItem={handleDeleteItem}

        onFocus={handleFocus}

        onBlur={handleBlur}

        showSuggestions={showSuggestions}

        suggestions={chemicalSuggestions as any}

        onSelectSuggestion={handleSelectSuggestion}

      />

    </ThemedView>

  );

}

