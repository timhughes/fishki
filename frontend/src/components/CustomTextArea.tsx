import React, { useRef, useEffect } from 'react';
import { styled } from '@mui/material/styles';

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
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

export const CustomTextArea: React.FC<CustomTextAreaProps> = ({
  value,
  onChange,
  onKeyDown,
  disabled = false,
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Handle content changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Log the number of textareas for debugging
  useEffect(() => {
    console.log('Custom TextArea - Textareas in DOM:', document.querySelectorAll('textarea').length);
  }, []);

  return (
    <StyledTextArea
      ref={textAreaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
    />
  );
};
