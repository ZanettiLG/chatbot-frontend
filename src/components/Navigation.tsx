import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import BuildIcon from '@mui/icons-material/Build';
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
      'tools': '/tools',
      'conversations': '/conversations',
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
      case '/tools':
        return 'tools';
      case '/conversations':
        return 'conversations';
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
          <BottomNavigationAction
            label="Ferramentas"
            value="tools"
            icon={<BuildIcon />}
          />
          <BottomNavigationAction
            label="Conversas"
            value="conversations"
            icon={<ChatIcon />}
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
