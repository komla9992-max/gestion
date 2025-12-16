// src/api/usersApi.js
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'gestion_app_users_v1';

function readStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const defaultUsers = [
      { id: uuidv4(), name: 'Admin', email: 'admin@local', role: 'admin', password: 'admin', permissions: [] },
      { id: uuidv4(), name: 'Supervisor', email: 'sup@local', role: 'superviseur', password: 'sup', permissions: [] },
      { id: uuidv4(), name: 'Agent One', email: 'agent1@local', role: 'agent', password: 'agent1', permissions: [] }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  const users = JSON.parse(raw);
  // Migration : ajouter un mot de passe par défaut et permissions aux utilisateurs existants qui n'en ont pas
  let needsUpdate = false;
  const migratedUsers = users.map(user => {
    let updated = false;
    const updatedUser = { ...user };
    
    if (!user.password) {
      updated = true;
      // Générer un mot de passe basé sur l'email ou un défaut
      const defaultPassword = user.email ? user.email.split('@')[0] : 'password123';
      updatedUser.password = defaultPassword;
    }
    
    if (!user.permissions) {
      updated = true;
      updatedUser.permissions = [];
    }
    
    if (updated) {
      needsUpdate = true;
    }
    
    return updatedUser;
  });
  if (needsUpdate) {
    writeStorage(migratedUsers);
    return migratedUsers;
  }
  return users;
}

function writeStorage(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export const usersApi = {
  list: async () => readStorage(),
  create: async ({ name, email, role, password, permissions }) => {
    const users = readStorage();
    // Générer un mot de passe par défaut si non fourni
    const defaultPassword = password || email.split('@')[0] || 'password123';
    const newUser = { 
      id: uuidv4(), 
      name, 
      email, 
      role, 
      password: defaultPassword,
      permissions: permissions || []
    };
    users.push(newUser);
    writeStorage(users);
    return newUser;
  },
  update: async (id, { name, email, role, password, permissions }) => {
    const users = readStorage();
    const idx = users.findIndex(u => u.id === id);
    const updatedUser = { ...users[idx], name, email, role };
    // Mettre à jour le mot de passe seulement si fourni
    if (password) {
      updatedUser.password = password;
    }
    // Mettre à jour les permissions si fournies
    if (permissions !== undefined) {
      updatedUser.permissions = permissions;
    }
    users[idx] = updatedUser;
    writeStorage(users);
    return users[idx];
  },
  remove: async (id) => {
    const users = readStorage().filter(u => u.id !== id);
    writeStorage(users);
    return true;
  },
  findByCredentials: async (identifier, password) => {
    const users = readStorage();
    // Permettre la connexion avec email ou nom d'utilisateur
    const user = users.find(u => 
      (u.email.toLowerCase() === identifier.toLowerCase() || 
       u.name.toLowerCase() === identifier.toLowerCase()) &&
      u.password === password
    );
    return user || null;
  }
};
