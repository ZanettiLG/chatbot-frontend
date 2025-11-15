// Configuração de ambiente
// As variáveis VITE_* são definidas no build time via Docker
export const config = {
  // URL do WebSocket (via nginx no mesmo domínio)
  // Socket.IO client adiciona automaticamente /socket.io/, então passar apenas a URL base
  wsUrl: import.meta.env.VITE_WS_URL || 'wss://localhost',
  // URL base da API (via nginx no mesmo domínio)
  apiUrl: import.meta.env.VITE_API_URL || 'https://localhost/api',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export default config;

