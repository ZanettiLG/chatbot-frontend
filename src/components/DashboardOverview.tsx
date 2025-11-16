import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import HistoryIcon from '@mui/icons-material/History';
import GroupIcon from '@mui/icons-material/Group';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import RuleIcon from '@mui/icons-material/Rule';
import BuildIcon from '@mui/icons-material/Build';
import SettingsIcon from '@mui/icons-material/Settings';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { RootState } from '../store';
import { fetchAgents } from '../store/agentSlice';

interface OverviewCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  metric?: string;
  size?: 'large' | 'medium' | 'small';
}

const DashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { agents } = useSelector((state: RootState) => state.agent);

  useEffect(() => {
    dispatch(fetchAgents() as any);
  }, [dispatch]);

  const activeAgentsCount = agents.filter(a => a.isActive).length;
  const totalAgentsCount = agents.length;

  const cards: OverviewCard[] = [
    {
      title: 'Conversar',
      description: 'Inicie uma nova conversa com seus agentes',
      icon: <ChatBubbleIcon />,
      path: '/chat',
      color: '#1976d2',
      size: 'large',
    },
    {
      title: 'Agentes',
      description: 'Gerencie seus agentes de IA',
      icon: <GroupIcon />,
      path: '/dashboard/agents',
      color: '#42a5f5',
      metric: `${activeAgentsCount} ativos`,
      size: 'medium',
    },
    {
      title: 'Histórico de Conversas',
      description: 'Visualize conversas anteriores',
      icon: <HistoryIcon />,
      path: '/dashboard/history',
      color: '#757575',
      size: 'small',
    },
    {
      title: 'Estados de Inferência',
      description: 'Visualize o processo de pensamento dos agentes',
      icon: <PsychologyIcon />,
      path: '/dashboard/inference',
      color: '#9c27b0',
      size: 'small',
    },
    {
      title: 'Personalidades',
      description: 'Configure personalidades dos agentes',
      icon: <SentimentSatisfiedIcon />,
      path: '/dashboard/personalities',
      color: '#ab47bc',
      size: 'small',
    },
    {
      title: 'Roles',
      description: 'Gerencie os cargos dos agentes',
      icon: <AssignmentIndIcon />,
      path: '/dashboard/roles',
      color: '#26a69a',
      size: 'small',
    },
    {
      title: 'Regras',
      description: 'Configure regras de comportamento',
      icon: <RuleIcon />,
      path: '/dashboard/rules',
      color: '#ef5350',
      size: 'small',
    },
    {
      title: 'Ferramentas',
      description: 'Gerencie ferramentas disponíveis',
      icon: <BuildIcon />,
      path: '/dashboard/tools',
      color: '#ffa726',
      size: 'small',
    },
    {
      title: 'Configurações',
      description: 'Configurações do sistema',
      icon: <SettingsIcon />,
      path: '/dashboard/settings',
      color: '#78909c',
      size: 'small',
    },
    {
      title: 'WhatsApp',
      description: 'Gerencie sessões e status do WhatsApp',
      icon: <WhatsAppIcon />,
      path: '/dashboard/whatsapp',
      color: '#25D366',
      size: 'small',
    },
  ];

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  const getGridSize = (size?: 'large' | 'medium' | 'small') => {
    switch (size) {
      case 'large':
        return { xs: 12, sm: 12, md: 8 };
      case 'medium':
        return { xs: 12, sm: 6, md: 4 };
      case 'small':
        return { xs: 12, sm: 6, md: 4 };
      default:
        return { xs: 12, sm: 6, md: 4 };
    }
  };

  return (
    <Box>
      {/* Mensagem de Boas-vindas */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Bem-vindo ao Salve.ai 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gerencie seus agentes e conversas
        </Typography>
      </Box>

      {/* Grid de Cards */}
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid key={card.path} item {...getGridSize(card.size)}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
                ...(card.size === 'large' && {
                  background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}dd 100%)`,
                  color: 'white',
                }),
              }}
              elevation={card.size === 'large' ? 3 : 2}
            >
              <CardActionArea
                onClick={() => handleCardClick(card.path)}
                sx={{
                  height: '100%',
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    width: '100%',
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: card.size === 'large' ? 'rgba(255,255,255,0.2)' : card.color,
                      color: card.size === 'large' ? 'white' : 'white',
                      width: 56,
                      height: 56,
                      mr: 2,
                    }}
                  >
                    {card.icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{
                        fontWeight: 600,
                        color: card.size === 'large' ? 'white' : 'text.primary',
                      }}
                    >
                      {card.title}
                    </Typography>
                    {card.metric && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: card.size === 'large' ? 'rgba(255,255,255,0.9)' : 'text.secondary',
                          fontWeight: 500,
                        }}
                      >
                        {card.metric}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: card.size === 'large' ? 'rgba(255,255,255,0.9)' : 'text.secondary',
                    flexGrow: 1,
                  }}
                >
                  {card.description}
                </Typography>
                {card.size === 'large' && (
                  <Button
                    variant="contained"
                    sx={{
                      mt: 2,
                      bgcolor: 'white',
                      color: card.color,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.9)',
                      },
                    }}
                  >
                    Iniciar Conversa
                  </Button>
                )}
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Card de Métricas (se necessário) */}
      {totalAgentsCount > 0 && (
        <Box sx={{ mt: 4 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resumo
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Total de Agentes
                </Typography>
                <Typography variant="h4" color="primary">
                  {totalAgentsCount}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Agentes Ativos
                </Typography>
                <Typography variant="h4" color="success.main">
                  {activeAgentsCount}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default DashboardOverview;

