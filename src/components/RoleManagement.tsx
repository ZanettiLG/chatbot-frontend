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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Build as BuildIcon,
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
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [toolsDialogOpen, setToolsDialogOpen] = useState(false);
  const [selectedRoleForTools, setSelectedRoleForTools] = useState<Role | null>(null);
  const [roleToolIds, setRoleToolIds] = useState<Set<string>>(new Set());
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
    if (editingRole) {
      await dispatch(updateRole({ id: editingRole.id, data: formData }) as any);
    } else {
      await dispatch(createRole(formData as any) as any);
    }
    handleCloseDialog();
    dispatch(fetchRoles() as any);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este role?')) {
      await dispatch(deleteRole(id) as any);
      dispatch(fetchRoles() as any);
    }
  };

  if (loading && roles.length === 0) {
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
            Gerenciamento de Roles (Cargos)
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
              variant="outlined"
              size="small"
              onClick={() => navigate('/tools')}
            >
              Ferramentas
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Novo Role
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

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

        {roles.length === 0 && !loading && (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
            Nenhum role cadastrado. Clique em "Novo Role" para criar um.
          </Typography>
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
      <Dialog open={toolsDialogOpen} onClose={() => setToolsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Ferramentas da Role: {selectedRoleForTools?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {tools.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Nenhuma ferramenta disponível. Crie ferramentas em{' '}
                <Button size="small" onClick={() => navigate('/tools')}>
                  Gerenciamento de Ferramentas
                </Button>
              </Typography>
            ) : (
              <List>
                {tools.map((tool) => {
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

