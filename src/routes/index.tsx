import React from 'react';
import { lazy, Suspense } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

// Componentes principais (não lazy para melhor performance inicial)
import NotFound from '../pages/NotFound';
import ChatInterface from '../pages/Chat';
import DashboardOverview from '../pages/Dashboard';
import DashboardLayout from '../pages/Dashboard/layouts/DashboardLayout';
// Lazy loading para componentes do Dashboard
const History = lazy(() => import('../pages/Dashboard/History'));
const RoleManagement = lazy(() => import('../pages/Dashboard/Roles'));
const ActionManagement = lazy(() => import('../pages/Dashboard/Actions'));
const EngineStatus = lazy(() => import('../pages/Dashboard/EngineStatus'));
const RuleManagement = lazy(() => import('../pages/Dashboard/RuleManagement'));
const ToolManagement = lazy(() => import('../pages/Dashboard/ToolManagement'));
const AgentManagement = lazy(() => import('../pages/Dashboard/AgentManagement'));
const WhatsAppManagement = lazy(() => import('../pages/Dashboard/WhatsAppManagement'));
const PersonalityManagement = lazy(() => import('../pages/Dashboard/PersonalityManagement'));

const LoadingFallback: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      minHeight: '400px',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <CircularProgress />
  </Box>
);

const LazyComponentLazy = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
);

const routes : RouteObject[] = [
  {
    path: 'chat',
    element: <ChatInterface />,
  },
  {
    path: 'chat/:agentId',
    element: <ChatInterface />,
  },
  {
    path: '/',
    index: true,
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <LazyComponentLazy><DashboardOverview /></LazyComponentLazy>,
      },
      {
        path: "overview",
        element: <LazyComponentLazy><DashboardOverview /></LazyComponentLazy>,
      },
      {
        path: 'agents',
        element: <LazyComponentLazy><AgentManagement /></LazyComponentLazy>,
      },
      {
        path: 'roles',
        element: <LazyComponentLazy><RoleManagement /></LazyComponentLazy>,
      },
      {
        path: 'rules',
        element: <LazyComponentLazy><RuleManagement /></LazyComponentLazy>,
      },
      {
        path: 'personalities',
        element: <LazyComponentLazy><PersonalityManagement /></LazyComponentLazy>,
      },
      {
        path: 'tools',
        element: <LazyComponentLazy><ToolManagement /></LazyComponentLazy>,
      },
      {
        path: 'actions',
        element: <LazyComponentLazy><ActionManagement /></LazyComponentLazy>,
      },
      {
        path: 'history',
        element: <LazyComponentLazy><History /></LazyComponentLazy>,
      },
      {
        path: 'settings',
        element: <LazyComponentLazy><EngineStatus /></LazyComponentLazy>,
      },
      {
        path: 'whatsapp',
        element: <LazyComponentLazy><WhatsAppManagement /></LazyComponentLazy>,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;