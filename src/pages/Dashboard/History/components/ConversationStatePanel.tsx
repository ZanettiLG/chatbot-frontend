import React from 'react';
import Box from '@mui/material/Box';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import CircularProgress from '@mui/material/CircularProgress';
import FlagIcon from '@mui/icons-material/Flag';
import PublicIcon from '@mui/icons-material/Public';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { ConversationState } from '../../../../types/goap.types';
import WorldStateView from '../../../../components/WorldStateView';
import PlannedActionsView from './PlannedActionsView';

import ActiveGoalsView from './ActiveGoalsView';

interface ConversationStatePanelProps {
  conversationState: ConversationState | null;
  loading?: boolean;
}

const ConversationStatePanel: React.FC<ConversationStatePanelProps> = ({
  conversationState,
  loading = false,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!conversationState) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        Nenhum estado de conversa disponível ainda.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PublicIcon />
            <Typography variant="h6">Estado do Mundo</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <WorldStateView worldState={conversationState.worldState} />
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FlagIcon />
            <Typography variant="h6">
              Objetivos Ativos ({conversationState.currentGoals.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <ActiveGoalsView goals={conversationState.currentGoals} />
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PlayArrowIcon />
            <Typography variant="h6">
              Ações Planejadas ({conversationState.pendingActions.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <PlannedActionsView actions={conversationState.pendingActions} />
        </AccordionDetails>
      </Accordion>

      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
        Última atualização: {new Date(conversationState.lastUpdated).toLocaleString()}
      </Typography>
    </Box>
  );
};

export default ConversationStatePanel;

