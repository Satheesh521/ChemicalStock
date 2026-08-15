// services/stockOutService.ts
import { supabase } from '../lib/supabase';

export interface StockOutInput {
  chemical_id?: string;
  chemical_name: string;
  mc_no: string;
  stock_kg: number;
  stock_g: number;
  stock_mg: number;
  date_out?: string;
  purpose?: string;
  department?: string;
  requested_by?: string;
  approved_by?: string;
}

export interface ChemicalSuggestion {
  id: string;
  name: string;
  current_stock: number;
  unit?: string;
}

export const stockOutService = {
  // ✅ 1. SEARCH/FILTER CHEMICALS FOR AUTOCOMPLETE / DROPDOWN
  async searchChemicals(searchQuery: string): Promise<ChemicalSuggestion[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (!searchQuery || searchQuery.trim().length === 0) {
        return this.getAllActiveChemicals();
      }

      const { data, error } = await supabase
        .from('chemicals')
        .select('id, name, current_stock, unit')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .ilike('name', `%${searchQuery.trim()}%`)
        .order('name', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('❌ Search Chemicals Error:', error);
      return [];
    }
  },

  // ✅ 2. GET ALL ACTIVE CHEMICALS FOR DROPDOWN LIST
  async getAllActiveChemicals(): Promise<ChemicalSuggestion[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('chemicals')
        .select('id, name, current_stock, unit')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('❌ Fetch All Chemicals Error:', error);
      return [];
    }
  },

  // ✅ 3. CREATE STOCK OUT & DEDUCT FROM CHEMICALS TABLE
  async addStockOut(data: StockOutInput) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 1. Convert all measurements (kg, g, mg) into Total Kilograms with 3 decimals
      const kg = Number(data.stock_kg) || 0;
      const gInKg = (Number(data.stock_g) || 0) / 1000;
      const mgInKg = (Number(data.stock_mg) || 0) / 1000000;

      const totalOutInKg = Number((kg + gInKg + mgInKg).toFixed(3));

      if (totalOutInKg <= 0) {
        throw new Error('Enter a valid stock quantity to issue.');
      }

      // 2. Fetch Chemical details to check stock availability
      let chemicalId = data.chemical_id;
      let currentStock = 0;
      let chemicalName = data.chemical_name.trim();

      let query = supabase
        .from('chemicals')
        .select('id, current_stock, name')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (chemicalId) {
        query = query.eq('id', chemicalId);
      } else {
        query = query.ilike('name', chemicalName);
      }

      const { data: chemicalData, error: chemFetchError } = await query.maybeSingle();

      if (chemFetchError || !chemicalData) {
        throw new Error(`Chemical "${data.chemical_name}" not found in inventory.`);
      }

      chemicalId = chemicalData.id;
      chemicalName = chemicalData.name;
      currentStock = Number(chemicalData.current_stock) || 0;

      // 3. Stock Check Validation
      if (currentStock < totalOutInKg) {
        throw new Error(
          `Insufficient Stock! Available: ${currentStock.toFixed(3)} kg, Required: ${totalOutInKg.toFixed(3)} kg`
        );
      }

      // 4. Insert entry into stock_out table
      const { data: result, error: insertError } = await supabase
        .from('stock_out')
        .insert({
          user_id: user.id,
          chemical_id: chemicalId,
          chemical_name: chemicalName,
          mc_no: data.mc_no,
          stock_kg: Number(data.stock_kg) || 0,
          stock_g: Number(data.stock_g) || 0,
          stock_mg: Number(data.stock_mg) || 0,
          quantity: totalOutInKg,
          unit: 'kg',
          date_out: data.date_out || new Date().toISOString().split('T')[0],
          performed_by: user.id,
          purpose: data.purpose || 'Dyeing Process',
          department: data.department || 'Dyeing',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 5. Deduct stock from chemicals table (Precise 3-decimal subtraction)
      const updatedStock = Number((currentStock - totalOutInKg).toFixed(3));

      const { error: updateError } = await supabase
        .from('chemicals')
        .update({
          current_stock: updatedStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chemicalId);

      if (updateError) throw updateError;

      return result;
    } catch (error: any) {
      console.error('❌ Add Stock Out Error:', error);
      throw new Error(error.message || 'Failed to perform stock out');
    }
  },

  // ✅ 4. READ ALL STOCK OUTS
  async getStockOuts() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('stock_out')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Fetch Stock Outs Error:', error);
      throw error;
    }
  },

  // ✅ 5. DELETE / CANCEL STOCK OUT (Restores Chemical Stock)
  async deleteStockOut(id: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: stockOutItem, error: fetchErr } = await supabase
        .from('stock_out')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr || !stockOutItem) throw new Error('Record not found.');

      const { error: deleteError } = await supabase
        .from('stock_out')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      if (stockOutItem.chemical_id) {
        const { data: chemical } = await supabase
          .from('chemicals')
          .select('current_stock')
          .eq('id', stockOutItem.chemical_id)
          .single();

        if (chemical) {
          const restoredStock = Number((Number(chemical.current_stock) + Number(stockOutItem.quantity)).toFixed(3));

          await supabase
            .from('chemicals')
            .update({ current_stock: restoredStock })
            .eq('id', stockOutItem.chemical_id);
        }
      }

      return true;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to revert stock out');
    }
  }
};pack