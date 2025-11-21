import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ListItemText from '@mui/material/ListItemText';
import InputAdornment from '@mui/material/InputAdornment';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FilterListIcon from '@mui/icons-material/FilterList';
import CircularProgress from '@mui/material/CircularProgress';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';

import { RootState } from '../../../store';
import {
  fetchActions,
  createAction,
  updateAction,
  clearError,
} from '../../../store/actionSlice';
import { Action } from '../../types/goap.types';
import { useToast } from '../../../hooks/useToast';
import EmptyState from '../../../components/EmptyState';
import ListSkeleton from '../../../components/ListSkeleton';

import ActionFormDialog from './components/ActionFormDialog';

const CATEGORIES = [
  'vendas',
  'atendimento',
  'educação',
  'financeiro',
  'técnico',
  'suporte',
  'outros',
];

const ActionManagement: React.FC = () => {
  const dispatch = useDispatch();
  const { actions, loading, error } = useSelector((state: RootState) => state.action);
  const { roles } = useSelector((state: RootState) => state.role);
  const { showSuccess, showError } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');

  useEffect(() => {
    dispatch(fetchActions());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleOpenDialog = (action?: Action) => {
    if (action) {
      setEditingAction(action);
    } else {
      setEditingAction(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAction(null);
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingAction) {
        await dispatch(updateAction({ id: editingAction.id, data: formData }));
        showSuccess('Ação atualizada com sucesso!');
      } else {
        await dispatch(createAction(formData));
        showSuccess('Ação criada com sucesso!');
      }
      handleCloseDialog();
      dispatch(fetchActions());
    } catch (error) {
      const errorMessage = error?.message || error?.toString() || 'Erro ao salvar ação';
      showError(`Erro ao salvar ação: ${errorMessage}`);
    }
  };

  const getFilteredActions = () => {
    return actions.filter((action) => {
      const matchesCategory = selectedCategory === 'todas' || action.category === selectedCategory;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        action.name.toLowerCase().includes(searchLower) ||
        action.description.toLowerCase().includes(searchLower);
      return matchesCategory && matchesSearch;
    });
  };

  const getAvailableCategories = () => {
    const categories = new Set(actions.map(action => action.category));
    return Array.from(categories).sort();
  };

  const getRoleNames = (roleIds: string[]): string => {
    return roleIds
      .map(id => roles.find(r => r.id === id)?.name || id)
      .join(', ') || 'Nenhum';
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Gerenciamento de Ações
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nova Ação
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && actions.length === 0 ? (
          <ListSkeleton count={5} hasSecondary={true} hasAction={true} />
        ) : !loading && actions.length === 0 ? (
          <EmptyState
            icon={<PlayArrowIcon />}
            title="Nenhuma ação cadastrada"
            description="Crie ações para definir comportamentos do agente. Ações têm pré-requisitos e efeitos no estado do mundo."
            actionLabel="Criar Primeira Ação"
            onAction={() => handleOpenDialog()}
            size="medium"
          />
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Buscar ações por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
                size="small"
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <FilterListIcon sx={{ color: 'text.secondary' }} />
                <Chip
                  label="Todas"
                  onClick={() => setSelectedCategory('todas')}
                  color={selectedCategory === 'todas' ? 'primary' : 'default'}
                  variant={selectedCategory === 'todas' ? 'filled' : 'outlined'}
                  size="small"
                  sx={{ cursor: 'pointer' }}
                />
                {getAvailableCategories().map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    onClick={() => setSelectedCategory(category)}
                    color={selectedCategory === category ? 'primary' : 'default'}
                    variant={selectedCategory === category ? 'filled' : 'outlined'}
                    size="small"
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>

            {getFilteredActions().length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                Nenhuma ação encontrada com os filtros aplicados.
              </Typography>
            ) : (
              <List>
                {getFilteredActions().map((action) => (
                  <ListItem key={action.id}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          <Typography variant="h6">{action.name}</Typography>
                          <Chip label={action.category} size="small" />
                          <Chip label={`Custo: ${action.cost}`} size="small" color="primary" variant="outlined" />
                          {!action.isActive && <Chip label="Inativa" size="small" color="error" />}
                          {action.isStateOnly && <Chip label="Apenas Estado" size="small" color="info" />}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {action.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              <strong>Pré-requisitos:</strong> {action.prerequisites.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              <strong>Efeitos:</strong> {action.effects.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              <strong>Roles:</strong> {getRoleNames(action.roleIds)}
                            </Typography>
                            {action.toolId && (
                              <Typography variant="caption" color="primary">
                                <strong>Tool:</strong> {action.toolId}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleOpenDialog(action)}>
                        <EditIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}
      </Paper>

      <ActionFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        editingAction={editingAction}
      />
    </Box>
  );
};

export default ActionManagement;

