import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Avatar,
  Box,
} from '@mui/material';
import {
  ChatBubble as ChatBubbleIcon,
  Dashboard as DashboardIcon,
  SmartToy as SmartToyIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { RootState } from '../store';
import { setTheme } from '../store/uiSlice';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { theme } = useSelector((state: RootState) => state.ui);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isDashboard = location.pathname.startsWith('/dashboard');
  const isChat = location.pathname === '/' || location.pathname === '/chat';

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    if (newValue === 'chat') {
      navigate('/chat');
    } else if (newValue === 'dashboard') {
      navigate('/dashboard');
    }
  };

  const handleThemeToggle = () => {
    dispatch(setTheme(theme === 'light' ? 'dark' : 'light'));
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileMenuItemClick = (action: string) => {
    handleProfileMenuClose();
    if (action === 'settings') {
      navigate('/dashboard/settings');
    }
    // Adicionar outras ações do menu conforme necessário
  };

  const getCurrentTab = () => {
    if (isDashboard) return 'dashboard';
    if (isChat) return 'chat';
    return 'chat'; // default
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={4}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
        {/* Logo e Título */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="Salve.ai logo"
            sx={{ mr: 1 }}
          >
            <SmartToyIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: 600 }}
          >
            Salve.ai
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs
          value={getCurrentTab()}
          onChange={handleTabChange}
          textColor="inherit"
          indicatorColor="secondary"
          sx={{ flexGrow: 0 }}
        >
          <Tab
            icon={<ChatBubbleIcon />}
            iconPosition="start"
            label="Conversar"
            value="chat"
            aria-label="Abrir interface de conversa"
          />
          <Tab
            icon={<DashboardIcon />}
            iconPosition="start"
            label="Dashboard"
            value="dashboard"
            aria-label="Abrir dashboard"
          />
        </Tabs>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Toggle de Tema */}
        <Tooltip title={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}>
          <IconButton
            color="inherit"
            onClick={handleThemeToggle}
            aria-label="Alternar tema"
          >
            {theme === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Tooltip>

        {/* Menu de Perfil */}
        <Tooltip title="Menu do perfil">
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleProfileMenuOpen}
            aria-label="Menu do perfil"
            aria-controls={anchorEl ? 'profile-menu' : undefined}
            aria-haspopup="true"
          >
            <AccountCircleIcon />
          </IconButton>
        </Tooltip>
        <Menu
          id="profile-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => handleProfileMenuItemClick('settings')}>
            <SettingsIcon sx={{ mr: 1 }} fontSize="small" />
            Configurações
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

