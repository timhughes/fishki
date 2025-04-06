import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '../contexts/NavigationContext';

export const NavigationBlocker: React.FC = () => {
  const navigate = useNavigate();
  const { blockNavigation, pendingLocation, confirmNavigation } = useNavigation();

  // Listen for location changes and block if needed
  useEffect(() => {
    if (pendingLocation && !blockNavigation) {
      // If we have a pending location but blocking is off, navigate
      navigate(pendingLocation);
      confirmNavigation();
    }
  }, [pendingLocation, blockNavigation, navigate, confirmNavigation]);

  // With React Router v7, most of the blocking logic is now handled by the useBlocker hook
  // in the NavigationContext, so this component is simpler

  // This component doesn't render anything
  return null;
};
