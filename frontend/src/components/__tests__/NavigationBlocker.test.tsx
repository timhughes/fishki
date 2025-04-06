import React from 'react';
import { render } from '@testing-library/react';
import { NavigationBlocker } from '../NavigationBlocker';
import * as NavigationContextModule from '../../contexts/NavigationContext';

// Mock the useNavigation hook
jest.mock('../../contexts/NavigationContext', () => ({
  useNavigation: jest.fn()
}));

// Mock the useNavigate hook from react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(() => jest.fn())
}));

describe('NavigationBlocker', () => {
  const mockNavigate = jest.fn();
  const mockConfirmNavigation = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);
  });

  it('should not navigate when there is no pending location', () => {
    // Setup mock return value for useNavigation
    jest.spyOn(NavigationContextModule, 'useNavigation').mockReturnValue({
      blockNavigation: false,
      pendingLocation: null,
      confirmNavigation: mockConfirmNavigation,
      hasUnsavedChanges: false,
      setPendingLocation: jest.fn(),
      setBlockNavigation: jest.fn(),
      setHasUnsavedChanges: jest.fn(),
      cancelNavigation: jest.fn(),
      setNavigationCallback: jest.fn()
    });
    
    render(<NavigationBlocker />);
    
    // Should not navigate or confirm
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockConfirmNavigation).not.toHaveBeenCalled();
  });

  it('should navigate when there is a pending location and no blocking', () => {
    // Setup mock return value for useNavigation
    jest.spyOn(NavigationContextModule, 'useNavigation').mockReturnValue({
      blockNavigation: false,
      pendingLocation: '/new-path',
      confirmNavigation: mockConfirmNavigation,
      hasUnsavedChanges: false,
      setPendingLocation: jest.fn(),
      setBlockNavigation: jest.fn(),
      setHasUnsavedChanges: jest.fn(),
      cancelNavigation: jest.fn(),
      setNavigationCallback: jest.fn()
    });
    
    render(<NavigationBlocker />);
    
    // Should navigate and confirm
    expect(mockNavigate).toHaveBeenCalledWith('/new-path');
    expect(mockConfirmNavigation).toHaveBeenCalled();
  });

  it('should not navigate when there is a pending location but navigation is blocked', () => {
    // Setup mock return value for useNavigation
    jest.spyOn(NavigationContextModule, 'useNavigation').mockReturnValue({
      blockNavigation: true,
      pendingLocation: '/new-path',
      confirmNavigation: mockConfirmNavigation,
      hasUnsavedChanges: true,
      setPendingLocation: jest.fn(),
      setBlockNavigation: jest.fn(),
      setHasUnsavedChanges: jest.fn(),
      cancelNavigation: jest.fn(),
      setNavigationCallback: jest.fn()
    });
    
    render(<NavigationBlocker />);
    
    // Should not navigate or confirm
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockConfirmNavigation).not.toHaveBeenCalled();
  });
});
