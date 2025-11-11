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
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { RootState } from '../store';
import {
  fetchTools,
  createTool,
  updateTool,
  deleteTool,
  clearError,
} from '../store/toolSlice';
import { Tool, ToolParameter } from '../services/toolService';
import { useToast } from '../hooks/useToast';
import EmptyState from './EmptyState';
import ListSkeleton from './ListSkeleton';
import { Build as BuildIcon } from '@mui/icons-material';

const TOOL_TYPES = ['function', 'database_action', 'api_call'];
const CATEGORIES = ['pedidos', 'cálculos', 'consultas', 'processamento', 'outros'];

const ToolManagement: React.FC = () => {
  const dispatch = useDispatch();
  const { tools, loading, error } = useSelector((state: RootState) => state.tool);
  const { showSuccess, showError } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'function' as 'function' | 'database_action' | 'api_call',
    handler: '',
    category: 'outros',
    parameters: [] as ToolParameter[],
    isActive: true,
  });

  useEffect(() => {
    dispatch(fetchTools() as any);
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleOpenDialog = (tool?: Tool) => {
    if (tool) {
      setEditingTool(tool);
      setFormData({
        name: tool.name,
        description: tool.description,
        type: tool.type,
        handler: tool.handler,
        category: tool.category,
        parameters: tool.parameters,
        isActive: tool.isActive,
      });
    } else {
      setEditingTool(null);
      setFormData({
        name: '',
        description: '',
        type: 'function',
        handler: '',
        category: 'outros',
        parameters: [],
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTool(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingTool) {
        await dispatch(updateTool({ id: editingTool.id, data: formData }) as any);
        showSuccess('Ferramenta atualizada com sucesso!');
      } else {
        await dispatch(createTool(formData) as any);
        showSuccess('Ferramenta criada com sucesso!');
      }
      handleCloseDialog();
      dispatch(fetchTools() as any);
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Erro ao salvar ferramenta';
      showError(`Erro ao salvar ferramenta: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta ferramenta?')) {
      try {
        await dispatch(deleteTool(id) as any);
        showSuccess('Ferramenta excluída com sucesso!');
        dispatch(fetchTools() as any);
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || 'Erro ao excluir ferramenta';
        showError(`Erro ao excluir ferramenta: ${errorMessage}`);
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
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Gerenciamento de Ferramentas
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nova Ferramenta
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && tools.length === 0 ? (
          <ListSkeleton count={5} hasSecondary={true} hasAction={true} />
        ) : !loading && tools.length === 0 ? (
          <EmptyState
            icon={<BuildIcon />}
            title="Nenhuma ferramenta cadastrada"
            description="Crie ferramentas para estender as capacidades dos seus agentes. Ferramentas podem ser funções, ações de banco de dados ou chamadas de API."
            actionLabel="Criar Primeira Ferramenta"
            onAction={() => handleOpenDialog()}
            size="medium"
          />
        ) : (
          <>
            {/* Barra de busca e filtros */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
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
              <List>
                {getFilteredTools().map((tool) => (
                  <ListItem key={tool.id}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6">{tool.name}</Typography>
                          <Chip label={tool.type} size="small" color="primary" variant="outlined" />
                          <Chip label={tool.category} size="small" />
                          {!tool.isActive && <Chip label="Inativa" size="small" color="error" />}
                        </Box>
                      }
                      secondary={tool.description}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleOpenDialog(tool)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" onClick={() => handleDelete(tool.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTool ? 'Editar Ferramenta' : 'Nova Ferramenta'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Nome"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Descrição"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                label="Tipo"
              >
                {TOOL_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Handler (nome da função/use case)"
              value={formData.handler}
              onChange={(e) => setFormData({ ...formData, handler: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
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
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Ativa"
            />
            <Typography variant="body2" color="text.secondary">
              Nota: Parâmetros devem ser configurados via API por enquanto.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTool ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ToolManagement;

