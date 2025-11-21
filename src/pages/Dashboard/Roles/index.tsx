import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import ListItem from '@mui/material/ListItem';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import AddIcon from '@mui/icons-material/Add';
import FlagIcon from '@mui/icons-material/Flag';
import EditIcon from '@mui/icons-material/Edit';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import BuildIcon from '@mui/icons-material/Build';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import ListItemText from '@mui/material/ListItemText';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import FilterListIcon from '@mui/icons-material/FilterList';
import FormControlLabel from '@mui/material/FormControlLabel';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';

import { RootState } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import { RoleGoal } from '../../../types/goap.types';
import EmptyState from '../../../components/EmptyState';
import { fetchActions } from '../../../store/actionSlice';
import ListSkeleton from '../../../components/ListSkeleton';
import { Role, roleService } from '../../../services/roleService';
import {
  fetchTools,
  addToolToRole,
  removeToolFromRole,
} from '../../../store/toolSlice';
import {
  fetchRoles,
  createRole,
  updateRole,
  deleteRole,
  clearError,
} from '../../../store/roleSlice';

import RoleGoalFormDialog from './components/RoleGoalFormDialog';

const CATEGORIES = [
  'atendimento',
  'educação',
  'financeiro',
  'técnico',
  'vendas',
  'suporte',
];

const RoleManagement: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { roles, loading, error } = useSelector((state: RootState) => state.role);
  const { tools } = useSelector((state: RootState) => state.tool);
  const { showSuccess, showError } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [toolsDialogOpen, setToolsDialogOpen] = useState(false);
  const [selectedRoleForTools, setSelectedRoleForTools] = useState<Role | null>(null);
  const [roleToolIds, setRoleToolIds] = useState<Set<string>>(new Set());
  const [goalsDialogOpen, setGoalsDialogOpen] = useState(false);
  const [selectedRoleForGoals, setSelectedRoleForGoals] = useState<Role | null>(null);
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<RoleGoal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    category: 'atendimento',
    isActive: true,
  });

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchTools(true)); // Carregar apenas tools ativas
    dispatch(fetchActions()); // Carregar actions para seleção em goals
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description,
        prompt: role.prompt,
        category: role.category,
        isActive: role.isActive,
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        prompt: '',
        category: 'atendimento',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRole(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingRole) {
        await dispatch(updateRole({ id: editingRole.id, data: formData }));
        showSuccess('Role atualizado com sucesso!');
      } else {
        await dispatch(createRole(formData));
        showSuccess('Role criado com sucesso!');
      }
      handleCloseDialog();
      dispatch(fetchRoles());
    } catch (error) {
      const errorMessage = error?.message || error?.toString() || 'Erro ao salvar role';
      showError(`Erro ao salvar role: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este role?')) {
      try {
        await dispatch(deleteRole(id));
        showSuccess('Role excluído com sucesso!');
        dispatch(fetchRoles());
      } catch (error) {
        const errorMessage = error?.message || error?.toString() || 'Erro ao excluir role';
        showError(`Erro ao excluir role: ${errorMessage}`);
      }
    }
  };

  // Função para filtrar tools baseado na busca e categoria
  const getFilteredTools = () => {
    return tools.filter((tool) => {
      // Filtro por categoria
      const matchesCategory = selectedCategory === 'todas' || tool.category === selectedCategory;
      
      // Filtro por busca (nome ou descrição)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        !searchTerm || 
        tool.name.toLowerCase().includes(searchLower) || 
        tool.description.toLowerCase().includes(searchLower);
      
      return matchesCategory && matchesSearch;
    });
  };

  // Obter categorias únicas das tools
  const getAvailableCategories = () => {
    const categories = new Set(tools.map(tool => tool.category));
    return Array.from(categories).sort();
  };


  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1">
            Gerenciamento de Roles (Cargos)
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Novo Role
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        {loading && roles.length === 0 ? (
          <ListSkeleton count={5} hasSecondary={true} hasAction={true} />
        ) : !loading && roles.length === 0 ? (
          <EmptyState
            icon={<AssignmentIndIcon />}
            title="Nenhum role cadastrado"
            description="Crie roles (cargos) para definir as responsabilidades e capacidades dos seus agentes. Roles ajudam a organizar e especializar os agentes."
            actionLabel="Criar Primeiro Role"
            onAction={() => handleOpenDialog()}
            size="medium"
          />
        ) : (
          <List>
            {roles.map((role) => (
            <ListItem
              key={role.id}
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
                    {role.name} {role.isDefault && <Chip label="Padrão" size="small" color="primary" />}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {role.description}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Chip label={role.category} size="small" color="secondary" variant="outlined" />
                    <Chip
                      label={role.isActive ? 'Ativo' : 'Inativo'}
                      size="small"
                      color={role.isActive ? 'success' : 'default'}
                    />
                  </Box>
                </Box>
                <ListItemSecondaryAction>
                  <Tooltip title="Gerenciar Goals">
                    <IconButton
                      edge="end"
                      onClick={() => {
                        setSelectedRoleForGoals(role);
                        setGoalsDialogOpen(true);
                      }}
                    >
                      <FlagIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Gerenciar Ferramentas">
                    <IconButton
                      edge="end"
                      onClick={async () => {
                        setSelectedRoleForTools(role);
                        try {
                          const toolIds = await roleService.getTools(role.id);
                          setRoleToolIds(new Set(toolIds));
                        } catch (error) {
                          console.error('Error fetching role tools:', error);
                          setRoleToolIds(new Set());
                        }
                        setToolsDialogOpen(true);
                      }}
                    >
                      <BuildIcon />
                    </IconButton>
                  </Tooltip>
                  <IconButton edge="end" onClick={() => handleOpenDialog(role)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDelete(role.id)} disabled={role.isDefault}>
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
        <DialogTitle>{editingRole ? 'Editar Role' : 'Novo Role'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nome"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Atendente de Tabacaria"
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
              rows={6}
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              placeholder="Descreva o contexto, responsabilidades e conhecimento necessário para este cargo"
              required
              helperText="Este prompt será usado para definir o contexto do agente"
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
            {editingRole ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para gerenciar Tools da Role */}
      <Dialog open={toolsDialogOpen} onClose={() => {
        setToolsDialogOpen(false);
        setSearchTerm('');
        setSelectedCategory('todas');
      }} maxWidth="md" fullWidth>
        <DialogTitle>
          Ferramentas da Role: {selectedRoleForTools?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {tools.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Nenhuma ferramenta disponível. Crie ferramentas em{' '}
                <Button size="small" onClick={() => navigate('/dashboard/tools')}>
                  Gerenciamento de Ferramentas
                </Button>
              </Typography>
            ) : (
              <>
                {/* Barra de busca e filtros */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Buscar ferramentas por nome ou descrição..."
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

                {/* Lista de ferramentas filtradas */}
                {getFilteredTools().length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    Nenhuma ferramenta encontrada com os filtros aplicados.
                  </Typography>
                ) : (
                  <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {getFilteredTools().map((tool) => {
                  const isAssociated = roleToolIds.has(tool.id);
                  return (
                    <ListItem key={tool.id}>
                      <Checkbox
                        checked={isAssociated}
                        onChange={async () => {
                          if (selectedRoleForTools) {
                            try {
                              if (isAssociated) {
                                await dispatch(
                                  removeToolFromRole({
                                    roleId: selectedRoleForTools.id,
                                    toolId: tool.id,
                                  })
                                );
                                setRoleToolIds((prev) => {
                                  const newSet = new Set(prev);
                                  newSet.delete(tool.id);
                                  return newSet;
                                });
                              } else {
                                await dispatch(
                                  addToolToRole({
                                    roleId: selectedRoleForTools.id,
                                    toolId: tool.id,
                                  })
                                );
                                setRoleToolIds((prev) => {
                                  const newSet = new Set(prev);
                                  newSet.add(tool.id);
                                  return newSet;
                                });
                              }
                            } catch (error) {
                              console.error('Error toggling tool:', error);
                            }
                          }
                        }}
                      />
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">{tool.name}</Typography>
                            <Chip label={tool.type} size="small" color="primary" variant="outlined" />
                            <Chip label={tool.category} size="small" />
                          </Box>
                        }
                        secondary={tool.description}
                      />
                    </ListItem>
                  );
                })}
                  </List>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToolsDialogOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para gerenciar Goals da Role */}
      <Dialog open={goalsDialogOpen} onClose={() => {
        setGoalsDialogOpen(false);
        setSelectedRoleForGoals(null);
        setEditingGoal(null);
      }} maxWidth="md" fullWidth>
        <DialogTitle>
          Goals da Role: {selectedRoleForGoals?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Goals do Role</Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingGoal(null);
                  setGoalFormOpen(true);
                }}
              >
                Adicionar Goal
              </Button>
            </Box>
            {selectedRoleForGoals?.goals && selectedRoleForGoals.goals.length > 0 ? (
              <List>
                {selectedRoleForGoals.goals.map((goal) => (
                  <ListItem
                    key={goal.id}
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="h6">{goal.name}</Typography>
                          <Chip label={`Prioridade: ${goal.priority}`} size="small" color="primary" variant="outlined" />
                          <Chip label={goal.category} size="small" />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {goal.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              <strong>Ativação:</strong> {goal.activationConditions.length} condição(ões)
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              <strong>Sucesso:</strong> {goal.successCriteria.length} critério(s)
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              <strong>Ações:</strong> {goal.suggestedActions.length}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setEditingGoal(goal);
                          setGoalFormOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={async () => {
                          if (window.confirm('Tem certeza que deseja remover este goal?')) {
                            if (selectedRoleForGoals) {
                              const updatedGoals = (selectedRoleForGoals.goals || []).filter(g => g.id !== goal.id);
                              try {
                                await dispatch(updateRole({
                                  id: selectedRoleForGoals.id,
                                  data: { goals: updatedGoals },
                                }));
                                showSuccess('Goal removido com sucesso!');
                                dispatch(fetchRoles());
                              } catch (error) {
                                showError(`Erro ao remover goal: ${error?.message || error?.toString()}`);
                              }
                            }
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                Nenhum goal cadastrado para este role.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setGoalsDialogOpen(false);
            setSelectedRoleForGoals(null);
            setEditingGoal(null);
          }}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para criar/editar Goal */}
      <RoleGoalFormDialog
        open={goalFormOpen}
        onClose={() => {
          setGoalFormOpen(false);
          setEditingGoal(null);
        }}
        onSubmit={async (goal) => {
          if (selectedRoleForGoals) {
            const currentGoals = selectedRoleForGoals.goals || [];
            let updatedGoals: RoleGoal[];
            
            if (editingGoal) {
              updatedGoals = currentGoals.map(g => g.id === goal.id ? goal : g);
            } else {
              updatedGoals = [...currentGoals, goal];
            }

            try {
              await dispatch(updateRole({
                id: selectedRoleForGoals.id,
                data: { goals: updatedGoals },
              }));
              showSuccess(editingGoal ? 'Goal atualizado com sucesso!' : 'Goal criado com sucesso!');
              setGoalFormOpen(false);
              setEditingGoal(null);
              dispatch(fetchRoles());
            } catch (error) {
              showError(`Erro ao salvar goal: ${error?.message || error?.toString()}`);
            }
          }
        }}
        editingGoal={editingGoal}
      />
    </Box>
  );
};

export default RoleManagement;

