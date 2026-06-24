// services/chemicalService.ts
import { supabase } from '../lib/supabase';

export interface ChemicalInput {
  chemical_name: string;
  start_date: string;
  end_date: string;
  total_stock: string | number;
  created_by?: string;
}

export const chemicalService = {
  async addChemical(data: ChemicalInput) {
    try {
      console.log('📤 Sending to Supabase:', data);

      const { data: result, error } = await supabase
        .from('chemicals')
        .insert({
          chemical_name: data.chemical_name.trim(),
          start_date: data.start_date,
          end_date: data.end_date,
          total_stock: String(data.total_stock),
          created_by: data.created_by || 'anonymous',
          user_id: null, // Firebase user illa na null
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase Insert Error:', error.message);
        throw new Error(error.message);
      }

      console.log('✅ DB Saved:', result);
      return result;
    } catch (error) {
      console.error('💥 Service Error:', error);
      throw error;
    }
  },

  async getChemicals() {
    const { data, error } = await supabase
      .from('chemicals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};
