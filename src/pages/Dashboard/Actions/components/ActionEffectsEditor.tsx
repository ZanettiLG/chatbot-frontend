import React, { useState } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import DeleteIcon from '@mui/icons-material/Delete';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';

import { ActionEffect } from '../../../../types/goap.types';
import {
  WorldStateEntityType,
  WorldStateActionType,
} from '../../../../types/goap.types';

interface ActionEffectsEditorProps {
  effects: ActionEffect[];
  onChange: (effects: ActionEffect[]) => void;
}

const ACTION_OPERATORS = [
  { value: WorldStateActionType.SET, label: 'Definir (SET)' },
  { value: WorldStateActionType.CHOOSE, label: 'Escolher (CHOOSE)' },
  { value: WorldStateActionType.UPDATE, label: 'Atualizar (UPDATE)' },
  { value: WorldStateActionType.REMOVE, label: 'Remover (REMOVE)' },
  { value: WorldStateActionType.CONFIRM, label: 'Confirmar (CONFIRM)' },
  { value: WorldStateActionType.INCREMENT, label: 'Incrementar (INCREMENT)' },
  { value: WorldStateActionType.DECREMENT, label: 'Decrementar (DECREMENT)' },
  { value: WorldStateActionType.APPEND, label: 'Adicionar (APPEND)' },
  { value: WorldStateActionType.MERGE, label: 'Mesclar (MERGE)' },
];

const ENTITY_TYPES = Object.values(WorldStateEntityType);

const ActionEffectsEditor: React.FC<ActionEffectsEditorProps> = ({
  effects,
  onChange,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<ActionEffect>({
    worldStateKey: WorldStateEntityType.PRODUCT,
    operator: WorldStateActionType.SET,
    value: '',
  });

  const handleAdd = () => {
    onChange([...effects, { ...formData }]);
    setFormData({
      worldStateKey: WorldStateEntityType.PRODUCT,
      operator: WorldStateActionType.SET,
      value: '',
    });
    setEditingIndex(null);
  };

  const handleEdit = (index: number) => {
    setFormData(effects[index]);
    setEditingIndex(index);
  };

  const handleUpdate = () => {
    if (editingIndex !== null) {
      const updated = [...effects];
      updated[editingIndex] = formData;
      onChange(updated);
      setEditingIndex(null);
      setFormData({
        worldStateKey: WorldStateEntityType.PRODUCT,
        operator: WorldStateActionType.SET,
        value: '',
      });
    }
  };

  const handleDelete = (index: number) => {
    onChange(effects.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
        Efeitos
      </Typography>

      {effects.length > 0 && (
        <List sx={{ mb: 2 }}>
          {effects.map((effect, index) => (
            <Paper key={index} variant="outlined" sx={{ mb: 1 }}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" component="span">
                        <strong>{effect.worldStateKey}</strong>
                      </Typography>
                      <Typography variant="body2" component="span" color="text.secondary">
                        {ACTION_OPERATORS.find(op => op.value === effect.operator)?.label || effect.operator}
                      </Typography>
                      <Typography variant="body2" component="span" color="primary">
                        {JSON.stringify(effect.value)}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" size="small" onClick={() => handleEdit(index)}>
                    <Typography variant="caption">Editar</Typography>
                  </IconButton>
                  <IconButton edge="end" size="small" onClick={() => handleDelete(index)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </Paper>
          ))}
        </List>
      )}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Entidade do World State</InputLabel>
            <Select
              value={formData.worldStateKey}
              onChange={(e) => setFormData({ ...formData, worldStateKey: e.target.value as WorldStateEntityType })}
              label="Entidade do World State"
            >
              {ENTITY_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Operador</InputLabel>
            <Select
              value={formData.operator}
              onChange={(e) => setFormData({ ...formData, operator: e.target.value as WorldStateActionType })}
              label="Operador"
            >
              {ACTION_OPERATORS.map((op) => (
                <MenuItem key={op.value} value={op.value}>
                  {op.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Valor"
            value={typeof formData.value === 'string' ? formData.value : JSON.stringify(formData.value)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setFormData({ ...formData, value: parsed });
              } catch {
                setFormData({ ...formData, value: e.target.value });
              }
            }}
            fullWidth
            size="small"
            placeholder='Ex: "valor" ou 123 ou true ou {"key": "value"}'
            helperText="Use JSON válido (strings com aspas, números sem aspas, objetos com {})"
            required
          />

          <Button
            variant={editingIndex !== null ? 'outlined' : 'contained'}
            startIcon={<AddIcon />}
            onClick={editingIndex !== null ? handleUpdate : handleAdd}
            fullWidth
          >
            {editingIndex !== null ? 'Atualizar Efeito' : 'Adicionar Efeito'}
          </Button>
          {editingIndex !== null && (
            <Button
              variant="text"
              onClick={() => {
                setEditingIndex(null);
                setFormData({
                  worldStateKey: WorldStateEntityType.PRODUCT,
                  operator: WorldStateActionType.SET,
                  value: '',
                });
              }}
              fullWidth
            >
              Cancelar Edição
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ActionEffectsEditor;

