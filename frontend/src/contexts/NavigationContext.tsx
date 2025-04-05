import React, { createContext, useState, useContext, useCallback } from 'react';

interface NavigationContextType {
  blockNavigation: boolean;
  pendingLocation: string | null;
  hasUnsavedChanges: boolean;
  setPendingLocation: (location: string | null) => void;
  setBlockNavigation: (block: boolean) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  setNavigationCallback: (callback: (() => void) | null) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [blockNavigation, setBlockNavigation] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<string | null>(null);
  const [callback, setCallback] = useState<(() => void) | null>(null);

  const confirmNavigation = useCallback(() => {
    if (callback) {
      callback();
      setCallback(null);
    }
    setPendingLocation(null);
    setHasUnsavedChanges(false);
  }, [callback]);

  const cancelNavigation = useCallback(() => {
    setCallback(null);
    setPendingLocation(null);
  }, []);

  const value = {
    blockNavigation,
    pendingLocation,
    hasUnsavedChanges,
    setPendingLocation,
    setBlockNavigation,
    setHasUnsavedChanges,
    confirmNavigation,
    cancelNavigation,
    setNavigationCallback: setCallback
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
