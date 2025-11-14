import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { InferenceState } from '../services/inferenceService';

interface InferenceStateViewProps {
  inferenceState: InferenceState;
  compact?: boolean;
}

const InferenceStateView: React.FC<InferenceStateViewProps> = ({ inferenceState, compact = false }) => {
  const getStateColor = (state: string) => {
    switch (state) {
      case 'OBSERVATION':
        return 'default';
      case 'ANALYSIS':
        return 'info';
      case 'CONTRADICTION':
        return 'warning';
      case 'SYNTHESIS':
        return 'primary';
      case 'ACTION':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'OBSERVATION':
        return 'Observação';
      case 'ANALYSIS':
        return 'Análise (Tese)';
      case 'CONTRADICTION':
        return 'Contradição (Antítese)';
      case 'SYNTHESIS':
        return 'Síntese';
      case 'ACTION':
        return 'Ação';
      default:
        return state;
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'OBSERVATION':
        return <PsychologyIcon />;
      case 'ANALYSIS':
        return <LightbulbIcon />;
      case 'CONTRADICTION':
        return <WarningIcon />;
      case 'SYNTHESIS':
        return <CheckCircleIcon />;
      case 'ACTION':
        return <PlayArrowIcon />;
      default:
        return <PsychologyIcon />;
    }
  };

  if (compact) {
    return (
      <Paper
        elevation={1}
        sx={{
          p: 1.5,
          mb: 1,
          bgcolor: 'background.paper',
          borderLeft: 3,
          borderColor: `${getStateColor(inferenceState.state)}.main`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {getStateIcon(inferenceState.state)}
          <Chip
            label={getStateLabel(inferenceState.state)}
            size="small"
            color={getStateColor(inferenceState.state)}
            variant="outlined"
          />
          <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
            {new Date(inferenceState.timestamp).toLocaleTimeString()}
          </Typography>
        </Box>
        {inferenceState.synthesis && (
          <Typography variant="body2" color="text.secondary">
            <strong>Intenção:</strong> {inferenceState.synthesis.final_intent} ({Math.round(inferenceState.confidence * 100)}%)
          </Typography>
        )}
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStateIcon(inferenceState.state)}
          <Typography variant="h6">Estado de Pensamento</Typography>
        </Box>
        <Chip
          label={getStateLabel(inferenceState.state)}
          color={getStateColor(inferenceState.state)}
          icon={getStateIcon(inferenceState.state)}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Confiança: {Math.round(inferenceState.confidence * 100)}%
        </Typography>
        <LinearProgress
          variant="determinate"
          value={inferenceState.confidence * 100}
          color={inferenceState.confidence > 0.7 ? 'success' : inferenceState.confidence > 0.4 ? 'warning' : 'error'}
          sx={{ height: 8, borderRadius: 1 }}
        />
      </Box>

      {inferenceState.thesis && (
        <Accordion defaultExpanded sx={{ mb: 1 }}>
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              '&:hover': { bgcolor: 'action.hover' },
              cursor: 'pointer',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              🟢 Análise (Tese)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Intenção:</strong> {inferenceState.thesis.intent}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Hipótese:</strong> {inferenceState.thesis.hypothesis}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Confiança:</strong> {Math.round(inferenceState.thesis.confidence * 100)}%
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {inferenceState.antithesis && (
        <Accordion sx={{ mb: 1 }}>
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              '&:hover': { bgcolor: 'action.hover' },
              cursor: 'pointer',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              🔴 Contradição (Antítese)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {inferenceState.antithesis.contradictions && inferenceState.antithesis.contradictions.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Contradições identificadas:</strong>
                  </Typography>
                  <List dense>
                    {inferenceState.antithesis.contradictions.map((contradiction, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={contradiction}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              {inferenceState.antithesis.alternative_intent && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Intenção alternativa:</strong> {inferenceState.antithesis.alternative_intent}
                </Typography>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {inferenceState.synthesis && (
        <Accordion defaultExpanded sx={{ mb: 1 }}>
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              '&:hover': { bgcolor: 'action.hover' },
              cursor: 'pointer',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              🔵 Síntese
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Intenção Final:</strong> {inferenceState.synthesis.final_intent}
              </Typography>
              {inferenceState.synthesis.requires_confirmation && (
                <Chip
                  label="Requer Confirmação"
                  size="small"
                  color="warning"
                  sx={{ mt: 1, mb: 1 }}
                />
              )}
              {inferenceState.synthesis.action_plan && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Plano de Ação:</strong>
                  </Typography>
                  {Array.isArray(inferenceState.synthesis.action_plan) ? (
                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                      {inferenceState.synthesis.action_plan.map((action, index) => (
                        <Typography key={index} variant="body2" color="text.secondary" component="li" sx={{ mb: 0.5 }}>
                          {action}
                        </Typography>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {inferenceState.synthesis.action_plan}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="caption" color="text.secondary">
        Timestamp: {new Date(inferenceState.timestamp).toLocaleString()}
      </Typography>
    </Paper>
  );
};

export default InferenceStateView;

