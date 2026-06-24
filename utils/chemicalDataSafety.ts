// utils/chemicalDataSafety.ts
import { Alert } from 'react-native';

// Chemical Stock specific safety utilities
export interface ChemicalData {
  id?: string;
  chemical_name?: string;
  quantity?: string | number;
  total_stock?: string | number;
  start_date?: string;
  end_date?: string;
  created_by?: string;
  created_at?: string;
}

export class ChemicalDataSafety {
  // Safe decimal parsing for chemical quantities
  static safeParseDecimal(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined || value === '') {
      console.warn('⚠️ Empty value, using default:', defaultValue);
      return defaultValue;
    }
    
    if (typeof value === 'number') {
      return isNaN(value) ? defaultValue : value;
    }
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        console.warn('⚠️ Invalid decimal value:', value, 'using default:', defaultValue);
        return defaultValue;
      }
      return parsed;
    }
    
    console.warn('⚠️ Unexpected value type:', typeof value, 'using default:', defaultValue);
    return defaultValue;
  }

  // Safe quantity formatting for display
  static safeFormatQuantity(value: any, decimals: number = 3): string {
    const parsed = this.safeParseDecimal(value, 0);
    return parsed.toFixed(decimals);
  }

  // Validate chemical data structure
  static validateChemicalData(data: any): ChemicalData {
    const safeData: ChemicalData = {};
    
    try {
      safeData.id = data?.id || '';
      safeData.chemical_name = data?.chemical_name || 'Unknown Chemical';
      safeData.quantity = this.safeParseDecimal(data?.quantity, 0);
      safeData.total_stock = this.safeParseDecimal(data?.total_stock, 0);
      safeData.start_date = data?.start_date || new Date().toISOString().split('T')[0];
      safeData.end_date = data?.end_date || new Date().toISOString().split('T')[0];
      safeData.created_by = data?.created_by || 'Unknown User';
      safeData.created_at = data?.created_at || new Date().toISOString();
      
      console.log('✅ Chemical data validated:', safeData);
      return safeData;
    } catch (error) {
      console.error('❌ Chemical data validation failed:', error);
      return this.getDefaultChemicalData();
    }
  }

  // Get default chemical data
  static getDefaultChemicalData(): ChemicalData {
    return {
      chemical_name: 'Unknown Chemical',
      quantity: 0,
      total_stock: 0,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      created_by: 'Unknown User',
      created_at: new Date().toISOString()
    };
  }

  // Safe array mapping for chemical lists
  static safeMapChemicals(chemicals: any[]): ChemicalData[] {
    if (!Array.isArray(chemicals)) {
      console.warn('⚠️ Chemicals is not an array:', chemicals);
      return [];
    }
    
    return chemicals.map((chemical, index) => {
      try {
        return this.validateChemicalData(chemical);
      } catch (error) {
        console.error(`❌ Error processing chemical at index ${index}:`, error);
        return this.getDefaultChemicalData();
      }
    });
  }

  // Check for critical dashboard data
  static validateDashboardData(data: any) {
    const issues: string[] = [];
    
    if (!data) {
      issues.push('No dashboard data provided');
      return { isValid: false, issues };
    }
    
    // Check chemicals array
    if (!Array.isArray(data.chemicals)) {
      issues.push('Chemicals data is not an array');
    } else if (data.chemicals.length === 0) {
      console.log('ℹ️ No chemicals found - showing empty state');
    } else {
      // Check each chemical for critical fields
      data.chemicals.forEach((chemical: any, index: number) => {
        if (!chemical.chemical_name) {
          issues.push(`Chemical at index ${index} missing name`);
        }
        if (chemical.quantity === null || chemical.quantity === undefined) {
          issues.push(`Chemical at index ${index} missing quantity`);
        }
      });
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Show user-friendly error message
  static showError(message: string, error?: any) {
    console.error('🚨 Chemical Stock Error:', message, error);
    
    Alert.alert(
      'Chemical Stock Error',
      message,
      [
        { text: 'OK', style: 'default' },
        { 
          text: 'Report Issue', 
          onPress: () => {
            console.log('📋 Error reported:', { message, error });
          }
        }
      ]
    );
  }
}

// Hook for safe chemical data handling
export const useChemicalDataSafety = () => {
  return {
    safeParseDecimal: ChemicalDataSafety.safeParseDecimal,
    safeFormatQuantity: ChemicalDataSafety.safeFormatQuantity,
    validateChemicalData: ChemicalDataSafety.validateChemicalData,
    safeMapChemicals: ChemicalDataSafety.safeMapChemicals,
    validateDashboardData: ChemicalDataSafety.validateDashboardData,
    showError: ChemicalDataSafety.showError
  };
};
