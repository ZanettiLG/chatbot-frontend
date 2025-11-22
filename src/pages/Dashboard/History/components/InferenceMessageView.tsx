import React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import Collapse from '@mui/material/Collapse';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import WarningIcon from '@mui/icons-material/Warning';
import LinearProgress from '@mui/material/LinearProgress';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { InferenceState } from '../../../../services/inferenceService';

interface InferenceMessageViewProps {
  inference: InferenceState;
  isUser: boolean;
  hasInference: boolean;
  expanded: boolean;
  getStateColor: (state: string) => string;
  getStateLabel: (state: string) => string;
}

const InferenceMessageView = React.memo<InferenceMessageViewProps>(({ inference, isUser, hasInference, expanded, getStateColor, getStateLabel }: InferenceMessageViewProps) => {
  if(!isUser || !hasInference) {
    return null;
  }
  return (
    <Collapse in={expanded}>
      <Paper
        elevation={2}
        sx={{
          mt: 1,
          p: 2,
          bgcolor: 'background.paper',
          borderLeft: 3,
          borderColor: `${getStateColor(inference.state)}.main`,
          maxWidth: '80%',
          ml: 0,
          mr: 0, // Alinhar à direita junto com a mensagem do usuário
        }}
      >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PsychologyIcon color={getStateColor(inference.state)} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Processo de Pensamento
            </Typography>
            <Chip
              label={getStateLabel(inference.state)}
              size="small"
              color={getStateColor(inference.state)}
              sx={{ ml: 'auto' }}
            />
          </Box>

          {/* Confiança */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Confiança: {Math.round(inference.confidence * 100)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={inference.confidence * 100}
              color={inference.confidence > 0.7 ? 'success' : inference.confidence > 0.4 ? 'warning' : 'error'}
              sx={{ height: 6, borderRadius: 1, mt: 0.5 }}
            />
          </Box>

          {/* Tese */}
          {inference.thesis && (
            <Accordion defaultExpanded sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LightbulbIcon color="info" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Análise (Tese)
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Intenção:</strong> {inference.thesis.intent}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Hipótese:</strong> {inference.thesis.hypothesis}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Confiança:</strong> {Math.round(inference.thesis.confidence * 100)}%
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Antítese */}
          {inference.antithesis && (
            <Accordion sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="warning" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Contradição (Antítese)
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  {inference.antithesis.contradictions && inference.antithesis.contradictions.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Contradições identificadas:</strong>
                      </Typography>
                      <List dense>
                        {inference.antithesis.contradictions.map((contradiction, index) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <ListItemText
                              primary={contradiction}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  {inference.antithesis.alternative_intent && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Intenção alternativa:</strong> {inference.antithesis.alternative_intent}
                    </Typography>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Síntese */}
          {inference.synthesis && (
            <Accordion defaultExpanded sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon color="primary" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Síntese
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Intenção Final:</strong> {inference.synthesis.final_intent}
                  </Typography>
                  {inference.synthesis.requires_confirmation && (
                    <Chip
                      label="Requer Confirmação"
                      size="small"
                      color="warning"
                      sx={{ mt: 1, mb: 1 }}
                    />
                  )}
                  {inference.synthesis.action_plan && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Plano de Ação:</strong>
                      </Typography>
                      {Array.isArray(inference.synthesis.action_plan) ? (
                        <Box component="ul" sx={{ pl: 2, m: 0 }}>
                          {inference.synthesis.action_plan.map((action, index) => (
                            <Typography key={index} variant="body2" color="text.secondary" component="li" sx={{ mb: 0.5 }}>
                              {action}
                            </Typography>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {inference.synthesis.action_plan}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          <Divider sx={{ my: 1 }} />

          <Typography variant="caption" color="text.secondary">
            {new Date(inference.timestamp).toLocaleString()}
          </Typography>
        </Paper>
    </Collapse>
  );
});

InferenceMessageView.displayName = 'InferenceMessageView';

export default InferenceMessageView;