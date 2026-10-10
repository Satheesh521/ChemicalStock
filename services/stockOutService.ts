import { supabase } from '../lib/supabase';
import { chemicalService } from './chemicalService';

export interface StockOutInput {
  chemical_id?: string;
  chemical_name: string;
  mc_no: string;
  stock_kg: number;
  stock_g: number;
  stock_mg: number;
  total_stock_kg?: number;
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
      // Use central chemicalService to get authoritative current_stock
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const chems = await chemicalService.getChemicals();
      return (chems || []).map((c: any) => ({ id: c.id, name: c.name, current_stock: Number(c.current_stock) || 0, unit: c.unit }));
    } catch (error: any) {
      console.error('❌ Fetch All Chemicals Error:', error);
      return [];
    }
  },

  // ✅ 3. CREATE STOCK OUT - database trigger handles chem current_stock update
  async addStockOut(data: StockOutInput) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const kg = Number(data.stock_kg) || 0;
      const gInKg = (Number(data.stock_g) || 0) / 1000;
      const mgInKg = (Number(data.stock_mg) || 0) / 1000000;
      const totalOutInKg = Number((kg + gInKg + mgInKg).toFixed(3));

      if (totalOutInKg <= 0) {
        throw new Error('Enter a valid stock quantity to issue.');
      }

      let chemicalId = data.chemical_id;
      let chemicalName = data.chemical_name.trim();

      let query = supabase
        .from('chemicals')
        .select('id, current_stock, name')
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
      const currentStock = Number(chemicalData.current_stock) || 0;

      if (currentStock < totalOutInKg) {
        throw new Error('Entered stock-out quantity exceeds available stock.');
      }

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
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Fetch Stock Outs Error:', error);
      throw error;
    }
  },

  // ✅ 5. DELETE / CANCEL STOCK OUT - permanent delete from database
  async deleteStockOut(id: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error: deleteError } = await supabase
        .from('stock_out')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete stock out record');
    }
  },

  // ✅ 6. UPDATE EXISTING STOCK OUT RECORD - database trigger adjusts inventory by delta
  async updateStockOut(id: string, data: StockOutInput) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: oldRecord, error: fetchErr } = await supabase
        .from('stock_out')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchErr) throw fetchErr;
      if (!oldRecord) throw new Error('Stock out record not found for id: ' + String(id));

      const kg = Number(data.stock_kg) || 0;
      const gInKg = (Number(data.stock_g) || 0) / 1000;
      const mgInKg = (Number(data.stock_mg) || 0) / 1000000;
      const newTotalOutInKg = Number((kg + gInKg + mgInKg).toFixed(3));

      if (oldRecord.chemical_id) {
        const { data: chemical } = await supabase
          .from('chemicals')
          .select('id, current_stock')
          .eq('id', oldRecord.chemical_id)
          .maybeSingle();

        if (chemical) {
          const currentStock = Number(chemical.current_stock) || 0;
          const oldTotalOutInKg = Number(oldRecord.quantity) || 0;
          const delta = Number((newTotalOutInKg - oldTotalOutInKg).toFixed(3));

          if (delta > 0 && currentStock < delta) {
            throw new Error('Entered stock-out quantity exceeds available stock.');
          }
        }
      }

      const { data: result, error } = await supabase
        .from('stock_out')
        .update({
          chemical_name: data.chemical_name,
          mc_no: data.mc_no,
          stock_kg: kg,
          stock_g: Number(data.stock_g) || 0,
          stock_mg: Number(data.stock_mg) || 0,
          quantity: newTotalOutInKg,
          date_out: data.date_out,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error: any) {
      console.error('❌ Update Stock Out Error:', error);
      throw new Error(error.message || 'Failed to update stock out record');
    }
  },
};