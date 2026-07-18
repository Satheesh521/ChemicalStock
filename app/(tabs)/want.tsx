import { supabase } from '@/lib/supabase';

import { useCallback, useEffect, useState } from 'react';

import {
  Alert,

  KeyboardAvoidingView,

  Platform,
} from 'react-native';



import { WantForm } from '@/components/want-form';



type WantItem = {

  id: string;

  chemicalName: string;

  startDate: string;

  endDate: string;

  totalStock: string;

};



export default function WantScreen() {

  const [items, setItems] = useState<WantItem[]>([]);

  useEffect(() => {
    fetchChemicals();
  }, []);

  const fetchChemicals = async () => {
    try {
      const { data, error } = await supabase
        .from('chemicals')
        .select('*')
        .eq('is_active', true);
      if (data) {
        const mappedData = data.map((item: any) => ({
          id: item.id,
          chemicalName: item.name,
          startDate: item.start_date,
          endDate: item.end_date,
          totalStock: item.current_stock.toString(),
        }));
        setItems(mappedData);
      }
    } catch (error) {
      console.error('Error fetching chemicals:', error);
    }
  };

  const addItem = async (item: WantItem) => {
    try {
      const { error } = await supabase.from('chemicals').insert([{
        name: item.chemicalName,
        start_date: item.startDate,
        end_date: item.endDate,
        current_stock: parseFloat(item.totalStock),
        total_stock: parseFloat(item.totalStock),
        unit: 'kg',
        min_threshold: 25,
        is_active: true,
      }]);
      if (!error) {
        fetchChemicals();
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const updateItem = async (id: string, item: WantItem) => {
    try {
      const { error } = await supabase.from('chemicals').update({
        name: item.chemicalName,
        start_date: item.startDate,
        end_date: item.endDate,
        current_stock: parseFloat(item.totalStock),
        total_stock: parseFloat(item.totalStock),
      }).eq('id', id);
      if (!error) {
        fetchChemicals();
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from('chemicals').delete().eq('id', id);
      if (!error) {
        setItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };



  const [chemicalName, setChemicalName] = useState('');

  const [startDate, setStartDate] = useState('');

  const [endDate, setEndDate] = useState('');

  const [showStartPicker, setShowStartPicker] = useState(false);

  const [showEndPicker, setShowEndPicker] = useState(false);

  const [startDateObj, setStartDateObj] = useState<Date | undefined>(undefined);

  const [endDateObj, setEndDateObj] = useState<Date | undefined>(undefined);

  const [totalStock, setTotalStock] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);



  const validateDateRange = useCallback((start: Date, end: Date): boolean => {

    const startNormalized = new Date(start.getFullYear(), start.getMonth(), start.getDate());

    const endNormalized = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    return startNormalized.getTime() <= endNormalized.getTime();

  }, []);



  const handleStartDateChange = useCallback((date: Date) => {

    const iso = date.toISOString().slice(0, 10);

    setStartDate(iso);

    setStartDateObj(date);

    

    if (endDateObj && !validateDateRange(date, endDateObj)) {

      Alert.alert('Invalid Date Range', 'Start date must be before or equal to end date.');

    }

  }, [endDateObj, validateDateRange]);



  const handleEndDateChange = useCallback((date: Date) => {

    const iso = date.toISOString().slice(0, 10);

    setEndDate(iso);

    setEndDateObj(date);

    

    if (startDateObj && !validateDateRange(startDateObj, date)) {

      Alert.alert('Invalid Date Range', 'End date must be after or equal to start date.');

    }

  }, [startDateObj, validateDateRange]);



  const resetForm = useCallback(() => {

    setChemicalName('');

    setStartDate('');

    setEndDate('');

    setStartDateObj(undefined);

    setEndDateObj(undefined);

    setTotalStock('');

    setEditingId(null);

  }, []);



  const resetAllChemicals = useCallback(() => {

    Alert.alert(

      'Reset All Chemicals',

      'Are you sure you want to delete all chemicals? This cannot be undone.',

      [

        { text: 'Cancel', style: 'cancel' },

        {

          text: 'Reset All',

          style: 'destructive',

          onPress: () => {

            setItems([]);

            resetForm();

            Alert.alert('Success', 'All chemicals have been cleared!');

          },

        },

      ]

    );

  }, [setItems, resetForm]);



  const onAddOrUpdate = useCallback(async () => {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {

      Alert.alert('Error', 'Please login first');

      return;

    }



    if (!chemicalName.trim()) {

      Alert.alert('Validation', 'Chemical name is required');

      return;

    }

    if (!startDateObj || !endDateObj) {

      Alert.alert('Validation', 'Please choose start and end dates');

      return;

    }

    

    const startNormalized = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());

    const endNormalized = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());

    

    if (startNormalized.getTime() > endNormalized.getTime()) {

      Alert.alert('Validation', 'Start date must be before or equal to end date');

      return;

    }

    

    if (!totalStock.trim() || !/^[0-9]+$/.test(totalStock)) {

      Alert.alert('Validation', 'Total stock must be a valid number');

      return;

    }



    try {

      const trimmedName = chemicalName.trim();

      const trimmedTotal = parseInt(totalStock.trim());



      if (editingId) {

        const { error } = await supabase

          .from('want')

          .update({

            chemical_name: trimmedName,

            start_date: startDate,

            end_date: endDate,

            total_stock: trimmedTotal,

            unit: 'kg',

          })

          .eq('id', editingId)

          .eq('user_id', user.id);



        if (error) throw error;

        Alert.alert('Success', 'Chemical updated successfully!');

      } else {

        const { error } = await supabase

          .from('want')

          .insert({

            user_id: user.id,

            chemical_name: trimmedName,

            start_date: startDate,

            end_date: endDate,

            total_stock: trimmedTotal,

            unit: 'kg',

          });



        if (error) throw error;

        Alert.alert('Success', 'Chemical added successfully!');

      }



      resetForm();

      // Refresh context list

      // You can call a refresh function from useWant if available

    } catch (error: any) {

      console.error('Add/Update Error:', error);

      Alert.alert('Error', error.message || 'Failed to save to database');

    }

  }, [chemicalName, startDate, endDate, startDateObj, endDateObj, totalStock, editingId, resetForm]);



  const formatDate = useCallback((d?: string) => {

    if (!d) return '';

    const dt = new Date(d);

    if (Number.isNaN(dt.getTime())) return d;

    return dt.toLocaleDateString();

  }, []);



  const onSelectItem = useCallback((item: WantItem) => {

    setChemicalName(item.chemicalName);

    setStartDate(item.startDate);

    setEndDate(item.endDate);

    setStartDateObj(new Date(item.startDate));

    setEndDateObj(new Date(item.endDate));

    setTotalStock(item.totalStock);

    setEditingId(item.id);

  }, []);



  const onDeleteItem = useCallback((id: string) => {

    Alert.alert('Confirm', 'Delete this entry?', [

      { text: 'Cancel', style: 'cancel' },

      {

        text: 'Delete',

        style: 'destructive',

        onPress: async () => {

          try {

            await deleteItem(id);

            Alert.alert('Success', 'Entry deleted from Supabase ✅');

          } catch (error: any) {

            Alert.alert('Error', error.message || 'Failed to delete');

          }

        },

      },

    ]);

  }, [deleteItem]);



  return (

    <KeyboardAvoidingView

      style={{ flex: 1 }}

      behavior={Platform.OS === 'ios' ? 'padding' : undefined}

      keyboardVerticalOffset={80}>

      <WantForm

        chemicalName={chemicalName}

        setChemicalName={setChemicalName}

        startDate={startDate}

        setStartDate={setStartDate}

        endDate={endDate}

        setEndDate={setEndDate}

        showStartPicker={showStartPicker}

        setShowStartPicker={setShowStartPicker}

        showEndPicker={showEndPicker}

        setShowEndPicker={setShowEndPicker}

        startDateObj={startDateObj}

        setStartDateObj={setStartDateObj}

        endDateObj={endDateObj}

        setEndDateObj={setEndDateObj}

        totalStock={totalStock}

        setTotalStock={setTotalStock}

        editingId={editingId}

        onAddOrUpdate={onAddOrUpdate}

        resetForm={resetForm}

        resetAllChemicals={resetAllChemicals}

        formatDate={formatDate}

        items={items}

        onSelectItem={onSelectItem}

        onDeleteItem={onDeleteItem}

        handleStartDateChange={handleStartDateChange}

        handleEndDateChange={handleEndDateChange}

      />

    </KeyboardAvoidingView>

  );

}

