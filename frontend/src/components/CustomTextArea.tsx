import React, { forwardRef, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { SxProps, Theme } from '@mui/material/styles';

const StyledTextArea = styled('textarea')(({ theme }) => ({
  width: '100%',
  height: '100%',
  fontFamily: 'monospace',
  fontSize: '14px',
  lineHeight: 1.5,
  padding: '14px',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  resize: 'none',
  outline: 'none',
  '&:focus': {
    borderColor: theme.palette.primary.main,
  },
}));

interface CustomTextAreaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  sx?: SxProps<Theme>;
}

export const CustomTextArea = forwardRef<HTMLTextAreaElement, CustomTextAreaProps>(
  ({ value, onChange, onKeyDown, disabled = false, placeholder, sx }, ref) => {
    // Log the number of textareas for debugging
    useEffect(() => {
      console.log('Custom TextArea - Textareas in DOM:', document.querySelectorAll('textarea').length);
    }, []);

    return (
      <StyledTextArea
        ref={ref}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        sx={sx}
      />
    );
  }
);
