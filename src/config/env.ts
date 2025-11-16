// Configuração de ambiente
// As variáveis VITE_* são definidas no build time via Docker
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

// Em produção, usar URLs relativas (mesmo domínio via nginx)
// Em desenvolvimento, usar URLs absolutas para localhost

// Função para obter URL da API (resolvida em runtime)
const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    // Se a URL começa com /, é relativa - usar como está
    if (envUrl.startsWith('/')) return envUrl;
    return envUrl;
  }
  // Se não especificado, usar relativa em produção e localhost em dev
  return isProd ? '/api' : 'http://localhost:3030/api';
};

// Função para obter URL do WebSocket (resolvida em runtime)
// Socket.IO precisa de URL completa (com protocolo e host)
const getWsUrl = (): string => {
  // Em runtime, sempre construir URL completa baseada no domínio atual
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  
  // Build time: usar variável de ambiente ou fallback
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl && !envUrl.startsWith('/')) {
    // Se for URL absoluta, usar como está
    return envUrl;
  }
  
  // Fallback para desenvolvimento
  return isProd ? '' : 'ws://localhost:3030';
};

// Configuração resolvida em runtime (não no build time)
export const config = {
  // URL do WebSocket (via nginx no mesmo domínio)
  // Será resolvida em runtime para o mesmo domínio
  get wsUrl() {
    return getWsUrl();
  },
  // URL base da API (via nginx no mesmo domínio)
  get apiUrl() {
    return getApiUrl();
  },
  isDevelopment: isDev,
  isProduction: isProd,
};

export default config;

