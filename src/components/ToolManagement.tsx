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
import { RootState } from '../store';
import {
  fetchTools,
  createTool,
  updateTool,
  deleteTool,
  clearError,
} from '../store/toolSlice';
import { Tool, ToolParameter } from '../services/toolService';

const TOOL_TYPES = ['function', 'database_action', 'api_call'];
const CATEGORIES = ['pedidos', 'cálculos', 'consultas', 'processamento', 'outros'];

const ToolManagement: React.FC = () => {
  const dispatch = useDispatch();
  const { tools, loading, error } = useSelector((state: RootState) => state.tool);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
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

  const handleSubmit = () => {
    if (editingTool) {
      dispatch(updateTool({ id: editingTool.id, data: formData }) as any);
    } else {
      dispatch(createTool(formData) as any);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta ferramenta?')) {
      dispatch(deleteTool(id) as any);
    }
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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {tools.map((tool) => (
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

