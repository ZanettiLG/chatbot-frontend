import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Typography, Container } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import { theme, darkTheme } from './styles/theme';
import ChatInterface from './components/ChatInterface';
import EngineStatus from './components/EngineStatus';
import Navigation from './components/Navigation';
import AgentManagement from './components/AgentManagement';
import RoleManagement from './components/RoleManagement';
import PersonalityManagement from './components/PersonalityManagement';
import RuleManagement from './components/RuleManagement';
import WhatsAppSessionManagement from './components/WhatsAppSessionManagement';

const App: React.FC = () => {
  console.log('App component rendering');
  
  // WebSocket será inicializado pelos componentes que precisam (ex: ChatInterface)
  // Não inicializar aqui para evitar múltiplas instâncias
  
  try {
    const { theme: currentTheme } = useSelector((state: RootState) => state.ui);
    const muiTheme = currentTheme === 'dark' ? darkTheme : theme;

    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              🤖 Chatbot
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Navigation />
          <Routes>
            <Route path="/" element={<ChatInterface />} />
            <Route path="/engines" element={<EngineStatus />} />
            <Route path="/agents" element={<AgentManagement />} />
            <Route path="/roles" element={<RoleManagement />} />
            <Route path="/personalities" element={<PersonalityManagement />} />
            <Route path="/rules" element={<RuleManagement />} />
            <Route path="/whatsapp-sessions" element={<WhatsAppSessionManagement />} />
          </Routes>
        </Container>
      </ThemeProvider>
    );
  } catch (error) {
    console.error('Error in App component:', error);
    return (
      <div>
        <h1>Error loading app</h1>
        <p>{String(error)}</p>
      </div>
    );
  }
};

export default App;
