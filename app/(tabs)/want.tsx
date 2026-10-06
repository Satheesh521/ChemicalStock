import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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
  currentStock?: string;
};

export default function WantScreen() {
  const [items, setItems] = useState<WantItem[]>([]);

  const fetchChemicals = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('chemicals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mappedData = data.map((item: any) => ({
        id: item.id,
        chemicalName: item.name,
        startDate: item.start_date,
        endDate: item.end_date,
        totalStock: (item.total_stock ?? item.current_stock ?? '0').toString(),
        currentStock: (item.current_stock ?? '0').toString(),
      }));
      setItems(mappedData);
    }
  }, []);

  // ✅ Auto-refresh when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchChemicals();
    }, [fetchChemicals])
  );

  const addItem = async (item: WantItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      const parsedStock = parseFloat(item.totalStock) || 0;
      const { error } = await supabase.from('chemicals').insert([{
        user_id: user.id,
        name: item.chemicalName,
        start_date: item.startDate,
        end_date: item.endDate,
        current_stock: parsedStock,
        total_stock: parsedStock,
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const parsedStock = parseFloat(item.totalStock) || 0;
      const { error } = await supabase.from('chemicals').update({
        name: item.chemicalName,
        start_date: item.startDate,
        end_date: item.endDate,
        total_stock: parsedStock,
      }).eq('id', id).eq('user_id', user.id);

      if (!error) {
        fetchChemicals();
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      setItems(prev => prev.filter(item => item.id !== id));

      const { error } = await supabase
        .from('chemicals')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        await fetchChemicals();
        throw error;
      }

      await fetchChemicals();
    } catch (error) {
      console.error('Error deleting item:', error);
      await fetchChemicals();
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
          onPress: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from('chemicals').update({ is_active: false }).eq('user_id', user.id);
            }
            setItems([]);
            resetForm();
            Alert.alert('Success', 'All chemicals have been cleared!');
          },
        },
      ]
    );
  }, [resetForm]);

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

    if (!totalStock.trim() || isNaN(Number(totalStock))) {
      Alert.alert('Validation', 'Total stock must be a valid number');
      return;
    }

    try {
      const trimmedName = chemicalName.trim();
      const trimmedTotal = parseFloat(totalStock.trim());

      if (editingId) {
        await updateItem(editingId, {
          id: editingId,
          chemicalName: trimmedName,
          startDate,
          endDate,
          totalStock: trimmedTotal.toString(),
        });
        Alert.alert('Success', 'Chemical updated successfully!');
      } else {
        await addItem({
          id: '',
          chemicalName: trimmedName,
          startDate,
          endDate,
          totalStock: trimmedTotal.toString(),
        });
        Alert.alert('Success', 'Chemical added successfully!');
      }

      resetForm();
    } catch (error: any) {
      console.error('Add/Update Error:', error);
      Alert.alert('Error', error.message || 'Failed to save to database');
    }
  }, [chemicalName, startDate, endDate, startDateObj, endDateObj, totalStock, editingId, resetForm, fetchChemicals]);

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
    if (item.startDate) setStartDateObj(new Date(item.startDate));
    if (item.endDate) setEndDateObj(new Date(item.endDate));
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
            Alert.alert('Success', 'Entry deleted successfully ✅');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete');
          }
        },
      },
    ]);
  }, []);

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