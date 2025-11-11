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
  Rule as RuleIcon,
} from '@mui/icons-material';
import { RootState } from '../store';
import {
  fetchRules,
  createRule,
  updateRule,
  deleteRule,
  clearError,
} from '../store/ruleSlice';
import { Rule } from '../services/ruleService';
import { useToast } from '../hooks/useToast';
import EmptyState from './EmptyState';
import ListSkeleton from './ListSkeleton';

const CATEGORIES = [
  'comunicação',
  'comportamento',
  'técnica',
  'qualidade',
  'segurança',
];

const RuleManagement: React.FC = () => {
  const dispatch = useDispatch();
  const { rules, loading, error } = useSelector((state: RootState) => state.rule);
  const { showSuccess, showError } = useToast();
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
    try {
      if (editingRule) {
        await dispatch(updateRule({ id: editingRule.id, data: formData }) as any);
        showSuccess('Regra atualizada com sucesso!');
      } else {
        await dispatch(createRule(formData as any) as any);
        showSuccess('Regra criada com sucesso!');
      }
      handleCloseDialog();
      dispatch(fetchRules() as any);
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Erro ao salvar regra';
      showError(`Erro ao salvar regra: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta regra?')) {
      try {
        await dispatch(deleteRule(id) as any);
        showSuccess('Regra excluída com sucesso!');
        dispatch(fetchRules() as any);
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || 'Erro ao excluir regra';
        showError(`Erro ao excluir regra: ${errorMessage}`);
      }
    }
  };


  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1">
            Gerenciamento de Regras
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nova Regra
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        {loading && rules.length === 0 ? (
          <ListSkeleton count={5} hasSecondary={true} hasAction={true} />
        ) : !loading && rules.length === 0 ? (
          <EmptyState
            icon={<RuleIcon />}
            title="Nenhuma regra cadastrada"
            description="Crie regras para definir o comportamento dos seus agentes. Regras podem ser de comunicação, qualidade, segurança e mais."
            actionLabel="Criar Primeira Regra"
            onAction={() => handleOpenDialog()}
            size="medium"
          />
        ) : (
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

