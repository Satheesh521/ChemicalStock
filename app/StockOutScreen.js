import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function StockOutScreen() {
    const [chemicals, setChemicals] = useState([]);
    const [selectedChemical, setSelectedChemical] = useState('');
    const [mcNo, setMcNo] = useState('');
    const [kg, setKg] = useState('');
    const [g, setG] = useState('');
    const [mg, setMg] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [currentTime, setCurrentTime] = useState('');
    const [stockOutHistory, setStockOutHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchChemicals();
        fetchStockOutHistory();

        const timer = setInterval(() => {
            setCurrentTime(formatTime(new Date()));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (d) => {
        try {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        } catch (e) {
            return d.toLocaleTimeString();
        }
    };

    const fetchChemicals = async () => {
        setRefreshing(true);
        const { data, error } = await supabase.from('chemicals').select('id, name, current_stock');
        if (error) {
            console.error('fetchChemicals', error);
            Alert.alert('Error', 'Unable to load chemicals.');
        } else {
            setChemicals(data || []);
        }
        setRefreshing(false);
    };

    const fetchStockOutHistory = async () => {
        setRefreshing(true);
        // order by date_out desc then timestamp desc
        const { data, error } = await supabase
            .from('stock_out')
            .select('*')
            .order('date_out', { ascending: false });

        if (error) {
            console.error('fetchStockOutHistory', error);
            Alert.alert('Error', 'Unable to load stock out history.');
        } else {
            setStockOutHistory(data || []);
        }
        setRefreshing(false);
    };

    const handleReset = () => {
        setSelectedChemical('');
        setMcNo('');
        setKg('');
        setG('');
        setMg('');
        setDate(new Date());
    };

    const handleAddStockOut = async () => {
        if (!selectedChemical || !mcNo.trim()) {
            Alert.alert('Validation Error', 'Please select a chemical and enter Machine Number (Mc/No).');
            return;
        }

        const valKg = parseFloat(kg) || 0;
        const valG = parseFloat(g) || 0;
        const valMg = parseFloat(mg) || 0;

        const totalCalculatedKg = Number((valKg + (valG / 1000) + (valMg / 1000000)).toFixed(3));

        if (totalCalculatedKg <= 0) {
            Alert.alert('Validation Error', 'Please enter a valid stock out quantity.');
            return;
        }

        setLoading(true);

        const chosenChemical = chemicals.find(c => c.id === selectedChemical);

        // Get Current Authenticated User
        let userId = null;
        try {
            const { data: userData } = await supabase.auth.getUser();
            userId = userData?.user?.id || null;
        } catch (e) {
            console.warn('Could not retrieve user', e);
        }

        // Insert Stock Out Entry
        const insertPayload = {
            chemical_id: selectedChemical,
            chemical_name: chosenChemical?.name || '',
            mc_no: mcNo,
            stock_kg: valKg,
            stock_g: valG,
            stock_mg: valMg,
            quantity: totalCalculatedKg,
            unit: 'kg',
            date_out: date.toISOString().split('T')[0],
            timestamp: currentTime,
            performed_by: userId,
            user_id: userId
        };

        const { error: insertError } = await supabase.from('stock_out').insert([insertPayload]);

        if (insertError) {
            console.error('insertError', insertError);
            Alert.alert('Error Inserting Stock Out', insertError.message || 'Unknown error');
            setLoading(false);
            return;
        }

        // Deduct Current Stock in Chemicals Table
        if (chosenChemical) {
            const prev = Number(chosenChemical.current_stock || 0);
            const updatedStock = Number((prev - totalCalculatedKg).toFixed(3));
            const safeStock = updatedStock < 0 ? 0 : updatedStock;
            const { error: updateError } = await supabase
                .from('chemicals')
                .update({ current_stock: safeStock })
                .eq('id', selectedChemical);

            if (updateError) {
                console.error('updateError', updateError);
                Alert.alert('Warning', 'Stock out recorded but failed to update chemical stock.');
            }
        }

        Alert.alert('Success', 'Stock Out record added successfully!');
        handleReset();
        await fetchStockOutHistory();
        await fetchChemicals();
        setLoading(false);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Header Bar */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Stock Outs: {stockOutHistory.length}</Text>
                <TouchableOpacity
                    onPress={() => { fetchChemicals(); fetchStockOutHistory(); }}
                    style={styles.refreshBtn}
                    disabled={refreshing}
                >
                    <Text style={styles.refreshText}>↻ Refresh</Text>
                </TouchableOpacity>
            </View>

            {/* Chemicals List Card - shows chemical name, current stock and alert */}
            <View style={styles.card}>
                <View style={styles.cardHeaderIcon}>
                    <Text style={{ fontSize: 22, marginRight: 8 }}>🧾</Text>
                    <Text style={styles.cardTitle}>Chemicals</Text>
                </View>

                {chemicals.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptySub}>No chemicals found.</Text>
                    </View>
                ) : (
                    chemicals.map((chem) => {
                        const stock = Number(chem.current_stock || 0);
                        const below = stock < 25;
                        return (
                            <View key={chem.id} style={styles.chemicalItem}>
                                <Text style={styles.chemName}>{chem.name}</Text>
                                <View style={styles.statusContainer}>
                                    <Text style={styles.chemStock}>{stock.toFixed(3)} kg</Text>
                                    {below && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={[styles.statusDot, { backgroundColor: '#ef4444' }]} />
                                            <Text style={styles.statusText}>Below 25kg</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })
                )}
            </View>

            {/* Main Form Card */}
            <View style={styles.card}>
                <View style={styles.cardHeaderIcon}>
                    <Text style={{ fontSize: 24, marginRight: 8 }}>🧪</Text>
                    <Text style={styles.cardTitle}>Stock Out – Remove Chemical</Text>
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { marginRight: 8 }]}>
                        <Text style={styles.label}>Chemical Name *</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedChemical}
                                onValueChange={(itemValue) => setSelectedChemical(itemValue)}
                                mode="dropdown"
                            >
                                <Picker.Item label="Select Chemical" value="" />
                                {chemicals.map((chem) => (
                                    <Picker.Item key={chem.id} label={`${chem.name} (${Number(chem.current_stock || 0)} kg)`} value={chem.id} />
                                ))}
                            </Picker>
                        </View>
                        {selectedChemical ? (
                            <Text style={styles.selectedName}>
                                Selected: {chemicals.find(c => c.id === selectedChemical)?.name || '—'}
                            </Text>
                        ) : null}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mc/No *</Text>
                        <TextInput onChangeText={setMcNo} placeholder="Enter Mc/No" style={styles.input} value={mcNo} />
                    </View>
                </View>

                {/* Quantity (kg, g, mg) */}
                <Text style={styles.label}>Stock Out Quantity *</Text>
                <View style={[styles.row, { marginTop: 6 }]}>
                    <View style={styles.qtyBox}>
                        <TextInput keyboardType="numeric" onChangeText={setKg} placeholder="0" style={styles.input} value={kg} />
                        <Text style={styles.unitLabel}>kg</Text>
                    </View>
                    <View style={styles.qtyBox}>
                        <TextInput keyboardType="numeric" onChangeText={setG} placeholder="0" style={styles.input} value={g} />
                        <Text style={styles.unitLabel}>g</Text>
                    </View>
                    <View style={[styles.qtyBox, { marginRight: 0 }]}>
                        <TextInput keyboardType="numeric" onChangeText={setMg} placeholder="0" style={styles.input} value={mg} />
                        <Text style={styles.unitLabel}>mg</Text>
                    </View>
                </View>

                {/* Date Field */}
                <Text style={styles.label}>Date *</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
                    <Text>📅 {date.toLocaleDateString()}</Text>
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        display="default"
                        mode="date"
                        value={date}
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) setDate(selectedDate);
                        }}
                    />
                )}

                {/* Live Clock Display */}
                <Text style={styles.label}>Current Time</Text>
                <View style={[styles.input, styles.disabledInput]}>
                    <Text>🕒 {currentTime || 'Loading...'}</Text>
                </View>

                {/* Form Action Buttons */}
                <View style={[styles.row, { marginTop: 16 }]}>
                    <TouchableOpacity disabled={loading} onPress={handleAddStockOut} style={styles.addBtn}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.addBtnText}>+ Add Stock Out</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
                        <Text style={styles.resetBtnText}>↻ Reset</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* History Listing Card */}
            <View style={styles.card}>
                {stockOutHistory.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={{ fontSize: 36, marginBottom: 8 }}>📋</Text>
                        <Text style={styles.emptyTitle}>No records found</Text>
                        <Text style={styles.emptySub}>Add a stock out to see it here.</Text>
                    </View>
                ) : (
                    stockOutHistory.map((item) => (
                        <View key={item.id} style={styles.historyItem}>
                            <View>
                                <Text style={styles.historyName}>{item.chemical_name || 'Chemical'} (Mc: {item.mc_no || item.machine_no})</Text>
                                <Text style={styles.historySub}>{item.date_out} | {item.timestamp}</Text>
                            </View>
                            <Text style={styles.historyQty}>-{Number(item.quantity).toFixed(3)} kg</Text>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fbf9', padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
    refreshBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff' },
    refreshText: { color: '#16a34a', fontWeight: '600' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
    cardHeaderIcon: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    inputGroup: { flex: 1 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4, marginTop: 10 },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, backgroundColor: '#fff' },
    disabledInput: { backgroundColor: '#f3f4f6' },
    pickerContainer: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, overflow: 'hidden', justifyContent: 'center' },
    qtyBox: { flex: 1, marginRight: 6, alignItems: 'center' },
    unitLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
    addBtn: { flex: 2, backgroundColor: '#16a34a', padding: 14, borderRadius: 8, alignItems: 'center', marginRight: 8 },
    addBtnText: { color: '#fff', fontWeight: 'bold' },
    resetBtn: { flex: 1, borderWidth: 1, borderColor: '#16a34a', padding: 14, borderRadius: 8, alignItems: 'center' },
    resetBtnText: { color: '#16a34a', fontWeight: 'bold' },
    emptyContainer: { alignItems: 'center', padding: 24 },
    emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
    emptySub: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f3f4f6' },
    historyName: { fontWeight: '600', fontSize: 14, color: '#1f2937' },
    historySub: { fontSize: 12, color: '#9ca3af' },
    historyQty: { fontWeight: 'bold', color: '#dc2626' }
    ,
    chemicalItem: { backgroundColor: '#0f3b12', borderRadius: 8, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chemName: { color: '#fff', fontWeight: '700', fontSize: 15 },
    chemStock: { color: '#fff', fontWeight: '600', fontSize: 14, marginRight: 8 },
    statusContainer: { flexDirection: 'row', alignItems: 'center' },
    statusText: { color: '#fff', marginLeft: 6, fontWeight: '600' },
    statusDot: { width: 12, height: 12, borderRadius: 6, marginLeft: 6 }
});
