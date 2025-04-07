import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { SetupWizard } from '../SetupWizard';
import { api } from '../../api/client';

// Mock the API
jest.mock('../../api/client', () => ({
  api: {
    setConfig: jest.fn().mockResolvedValue({}),
    init: jest.fn().mockResolvedValue({})
  }
}));

describe('SetupWizard', () => {
  const mockOnComplete = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders the setup wizard with initial step', () => {
    render(<SetupWizard open={true} onComplete={mockOnComplete} />);
    
    // Check that the first step is displayed
    expect(screen.getByText('Welcome to Fishki Wiki')).toBeInTheDocument();
    expect(screen.getByText(/Please select a directory where your wiki content will be stored/)).toBeInTheDocument();
    expect(screen.getByLabelText('Wiki Directory Path')).toBeInTheDocument();
  });
  
  test('validates empty path input', async () => {
    render(<SetupWizard open={true} onComplete={mockOnComplete} />);
    
    // Try to proceed without entering a path
    fireEvent.click(screen.getByText('Next'));
    
    // Should show error
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid path')).toBeInTheDocument();
    });
    
    // API should not be called
    expect(api.setConfig).not.toHaveBeenCalled();
  });
  
  test('proceeds to second step after entering valid path', async () => {
    render(<SetupWizard open={true} onComplete={mockOnComplete} />);
    
    // Enter a valid path
    fireEvent.change(screen.getByLabelText('Wiki Directory Path'), {
      target: { value: '/test/wiki/path' }
    });
    
    // Click next
    await act(async () => {
      fireEvent.click(screen.getByText('Next'));
    });
    
    // API should be called with the path
    expect(api.setConfig).toHaveBeenCalledWith('/test/wiki/path');
    
    // Should show second step
    await waitFor(() => {
      expect(screen.getByText(/We'll now initialize a Git repository/)).toBeInTheDocument();
      expect(screen.getByText('/test/wiki/path')).toBeInTheDocument();
    });
  });
  
  test('completes setup when finishing the wizard', async () => {
    render(<SetupWizard open={true} onComplete={mockOnComplete} />);
    
    // Enter a valid path and go to step 2
    fireEvent.change(screen.getByLabelText('Wiki Directory Path'), {
      target: { value: '/test/wiki/path' }
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Next'));
    });
    
    // Click finish
    await act(async () => {
      fireEvent.click(screen.getByText('Finish'));
    });
    
    // API should initialize the repository
    expect(api.init).toHaveBeenCalledWith('/test/wiki/path');
    
    // onComplete should be called
    expect(mockOnComplete).toHaveBeenCalled();
  });
  
  test('handles API errors', async () => {
    // Mock API to reject
    (api.setConfig as jest.Mock).mockRejectedValueOnce(new Error('Failed to set config'));
    
    render(<SetupWizard open={true} onComplete={mockOnComplete} />);
    
    // Enter a valid path
    fireEvent.change(screen.getByLabelText('Wiki Directory Path'), {
      target: { value: '/test/wiki/path' }
    });
    
    // Click next
    await act(async () => {
      fireEvent.click(screen.getByText('Next'));
    });
    
    // Should show error
    await waitFor(() => {
      expect(screen.getByText('Failed to set config')).toBeInTheDocument();
    });
  });
  
  test('allows going back from second step', async () => {
    render(<SetupWizard open={true} onComplete={mockOnComplete} />);
    
    // Enter a valid path and go to step 2
    fireEvent.change(screen.getByLabelText('Wiki Directory Path'), {
      target: { value: '/test/wiki/path' }
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Next'));
    });
    
    // Click back
    fireEvent.click(screen.getByText('Back'));
    
    // Should be back at first step
    expect(screen.getByLabelText('Wiki Directory Path')).toBeInTheDocument();
  });
});
