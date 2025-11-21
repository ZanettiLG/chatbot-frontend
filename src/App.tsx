import React from 'react';
import { useSelector } from 'react-redux';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import routes from './routes';
import { RootState } from './store';
import { theme, darkTheme } from './styles/theme';

const App: React.FC = () => {
  console.log('App component rendering');
  const { theme: currentTheme } = useSelector((state: RootState) => state.ui);
  const muiTheme = currentTheme === 'dark' ? darkTheme : theme;

  const router = createBrowserRouter(routes);
  
  try {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <RouterProvider router={router} />
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


/*
        <Box
          component="main"
          sx={{
            mt: 8, // Compensar header fixo
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Routes>
            <Route path="/" element={<ChatInterface />} />
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/chat/:agentId" element={<ChatInterface />} />
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
              path="/dashboard/actions"
              element={
                <DashboardLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <ActionManagement />
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
            
            <Route path="/conversations" element={<Navigate to="/dashboard/history" replace />} />
            <Route path="/engines" element={<Navigate to="/dashboard/settings" replace />} />
            <Route path="/agents" element={<Navigate to="/dashboard/agents" replace />} />
            <Route path="/roles" element={<Navigate to="/dashboard/roles" replace />} />
            <Route path="/personalities" element={<Navigate to="/dashboard/personalities" replace />} />
            <Route path="/rules" element={<Navigate to="/dashboard/rules" replace />} />
            <Route path="/tools" element={<Navigate to="/dashboard/tools" replace />} />
            <Route path="/whatsapp-sessions" element={<Navigate to="/dashboard/whatsapp" replace />} />
            <Route path="/dashboard/whatsapp-sessions" element={<Navigate to="/dashboard/whatsapp" replace />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Box>


*/