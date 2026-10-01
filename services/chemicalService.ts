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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated. Please login.');

      console.log('📤 Sending to Supabase:', data);

      const { data: result, error } = await supabase
        .from('chemicals')
        .insert({
          user_id: user.id,
          name: data.name,
          total_stock: parseFloat(data.total_stock || data.quantity) || 0,
          current_stock: parseFloat(data.current_stock || data.quantity) || 0,
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

  // ✅ GET ALL CHEMICALS (Shared Company Inventory)
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


  // Subscribe to realtime changes for chemicals. Returns unsubscribe function.
  subscribeToChemicals(onChange: (payload: any) => void) {
    // Try to use Supabase Realtime (postgres_changes) if available
    try {
      // channel API available in newer supabase-js
      // subscribe to INSERT/UPDATE/DELETE on chemicals
      // Note: this may be a no-op if realtime is not configured on the project
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

      // Return unsubscribe
      return async () => {
        try {
          if (channel && channel.unsubscribe) await channel.unsubscribe();
        } catch (e) {
          console.warn('Failed to unsubscribe supabase channel', e);
        }
      };
    } catch (err) {
      // Fallback: simple polling every 10s
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

  // ✅ UPDATE CHEMICAL
  async updateChemical(id: string, data: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated.');

      const { data: result, error } = await supabase
        .from('chemicals')
        .update({
          name: data.name,
          total_stock: parseFloat(data.total_stock || data.quantity) || 0,
          current_stock: parseFloat(data.current_stock || data.quantity) || 0,
          unit: data.unit || 'kg',
          min_threshold: parseFloat(data.min_threshold || data.min_stock_level) || 25,
        })
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

