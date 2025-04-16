import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNavigation } from '../contexts/NavigationContext';

export const NavigationBlocker: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    blockNavigation, 
    hasUnsavedChanges, 
    pendingLocation, 
    setPendingLocation, 
    confirmNavigation 
  } = useNavigation();

  // Listen for location changes and block if needed
  useEffect(() => {
    if (pendingLocation && !blockNavigation) {
      // If we have a pending location but blocking is off, navigate
      navigate(pendingLocation);
      confirmNavigation();
    }
  }, [pendingLocation, blockNavigation, navigate, confirmNavigation]);

  // This effect handles browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Only block navigation if we have unsaved changes
      if (hasUnsavedChanges) {
        // Prevent the default navigation
        event.preventDefault();
        
        // Get the URL the user was trying to navigate to
        const targetPath = window.location.pathname;
        
        // Set it as pending location to trigger the dialog
        setPendingLocation(targetPath);
        
        // Push the current path back to history to stay on this page
        window.history.pushState(null, '', location.pathname);
        
        return;
      }
    };

    // Add event listener for popstate (browser back/forward)
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, location.pathname, setPendingLocation]);

  // This component doesn't render anything
  return null;
};
