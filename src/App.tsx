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

const App: React.FC = () => {
  const { theme: currentTheme } = useSelector((state: RootState) => state.ui);
  const muiTheme = currentTheme === 'dark' ? darkTheme : theme;

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🤖 Chatbot Multi-Engine
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Navigation />
        <Routes>
          <Route path="/" element={<ChatInterface />} />
          <Route path="/engines" element={<EngineStatus />} />
        </Routes>
      </Container>
    </ThemeProvider>
  );
};

export default App;
