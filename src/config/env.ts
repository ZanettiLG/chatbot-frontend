// Configuração de ambiente
export const config = {
  // URL do Socket.IO (NestJS usa Socket.IO na porta 3030)
  wsUrl: import.meta.env.VITE_WS_URL || 'http://localhost:3030',
  // URL base do servidor (sem /api pois os controllers não têm prefixo)
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3030',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export default config;

