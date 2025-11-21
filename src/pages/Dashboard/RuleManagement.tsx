import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import ListItem from '@mui/material/ListItem';
import RuleIcon from '@mui/icons-material/Rule';
import EditIcon from '@mui/icons-material/Edit';
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import FormControl from '@mui/material/FormControl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormHelperText from '@mui/material/FormHelperText';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PsychologyIcon from '@mui/icons-material/Psychology';
import FormControlLabel from '@mui/material/FormControlLabel';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';

import { RootState } from '../../store';
import { useToast } from '../../hooks/useToast';
import { Rule } from '../../services/ruleService';
import EmptyState from '../../components/EmptyState';
import ListSkeleton from '../../components/ListSkeleton';
import {
  fetchRules,
  createRule,
  updateRule,
  deleteRule,
  clearError,
} from '../../store/ruleSlice';

const CATEGORIES = [
  'comunicação',
  'comportamento',
  'técnica',
  'qualidade',
  'segurança',
];

const RuleManagement: React.FC = () => {
  const dispatch = useDispatch();
  const { rules, loading, error } = useSelector((state: RootState) => state.rule);
  const { showSuccess, showError } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    category: 'comunicação',
    isActive: true,
    dialecticRules: {
      general: [] as string[],
      intentions: [] as string[],
      actions: [] as string[],
    },
  });
  const [dialecticRuleInput, setDialecticRuleInput] = useState({
    general: '',
    intentions: '',
    actions: '',
  });

  useEffect(() => {
    dispatch(fetchRules());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleOpenDialog = (rule?: Rule) => {
    if (rule) {
      setEditingRule(rule);
      const dialecticRules = rule.metadata?.dialecticRules || {
        general: [],
        intentions: [],
        actions: [],
      };
      setFormData({
        name: rule.name,
        description: rule.description,
        prompt: rule.prompt,
        category: rule.category,
        isActive: rule.isActive,
        dialecticRules,
      });
      setDialecticRuleInput({
        general: Array.isArray(dialecticRules.general) ? dialecticRules.general.join('\n') : '',
        intentions: Array.isArray(dialecticRules.intentions) ? dialecticRules.intentions.join(', ') : '',
        actions: Array.isArray(dialecticRules.actions) ? dialecticRules.actions.join(', ') : '',
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        description: '',
        prompt: '',
        category: 'comunicação',
        isActive: true,
        dialecticRules: {
          general: [],
          intentions: [],
          actions: [],
        },
      });
      setDialecticRuleInput({
        general: '',
        intentions: '',
        actions: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRule(null);
  };

  const handleSubmit = async () => {
    try {
      // Processar regras dialéticas
      const dialecticRules = {
        general: dialecticRuleInput.general
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0),
        intentions: dialecticRuleInput.intentions
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
        actions: dialecticRuleInput.actions
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
      };

      const submitData = {
        ...formData,
        metadata: {
          dialecticRules: Object.keys(dialecticRules).some(
            (key) => dialecticRules[key as keyof typeof dialecticRules].length > 0
          )
            ? dialecticRules
            : undefined,
        },
      };

      if (editingRule) {
        await dispatch(updateRule({ id: editingRule.id, data: submitData }));
        showSuccess('Regra atualizada com sucesso!');
      } else {
        await dispatch(createRule(submitData));
        showSuccess('Regra criada com sucesso!');
      }
      handleCloseDialog();
      dispatch(fetchRules());
    } catch (error) {
      const errorMessage = error?.message || error?.toString() || 'Erro ao salvar regra';
      showError(`Erro ao salvar regra: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta regra?')) {
      try {
        await dispatch(deleteRule(id));
        showSuccess('Regra excluída com sucesso!');
        dispatch(fetchRules());
      } catch (error) {
        const errorMessage = error?.message || error?.toString() || 'Erro ao excluir regra';
        showError(`Erro ao excluir regra: ${errorMessage}`);
      }
    }
  };


  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1">
            Gerenciamento de Regras
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nova Regra
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        {loading && rules.length === 0 ? (
          <ListSkeleton count={5} hasSecondary={true} hasAction={true} />
        ) : !loading && rules.length === 0 ? (
          <EmptyState
            icon={<RuleIcon />}
            title="Nenhuma regra cadastrada"
            description="Crie regras para definir o comportamento dos seus agentes. Regras podem ser de comunicação, qualidade, segurança e mais."
            actionLabel="Criar Primeira Regra"
            onAction={() => handleOpenDialog()}
            size="medium"
          />
        ) : (
          <List>
            {rules.map((rule) => (
            <ListItem
              key={rule.id}
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
                    {rule.name} {rule.isDefault && <Chip label="Padrão" size="small" color="primary" />}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {rule.description}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Chip label={rule.category} size="small" color="secondary" variant="outlined" />
                    <Chip
                      label={rule.isActive ? 'Ativo' : 'Inativo'}
                      size="small"
                      color={rule.isActive ? 'success' : 'default'}
                    />
                  </Box>
                </Box>
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleOpenDialog(rule)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDelete(rule.id)} disabled={rule.isDefault}>
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
        <DialogTitle>{editingRule ? 'Editar Regra' : 'Nova Regra'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nome"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Sempre cumprimentar, Confirmar entendimento"
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
              rows={4}
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              placeholder="Descreva como esta regra deve ser aplicada no comportamento do agente"
              required
              helperText="Este prompt será usado para definir como a regra é aplicada"
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

            <Divider sx={{ my: 2 }} />

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PsychologyIcon />
                  <Typography variant="subtitle1">Regras Dialéticas (Opcional)</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Configure regras específicas para o raciocínio dialético. Essas regras serão usadas quando o agente tiver raciocínio dialético habilitado.
                  </Typography>

                  <TextField
                    label="Regras Gerais"
                    fullWidth
                    multiline
                    rows={3}
                    value={dialecticRuleInput.general}
                    onChange={(e) => setDialecticRuleInput({ ...dialecticRuleInput, general: e.target.value })}
                    placeholder="Uma regra por linha. Ex:&#10;Toda intenção deve ser testada antes de agir.&#10;Se houver dúvida, formule uma antítese antes da resposta final."
                    helperText="Regras gerais de raciocínio dialético (uma por linha)"
                  />

                  <TextField
                    label="Intenções Possíveis"
                    fullWidth
                    value={dialecticRuleInput.intentions}
                    onChange={(e) => setDialecticRuleInput({ ...dialecticRuleInput, intentions: e.target.value })}
                    placeholder="pedido_de_produto, pedido_de_foto, pedido_de_preço, confirmação_de_compra, reclamação"
                    helperText="Lista de intenções possíveis separadas por vírgula"
                  />

                  <TextField
                    label="Ações Disponíveis"
                    fullWidth
                    value={dialecticRuleInput.actions}
                    onChange={(e) => setDialecticRuleInput({ ...dialecticRuleInput, actions: e.target.value })}
                    placeholder="consultar_estoque, buscar_foto, pedir_confirmação, oferecer_alternativas, acionar_vendedor"
                    helperText="Lista de ações disponíveis separadas por vírgula"
                  />

                  <FormHelperText>
                    Essas regras serão combinadas com outras regras dialéticas de outras Rules ativas do agente.
                  </FormHelperText>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.prompt}
          >
            {editingRule ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RuleManagement;

