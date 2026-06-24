// D:\ReactNative\ChemicalStock\services\chemicalService.ts
import { supabase } from '../lib/supabase';

export interface ChemicalInput {
  name: string;
  cas_number?: string;
  quantity: string | number;
  unit?: string;
  min_stock_level?: string | number;
  location?: string;
  supplier?: string;
  hazard_class?: string;
  start_date?: string;
  end_date?: string;
}

export const chemicalService = {
  // ✅ ADD CHEMICAL
  async addChemical(data: ChemicalInput | any) {
    try {
      // ✅ AUTH CHECK
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated. Please login.');

      console.log('📤 Sending to Supabase:', data);

      const { data: result, error } = await supabase
        .from('chemicals')
        .insert({
          user_id: user.id,
          name: data.name,
          cas_number: data.cas_number || null,
          total_stock: parseFloat(data.quantity) || 0,
          current_stock: parseFloat(data.quantity) || 0,
          unit: data.unit || 'kg',
          min_threshold: parseFloat(data.min_stock_level) || 0,
          location: data.location || null,
          supplier: data.supplier || null,
          hazard_class: data.hazard_class || null,
          start_date: data.start_date || null, // ✅ Added for your app
          end_date: data.end_date || null,     // ✅ Added for your app
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase Insert Error:', error.message);
        throw new Error(error.message);
      }

      console.log('✅ DB Saved:', result);
      return result;
    } catch (error: any) {
      console.error('💥 Service Error:', error);
      throw new Error(error.message || 'Failed to add chemical');
    }
  },

  // ✅ GET ALL CHEMICALS
  async getChemicals() {
    try {
      // ✅ AUTH CHECK
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please login');

      const { data, error } = await supabase
        .from('chemicals')
        .select('*')
        .eq('user_id', user.id)       // ✅ Only logged-in user's data
        .eq('is_active', true)        // ✅ Only active chemicals
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase Fetch Error:', error.message);
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      console.error('💥 Fetch Error:', error);
      throw new Error(error.message || 'Failed to fetch chemicals');
    }
  },

  // ✅ UPDATE CHEMICAL (Newly Added)
  async updateChemical(id: string, data: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated.');

      const { data: result, error } = await supabase
        .from('chemicals')
        .update({
          name: data.name,
          cas_number: data.cas_number || null,
          total_stock: parseFloat(data.quantity) || 0,
          current_stock: parseFloat(data.quantity) || 0,
          unit: data.unit || 'kg',
          min_threshold: parseFloat(data.min_stock_level) || 0,
          location: data.location || null,
          supplier: data.supplier || null,
          hazard_class: data.hazard_class || null,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
        })
        .eq('id', id)
        .eq('user_id', user.id) // ✅ Security: Only update own data
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error: any) {
      console.error('💥 Update Error:', error);
      throw new Error(error.message || 'Failed to update');
    }
  },

  // ✅ DELETE CHEMICAL - Soft Delete (Newly Added)
  async deleteChemical(id: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated.');

      const { error } = await supabase
        .from('chemicals')
        .update({ is_active: false }) // ✅ Soft delete (Data won't be lost)
        .eq('id', id)
        .eq('user_id', user.id);      // ✅ Security: Only delete own data

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('💥 Delete Error:', error);
      throw new Error(error.message || 'Failed to delete');
    }
  }
};