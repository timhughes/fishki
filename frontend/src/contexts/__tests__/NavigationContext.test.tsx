import { render, screen, fireEvent } from '@testing-library/react';
import { NavigationProvider, useNavigation } from '../NavigationContext';
import { MemoryRouter } from 'react-router-dom';

// Test component that uses the navigation context
const TestComponent = () => {
  const { 
    blockNavigation, 
    setBlockNavigation, 
    hasUnsavedChanges, 
    setHasUnsavedChanges,
    pendingLocation,
    setPendingLocation,
    confirmNavigation,
    cancelNavigation
  } = useNavigation();

  return (
    <div>
      <div>Block Navigation: {blockNavigation ? 'true' : 'false'}</div>
      <div>Has Unsaved Changes: {hasUnsavedChanges ? 'true' : 'false'}</div>
      <div>Pending Location: {pendingLocation || 'none'}</div>
      
      <button onClick={() => setBlockNavigation(true)}>Enable Blocking</button>
      <button onClick={() => setBlockNavigation(false)}>Disable Blocking</button>
      <button onClick={() => setHasUnsavedChanges(true)}>Set Unsaved Changes</button>
      <button onClick={() => setHasUnsavedChanges(false)}>Clear Unsaved Changes</button>
      <button onClick={() => setPendingLocation('/test')}>Set Pending Location</button>
      <button onClick={confirmNavigation}>Confirm Navigation</button>
      <button onClick={cancelNavigation}>Cancel Navigation</button>
    </div>
  );
};

describe('NavigationContext', () => {
  test('provides navigation state and actions', () => {
    render(
      <MemoryRouter>
        <NavigationProvider>
          <TestComponent />
        </NavigationProvider>
      </MemoryRouter>
    );
    
    // Initial state
    expect(screen.getByText('Block Navigation: false')).toBeInTheDocument();
    expect(screen.getByText('Has Unsaved Changes: false')).toBeInTheDocument();
    expect(screen.getByText('Pending Location: none')).toBeInTheDocument();
    
    // Test setting block navigation
    fireEvent.click(screen.getByText('Enable Blocking'));
    expect(screen.getByText('Block Navigation: true')).toBeInTheDocument();
    
    // Test setting unsaved changes
    fireEvent.click(screen.getByText('Set Unsaved Changes'));
    expect(screen.getByText('Has Unsaved Changes: true')).toBeInTheDocument();
    
    // Test setting pending location
    fireEvent.click(screen.getByText('Set Pending Location'));
    expect(screen.getByText('Pending Location: /test')).toBeInTheDocument();
    
    // Test canceling navigation
    fireEvent.click(screen.getByText('Cancel Navigation'));
    expect(screen.getByText('Pending Location: none')).toBeInTheDocument();
  });
});
