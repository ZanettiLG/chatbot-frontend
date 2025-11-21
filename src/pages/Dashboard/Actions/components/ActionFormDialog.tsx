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
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { Action, ActionPrerequisite, ActionEffect } from '../types/goap.types';
import { CreateActionData, UpdateActionData } from '../services/actionService';
import ActionPrerequisitesEditor from './ActionPrerequisitesEditor';
import ActionEffectsEditor from './ActionEffectsEditor';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import { Tool } from '../services/toolService';

interface ActionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateActionData | UpdateActionData) => void;
  editingAction?: Action | null;
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

const ActionFormDialog: React.FC<ActionFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  editingAction,
}) => {
  const { roles } = useSelector((state: RootState) => state.role);
  const { tools } = useSelector((state: RootState) => state.tool);
  const [formData, setFormData] = useState<CreateActionData>({
    name: '',
    description: '',
    category: 'vendas',
    prerequisites: [],
    effects: [],
    cost: 10,
    roleIds: [],
    isStateOnly: false,
    toolId: undefined,
  });

  useEffect(() => {
    if (editingAction) {
      setFormData({
        name: editingAction.name,
        description: editingAction.description,
        category: editingAction.category,
        prerequisites: editingAction.prerequisites,
        effects: editingAction.effects,
        cost: editingAction.cost,
        roleIds: editingAction.roleIds,
        isStateOnly: editingAction.isStateOnly,
        toolId: editingAction.toolId,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'vendas',
        prerequisites: [],
        effects: [],
        cost: 10,
        roleIds: [],
        isStateOnly: false,
        toolId: undefined,
      });
    }
  }, [editingAction, open]);

  const handleSubmit = () => {
    if (!formData.name || !formData.description) {
      return;
    }
    onSubmit(formData);
  };

  const handleRoleChange = (roleId: string) => {
    const currentRoleIds = formData.roleIds || [];
    const newRoleIds = currentRoleIds.includes(roleId)
      ? currentRoleIds.filter(id => id !== roleId)
      : [...currentRoleIds, roleId];
    setFormData({ ...formData, roleIds: newRoleIds });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingAction ? 'Editar Ação' : 'Nova Ação'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
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
            <TextField
              label="Custo"
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 10 })}
              fullWidth
              inputProps={{ min: 1, max: 100 }}
              helperText="Menor custo = maior prioridade"
            />
          </Box>

          <Divider />

          <Typography variant="h6">Roles Associados</Typography>
          <FormControl fullWidth>
            <InputLabel>Selecione os Roles</InputLabel>
            <Select
              multiple
              value={formData.roleIds || []}
              onChange={(e) => setFormData({ ...formData, roleIds: e.target.value as string[] })}
              renderValue={(selected) => {
                const selectedRoles = (selected as string[])
                  .map(id => roles.find(r => r.id === id)?.name || id)
                  .join(', ');
                return selectedRoles || 'Nenhum role selecionado';
              }}
              label="Selecione os Roles"
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  <Checkbox checked={(formData.roleIds || []).includes(role.id)} />
                  <ListItemText primary={role.name} secondary={role.category} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Tool Associada (Opcional)</InputLabel>
            <Select
              value={formData.toolId || ''}
              onChange={(e) => setFormData({ ...formData, toolId: e.target.value || undefined })}
              label="Tool Associada (Opcional)"
            >
              <MenuItem value="">
                <em>Nenhuma</em>
              </MenuItem>
              {tools.filter(t => t.isActive).map((tool) => (
                <MenuItem key={tool.id} value={tool.id}>
                  {tool.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={formData.isStateOnly || false}
                onChange={(e) => setFormData({ ...formData, isStateOnly: e.target.checked })}
              />
            }
            label="Apenas Estado (não executa tool, apenas atualiza World State)"
          />

          <Divider />

          <ActionPrerequisitesEditor
            prerequisites={formData.prerequisites}
            onChange={(prerequisites) => setFormData({ ...formData, prerequisites })}
          />

          <Divider />

          <ActionEffectsEditor
            effects={formData.effects}
            onChange={(effects) => setFormData({ ...formData, effects })}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!formData.name || !formData.description}>
          {editingAction ? 'Salvar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActionFormDialog;

