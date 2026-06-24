/**
 * React Hook for Chemical Inventory Management
 * Handles loading states, error handling, and data caching
 * Perfect for use in React components
 */

import { useCallback, useEffect, useState } from 'react';
import {
    addChemical,
    addStockIn,
    addStockOut,
    fetchAlerts,
    fetchChemicalById,
    fetchChemicals,
    fetchStockInHistory,
    fetchStockOutHistory,
    markAlertAsRead,
    markAllAlertsAsRead,
} from './chemicalService';
import type {
    Alert,
    ChemicalWithHistory,
    CreateChemicalInput,
    CreateStockInInput,
    CreateStockOutInput,
    StockIn,
    StockOut
} from './types';

// ============================================================================
// OPERATION STATE TYPE
// ============================================================================

interface OperationState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Main hook for managing chemical inventory operations
 * 
 * @returns Object with state, data, and callable methods
 * 
 * @example
 * ```typescript
 * const {
 *   chemicals,
 *   loadingChemicals,
 *   errorChemicals,
 *   addNewChemical,
 *   alerts,
 *   markAlertRead,
 * } = useChemicalData();
 * ```
 */
export function useChemicalData() {
  // =========================================================================
  // STATE: CHEMICALS
  // =========================================================================
  const [chemicals, setChemicals] = useState<ChemicalWithHistory[]>([]);
  const [selectedChemical, setSelectedChemical] =
    useState<ChemicalWithHistory | null>(null);
  const [chemicalState, setChemicalState] = useState<OperationState>({
    loading: false,
    error: null,
    success: false,
  });

  // =========================================================================
  // STATE: STOCK HISTORY
  // =========================================================================
  const [stockInHistory, setStockInHistory] = useState<StockIn[]>([]);
  const [stockOutHistory, setStockOutHistory] = useState<StockOut[]>([]);
  const [historyState, setHistoryState] = useState<OperationState>({
    loading: false,
    error: null,
    success: false,
  });

  // =========================================================================
  // STATE: ALERTS
  // =========================================================================
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertState, setAlertState] = useState<OperationState>({
    loading: false,
    error: null,
    success: false,
  });

  // =========================================================================
  // STATE: TRANSACTION OPERATIONS
  // =========================================================================
  const [transactionState, setTransactionState] = useState<OperationState>({
    loading: false,
    error: null,
    success: false,
  });

  // =========================================================================
  // HELPER: ERROR FORMATTING
  // =========================================================================

  const formatError = (error: any): string => {
    if (error instanceof Error) {
      if ('code' in error && 'originalError' in error) {
        return `${error.message} (Code: ${error.code})`;
      }
      return error.message;
    }
    return String(error);
  };

  // =========================================================================
  // CHEMICAL OPERATIONS
  // =========================================================================

  /**
   * Load all chemicals for current user
   */
  const loadChemicals = useCallback(async () => {
    setChemicalState({ loading: true, error: null, success: false });
    try {
      const result = await fetchChemicals({
        sortOrder: 'desc',
        limit: 500,
      });
      setChemicals(result.data);
      setChemicalState({
        loading: false,
        error: null,
        success: true,
      });
    } catch (error) {
      const errorMsg = formatError(error);
      setChemicalState({
        loading: false,
        error: errorMsg,
        success: false,
      });
      console.error('Error loading chemicals:', errorMsg);
    }
  }, []);

  /**
   * Add a new chemical
   */
  const addNewChemical = useCallback(
    async (input: CreateChemicalInput) => {
      setTransactionState({ loading: true, error: null, success: false });
      try {
        const newChemical = await addChemical(input);
        setChemicals((prev) => [newChemical, ...prev]);
        setTransactionState({
          loading: false,
          error: null,
          success: true,
        });
        return newChemical;
      } catch (error) {
        const errorMsg = formatError(error);
        setTransactionState({
          loading: false,
          error: errorMsg,
          success: false,
        });
        console.error('Error adding chemical:', errorMsg);
        throw error;
      }
    },
    []
  );

  /**
   * Select a chemical and load its history
   */
  const selectChemical = useCallback(
    async (chemicalId: string) => {
      setChemicalState({ loading: true, error: null, success: false });
      try {
        const chemical = await fetchChemicalById(chemicalId);
        if (!chemical) {
          throw new Error('Chemical not found');
        }
        setSelectedChemical(chemical);
        setChemicalState({
          loading: false,
          error: null,
          success: true,
        });
      } catch (error) {
        const errorMsg = formatError(error);
        setChemicalState({
          loading: false,
          error: errorMsg,
          success: false,
        });
        console.error('Error selecting chemical:', errorMsg);
      }
    },
    []
  );

  // =========================================================================
  // STOCK OPERATIONS
  // =========================================================================

  /**
   * Record a stock in transaction
   */
  const recordStockIn = useCallback(
    async (input: CreateStockInInput) => {
      setTransactionState({ loading: true, error: null, success: false });
      try {
        const stockIn = await addStockIn(input);
        
        // Reload chemicals to reflect updated stock
        await loadChemicals();
        
        // Reload history
        if (input.chemical_id) {
          await loadStockInHistory(input.chemical_id);
        }

        setTransactionState({
          loading: false,
          error: null,
          success: true,
        });
        return stockIn;
      } catch (error) {
        const errorMsg = formatError(error);
        setTransactionState({
          loading: false,
          error: errorMsg,
          success: false,
        });
        console.error('Error recording stock in:', errorMsg);
        throw error;
      }
    },
    [loadChemicals]
  );

  /**
   * Load stock in history for a chemical
   */
  const loadStockInHistory = useCallback(async (chemicalId: string) => {
    setHistoryState({ loading: true, error: null, success: false });
    try {
      const result = await fetchStockInHistory(chemicalId);
      setStockInHistory(result.data);
      setHistoryState({
        loading: false,
        error: null,
        success: true,
      });
    } catch (error) {
      const errorMsg = formatError(error);
      setHistoryState({
        loading: false,
        error: errorMsg,
        success: false,
      });
      console.error('Error loading stock in history:', errorMsg);
    }
  }, []);

  /**
   * Record a stock out transaction
   */
  const recordStockOut = useCallback(
    async (input: CreateStockOutInput) => {
      setTransactionState({ loading: true, error: null, success: false });
      try {
        const stockOut = await addStockOut(input);
        
        // Reload chemicals to reflect updated stock
        await loadChemicals();
        
        // Reload history
        if (input.chemical_id) {
          await loadStockOutHistory(input.chemical_id);
        }

        setTransactionState({
          loading: false,
          error: null,
          success: true,
        });
        return stockOut;
      } catch (error) {
        const errorMsg = formatError(error);
        setTransactionState({
          loading: false,
          error: errorMsg,
          success: false,
        });
        console.error('Error recording stock out:', errorMsg);
        throw error;
      }
    },
    [loadChemicals]
  );

  /**
   * Load stock out history for a chemical
   */
  const loadStockOutHistory = useCallback(async (chemicalId: string) => {
    setHistoryState({ loading: true, error: null, success: false });
    try {
      const result = await fetchStockOutHistory(chemicalId);
      setStockOutHistory(result.data);
      setHistoryState({
        loading: false,
        error: null,
        success: true,
      });
    } catch (error) {
      const errorMsg = formatError(error);
      setHistoryState({
        loading: false,
        error: errorMsg,
        success: false,
      });
      console.error('Error loading stock out history:', errorMsg);
    }
  }, []);

  // =========================================================================
  // ALERT OPERATIONS
  // =========================================================================

  /**
   * Load alerts for current user
   */
  const loadAlerts = useCallback(async () => {
    setAlertState({ loading: true, error: null, success: false });
    try {
      const result = await fetchAlerts({ unreadOnly: false });
      setAlerts(result.data);
      setAlertState({
        loading: false,
        error: null,
        success: true,
      });
    } catch (error) {
      const errorMsg = formatError(error);
      setAlertState({
        loading: false,
        error: errorMsg,
        success: false,
      });
      console.error('Error loading alerts:', errorMsg);
    }
  }, []);

  /**
   * Mark a single alert as read
   */
  const markAlertRead = useCallback(
    async (alertId: string) => {
      try {
        await markAlertAsRead(alertId);
        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === alertId ? { ...alert, is_read: true } : alert
          )
        );
      } catch (error) {
        console.error('Error marking alert as read:', formatError(error));
        throw error;
      }
    },
    []
  );

  /**
   * Mark all alerts as read
   */
  const markAllRead = useCallback(async () => {
    try {
      await markAllAlertsAsRead();
      setAlerts((prev) => prev.map((alert) => ({ ...alert, is_read: true })));
    } catch (error) {
      console.error('Error marking all alerts as read:', formatError(error));
      throw error;
    }
  }, []);

  // =========================================================================
  // COMPUTED VALUES
  // =========================================================================

  const unreadAlertCount = alerts.filter((a) => !a.is_read).length;
  const lowStockChemicals = chemicals.filter(
    (c) => c.current_stock <= c.min_threshold
  );

  // =========================================================================
  // RETURN HOOK API
  // =========================================================================

  return {
    // Chemical operations
    chemicals,
    selectedChemical,
    loadChemicals,
    addNewChemical,
    selectChemical,
    chemicalState,
    lowStockChemicals,

    // Stock in operations
    stockInHistory,
    recordStockIn,
    loadStockInHistory,

    // Stock out operations
    stockOutHistory,
    recordStockOut,
    loadStockOutHistory,

    // Alert operations
    alerts,
    loadAlerts,
    markAlertRead,
    markAllRead,
    alertState,
    unreadAlertCount,

    // Transaction state (for add/update operations)
    transactionState,
    historyState,
  };
}

// ============================================================================
// HELPER HOOK: USE EFFECT TO LOAD INITIAL DATA
// ============================================================================

/**
 * Hook to automatically load initial data when component mounts
 * 
 * @example
 * ```typescript
 * useChemicalDataEffect(loadChemicals, loadAlerts);
 * ```
 */
export function useChemicalDataEffect(
  onLoadChemicals: () => Promise<void>,
  onLoadAlerts: () => Promise<void>
) {
  useEffect(() => {
    onLoadChemicals();
    onLoadAlerts();
  }, [onLoadChemicals, onLoadAlerts]);
}
