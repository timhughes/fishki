import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { api } from '../api/client';

interface SetupWizardProps {
  onComplete: () => void;
  open: boolean;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, open }) => {
  const [wikiPath, setWikiPath] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Select Wiki Location', 'Initialize Repository'];

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWikiPath(e.target.value);
    setError(null);
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      // Validate and save the wiki path
      if (!wikiPath.trim()) {
        setError('Please enter a valid path');
        return;
      }
      
      setLoading(true);
      try {
        await api.setConfig(wikiPath);
        setActiveStep(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to set wiki path');
      } finally {
        setLoading(false);
      }
    } else if (activeStep === 1) {
      // Initialize the Git repository
      setLoading(true);
      try {
        await api.init(wikiPath);
        onComplete();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize repository');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError(null);
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div" align="center">
          Welcome to Fishki Wiki
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {activeStep === 0 && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Please select a directory where your wiki content will be stored. 
                This directory will be used to store all your Markdown files and will be 
                initialized as a Git repository.
              </Typography>
              <TextField
                label="Wiki Directory Path"
                variant="outlined"
                fullWidth
                value={wikiPath}
                onChange={handlePathChange}
                placeholder="/path/to/your/wiki"
                helperText="Enter an absolute path to an existing directory or a new directory to be created"
                sx={{ mb: 2 }}
              />
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                We'll now initialize a Git repository in the selected directory:
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
                {wikiPath}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                This will allow you to track changes to your wiki content and collaborate with others.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          disabled={activeStep === 0 || loading} 
          onClick={handleBack}
        >
          Back
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleNext}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : activeStep === steps.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
