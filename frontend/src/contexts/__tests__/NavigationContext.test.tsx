import { render, fireEvent } from '@testing-library/react';
import { NavigationProvider, useNavigation } from '../NavigationContext';

// Test component that uses the navigation context
const TestComponent = () => {
  const {
    hasUnsavedChanges,
    setHasUnsavedChanges,
    pendingLocation,
    setPendingLocation,
    blockNavigation,
    setBlockNavigation,
    confirmNavigation,
    cancelNavigation
  } = useNavigation();

  return (
    <div>
      <div data-testid="has-unsaved-changes">{hasUnsavedChanges.toString()}</div>
      <div data-testid="pending-location">{pendingLocation || 'no-pending'}</div>
      <div data-testid="block-navigation">{blockNavigation.toString()}</div>
      <button 
        data-testid="set-unsaved" 
        onClick={() => setHasUnsavedChanges(true)}
      >
        Set Unsaved
      </button>
      <button 
        data-testid="set-pending" 
        onClick={() => setPendingLocation('/test')}
      >
        Set Pending
      </button>
      <button 
        data-testid="set-block" 
        onClick={() => setBlockNavigation(true)}
      >
        Block Navigation
      </button>
      <button 
        data-testid="confirm-navigation" 
        onClick={confirmNavigation}
      >
        Confirm Navigation
      </button>
      <button 
        data-testid="cancel-navigation" 
        onClick={cancelNavigation}
      >
        Cancel Navigation
      </button>
    </div>
  );
};

describe('NavigationContext', () => {
  it('provides default values', () => {
    const { getByTestId } = render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );
    
    expect(getByTestId('has-unsaved-changes').textContent).toBe('false');
    expect(getByTestId('pending-location').textContent).toBe('no-pending');
    expect(getByTestId('block-navigation').textContent).toBe('false');
  });
  
  it('updates hasUnsavedChanges state', () => {
    const { getByTestId } = render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );
    
    fireEvent.click(getByTestId('set-unsaved'));
    
    expect(getByTestId('has-unsaved-changes').textContent).toBe('true');
  });
  
  it('updates pendingLocation state', () => {
    const { getByTestId } = render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );
    
    fireEvent.click(getByTestId('set-pending'));
    
    expect(getByTestId('pending-location').textContent).toBe('/test');
  });
  
  it('updates blockNavigation state', () => {
    const { getByTestId } = render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );
    
    fireEvent.click(getByTestId('set-block'));
    
    expect(getByTestId('block-navigation').textContent).toBe('true');
  });
  
  it('handles confirmNavigation', () => {
    const { getByTestId } = render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );
    
    // Set up state
    fireEvent.click(getByTestId('set-unsaved'));
    fireEvent.click(getByTestId('set-pending'));
    
    // Confirm navigation
    fireEvent.click(getByTestId('confirm-navigation'));
    
    // Should reset states
    expect(getByTestId('has-unsaved-changes').textContent).toBe('false');
    expect(getByTestId('pending-location').textContent).toBe('no-pending');
  });
  
  it('handles cancelNavigation', () => {
    const { getByTestId } = render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );
    
    // Set up state
    fireEvent.click(getByTestId('set-pending'));
    
    // Cancel navigation
    fireEvent.click(getByTestId('cancel-navigation'));
    
    // Should reset pending location
    expect(getByTestId('pending-location').textContent).toBe('no-pending');
  });
});
