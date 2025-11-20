import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { GoalCondition } from '../types/goap.types';
import { WorldStateEntityType } from '../types/goap.types';

interface GoalConditionsEditorProps {
  conditions: GoalCondition[];
  onChange: (conditions: GoalCondition[]) => void;
  title?: string;
}

const OPERATORS = [
  { value: 'exists', label: 'Existe' },
  { value: 'not_exists', label: 'Não existe' },
  { value: 'equals', label: 'Igual a' },
  { value: 'not_equals', label: 'Diferente de' },
  { value: 'greater_than', label: 'Maior que' },
  { value: 'less_than', label: 'Menor que' },
  { value: 'contains', label: 'Contém' },
];

const ENTITY_TYPES = Object.values(WorldStateEntityType);

const GoalConditionsEditor: React.FC<GoalConditionsEditorProps> = ({
  conditions,
  onChange,
  title = 'Condições',
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<GoalCondition>({
    worldStateKey: WorldStateEntityType.PRODUCT,
    operator: 'exists',
    value: undefined,
  });

  const handleAdd = () => {
    onChange([...conditions, { ...formData }]);
    setFormData({
      worldStateKey: WorldStateEntityType.PRODUCT,
      operator: 'exists',
      value: undefined,
    });
    setEditingIndex(null);
  };

  const handleEdit = (index: number) => {
    setFormData(conditions[index]);
    setEditingIndex(index);
  };

  const handleUpdate = () => {
    if (editingIndex !== null) {
      const updated = [...conditions];
      updated[editingIndex] = formData;
      onChange(updated);
      setEditingIndex(null);
      setFormData({
        worldStateKey: WorldStateEntityType.PRODUCT,
        operator: 'exists',
        value: undefined,
      });
    }
  };

  const handleDelete = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const needsValue = ['equals', 'not_equals', 'greater_than', 'less_than', 'contains'].includes(formData.operator);

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
        {title}
      </Typography>

      {conditions.length > 0 && (
        <List sx={{ mb: 2 }}>
          {conditions.map((condition, index) => (
            <Paper key={index} variant="outlined" sx={{ mb: 1 }}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" component="span">
                        <strong>{condition.worldStateKey}</strong>
                      </Typography>
                      <Typography variant="body2" component="span" color="text.secondary">
                        {OPERATORS.find(op => op.value === condition.operator)?.label || condition.operator}
                      </Typography>
                      {condition.value !== undefined && (
                        <Typography variant="body2" component="span" color="primary">
                          {JSON.stringify(condition.value)}
                        </Typography>
                      )}
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
              onChange={(e) => setFormData({ ...formData, operator: e.target.value as any, value: undefined })}
              label="Operador"
            >
              {OPERATORS.map((op) => (
                <MenuItem key={op.value} value={op.value}>
                  {op.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {needsValue && (
            <TextField
              label="Valor"
              value={formData.value !== undefined ? JSON.stringify(formData.value) : ''}
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
              placeholder='Ex: "valor" ou 123 ou true'
              helperText="Use JSON válido (strings com aspas, números sem aspas)"
            />
          )}

          <Button
            variant={editingIndex !== null ? 'outlined' : 'contained'}
            startIcon={<AddIcon />}
            onClick={editingIndex !== null ? handleUpdate : handleAdd}
            fullWidth
          >
            {editingIndex !== null ? 'Atualizar Condição' : 'Adicionar Condição'}
          </Button>
          {editingIndex !== null && (
            <Button
              variant="text"
              onClick={() => {
                setEditingIndex(null);
                setFormData({
                  worldStateKey: WorldStateEntityType.PRODUCT,
                  operator: 'exists',
                  value: undefined,
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

export default GoalConditionsEditor;

