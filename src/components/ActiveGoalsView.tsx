import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import { ActiveGoal } from '../types/goap.types';

interface ActiveGoalsViewProps {
  goals: ActiveGoal[];
}

const GOAL_STATUS_COLORS: Record<ActiveGoal['status'], string> = {
  active: '#2196F3',
  in_progress: '#FF9800',
  completed: '#4CAF50',
  failed: '#F44336',
  paused: '#9E9E9E',
};

const GOAL_STATUS_LABELS: Record<ActiveGoal['status'], string> = {
  active: 'Ativo',
  in_progress: 'Em Progresso',
  completed: 'Completo',
  failed: 'Falhou',
  paused: 'Pausado',
};

const ActiveGoalsView: React.FC<ActiveGoalsViewProps> = ({ goals }) => {
  if (goals.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
        Nenhum objetivo ativo no momento.
      </Typography>
    );
  }

  const getProgress = (goal: ActiveGoal): number => {
    if (goal.requiredActions.length === 0) return 0;
    return (goal.completedActions.length / goal.requiredActions.length) * 100;
  };

  const getPriorityColor = (priority: number): 'error' | 'warning' | 'success' | 'default' => {
    if (priority >= 8) return 'error';
    if (priority >= 5) return 'warning';
    return 'success';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {goals.map((goal) => {
        const progress = getProgress(goal);
        return (
          <Paper key={goal.goalId} variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6">{goal.goalName}</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={GOAL_STATUS_LABELS[goal.status]}
                    size="small"
                    sx={{
                      backgroundColor: GOAL_STATUS_COLORS[goal.status],
                      color: 'white',
                    }}
                  />
                  <Chip
                    label={`Prioridade: ${goal.priority}`}
                    size="small"
                    color={getPriorityColor(goal.priority)}
                    variant="outlined"
                  />
                </Box>
              </Box>
              
              {goal.requiredActions.length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Progresso: {goal.completedActions.length} / {goal.requiredActions.length} ações
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(progress)}%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={progress} />
                </Box>
              )}

              {goal.lastActionAt && (
                <Typography variant="caption" color="text.secondary">
                  Última ação: {new Date(goal.lastActionAt).toLocaleString()}
                </Typography>
              )}
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
};

export default ActiveGoalsView;

