import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import { RootState } from '../store';
import { setTheme } from '../store/uiSlice';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { theme } = useSelector((state: RootState) => state.ui);

  const handleNavigationChange = (_event: React.SyntheticEvent, newValue: string) => {
    // Mapear valores do BottomNavigation para rotas reais
    const routeMap: Record<string, string> = {
      'chat': '/',
      'agents': '/agents',
      'engines': '/engines',
    };
    navigate(routeMap[newValue] || '/');
  };

  const handleThemeToggle = () => {
    dispatch(setTheme(theme === 'light' ? 'dark' : 'light'));
  };

  const getCurrentValue = () => {
    switch (location.pathname) {
      case '/':
        return 'chat';
      case '/agents':
        return 'agents';
      case '/engines':
        return 'engines';
      default:
        return 'chat';
    }
  };

  return (
    <>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
        elevation={3}
      >
        <BottomNavigation
          value={getCurrentValue()}
          onChange={handleNavigationChange}
          showLabels
        >
          <BottomNavigationAction
            label="Chat"
            value="chat"
            icon={<ChatIcon />}
          />
          <BottomNavigationAction
            label="Agentes"
            value="agents"
            icon={<PersonIcon />}
          />
          <BottomNavigationAction
            label="Engines"
            value="engines"
            icon={<SettingsIcon />}
          />
        </BottomNavigation>
      </Paper>

      {/* Theme Toggle Button */}
      <Tooltip title={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}>
        <IconButton
          onClick={handleThemeToggle}
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 1001,
            backgroundColor: 'background.paper',
            boxShadow: 2,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          {theme === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
      </Tooltip>
    </>
  );
};

export default Navigation;
