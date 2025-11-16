import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import { RootState } from '../store';
import {
  fetchPersonalities,
  createPersonality,
  updatePersonality,
  deletePersonality,
  clearError,
} from '../store/personalitySlice';
import { Personality } from '../services/personalityService';
import { useToast } from '../hooks/useToast';
import EmptyState from './EmptyState';
import ListSkeleton from './ListSkeleton';

const PersonalityManagement: React.FC = () => {
  const dispatch = useDispatch();
  const { personalities, loading, error } = useSelector((state: RootState) => state.personality);
  const { showSuccess, showError } = useToast();
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
    try {
      if (editingPersonality) {
        await dispatch(updatePersonality({ id: editingPersonality.id, data: formData }) as any);
        showSuccess('Personalidade atualizada com sucesso!');
      } else {
        await dispatch(createPersonality(formData as any) as any);
        showSuccess('Personalidade criada com sucesso!');
      }
      handleCloseDialog();
      dispatch(fetchPersonalities() as any);
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Erro ao salvar personalidade';
      showError(`Erro ao salvar personalidade: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta personalidade?')) {
      try {
        await dispatch(deletePersonality(id) as any);
        showSuccess('Personalidade excluída com sucesso!');
        dispatch(fetchPersonalities() as any);
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || 'Erro ao excluir personalidade';
        showError(`Erro ao excluir personalidade: ${errorMessage}`);
      }
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


  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1">
            Gerenciamento de Personalidades
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nova Personalidade
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        {loading && personalities.length === 0 ? (
          <ListSkeleton count={5} hasSecondary={true} hasAction={true} />
        ) : !loading && personalities.length === 0 ? (
          <EmptyState
            icon={<SentimentSatisfiedIcon />}
            title="Nenhuma personalidade cadastrada"
            description="Crie personalidades para definir o tom e estilo de comunicação dos seus agentes. Personalidades ajudam a criar experiências mais naturais e consistentes."
            actionLabel="Criar Primeira Personalidade"
            onAction={() => handleOpenDialog()}
            size="medium"
          />
        ) : (
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

