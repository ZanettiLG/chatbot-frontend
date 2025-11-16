import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  size = 'medium',
}) => {
  const iconSize = size === 'large' ? 120 : size === 'medium' ? 80 : 60;
  const titleVariant = size === 'large' ? 'h5' : size === 'medium' ? 'h6' : 'subtitle1';

  return (
    <Paper
      elevation={0}
      sx={{
        p: size === 'large' ? 6 : size === 'medium' ? 4 : 3,
        textAlign: 'center',
        backgroundColor: 'transparent',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {icon && (
          <Box
            sx={{
              fontSize: iconSize,
              color: 'text.secondary',
              opacity: 0.6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        )}
        <Typography variant={titleVariant} color="text.primary" fontWeight={500}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
          {description}
        </Typography>
        {actionLabel && onAction && (
          <Button
            variant="contained"
            onClick={onAction}
            sx={{ mt: 1 }}
            size={size === 'large' ? 'large' : 'medium'}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default EmptyState;

