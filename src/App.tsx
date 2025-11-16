import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import { theme, darkTheme } from './styles/theme';
import Header from './components/Header';
import DashboardLayout from './components/DashboardLayout';
import NotFound from './components/NotFound';
import ToastNotification from './components/ToastNotification';

// Componentes principais (não lazy para melhor performance inicial)
import ChatInterface from './components/ChatInterface';
import DashboardOverview from './components/DashboardOverview';

// Lazy loading para componentes do Dashboard
const AgentManagement = lazy(() => import('./components/AgentManagement'));
const RoleManagement = lazy(() => import('./components/RoleManagement'));
const PersonalityManagement = lazy(() => import('./components/PersonalityManagement'));
const RuleManagement = lazy(() => import('./components/RuleManagement'));
const ToolManagement = lazy(() => import('./components/ToolManagement'));
const UnifiedChatInterface = lazy(() => import('./components/UnifiedChatInterface'));
const EngineStatus = lazy(() => import('./components/EngineStatus'));
const WhatsAppManagement = lazy(() => import('./components/WhatsAppManagement'));
const InferenceManagement = lazy(() => import('./components/InferenceManagement'));

const LoadingFallback: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
    }}
  >
    <CircularProgress />
  </Box>
);

const App: React.FC = () => {
  console.log('App component rendering');
  
  try {
    const { theme: currentTheme } = useSelector((state: RootState) => state.ui);
    const muiTheme = currentTheme === 'dark' ? darkTheme : theme;

    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Header />
        <ToastNotification />
        
        <Box
          component="main"
          sx={{
            mt: 8, // Compensar header fixo
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Routes>
            {/* Rotas de Chat (sem sidebar) */}
            <Route path="/" element={<ChatInterface />} />
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/chat/:agentId" element={<ChatInterface />} />
            {/* Rotas do Dashboard (com sidebar) */}
            <Route
              path="/dashboard"
              element={
                <DashboardLayout>
                  <DashboardOverview />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/agents"
              element={
                <DashboardLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <AgentManagement />
                  </Suspense>
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/roles"
              element={
                <DashboardLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <RoleManagement />
                  </Suspense>
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/rules"
              element={
                <DashboardLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <RuleManagement />
                  </Suspense>
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/personalities"
              element={
                <DashboardLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <PersonalityManagement />
                  </Suspense>
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/tools"
              element={
                <DashboardLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <ToolManagement />
                  </Suspense>
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/history"
              element={
                <DashboardLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <UnifiedChatInterface />
                  </Suspense>
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <DashboardLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <EngineStatus />
                  </Suspense>
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/whatsapp"
              element={
                <DashboardLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <WhatsAppManagement />
                  </Suspense>
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/inference"
              element={
                <DashboardLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <InferenceManagement />
                  </Suspense>
                </DashboardLayout>
              }
            />
            
            {/* Redirects para compatibilidade com rotas antigas */}
            <Route path="/conversations" element={<Navigate to="/dashboard/history" replace />} />
            <Route path="/engines" element={<Navigate to="/dashboard/settings" replace />} />
            <Route path="/agents" element={<Navigate to="/dashboard/agents" replace />} />
            <Route path="/roles" element={<Navigate to="/dashboard/roles" replace />} />
            <Route path="/personalities" element={<Navigate to="/dashboard/personalities" replace />} />
            <Route path="/rules" element={<Navigate to="/dashboard/rules" replace />} />
            <Route path="/tools" element={<Navigate to="/dashboard/tools" replace />} />
            <Route path="/whatsapp-sessions" element={<Navigate to="/dashboard/whatsapp" replace />} />
            <Route path="/dashboard/whatsapp-sessions" element={<Navigate to="/dashboard/whatsapp" replace />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Box>
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
