import { Outlet, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import Header from '../components/Header';
import DashboardSidebar from '../components/DashboardSidebar';
import ToastNotification from '../../../components/ToastNotification';

const DashboardLayoutContent = ({children} : {children: React.ReactNode}) => {
  return (
    <Fade in timeout={300}>
      <Box>
        {children}
      </Box>
    </Fade>
  );
};

const DashboardLayout = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const breadcrumbs = pathnames.map((name) => {
    const label = name.charAt(0).toUpperCase() + name.slice(1);
    return { label, path: `/dashboard/${name}` };
  });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <DashboardSidebar />
      <Header />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: { xs: 8, sm: 8 },
          p: { xs: 2, sm: 3, md: 4 },
          minHeight: 'calc(100vh - 64px)',
          width: { sm: `calc(100% - 240px)` },
          backgroundColor: 'background.default',
        }}
      >
        <ToastNotification />
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
                  variant="body1"
                  component="button"
                  key={breadcrumb.path}
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
        <DashboardLayoutContent>
          <Outlet />
        </DashboardLayoutContent>
      </Box>
    </Box>
  );
};

export default DashboardLayout;