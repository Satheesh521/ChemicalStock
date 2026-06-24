import { createContext, ReactNode, useContext, useState } from 'react';

export type WantItem = {
  id: string;
  chemicalName: string;
  startDate: string;
  endDate: string;
  totalStock: string;
};

export type StockOutItem = {
  id: string;
  chemicalName: string;
  machineNo: string;
  stockValue: string;
  stockUnit: 'kg' | 'g' | 'mg';
  dateOut: string;
  timestamp: string; // New field for precise time (HH:MM:SS)
};

type WantContextType = {
  items: WantItem[];
  addItem: (item: WantItem) => void;
  updateItem: (id: string, item: WantItem) => void;
  deleteItem: (id: string) => void;
  setItems: (items: WantItem[]) => void;
  stockOutItems: StockOutItem[];
  addStockOut: (item: StockOutItem) => void;
  updateStockOut: (id: string, item: StockOutItem) => void;
  deleteStockOut: (id: string) => void;
  setStockOutItems: (items: StockOutItem[]) => void;
};

const WantContext = createContext<WantContextType | undefined>(undefined);

export function WantProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WantItem[]>([]);
  const [stockOutItems, setStockOutItems] = useState<StockOutItem[]>([]);

  const addItem = (item: WantItem) => {
    setItems(prev => [item, ...prev]);
  };

  const updateItem = (id: string, item: WantItem) => {
    setItems(prev =>
      prev.map(i => (i.id === id ? item : i))
    );
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const addStockOut = (item: StockOutItem) => {
    setStockOutItems(prev => [item, ...prev]);
  };

  const updateStockOut = (id: string, item: StockOutItem) => {
    setStockOutItems(prev =>
      prev.map(i => (i.id === id ? item : i))
    );
  };

  const deleteStockOut = (id: string) => {
    setStockOutItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <WantContext.Provider value={{ 
      items, 
      addItem, 
      updateItem, 
      deleteItem, 
      setItems,
      stockOutItems,
      addStockOut,
      updateStockOut,
      deleteStockOut,
      setStockOutItems
    }}>
      {children}
    </WantContext.Provider>
  );
}

export function useWant() {
  const context = useContext(WantContext);
  if (context === undefined) {
    throw new Error('useWant must be used within a WantProvider');
  }
  return context;
}
