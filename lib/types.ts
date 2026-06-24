/**
 * TypeScript interfaces for Supabase chemical inventory management
 * Covers all tables and operations
 */

// ============================================================================
// DATABASE RECORD TYPES (match your Supabase tables exactly)
// ============================================================================

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  provider: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chemical {
  id: string;
  user_id: string;
  chemical_name: string;
  chemical_formula: string;
  cas_number: string;
  hazard_class: string;
  total_stock: number;
  current_stock: number;
  unit: string;
  min_threshold: number;
  location: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockIn {
  id: string;
  chemical_id: string;
  quantity: number;
  unit: string;
  supplier: string;
  purpose: string;
  department: string;
  requested_by: string;
  approved_by: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StockOut {
  id: string;
  chemical_id: string;
  quantity: number;
  unit: string;
  purpose: string;
  department: string;
  requested_by: string;
  approved_by: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Alert {
  id: string;
  chemical_id: string;
  alert_type: 'low_stock' | 'expiry' | 'other';
  message: string;
  is_read: boolean;
  created_at: string;
}

// ============================================================================
// INPUT/REQUEST TYPES (for creating/updating records)
// ============================================================================

export interface CreateChemicalInput {
  chemical_name: string;
  chemical_formula: string;
  cas_number: string;
  hazard_class: string;
  total_stock: number;
  current_stock: number;
  unit: string;
  min_threshold: number;
  location: string;
  start_date?: string | null;
  end_date?: string | null;
}

export interface CreateStockInInput {
  chemical_id: string;
  quantity: number;
  unit: string;
  supplier: string;
  purpose: string;
  department: string;
  requested_by: string;
  approved_by?: string | null;
}

export interface CreateStockOutInput {
  chemical_id: string;
  quantity: number;
  unit: string;
  purpose: string;
  department: string;
  requested_by: string;
  approved_by?: string | null;
}

// ============================================================================
// RESPONSE TYPES (with relations/calculations)
// ============================================================================

export interface ChemicalWithHistory extends Chemical {
  stock_in_count?: number;
  stock_out_count?: number;
  status?: 'available' | 'low_stock' | 'depleted';
}

export interface StockInWithChemical extends StockIn {
  chemical?: Chemical;
}

export interface StockOutWithChemical extends StockOut {
  chemical?: Chemical;
}

export interface AlertWithChemical extends Alert {
  chemical?: Chemical;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface SupabaseError {
  code: string;
  message: string;
  status?: number;
  details?: string;
}

export class ChemicalServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ChemicalServiceError';
  }
}

// ============================================================================
// OPERATION RESPONSE TYPES
// ============================================================================

export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: SupabaseError | string;
  loading?: boolean;
}

export interface ListResult<T> {
  data: T[];
  count: number;
  error?: SupabaseError | string;
}
