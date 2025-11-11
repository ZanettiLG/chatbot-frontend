import React, { useEffect } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { removeNotification } from '../store/uiSlice';

const ToastNotification: React.FC = () => {
  const dispatch = useDispatch();
  const notifications = useSelector((state: RootState) => state.ui.notifications);

  const handleClose = (id: string) => {
    dispatch(removeNotification(id));
  };

  // Auto-remover notificações após 6 segundos
  useEffect(() => {
    if (notifications.length === 0) return;
    
    const currentNotification = notifications[notifications.length - 1];
    const timer = setTimeout(() => {
      handleClose(currentNotification.id);
    }, 6000);
    
    return () => clearTimeout(timer);
  }, [notifications, dispatch]);

  if (notifications.length === 0) {
    return null;
  }

  // Mostrar apenas a última notificação
  const currentNotification = notifications[notifications.length - 1];

  return (
    <Snackbar
      open={true}
      autoHideDuration={6000}
      onClose={() => handleClose(currentNotification.id)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={() => handleClose(currentNotification.id)}
        severity={currentNotification.type as AlertColor}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {currentNotification.message}
      </Alert>
    </Snackbar>
  );
};

export default ToastNotification;

