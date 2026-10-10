// D:\ReactNative\ChemicalStock\services\chemicalService.ts
import { supabase } from '../lib/supabase';

export interface ChemicalInput {
  name: string;
  cas_number?: string;
  quantity?: string | number;
  total_stock?: string | number;
  current_stock?: string | number;
  unit?: string;
  min_stock_level?: string | number;
  location?: string;
  supplier?: string;
  hazard_class?: string;
  start_date?: string;
  end_date?: string;
}

export const chemicalService = {
  // ✅ ADD CHEMICAL (Total Stock is set statically at creation)
  async addChemical(data: ChemicalInput | any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated. Please login.');

      const initialTotal = parseFloat(data.total_stock || data.quantity || '0') || 0;
      const initialCurrent = parseFloat(data.current_stock ?? data.total_stock ?? data.quantity ?? '0') || initialTotal;

      console.log('📤 Sending to Supabase:', data);

      const { data: result, error } = await supabase
        .from('chemicals')
        .insert({
          user_id: user.id,
          name: data.name,
          total_stock: initialTotal,
          current_stock: initialCurrent,
          unit: data.unit || 'kg',
          min_threshold: parseFloat(data.min_threshold || data.min_stock_level) || 25,
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Please login');
      }

      const { data, error } = await supabase
        .from('chemicals')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase Fetch Error:', error.message);
        throw error;
      }

      return (data || []).map((chem: any) => ({
        ...chem,
        total_stock: Number(chem.total_stock) || 0,
        current_stock: Math.max(0, Number(chem.current_stock) || 0),
        min_threshold: Number(chem.min_threshold) || 25,
      }));
    } catch (error: any) {
      console.error('💥 Fetch Error:', error);
      throw new Error(error.message || 'Failed to fetch chemicals');
    }
  },

  // Realtime subscriber for chemicals
  subscribeToChemicals(onChange: (payload: any) => void) {
    try {
      let channel: any = null;
      if ((supabase as any).channel) {
        channel = (supabase as any)
          .channel('public:chemicals')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'chemicals' },
            (payload: any) => {
              try {
                onChange(payload);
              } catch (e) {
                console.error('Subscriber callback error:', e);
              }
            }
          )
          .subscribe();
      }

      return async () => {
        try {
          if (channel && channel.unsubscribe) await channel.unsubscribe();
        } catch (e) {
          console.warn('Failed to unsubscribe supabase channel', e);
        }
      };
    } catch (err) {
      console.warn('Realtime subscribe failed, falling back to polling', err);
      let cancelled = false;
      const interval = setInterval(async () => {
        if (cancelled) return;
        try {
          const { data: fresh } = await supabase
            .from('chemicals')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
          onChange({ eventType: 'poll', new: fresh });
        } catch (e) {
          console.warn('Polling fetch failed', e);
        }
      }, 10000);

      return async () => {
        cancelled = true;
        clearInterval(interval);
      };
    }
  },

  // ✅ UPDATE CHEMICAL (Preserves Total Stock unless explicitly modified)
  async updateChemical(id: string, data: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated.');

      const updatePayload: any = {
        name: data.name,
        unit: data.unit || 'kg',
        min_threshold: parseFloat(data.min_threshold || data.min_stock_level) || 25,
      };

      if (data.total_stock !== undefined) {
        updatePayload.total_stock = parseFloat(data.total_stock) || 0;
      }
      if (data.current_stock !== undefined) {
        updatePayload.current_stock = parseFloat(data.current_stock) || 0;
      }

      const { data: result, error } = await supabase
        .from('chemicals')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error: any) {
      console.error('💥 Update Error:', error);
      throw new Error(error.message || 'Failed to update');
    }
  },

  // ✅ DELETE CHEMICAL (Soft Delete)
  async deleteChemical(id: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated.');

      const { error } = await supabase
        .from('chemicals')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('💥 Delete Error:', error);
      throw new Error(error.message || 'Failed to delete');
    }
  }
};