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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import {
  fetchRules,
  createRule,
  updateRule,
  deleteRule,
  clearError,
} from '../store/ruleSlice';
import { Rule } from '../services/ruleService';

const CATEGORIES = [
  'comunicação',
  'comportamento',
  'técnica',
  'qualidade',
  'segurança',
];

const RuleManagement: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { rules, loading, error } = useSelector((state: RootState) => state.rule);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    category: 'comunicação',
    isActive: true,
  });

  useEffect(() => {
    dispatch(fetchRules() as any);
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleOpenDialog = (rule?: Rule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        description: rule.description,
        prompt: rule.prompt,
        category: rule.category,
        isActive: rule.isActive,
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        description: '',
        prompt: '',
        category: 'comunicação',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRule(null);
  };

  const handleSubmit = async () => {
    if (editingRule) {
      await dispatch(updateRule({ id: editingRule.id, data: formData }) as any);
    } else {
      await dispatch(createRule(formData as any) as any);
    }
    handleCloseDialog();
    dispatch(fetchRules() as any);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta regra?')) {
      await dispatch(deleteRule(id) as any);
      dispatch(fetchRules() as any);
    }
  };

  if (loading && rules.length === 0) {
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
            Gerenciamento de Regras
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/agents')}
            >
              Agentes
            </Button>
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
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Nova Regra
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        <List>
          {rules.map((rule) => (
            <ListItem
              key={rule.id}
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
                  <Typography variant="h6">
                    {rule.name} {rule.isDefault && <Chip label="Padrão" size="small" color="primary" />}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {rule.description}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Chip label={rule.category} size="small" color="secondary" variant="outlined" />
                    <Chip
                      label={rule.isActive ? 'Ativo' : 'Inativo'}
                      size="small"
                      color={rule.isActive ? 'success' : 'default'}
                    />
                  </Box>
                </Box>
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleOpenDialog(rule)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDelete(rule.id)} disabled={rule.isDefault}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </Box>
            </ListItem>
          ))}
        </List>

        {rules.length === 0 && !loading && (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
            Nenhuma regra cadastrada. Clique em "Nova Regra" para criar uma.
          </Typography>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingRule ? 'Editar Regra' : 'Nova Regra'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nome"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Sempre cumprimentar, Confirmar entendimento"
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
            <FormControl fullWidth required>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                label="Categoria"
              >
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Prompt"
              fullWidth
              multiline
              rows={4}
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              placeholder="Descreva como esta regra deve ser aplicada no comportamento do agente"
              required
              helperText="Este prompt será usado para definir como a regra é aplicada"
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
            disabled={!formData.name || !formData.prompt}
          >
            {editingRule ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RuleManagement;

