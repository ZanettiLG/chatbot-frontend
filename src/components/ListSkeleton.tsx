import React from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

interface ListSkeletonProps {
  count?: number;
  hasSecondary?: boolean;
  hasAction?: boolean;
}

const ListSkeleton: React.FC<ListSkeletonProps> = ({ 
  count = 5, 
  hasSecondary = true,
  hasAction = true 
}) => {
  return (
    <List>
      {Array.from({ length: count }).map((_, index) => (
        <ListItem
          key={index}
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            mb: 1,
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width="40%" height={32} sx={{ mb: 1 }} />
              {hasSecondary && (
                <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
              )}
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
              </Box>
            </Box>
            {hasAction && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="circular" width={40} height={40} />
              </Box>
            )}
          </Box>
        </ListItem>
      ))}
    </List>
  );
};

export default ListSkeleton;

