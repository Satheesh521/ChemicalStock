// services/stockOutService.ts
import { supabase } from '../lib/supabase';

export interface StockOutInput {
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
  performed_by?: string;
}

export const stockOutService = {
  // CREATE
  async addStockOut(data: StockOutInput) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from('stock_out')
        .insert({
          user_id: user.id,
          chemical_name: data.chemical_name,
          mc_no: data.mc_no,
          stock_kg: data.stock_kg,
          stock_g: data.stock_g,
          stock_mg: data.stock_mg,
          date_out: data.date_out || new Date().toISOString().split('T')[0],
          performed_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error: any) {
      console.error('Add Stock Out Error:', error);
      throw new Error(error.message || 'Failed to add stock out');
    }
  },

  // READ
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

  // UPDATE
  async updateStockOut(id: string, data: Partial<StockOutInput>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from('stock_out')
        .update({
          chemical_name: data.chemical_name,
          mc_no: data.mc_no,
          stock_kg: data.stock_kg,
          stock_g: data.stock_g,
          stock_mg: data.stock_mg,
          date_out: data.date_out,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update');
    }
  },

  // DELETE
  async deleteStockOut(id: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('stock_out')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete');
    }
  }
};