/**
 * Chemical Inventory Service
 * Core database operations for chemicals, stock movements, and alerts
 * All operations respect RLS policies (user_id filter is implicit via auth)
 */

import { requireAuth, supabase } from './supabaseClient';
import type {
    Alert,
    Chemical,
    ChemicalServiceError,
    ChemicalWithHistory,
    CreateChemicalInput,
    CreateStockInInput,
    CreateStockOutInput,
    ListResult,
    StockIn,
    StockOut,
    SupabaseError
} from './types';

// ============================================================================
// UTILITY FUNCTIONS FOR ERROR HANDLING
// ============================================================================

/**
 * Parse Supabase error response
 */
function parseSupabaseError(error: any): SupabaseError {
  return {
    code: error.code || 'UNKNOWN_ERROR',
    message: error.message || 'An unknown error occurred',
    status: error.status,
    details: error.details,
  };
}

/**
 * Throw a ChemicalServiceError with parsed details
 */
function throwChemicalError(
  message: string,
  code: string,
  error?: any
): never {
  throw new ChemicalServiceError(
    message,
    code,
    error instanceof Error ? error : new Error(String(error))
  );
}

// ============================================================================
// CHEMICAL OPERATIONS
// ============================================================================

/**
 * Add a new chemical to inventory
 * 
 * @param input - Chemical data to insert
 * @returns Created chemical record
 * @throws ChemicalServiceError on failure
 * 
 * @example
 * ```typescript
 * const chemical = await addChemical({
 *   chemical_name: 'Sulfuric Acid',
 *   chemical_formula: 'H2SO4',
 *   cas_number: '7664-93-9',
 *   hazard_class: 'Corrosive',
 *   total_stock: 100,
 *   current_stock: 100,
 *   unit: 'mL',
 *   min_threshold: 10,
 *   location: 'Lab A - Cabinet 3',
 * });
 * ```
 */
export async function addChemical(
  input: CreateChemicalInput
): Promise<Chemical> {
  try {
    // Verify user is authenticated (RLS will enforce this server-side too)
    const userId = await requireAuth();

    const { data, error } = await supabase
      .from('chemicals')
      .insert([
        {
          user_id: userId,
          ...input,
        },
      ])
      .select()
      .single();

    if (error) {
      throwChemicalError(
        `Failed to add chemical: ${error.message}`,
        'ADD_CHEMICAL_FAILED',
        error
      );
    }

    if (!data) {
      throwChemicalError(
        'No data returned after adding chemical',
        'NO_DATA_RETURNED',
        null
      );
    }

    console.log('✓ Chemical added successfully:', data.id);
    return data as Chemical;
  } catch (error) {
    if (error instanceof ChemicalServiceError) {
      throw error;
    }
    throwChemicalError(
      'An unexpected error occurred while adding chemical',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Fetch all chemicals for the current user
 * Automatically filters by user_id via RLS policy
 * 
 * @param options - Optional filters and sorting
 * @returns List of chemicals with history counts
 * 
 * @example
 * ```typescript
 * const chemicals = await fetchChemicals({
 *   sortBy: 'chemical_name',
 *   sortOrder: 'asc',
 *   limit: 50,
 * });
 * ```
 */
export async function fetchChemicals(options?: {
  sortBy?: keyof Chemical;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}): Promise<ListResult<ChemicalWithHistory>> {
  try {
    // Verify authentication
    await requireAuth();

    let query = supabase
      .from('chemicals')
      .select('*', { count: 'exact' });

    // Apply sorting
    if (options?.sortBy) {
      query = query.order(options.sortBy, {
        ascending: options.sortOrder === 'asc',
      });
    } else {
      // Default: sort by most recent
      query = query.order('created_at', { ascending: false });
    }

    // Apply limit
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error, count } = await query;

    if (error) {
      throwChemicalError(
        `Failed to fetch chemicals: ${error.message}`,
        'FETCH_CHEMICALS_FAILED',
        error
      );
    }

    return {
      data: (data || []) as ChemicalWithHistory[],
      count: count || 0,
    };
  } catch (error) {
    if (error instanceof ChemicalServiceError) {
      throw error;
    }
    throwChemicalError(
      'An unexpected error occurred while fetching chemicals',
      'FETCH_ERROR',
      error
    );
  }
}

/**
 * Fetch a single chemical by ID
 * 
 * @param chemicalId - Chemical ID to fetch
 * @returns Chemical record or null
 */
export async function fetchChemicalById(
  chemicalId: string
): Promise<Chemical | null> {
  try {
    await requireAuth();

    const { data, error } = await supabase
      .from('chemicals')
      .select('*')
      .eq('id', chemicalId)
      .single();

    if (error) {
      // Handle "no rows" case gracefully
      if (error.code === 'PGRST116') {
        return null;
      }
      throwChemicalError(
        `Failed to fetch chemical: ${error.message}`,
        'FETCH_CHEMICAL_FAILED',
        error
      );
    }

    return data as Chemical;
  } catch (error) {
    if (error instanceof ChemicalServiceError) {
      throw error;
    }
    throwChemicalError(
      'An unexpected error occurred while fetching chemical',
      'FETCH_ERROR',
      error
    );
  }
}

/**
 * Update a chemical's stock levels
 * 
 * @param chemicalId - ID of chemical to update
 * @param updates - Partial updates to apply
 * @returns Updated chemical record
 */
export async function updateChemical(
  chemicalId: string,
  updates: Partial<Chemical>
): Promise<Chemical> {
  try {
    await requireAuth();

    const { data, error } = await supabase
      .from('chemicals')
      .update(updates)
      .eq('id', chemicalId)
      .select()
      .single();

    if (error) {
      throwChemicalError(
        `Failed to update chemical: ${error.message}`,
        'UPDATE_CHEMICAL_FAILED',
        error
      );
    }

    return data as Chemical;
  } catch (error) {
    if (error instanceof ChemicalServiceError) {
      throw error;
    }
    throwChemicalError(
      'An unexpected error occurred while updating chemical',
      'UPDATE_ERROR',
      error
    );
  }
}

// ============================================================================
// STOCK IN OPERATIONS
// ============================================================================

/**
 * Record a stock in (incoming inventory) transaction
 * 
 * @param input - Stock in details
 * @returns Created stock in record
 * 
 * @example
 * ```typescript
 * const stockIn = await addStockIn({
 *   chemical_id: 'chem-123',
 *   quantity: 50,
 *   unit: 'mL',
 *   supplier: 'ChemSupply Inc',
 *   purpose: 'Laboratory experiments',
 *   department: 'Research',
 *   requested_by: 'Dr. Smith',
 *   approved_by: 'Manager',
 * });
 * ```
 */
export async function addStockIn(
  input: CreateStockInInput
): Promise<StockIn> {
  try {
    await requireAuth();

    // Verify chemical exists and belongs to user
    const chemical = await fetchChemicalById(input.chemical_id);
    if (!chemical) {
      throwChemicalError(
        'Chemical not found or access denied',
        'CHEMICAL_NOT_FOUND',
        null
      );
    }

    const { data, error } = await supabase
      .from('stock_in')
      .insert([input])
      .select()
      .single();

    if (error) {
      throwChemicalError(
        `Failed to record stock in: ${error.message}`,
        'STOCK_IN_FAILED',
        error
      );
    }

    // Update chemical's current_stock
    const newStock = chemical.current_stock + input.quantity;
    await updateChemical(input.chemical_id, {
      current_stock: newStock,
      updated_at: new Date().toISOString(),
    });

    console.log('✓ Stock in recorded and inventory updated');
    return data as StockIn;
  } catch (error) {
    if (error instanceof ChemicalServiceError) {
      throw error;
    }
    throwChemicalError(
      'An unexpected error occurred while recording stock in',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Fetch stock in history for a chemical
 * 
 * @param chemicalId - Chemical ID to fetch history for
 * @param limit - Max number of records to return (default: 100)
 * @returns List of stock in records
 */
export async function fetchStockInHistory(
  chemicalId: string,
  limit: number = 100
): Promise<ListResult<StockIn>> {
  try {
    await requireAuth();

    // Verify chemical exists
    const chemical = await fetchChemicalById(chemicalId);
    if (!chemical) {
      throwChemicalError(
        'Chemical not found',
        'CHEMICAL_NOT_FOUND',
        null
      );
    }

    const { data, error, count } = await supabase
      .from('stock_in')
      .select('*', { count: 'exact' })
      .eq('chemical_id', chemicalId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throwChemicalError(
        `Failed to fetch stock in history: ${error.message}`,
        'FETCH_HISTORY_FAILED',
        error
      );
    }

    return {
      data: (data || []) as StockIn[],
      count: count || 0,
    };
  } catch (error) {
    if (error instanceof ChemicalServiceError) {
      throw error;
    }
    throwChemicalError(
      'An unexpected error occurred while fetching stock in history',
      'FETCH_ERROR',
      error
    );
  }
}

// ============================================================================
// STOCK OUT OPERATIONS
// ============================================================================

/**
 * Record a stock out (outgoing inventory) transaction
 * 
 * @param input - Stock out details
 * @returns Created stock out record
 * 
 * @example
 * ```typescript
 * const stockOut = await addStockOut({
 *   chemical_id: 'chem-123',
 *   quantity: 25,
 *   unit: 'mL',
 *   purpose: 'Used in experiment #42',
 *   department: 'Research',
 *   requested_by: 'Dr. Smith',
 *   approved_by: 'Manager',
 * });
 * ```
 */
export async function addStockOut(
  input: CreateStockOutInput
): Promise<StockOut> {
  try {
    await requireAuth();

    // Verify chemical exists and belongs to user
    const chemical = await fetchChemicalById(input.chemical_id);
    if (!chemical) {
      throwChemicalError(
        'Chemical not found or access denied',
        'CHEMICAL_NOT_FOUND',
        null
      );
    }

    // Prevent over-withdrawal
    if (input.quantity > chemical.current_stock) {
      throwChemicalError(
        `Insufficient stock. Available: ${chemical.current_stock}, Requested: ${input.quantity}`,
        'INSUFFICIENT_STOCK',
        null
      );
    }

    const { data, error } = await supabase
      .from('stock_out')
      .insert([input])
      .select()
      .single();

    if (error) {
      throwChemicalError(
        `Failed to record stock out: ${error.message}`,
        'STOCK_OUT_FAILED',
        error
      );
    }

    // Update chemical's current_stock
    const newStock = chemical.current_stock - input.quantity;
    await updateChemical(input.chemical_id, {
      current_stock: newStock,
      updated_at: new Date().toISOString(),
    });

    console.log('✓ Stock out recorded and inventory updated');
    return data as StockOut;
  } catch (error) {
    if (error instanceof ChemicalServiceError) {
      throw error;
    }
    throwChemicalError(
      'An unexpected error occurred while recording stock out',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Fetch stock out history for a chemical
 * 
 * @param chemicalId - Chemical ID to fetch history for
 * @param limit - Max number of records to return (default: 100)
 * @returns List of stock out records
 */
export async function fetchStockOutHistory(
  chemicalId: string,
  limit: number = 100
): Promise<ListResult<StockOut>> {
  try {
    await requireAuth();

    // Verify chemical exists
    const chemical = await fetchChemicalById(chemicalId);
    if (!chemical) {
      throwChemicalError(
        'Chemical not found',
        'CHEMICAL_NOT_FOUND',
        null
      );
    }

    const { data, error, count } = await supabase
      .from('stock_out')
      .select('*', { count: 'exact' })
      .eq('chemical_id', chemicalId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throwChemicalError(
        `Failed to fetch stock out history: ${error.message}`,
        'FETCH_HISTORY_FAILED',
        error
      );
    }

    return {
      data: (data || []) as StockOut[],
      count: count || 0,
    };
  } catch (error) {
    if (error instanceof ChemicalServiceError) {
      throw error;
    }
    throwChemicalError(
      'An unexpected error occurred while fetching stock out history',
      'FETCH_ERROR',
      error
    );
  }
}

// ============================================================================
// ALERT OPERATIONS
// ============================================================================

/**
 * Fetch alerts for the current user
 * Returns unread alerts first, then read alerts
 * 
 * @param options - Optional filters
 * @returns List of alerts with chemical details
 * 
 * @example
 * ```typescript
 * const { data: alerts } = await fetchAlerts({ unreadOnly: true });
 * ```
 */
export async function fetchAlerts(options?: {
  unreadOnly?: boolean;
  limit?: number;
}): Promise<ListResult<Alert>> {
  try {
    await requireAuth();

    let query = supabase
      .from('alerts')
      .select('*', { count: 'exact' });

    // Filter unread only if requested
    if (options?.unreadOnly) {
      query = query.eq('is_read', false);
    }

    // Order: unread first, then by date
    const { data, error, count } = await query
      .order('is_read', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(options?.limit || 50);

    if (error) {
      throwChemicalError(
        `Failed to fetch alerts: ${error.message}`,
        'FETCH_ALERTS_FAILED',
        error
      );
    }

    return {
      data: (data || []) as Alert[],
      count: count || 0,
    };
  } catch (error) {
    if (error instanceof ChemicalServiceError) {
      throw error;
    }
    throwChemicalError(
      'An unexpected error occurred while fetching alerts',
      'FETCH_ERROR',
      error
    );
  }
}

/**
 * Mark an alert as read
 * 
 * @param alertId - Alert ID to mark as read
 * @returns Updated alert
 */
export async function markAlertAsRead(alertId: string): Promise<Alert> {
  try {
    await requireAuth();

    const { data, error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', alertId)
      .select()
      .single();

    if (error) {
      throwChemicalError(
        `Failed to mark alert as read: ${error.message}`,
        'UPDATE_ALERT_FAILED',
        error
      );
    }

    return data as Alert;
  } catch (error) {
    if (error instanceof ChemicalServiceError) {
      throw error;
    }
    throwChemicalError(
      'An unexpected error occurred while updating alert',
      'UPDATE_ERROR',
      error
    );
  }
}

/**
 * Mark all alerts as read for current user
 * 
 * @returns Number of alerts updated
 */
export async function markAllAlertsAsRead(): Promise<number> {
  try {
    const userId = await requireAuth();

    const { data, error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('user_id', userId)
      .select();

    if (error) {
      throwChemicalError(
        `Failed to mark all alerts as read: ${error.message}`,
        'UPDATE_ALERTS_FAILED',
        error
      );
    }

    return (data || []).length;
  } catch (error) {
    if (error instanceof ChemicalServiceError) {
      throw error;
    }
    throwChemicalError(
      'An unexpected error occurred while updating alerts',
      'UPDATE_ERROR',
      error
    );
  }
}
