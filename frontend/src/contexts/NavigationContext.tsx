import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  // In React Router v7, we need to handle navigation blocking manually
  // since we're not using the data router in tests
  useEffect(() => {
    // Set up beforeunload event to prevent accidental browser navigation/closing
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const confirmNavigation = useCallback(() => {
    if (callback) {
      callback();
      setCallback(null);
    } else if (pendingLocation) {
      navigate(pendingLocation);
    }
    
    setPendingLocation(null);
    setHasUnsavedChanges(false);
  }, [callback, pendingLocation, navigate]);

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
