import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import { ConversationState } from '../types/goap.types';

interface WorldStateViewProps {
  worldState: ConversationState['worldState'];
}

const WorldStateView: React.FC<WorldStateViewProps> = ({ worldState }) => {
  const entities = worldState.entities || {};
  const metadata = worldState.metadata || {};

  // Entidades podem ser um Record<string, WorldStateEntity[]> ou Record<string, any>
  // Precisamos lidar com ambos os casos
  const flattenEntities = () => {
    const result: Array<{ key: string; value: any }> = [];
    Object.entries(entities).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // Se for array, pegar o último (mais recente)
        if (value.length > 0) {
          const latest = value[value.length - 1];
          result.push({ key, value: latest.value || latest });
        }
      } else {
        result.push({ key, value });
      }
    });
    return result;
  };

  const flattenedEntities = flattenEntities();
  const hasData = flattenedEntities.length > 0 || Object.keys(metadata).length > 0;

  if (!hasData) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
        Nenhum estado do mundo registrado ainda.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {flattenedEntities.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Entidades:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {flattenedEntities.map(({ key, value }) => (
              <Paper key={key} variant="outlined" sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={key} size="small" color="primary" variant="outlined" />
                  <Typography variant="body2">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {Object.keys(metadata).length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', mt: 2 }}>
            Metadados:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Object.entries(metadata).map(([key, value]) => (
              <Paper key={key} variant="outlined" sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={key} size="small" />
                  <Typography variant="body2">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default WorldStateView;

