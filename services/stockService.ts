/**
 * Stock Service
 * Handle stock IN/OUT transactions
 */

import { supabase } from '../lib/supabase';
import { chemicalService } from './chemicalService';

type StockTransaction = {
  id: string;
  chemical_id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  reason?: string;
  performed_by?: string;
  created_at: string;
};

// Add stock IN transaction
export const addStockIn = async (
  chemicalId: string,
  quantity: number,
  reason: string,
  performedBy: string
): Promise<StockTransaction> => {
  try {
    // Fetch current chemical
    const chemicals = await chemicalService.getChemicals();
    const chemical = chemicals.find((c: any) => c.id === chemicalId);
    if (!chemical) throw new Error('Chemical not found');

    // Insert transaction
    const { data, error } = await supabase
      .from('stock_transactions')
      .insert([
        {
          chemical_id: chemicalId,
          type: 'IN',
          quantity,
          reason,
          performed_by: performedBy,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Update chemical quantity
    await chemicalService.updateChemical(chemicalId, {
      name: chemical.name,
      quantity: chemical.current_stock + quantity,
      unit: chemical.unit,
    });

    return data;
  } catch (error) {
    console.error('Error adding stock in:', error);
    throw error;
  }
};

// Add stock OUT transaction
export const addStockOut = async (
  chemicalId: string,
  quantity: number,
  reason: string,
  performedBy: string
): Promise<StockTransaction> => {
  try {
    // Fetch current chemical
    const chemicals = await chemicalService.getChemicals();
    const chemical = chemicals.find((c: any) => c.id === chemicalId);
    if (!chemical) throw new Error('Chemical not found');

    // Check if sufficient stock
    if (chemical.current_stock < quantity) {
      throw new Error(
        `अपर्याप्त स्टॉक! उपलब्ध: ${chemical.current_stock} ${chemical.unit}`
      );
    }

    // Insert transaction
    const { data, error } = await supabase
      .from('stock_transactions')
      .insert([
        {
          chemical_id: chemicalId,
          type: 'OUT',
          quantity,
          reason,
          performed_by: performedBy,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Update chemical quantity
    await chemicalService.updateChemical(chemicalId, {
      name: chemical.name,
      quantity: chemical.current_stock - quantity,
      unit: chemical.unit,
    });

    return data;
  } catch (error) {
    console.error('Error adding stock out:', error);
    throw error;
  }
};

// Get transaction history for specific chemical
export const getTransactionHistory = async (
  chemicalId: string
): Promise<StockTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('stock_transactions')
      .select('*')
      .eq('chemical_id', chemicalId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
};

// Get all transactions ordered by date desc
export const getAllTransactions = async (
  limit: number = 50
): Promise<StockTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('stock_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    throw error;
  }
};

// Get today's transactions
export const getTodayTransactions = async (): Promise<StockTransaction[]> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('stock_transactions')
      .select('*')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching today transactions:', error);
    throw error;
  }
};

// Export service object for imports
export const stockService = {
  addStockIn,
  addStockOut,
  getAllTransactions,
  getTransactionHistory,
  getTodayTransactions,
};
