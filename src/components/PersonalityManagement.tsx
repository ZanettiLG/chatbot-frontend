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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import {
  fetchPersonalities,
  createPersonality,
  updatePersonality,
  deletePersonality,
  clearError,
} from '../store/personalitySlice';
import { Personality } from '../services/personalityService';

const PersonalityManagement: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { personalities, loading, error } = useSelector((state: RootState) => state.personality);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPersonality, setEditingPersonality] = useState<Personality | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    traits: [] as string[],
    examples: [] as string[],
    isActive: true,
  });
  const [traitInput, setTraitInput] = useState('');
  const [exampleInput, setExampleInput] = useState('');

  useEffect(() => {
    dispatch(fetchPersonalities() as any);
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleOpenDialog = (personality?: Personality) => {
    if (personality) {
      setEditingPersonality(personality);
      setFormData({
        name: personality.name,
        description: personality.description,
        prompt: personality.prompt,
        traits: personality.traits || [],
        examples: personality.examples || [],
        isActive: personality.isActive,
      });
    } else {
      setEditingPersonality(null);
      setFormData({
        name: '',
        description: '',
        prompt: '',
        traits: [],
        examples: [],
        isActive: true,
      });
    }
    setTraitInput('');
    setExampleInput('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPersonality(null);
  };

  const handleSubmit = async () => {
    if (editingPersonality) {
      await dispatch(updatePersonality({ id: editingPersonality.id, data: formData }) as any);
    } else {
      await dispatch(createPersonality(formData as any) as any);
    }
    handleCloseDialog();
    dispatch(fetchPersonalities() as any);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta personalidade?')) {
      await dispatch(deletePersonality(id) as any);
      dispatch(fetchPersonalities() as any);
    }
  };

  const addTrait = () => {
    if (traitInput.trim()) {
      setFormData({ ...formData, traits: [...formData.traits, traitInput.trim()] });
      setTraitInput('');
    }
  };

  const removeTrait = (index: number) => {
    setFormData({ ...formData, traits: formData.traits.filter((_, i) => i !== index) });
  };

  const addExample = () => {
    if (exampleInput.trim()) {
      setFormData({ ...formData, examples: [...formData.examples, exampleInput.trim()] });
      setExampleInput('');
    }
  };

  const removeExample = (index: number) => {
    setFormData({ ...formData, examples: formData.examples.filter((_, i) => i !== index) });
  };

  if (loading && personalities.length === 0) {
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
            Gerenciamento de Personalidades
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
              onClick={() => navigate('/rules')}
            >
              Regras
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Nova Personalidade
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        <List>
          {personalities.map((personality) => (
            <ListItem
              key={personality.id}
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
                    {personality.name} {personality.isDefault && <Chip label="Padrão" size="small" color="primary" />}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {personality.description}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {personality.traits?.map((trait, idx) => (
                      <Chip key={idx} label={trait} size="small" variant="outlined" />
                    ))}
                    <Chip
                      label={personality.isActive ? 'Ativo' : 'Inativo'}
                      size="small"
                      color={personality.isActive ? 'success' : 'default'}
                    />
                  </Box>
                </Box>
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleOpenDialog(personality)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDelete(personality.id)} disabled={personality.isDefault}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </Box>
            </ListItem>
          ))}
        </List>

        {personalities.length === 0 && !loading && (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
            Nenhuma personalidade cadastrada. Clique em "Nova Personalidade" para criar uma.
          </Typography>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingPersonality ? 'Editar Personalidade' : 'Nova Personalidade'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nome"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Amigável, Profissional, Didático"
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
            <TextField
              label="Prompt"
              fullWidth
              multiline
              rows={6}
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              placeholder="Descreva detalhadamente como esta personalidade se comporta, como fala, como reage, etc."
              required
              helperText="Este prompt será usado para definir como o agente se comporta"
            />
            
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Traits (Características)</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  placeholder="Ex: amigável, profissional"
                  value={traitInput}
                  onChange={(e) => setTraitInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTrait();
                    }
                  }}
                  sx={{ flex: 1 }}
                />
                <Button onClick={addTrait} variant="outlined">Adicionar</Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {formData.traits.map((trait, idx) => (
                  <Chip
                    key={idx}
                    label={trait}
                    onDelete={() => removeTrait(idx)}
                    size="small"
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Exemplos de Interações</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  placeholder="Ex: Olá! Como posso ajudá-lo hoje? 😊"
                  value={exampleInput}
                  onChange={(e) => setExampleInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addExample();
                    }
                  }}
                  sx={{ flex: 1 }}
                />
                <Button onClick={addExample} variant="outlined">Adicionar</Button>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {formData.examples.map((example, idx) => (
                  <Chip
                    key={idx}
                    label={example}
                    onDelete={() => removeExample(idx)}
                    size="small"
                    sx={{ alignSelf: 'flex-start' }}
                  />
                ))}
              </Box>
            </Box>

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
            {editingPersonality ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PersonalityManagement;

