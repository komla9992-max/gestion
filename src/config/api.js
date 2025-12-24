// Configuration de l'API
// En développement, utilisez l'IP de votre ordinateur au lieu de localhost
// pour permettre l'accès depuis d'autres ordinateurs sur le même réseau

// Détecter automatiquement l'URL de l'API
const getApiUrl = () => {
  // En production, utilisez l'URL du serveur
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'http://213.136.93.42:3001';
  }
  
  // En développement, utilisez l'IP locale ou localhost
  // Remplacez '192.168.1.100' par l'IP de votre ordinateur sur le réseau local
  // Vous pouvez trouver votre IP avec la commande: ipconfig (Windows) ou ifconfig (Linux/Mac)
  const hostname = window.location.hostname;
  
  // Si on accède via une IP (pas localhost), utiliser cette IP pour l'API
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:3001`;
  }
  
  // Sinon, utiliser localhost (pour le développement local uniquement)
  return 'http://localhost:3001';
};

export const API_URL = getApiUrl();

console.log('🔗 URL de l\'API:', API_URL);

