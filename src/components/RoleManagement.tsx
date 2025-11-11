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
  Tooltip,
  Checkbox,
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Build as BuildIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import {
  fetchRoles,
  createRole,
  updateRole,
  deleteRole,
  clearError,
} from '../store/roleSlice';
import { Role, roleService } from '../services/roleService';
import { fetchTools, addToolToRole, removeToolFromRole } from '../store/toolSlice';
import { Tool } from '../services/toolService';
import { useToast } from '../hooks/useToast';
import EmptyState from './EmptyState';
import ListSkeleton from './ListSkeleton';
import { AssignmentInd as AssignmentIndIcon } from '@mui/icons-material';

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
    dispatch(fetchRoles() as any);
    dispatch(fetchTools(true) as any); // Carregar apenas tools ativas
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
        await dispatch(updateRole({ id: editingRole.id, data: formData }) as any);
        showSuccess('Role atualizado com sucesso!');
      } else {
        await dispatch(createRole(formData as any) as any);
        showSuccess('Role criado com sucesso!');
      }
      handleCloseDialog();
      dispatch(fetchRoles() as any);
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Erro ao salvar role';
      showError(`Erro ao salvar role: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este role?')) {
      try {
        await dispatch(deleteRole(id) as any);
        showSuccess('Role excluído com sucesso!');
        dispatch(fetchRoles() as any);
      } catch (error: any) {
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
                                  }) as any
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
                                  }) as any
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
    </Box>
  );
};

export default RoleManagement;

