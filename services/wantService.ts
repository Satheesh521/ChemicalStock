import { supabase } from '../lib/supabase';
import { Want } from '../lib/types';

export const wantService = {
  async createWant(data: Partial<Want>): Promise<Want> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: result, error } = await supabase
      .from('want')
      .insert({
        user_id: user.id,
        chemical_name: data.chemical_name,
        start_date: data.start_date,
        end_date: data.end_date,
        total_stock: data.total_stock,
        unit: data.unit || 'kg',
        status: data.status || 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  async getWants() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('want')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateWant(id: string, data: Partial<Want>) {
    const { error } = await supabase
      .from('want')
      .update({
        chemical_name: data.chemical_name,
        start_date: data.start_date,
        end_date: data.end_date,
        total_stock: data.total_stock,
        unit: data.unit,
        status: data.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteWant(id: string) {
    const { error } = await supabase
      .from('want')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
