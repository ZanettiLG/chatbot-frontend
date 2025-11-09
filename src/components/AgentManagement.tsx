import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormHelperText,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import {
  fetchAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  clearError,
} from '../store/agentSlice';
import { fetchRoles } from '../store/roleSlice';
import { fetchPersonalities } from '../store/personalitySlice';
import { fetchRules } from '../store/ruleSlice';
import { Agent } from '../store/agentSlice';

const LANGUAGES = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español' },
];

const STYLES = [
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'técnico', label: 'Técnico' },
  { value: 'amigável', label: 'Amigável' },
];

const AgentManagement: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { agents, loading, error } = useSelector((state: RootState) => state.agent);
  const { roles } = useSelector((state: RootState) => state.role);
  const { personalities } = useSelector((state: RootState) => state.personality);
  const { rules } = useSelector((state: RootState) => state.rule);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    roleId: '',
    personalityId: '',
    ruleIds: [] as string[],
    language: 'pt-BR',
    style: 'formal',
    systemPrompt: '',
    knowledgeIds: [] as string[],
    isActive: true,
  });

  useEffect(() => {
    dispatch(fetchAgents() as any);
    dispatch(fetchRoles({ activeOnly: true }) as any);
    dispatch(fetchPersonalities({ activeOnly: true }) as any);
    dispatch(fetchRules({ activeOnly: true }) as any);
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleOpenDialog = (agent?: Agent) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        name: agent.name,
        description: agent.description,
        roleId: agent.roleId,
        personalityId: agent.personalityId,
        ruleIds: agent.ruleIds || [],
        language: agent.language || 'pt-BR',
        style: agent.style || 'formal',
        systemPrompt: agent.systemPrompt || '',
        knowledgeIds: agent.knowledgeIds || [],
        isActive: agent.isActive,
      });
    } else {
      setEditingAgent(null);
      setFormData({
        name: '',
        description: '',
        roleId: '',
        personalityId: '',
        ruleIds: [],
        language: 'pt-BR',
        style: 'formal',
        systemPrompt: '',
        knowledgeIds: [],
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAgent(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.roleId || !formData.personalityId) {
      return;
    }

    if (editingAgent) {
      await dispatch(updateAgent({ id: editingAgent.id, data: formData }) as any);
    } else {
      await dispatch(createAgent(formData as any) as any);
    }
    handleCloseDialog();
    dispatch(fetchAgents() as any);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este agente?')) {
      await dispatch(deleteAgent(id) as any);
      dispatch(fetchAgents() as any);
    }
  };

  const selectedRole = roles.find((r) => r.id === formData.roleId);
  const selectedPersonality = personalities.find((p) => p.id === formData.personalityId);

  if (loading && agents.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1">
            Gerenciamento de Agentes
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/roles')}
            >
              Roles
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/personalities')}
            >
              Personalidades
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/rules')}
            >
              Regras
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Novo Agente
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        <List>
          {agents.map((agent) => {
            const agentRole = roles.find((r) => r.id === agent.roleId);
            const agentPersonality = personalities.find((p) => p.id === agent.personalityId);
            
            return (
              <ListItem
                key={agent.id}
                sx={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  mb: 1,
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">{agent.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {agent.description}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {agentRole && (
                        <Chip label={agentRole.name} size="small" color="primary" variant="outlined" />
                      )}
                      {agentPersonality && (
                        <Chip label={agentPersonality.name} size="small" color="secondary" variant="outlined" />
                      )}
                      <Chip label={agent.language} size="small" />
                      <Chip label={agent.style} size="small" />
                      <Chip
                        label={agent.isActive ? 'Ativo' : 'Inativo'}
                        size="small"
                        color={agent.isActive ? 'success' : 'default'}
                      />
                    </Box>
                  </Box>
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleOpenDialog(agent)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(agent.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </Box>
              </ListItem>
            );
          })}
        </List>

        {agents.length === 0 && !loading && (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
            Nenhum agente cadastrado. Clique em "Novo Agente" para criar um.
          </Typography>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingAgent ? 'Editar Agente' : 'Novo Agente'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nome"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              label="Descrição"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />

            <Divider sx={{ my: 1 }} />

            <FormControl fullWidth required>
              <InputLabel>Role (Cargo)</InputLabel>
              <Select
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                label="Role (Cargo)"
              >
                {roles.filter((r) => r.isActive).map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name} {role.isDefault && '(Padrão)'}
                  </MenuItem>
                ))}
              </Select>
              {selectedRole && (
                <FormHelperText>{selectedRole.description}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Personalidade</InputLabel>
              <Select
                value={formData.personalityId}
                onChange={(e) => setFormData({ ...formData, personalityId: e.target.value })}
                label="Personalidade"
              >
                {personalities.filter((p) => p.isActive).map((personality) => (
                  <MenuItem key={personality.id} value={personality.id}>
                    {personality.name} {personality.isDefault && '(Padrão)'}
                  </MenuItem>
                ))}
              </Select>
              {selectedPersonality && (
                <FormHelperText>{selectedPersonality.description}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Regras de Comportamento</InputLabel>
              <Select
                multiple
                value={formData.ruleIds}
                onChange={(e) => setFormData({ ...formData, ruleIds: e.target.value as string[] })}
                label="Regras de Comportamento"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((ruleId) => {
                      const rule = rules.find((r) => r.id === ruleId);
                      return rule ? <Chip key={ruleId} label={rule.name} size="small" /> : null;
                    })}
                  </Box>
                )}
              >
                {rules.filter((r) => r.isActive).map((rule) => (
                  <MenuItem key={rule.id} value={rule.id}>
                    <Checkbox checked={formData.ruleIds.includes(rule.id)} />
                    {rule.name} {rule.isDefault && '(Padrão)'}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Selecione as regras que este agente deve seguir
              </FormHelperText>
            </FormControl>

            <Divider sx={{ my: 1 }} />

            <FormControl fullWidth required>
              <InputLabel>Linguagem</InputLabel>
              <Select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                label="Linguagem"
              >
                {LANGUAGES.map((lang) => (
                  <MenuItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Estilo de Comunicação</InputLabel>
              <Select
                value={formData.style}
                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                label="Estilo de Comunicação"
              >
                {STYLES.map((style) => (
                  <MenuItem key={style.value} value={style.value}>
                    {style.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 1 }} />

            <TextField
              label="System Prompt (Opcional)"
              fullWidth
              multiline
              rows={4}
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              placeholder="Prompt customizado adicional para personalizar ainda mais o comportamento do agente"
              helperText="Este prompt será adicionado ao final do prompt combinado (role + personalidade + regras)"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Ativo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.roleId || !formData.personalityId}
          >
            {editingAgent ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgentManagement;
