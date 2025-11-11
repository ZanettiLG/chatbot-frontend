import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Box,
  Typography,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ChatBubble as ChatBubbleIcon,
  History as HistoryIcon,
  Group as GroupIcon,
  SentimentSatisfied as SentimentSatisfiedIcon,
  AssignmentInd as AssignmentIndIcon,
  Rule as RuleIcon,
  Build as BuildIcon,
  Settings as SettingsIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 64;

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  section?: string;
}

const menuItems: MenuItem[] = [
  // CORE
  { label: 'Conversar', icon: <ChatBubbleIcon />, path: '/chat', section: 'CORE' },
  { label: 'Histórico de Conversas', icon: <HistoryIcon />, path: '/dashboard/history', section: 'CORE' },
  // AGENTES
  { label: 'Agentes', icon: <GroupIcon />, path: '/dashboard/agents', section: 'AGENTES' },
  { label: 'Personalidades', icon: <SentimentSatisfiedIcon />, path: '/dashboard/personalities', section: 'AGENTES' },
  { label: 'Roles', icon: <AssignmentIndIcon />, path: '/dashboard/roles', section: 'AGENTES' },
  { label: 'Regras', icon: <RuleIcon />, path: '/dashboard/rules', section: 'AGENTES' },
  // CONFIGURAÇÕES
  { label: 'Ferramentas', icon: <BuildIcon />, path: '/dashboard/tools', section: 'CONFIGURAÇÕES' },
  { label: 'Configurações', icon: <SettingsIcon />, path: '/dashboard/settings', section: 'CONFIGURAÇÕES' },
  { label: 'WhatsApp', icon: <WhatsAppIcon />, path: '/dashboard/whatsapp', section: 'CONFIGURAÇÕES' },
];

const DashboardSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [collapsed, setCollapsed] = React.useState(false);

  const drawerVariant = isMobile ? 'temporary' : 'permanent';

  const handleItemClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setCollapsed(true);
    }
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    if (path === '/chat') {
      return location.pathname === '/' || location.pathname === '/chat';
    }
    return location.pathname.startsWith(path);
  };

  const renderMenuItems = () => {
    let currentSection = '';
    const items: React.ReactNode[] = [];

    menuItems.forEach((item, index) => {
      // Adicionar Divider antes de cada nova seção
      if (item.section && item.section !== currentSection) {
        if (currentSection !== '') {
          items.push(<Divider key={`divider-${currentSection}`} sx={{ my: 1 }} />);
        }
        currentSection = item.section;
        
        // Adicionar título da seção (apenas quando não colapsado)
        if (!collapsed && !isMobile) {
          items.push(
            <Box key={`section-${item.section}`} sx={{ px: 2, py: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                {item.section}
              </Typography>
            </Box>
          );
        }
      }

      const active = isActive(item.path);
      const listItem = (
        <ListItem key={item.path} disablePadding>
          <Tooltip title={collapsed ? item.label : ''} placement="right">
            <ListItemButton
              selected={active}
              onClick={() => handleItemClick(item.path)}
              sx={{
                minHeight: 48,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: 2.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: collapsed ? 0 : 3,
                  justifyContent: 'center',
                  color: active ? 'inherit' : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={item.label} />}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      );

      items.push(listItem);
    });

    return items;
  };

  return (
    <Drawer
      variant={drawerVariant}
      open={isMobile ? !collapsed : true}
      onClose={() => setCollapsed(true)}
      ModalProps={{
        keepMounted: true, // Melhor performance em mobile
      }}
      sx={{
        width: collapsed && !isMobile ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: collapsed && !isMobile ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          elevation: 2,
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto', mt: 1 }}>
        <List>
          {renderMenuItems()}
        </List>
      </Box>
    </Drawer>
  );
};

export default DashboardSidebar;

