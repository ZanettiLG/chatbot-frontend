import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Slider from '@mui/material/Slider';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import { RoleGoal, GoalCondition } from '../types/goap.types';
import GoalConditionsEditor from './GoalConditionsEditor';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface RoleGoalFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (goal: RoleGoal) => void;
  editingGoal?: RoleGoal | null;
}

const CATEGORIES = [
  'vendas',
  'atendimento',
  'educação',
  'financeiro',
  'técnico',
  'suporte',
  'outros',
];

const COMPLETION_STRATEGIES = [
  { value: 'all_actions', label: 'Todas as ações completadas' },
  { value: 'success_criteria', label: 'Critérios de sucesso atendidos' },
  { value: 'manual', label: 'Manual' },
];

const RoleGoalFormDialog: React.FC<RoleGoalFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  editingGoal,
}) => {
  const { actions } = useSelector((state: RootState) => state.action);
  const [formData, setFormData] = useState<RoleGoal>({
    id: '',
    name: '',
    description: '',
    priority: 5,
    category: 'vendas',
    activationConditions: [],
    successCriteria: [],
    suggestedActions: [],
  });

  useEffect(() => {
    if (editingGoal) {
      setFormData(editingGoal);
    } else {
      setFormData({
        id: '',
        name: '',
        description: '',
        priority: 5,
        category: 'vendas',
        activationConditions: [],
        successCriteria: [],
        suggestedActions: [],
      });
    }
  }, [editingGoal, open]);

  const handleSubmit = () => {
    if (!formData.name || !formData.description) {
      return;
    }
    // Gerar ID se não existir
    if (!formData.id) {
      formData.id = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    onSubmit(formData);
  };

  const handleSuggestedActionsChange = (actionIds: string[]) => {
    setFormData({ ...formData, suggestedActions: actionIds });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingGoal ? 'Editar Goal' : 'Novo Goal'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          <TextField
            label="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
            placeholder="Ex: Fechar Pedido"
          />
          <TextField
            label="Descrição"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            multiline
            rows={3}
            required
            placeholder="Descreva o objetivo deste goal"
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
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
            <Box sx={{ flex: 1 }}>
              <Typography gutterBottom>
                Prioridade: {formData.priority} (1-10)
              </Typography>
              <Slider
                value={formData.priority}
                onChange={(_, value) => setFormData({ ...formData, priority: value as number })}
                min={1}
                max={10}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
          </Box>

          <Divider />

          <GoalConditionsEditor
            conditions={formData.activationConditions}
            onChange={(conditions) => setFormData({ ...formData, activationConditions: conditions })}
            title="Condições de Ativação"
          />

          <Divider />

          <GoalConditionsEditor
            conditions={formData.successCriteria}
            onChange={(conditions) => setFormData({ ...formData, successCriteria: conditions })}
            title="Critérios de Sucesso"
          />

          <Divider />

          <Typography variant="h6">Ações Sugeridas</Typography>
          <FormControl fullWidth>
            <InputLabel>Selecione as Ações</InputLabel>
            <Select
              multiple
              value={formData.suggestedActions || []}
              onChange={(e) => handleSuggestedActionsChange(e.target.value as string[])}
              renderValue={(selected) => {
                const selectedActions = (selected as string[])
                  .map(id => actions.find(a => a.id === id)?.name || id)
                  .join(', ');
                return selectedActions || 'Nenhuma ação selecionada';
              }}
              label="Selecione as Ações"
            >
              {actions.filter(a => a.isActive).map((action) => (
                <MenuItem key={action.id} value={action.id}>
                  <Checkbox checked={(formData.suggestedActions || []).includes(action.id)} />
                  <ListItemText primary={action.name} secondary={action.description} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!formData.name || !formData.description}>
          {editingGoal ? 'Salvar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoleGoalFormDialog;

