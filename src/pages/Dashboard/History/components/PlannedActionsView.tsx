import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { PlannedAction } from '../../../../types/goap.types';

interface PlannedActionsViewProps {
  actions: PlannedAction[];
}

const ACTION_STATUS_COLORS: Record<PlannedAction['status'], string> = {
  planned: '#9E9E9E',
  ready: '#2196F3',
  executing: '#FF9800',
  completed: '#4CAF50',
  failed: '#F44336',
};

const ACTION_STATUS_LABELS: Record<PlannedAction['status'], string> = {
  planned: 'Planejada',
  ready: 'Pronta',
  executing: 'Executando',
  completed: 'Completa',
  failed: 'Falhou',
};

const PlannedActionsView: React.FC<PlannedActionsViewProps> = ({ actions }) => {
  if (actions.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
        Nenhuma ação planejada no momento.
      </Typography>
    );
  }

  // Ordenar por status (ready primeiro) e depois por custo
  const sortedActions = [...actions].sort((a, b) => {
    if (a.status === 'ready' && b.status !== 'ready') return -1;
    if (b.status === 'ready' && a.status !== 'ready') return 1;
    return a.cost - b.cost;
  });

  return (
    <List>
      {sortedActions.map((action) => (
        <Paper key={action.actionId} variant="outlined" sx={{ mb: 1 }}>
          <ListItem>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body1">{action.actionName}</Typography>
                  <Chip
                    label={ACTION_STATUS_LABELS[action.status]}
                    size="small"
                    sx={{
                      backgroundColor: ACTION_STATUS_COLORS[action.status],
                      color: 'white',
                    }}
                  />
                  <Chip label={`Custo: ${action.cost}`} size="small" variant="outlined" />
                </Box>
              }
              secondary={
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Pré-requisitos: {action.prerequisites.length}
                  </Typography>
                  {action.executedAt && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                      Executada: {new Date(action.executedAt).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItem>
        </Paper>
      ))}
    </List>
  );
};

export default PlannedActionsView;

