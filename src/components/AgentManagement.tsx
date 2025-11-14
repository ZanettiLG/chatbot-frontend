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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormHelperText,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { RootState } from '../store';
import {
  fetchAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  clearError,
  type Agent,
} from '../store/agentSlice';
import { fetchRoles } from '../store/roleSlice';
import { fetchPersonalities } from '../store/personalitySlice';
import { fetchRules } from '../store/ruleSlice';
import { documentService, Document } from '../services/documentService';
import { agentService } from '../services/agentService';
import { useToast } from '../hooks/useToast';
import EmptyState from './EmptyState';
import ListSkeleton from './ListSkeleton';
import { Group as GroupIcon } from '@mui/icons-material';

const LANGUAGES = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español' },
];

const STYLES = [
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'técnico', label: 'Técnico' },
  { value: 'amigável', label: 'Amigável' },
];

const AgentManagement: React.FC = () => {
  const dispatch = useDispatch();
  const { agents, loading, error } = useSelector((state: RootState) => state.agent);
  const { roles } = useSelector((state: RootState) => state.role);
  const { personalities } = useSelector((state: RootState) => state.personality);
  const { rules } = useSelector((state: RootState) => state.rule);
  const { showSuccess, showError } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentOwners, setDocumentOwners] = useState<Record<string, string>>({}); // documentId -> agentId
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [documentFormData, setDocumentFormData] = useState({
    title: '',
    content: '',
  });
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    roleId: '',
    personalityId: '',
    ruleIds: [] as string[],
    language: 'pt-BR',
    style: 'formal',
    systemPrompt: '',
    knowledgeIds: [] as string[],
    isActive: true,
    enableDialecticReasoning: false,
  });

  useEffect(() => {
    dispatch(fetchAgents() as any);
    dispatch(fetchRoles({ activeOnly: true }) as any);
    dispatch(fetchPersonalities({ activeOnly: true }) as any);
    dispatch(fetchRules({ activeOnly: true }) as any);
    
    // Carregar documentos
    documentService.getAll().then(setDocuments).catch(console.error);
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Carregar donos dos documentos
  const loadDocumentOwners = async (docs: Document[] = documents) => {
    const owners: Record<string, string> = {};
    for (const doc of docs) {
      try {
        const result = await agentService.getKnowledgeOwner(doc.id);
        if (result.agentId) {
          owners[doc.id] = result.agentId;
        }
      } catch (error) {
        console.error(`Error loading owner for document ${doc.id}:`, error);
      }
    }
    setDocumentOwners(owners);
  };

  const handleOpenDialog = async (agent?: Agent) => {
    if (agent) {
      // Buscar o agente mais recente do estado Redux para garantir que temos os dados atualizados
      // Isso garante que se o agente foi atualizado recentemente, pegamos a versão mais recente
      const latestAgent = agents.find(a => a.id === agent.id) || agent;
      
      setEditingAgent(latestAgent);
      setFormData({
        name: latestAgent.name,
        description: latestAgent.description,
        roleId: latestAgent.roleId,
        personalityId: latestAgent.personalityId,
        ruleIds: latestAgent.ruleIds || [],
        language: latestAgent.language || 'pt-BR',
        style: latestAgent.style || 'formal',
        systemPrompt: latestAgent.systemPrompt || '',
        knowledgeIds: latestAgent.knowledgeIds || [],
        isActive: latestAgent.isActive,
        enableDialecticReasoning: latestAgent.enableDialecticReasoning ?? false,
      });
    } else {
      setEditingAgent(null);
      setFormData({
        name: '',
        description: '',
        roleId: '',
        personalityId: '',
        ruleIds: [],
        language: 'pt-BR',
        style: 'formal',
        systemPrompt: '',
        knowledgeIds: [],
        isActive: true,
        enableDialecticReasoning: false,
      });
    }
    // Carregar donos dos documentos quando abrir o diálogo
    await loadDocumentOwners();
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAgent(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.roleId || !formData.personalityId) {
      showError('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingAgent) {
        const result = await dispatch(updateAgent({ id: editingAgent.id, data: formData }) as any);
        
        // Verificar se a atualização foi bem-sucedida
        if (updateAgent.fulfilled.match(result)) {
          console.log('✅ Agente atualizado:', result.payload);
          console.log('✅ enableDialecticReasoning:', result.payload.enableDialecticReasoning);
          showSuccess('Agente atualizado com sucesso!');
          handleCloseDialog();
          // Recarregar a lista após um pequeno delay para garantir que o backend processou
          setTimeout(() => {
            dispatch(fetchAgents() as any);
          }, 100);
        } else {
          console.error('❌ Falha ao atualizar agente:', result);
          throw new Error('Falha ao atualizar agente');
        }
      } else {
        const result = await dispatch(createAgent(formData as any) as any);
        
        if (createAgent.fulfilled.match(result)) {
          showSuccess('Agente criado com sucesso!');
          handleCloseDialog();
        } else {
          throw new Error('Falha ao criar agente');
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Erro ao salvar agente';
      showError(`Erro ao salvar agente: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este agente?')) {
      try {
        await dispatch(deleteAgent(id) as any);
        showSuccess('Agente excluído com sucesso!');
        dispatch(fetchAgents() as any);
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || 'Erro ao excluir agente';
        showError(`Erro ao excluir agente: ${errorMessage}`);
      }
    }
  };

  const handleOpenDocumentDialog = (document?: Document) => {
    if (document) {
      setEditingDocument(document);
      setDocumentFormData({
        title: document.title,
        content: document.content,
      });
    } else {
      setEditingDocument(null);
      setDocumentFormData({
        title: '',
        content: '',
      });
    }
    setOpenDocumentDialog(true);
  };

  const handleCloseDocumentDialog = () => {
    setOpenDocumentDialog(false);
    setEditingDocument(null);
    setDocumentFormData({
      title: '',
      content: '',
    });
  };

  const handleSaveDocument = async () => {
    if (!documentFormData.title || !documentFormData.content) {
      return;
    }

    try {
      if (editingDocument) {
        await documentService.update(editingDocument.id, documentFormData);
      } else {
        await documentService.create(documentFormData);
      }
      // Recarregar documentos
      const updatedDocuments = await documentService.getAll();
      setDocuments(updatedDocuments);
      // Recarregar donos se o diálogo de agente estiver aberto
      if (openDialog) {
        await loadDocumentOwners(updatedDocuments);
      }
      handleCloseDocumentDialog();
      } catch (error) {
        console.error('Error saving document:', error);
        showError('Erro ao salvar documento');
      }
  };

  const handleDeleteDocument = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este documento?')) {
      try {
        await documentService.delete(id);
        // Remover da lista local
        setDocuments(documents.filter((d) => d.id !== id));
        // Remover dos knowledgeIds se estiver selecionado
        setFormData({
          ...formData,
          knowledgeIds: formData.knowledgeIds.filter((docId) => docId !== id),
        });
        // Remover dos donos
        const newOwners = { ...documentOwners };
        delete newOwners[id];
        setDocumentOwners(newOwners);
      } catch (error) {
        console.error('Error deleting document:', error);
        showError('Erro ao excluir documento');
      }
    }
  };

  const selectedRole = roles.find((r) => r.id === formData.roleId);
  const selectedPersonality = personalities.find((p) => p.id === formData.personalityId);


  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1">
            Gerenciamento de Agentes
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Novo Agente
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        {loading && agents.length === 0 ? (
          <ListSkeleton count={5} hasSecondary={true} hasAction={true} />
        ) : !loading && agents.length === 0 ? (
          <EmptyState
            icon={<GroupIcon />}
            title="Nenhum agente cadastrado"
            description="Crie seu primeiro agente para começar a usar o sistema. Agentes são assistentes de IA configuráveis que podem interagir com usuários."
            actionLabel="Criar Primeiro Agente"
            onAction={() => handleOpenDialog()}
            size="medium"
          />
        ) : (
          <List>
            {agents.map((agent) => {
            const agentRole = roles.find((r) => r.id === agent.roleId);
            const agentPersonality = personalities.find((p) => p.id === agent.personalityId);
            
            return (
              <ListItem
                key={agent.id}
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
                    <Typography variant="h6">{agent.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {agent.description}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {agentRole && (
                        <Chip label={agentRole.name} size="small" color="primary" variant="outlined" />
                      )}
                      {agentPersonality && (
                        <Chip label={agentPersonality.name} size="small" color="secondary" variant="outlined" />
                      )}
                      <Chip label={agent.language} size="small" />
                      <Chip label={agent.style} size="small" />
                      <Chip
                        label={agent.isActive ? 'Ativo' : 'Inativo'}
                        size="small"
                        color={agent.isActive ? 'success' : 'default'}
                      />
                      {agent.enableDialecticReasoning && (
                        <Chip
                          label="Raciocínio Dialético"
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleOpenDialog(agent)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(agent.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </Box>
              </ListItem>
            );
          })}
        </List>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingAgent ? 'Editar Agente' : 'Novo Agente'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nome"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

            <Divider sx={{ my: 1 }} />

            <FormControl fullWidth required>
              <InputLabel>Role (Cargo)</InputLabel>
              <Select
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                label="Role (Cargo)"
              >
                {roles.filter((r) => r.isActive).map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name} {role.isDefault && '(Padrão)'}
                  </MenuItem>
                ))}
              </Select>
              {selectedRole && (
                <FormHelperText>{selectedRole.description}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Personalidade</InputLabel>
              <Select
                value={formData.personalityId}
                onChange={(e) => setFormData({ ...formData, personalityId: e.target.value })}
                label="Personalidade"
              >
                {personalities.filter((p) => p.isActive).map((personality) => (
                  <MenuItem key={personality.id} value={personality.id}>
                    {personality.name} {personality.isDefault && '(Padrão)'}
                  </MenuItem>
                ))}
              </Select>
              {selectedPersonality && (
                <FormHelperText>{selectedPersonality.description}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Regras de Comportamento</InputLabel>
              <Select
                multiple
                value={formData.ruleIds}
                onChange={(e) => setFormData({ ...formData, ruleIds: e.target.value as string[] })}
                label="Regras de Comportamento"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((ruleId) => {
                      const rule = rules.find((r) => r.id === ruleId);
                      return rule ? <Chip key={ruleId} label={rule.name} size="small" /> : null;
                    })}
                  </Box>
                )}
              >
                {rules.filter((r) => r.isActive).map((rule) => (
                  <MenuItem key={rule.id} value={rule.id}>
                    <Checkbox checked={formData.ruleIds.includes(rule.id)} />
                    {rule.name} {rule.isDefault && '(Padrão)'}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Selecione as regras que este agente deve seguir
              </FormHelperText>
            </FormControl>

            <Divider sx={{ my: 1 }} />

            <FormControl fullWidth required>
              <InputLabel>Linguagem</InputLabel>
              <Select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                label="Linguagem"
              >
                {LANGUAGES.map((lang) => (
                  <MenuItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Estilo de Comunicação</InputLabel>
              <Select
                value={formData.style}
                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                label="Estilo de Comunicação"
              >
                {STYLES.map((style) => (
                  <MenuItem key={style.value} value={style.value}>
                    {style.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 1 }} />

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Documentos de Conhecimento
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDocumentDialog()}
                >
                  Adicionar Documento
                </Button>
              </Box>
              <FormHelperText sx={{ mb: 2 }}>
                Selecione os documentos de conhecimento que este agente deve usar para responder perguntas.
                <br />
                <strong>Importante:</strong> Cada conhecimento é exclusivo de um agente e não pode ser compartilhado entre agentes.
              </FormHelperText>
              
              {documents.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  Nenhum documento cadastrado. Clique em "Adicionar Documento" para criar um.
                </Typography>
              ) : (() => {
                // Filtrar documentos: mostrar apenas os disponíveis (não associados) ou já associados ao agente atual
                const availableDocuments = documents.filter((doc) => {
                  const ownerAgentId = documentOwners[doc.id];
                  // Se não tem dono, está disponível
                  if (!ownerAgentId) return true;
                  // Se tem dono e é o agente atual, mostrar (para poder remover se necessário)
                  if (ownerAgentId === editingAgent?.id) return true;
                  // Se tem dono e é outro agente, não mostrar
                  return false;
                });

                if (availableDocuments.length === 0) {
                  return (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      Todos os documentos disponíveis já estão associados a outros agentes.
                      <br />
                      Crie um novo documento ou remova a associação de outro agente primeiro.
                    </Typography>
                  );
                }

                return (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 300, overflowY: 'auto' }}>
                    {availableDocuments.map((doc) => {
                      const ownerAgentId = documentOwners[doc.id];
                      const isOwnedByCurrentAgent = ownerAgentId === editingAgent?.id;
                      const isChecked = formData.knowledgeIds.includes(doc.id);

                      return (
                        <Box
                          key={doc.id}
                          sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 1,
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            '&:hover': {
                              backgroundColor: '#f5f5f5',
                            },
                          }}
                        >
                          <Checkbox
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  knowledgeIds: [...formData.knowledgeIds, doc.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  knowledgeIds: formData.knowledgeIds.filter((id) => id !== doc.id),
                                });
                              }
                            }}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight="medium" noWrap>
                              {doc.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {doc.content.substring(0, 80)}
                              {doc.content.length > 80 ? '...' : ''}
                            </Typography>
                            {isOwnedByCurrentAgent && (
                              <Typography variant="caption" color="info.main" sx={{ mt: 0.5, display: 'block' }}>
                                ✓ Já associado a este agente
                              </Typography>
                            )}
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDocumentDialog(doc)}
                            sx={{ ml: 'auto' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteDocument(doc.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      );
                    })}
                  </Box>
                );
              })()}
            </Box>

            <Divider sx={{ my: 1 }} />

            <TextField
              label="System Prompt (Opcional)"
              fullWidth
              multiline
              rows={4}
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              placeholder="Prompt customizado adicional para personalizar ainda mais o comportamento do agente"
              helperText="Este prompt será adicionado ao final do prompt combinado (role + personalidade + regras)"
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

            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableDialecticReasoning}
                  onChange={(e) => setFormData({ ...formData, enableDialecticReasoning: e.target.checked })}
                />
              }
              label="Raciocínio Dialético"
            />
            <FormHelperText>
              Quando habilitado, o agente usa raciocínio dialético (tese → antítese → síntese) para processar mensagens
            </FormHelperText>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.roleId || !formData.personalityId}
          >
            {editingAgent ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para criar/editar documento */}
      <Dialog open={openDocumentDialog} onClose={handleCloseDocumentDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDocument ? 'Editar Documento' : 'Novo Documento'}
          <IconButton
            aria-label="close"
            onClick={handleCloseDocumentDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Título"
              fullWidth
              required
              value={documentFormData.title}
              onChange={(e) => setDocumentFormData({ ...documentFormData, title: e.target.value })}
              placeholder="Ex: Cardápio de Sushi"
            />
            <TextField
              label="Conteúdo"
              fullWidth
              required
              multiline
              rows={10}
              value={documentFormData.content}
              onChange={(e) => setDocumentFormData({ ...documentFormData, content: e.target.value })}
              placeholder="Digite o conteúdo do documento de conhecimento aqui..."
              helperText="Este conteúdo será usado pelo agente para responder perguntas relacionadas"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDocumentDialog}>Cancelar</Button>
          <Button
            onClick={handleSaveDocument}
            variant="contained"
            disabled={!documentFormData.title || !documentFormData.content}
          >
            {editingDocument ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgentManagement;
