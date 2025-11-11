import React from 'react';
import { Box, Breadcrumbs, Link, Typography, Fade } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import DashboardSidebar from './DashboardSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    const breadcrumbs: { label: string; path: string }[] = [];

    if (pathnames.length === 0) {
      return [{ label: 'Dashboard', path: '/dashboard' }];
    }

    breadcrumbs.push({ label: 'Dashboard', path: '/dashboard' });

    const routeLabels: Record<string, string> = {
      agents: 'Agentes',
      roles: 'Roles',
      rules: 'Regras',
      personalities: 'Personalidades',
      tools: 'Ferramentas',
      history: 'Histórico de Conversas',
      settings: 'Configurações',
      whatsapp: 'WhatsApp',
    };

    // Pular o primeiro elemento se for 'dashboard' (já adicionado acima)
    const startIndex = pathnames[0] === 'dashboard' ? 1 : 0;
    
    pathnames.slice(startIndex).forEach((pathname, index) => {
      const label = routeLabels[pathname] || pathname.charAt(0).toUpperCase() + pathname.slice(1);
      const path = `/${pathnames.slice(0, startIndex + index + 1).join('/')}`;
      breadcrumbs.push({ label, path });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <DashboardSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          mt: { xs: 8, sm: 8 },
          width: { sm: `calc(100% - 240px)` },
          backgroundColor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {/* Breadcrumbs */}
        {breadcrumbs.length > 1 && (
          <Breadcrumbs
            separator={<ChevronRightIcon fontSize="small" />}
            aria-label="breadcrumb"
            sx={{ mb: 3 }}
          >
            {breadcrumbs.map((breadcrumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return isLast ? (
                <Typography key={breadcrumb.path} color="text.primary">
                  {breadcrumb.label}
                </Typography>
              ) : (
                <Link
                  key={breadcrumb.path}
                  component="button"
                  variant="body1"
                  onClick={() => navigate(breadcrumb.path)}
                  sx={{
                    cursor: 'pointer',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {breadcrumb.label}
                </Link>
              );
            })}
          </Breadcrumbs>
        )}

        {/* Conteúdo com transição */}
        <Fade in timeout={300}>
          <Box>{children}</Box>
        </Fade>
      </Box>
    </Box>
  );
};

export default DashboardLayout;

