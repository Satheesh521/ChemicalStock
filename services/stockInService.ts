import { supabase } from '../lib/supabase';
import { CreateStockInInput, StockIn } from '../lib/types';
import { chemicalService } from './chemicalService';

export const stockInService = {
  async createStockIn(input: CreateStockInInput): Promise<StockIn> {
    try {
      // 1. Get the current chemical to update its stock
      const chemicals = await chemicalService.getChemicals();
      const chemical = chemicals.find(c => c.id === input.chemical_id);

      if (!chemical) {
        throw new Error('Chemical not found');
      }

      // 2. Insert into stock_in table
      const { data, error } = await supabase
        .from('stock_in')
        .insert({
          chemical_id: input.chemical_id,
          quantity: input.quantity,
          unit: input.unit || chemical.unit,
          supplier: input.supplier,
          batch_number: input.batch_number,
          expiry_date: input.expiry_date,
          notes: input.notes,
          performed_by: input.performed_by,
          location: input.location,
          purchase_date: input.purchase_date || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;

      // 3. Update the chemical's current_stock and total_stock
      const newStock = Number(chemical.current_stock) + Number(input.quantity);
      const newTotal = Number(chemical.total_stock) + Number(input.quantity);

      await chemicalService.updateChemical(chemical.id, {
        ...chemical,
        current_stock: newStock,
        total_stock: newTotal
      });

      return data;
    } catch (error: any) {
      console.error('Error in createStockIn:', error);
      throw new Error(error.message || 'Failed to record stock in');
    }
  },

  async getStockInHistory(chemicalId?: string) {
    let query = supabase
      .from('stock_in')
      .select('*, chemicals(name)')
      .order('created_at', { ascending: false });

    if (chemicalId) {
      query = query.eq('chemical_id', chemicalId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};
