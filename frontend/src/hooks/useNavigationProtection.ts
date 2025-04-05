import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '../contexts/NavigationContext';

export function useNavigationProtection(shouldBlock: boolean) {
  const { setBlockNavigation, setPendingLocation, setNavigationCallback, setHasUnsavedChanges } = useNavigation();
  const navigate = useNavigate();

  // Update block status when shouldBlock changes
  useEffect(() => {
    setBlockNavigation(shouldBlock);
    setHasUnsavedChanges(shouldBlock);
    
    // Update document title to indicate unsaved changes
    if (shouldBlock) {
      document.title = 'Fishki Wiki (Unsaved Changes)';
    }
    
    return () => {
      if (shouldBlock) {
        document.title = 'Fishki Wiki';
      }
    };
  }, [shouldBlock, setBlockNavigation, setHasUnsavedChanges]);

  // Handle browser back/forward buttons and tab close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldBlock) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock]);

  // Custom navigation function that checks for unsaved changes
  const navigateSafely = (to: string) => {
    if (shouldBlock) {
      setPendingLocation(to);
      setNavigationCallback(() => () => navigate(to));
      return false;
    } else {
      navigate(to);
      return true;
    }
  };

  return { navigateSafely };
}
