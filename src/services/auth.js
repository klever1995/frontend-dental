const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

// Guardar token en localStorage
export function setToken(token) {
  localStorage.setItem('auth_token', token);
}

// Obtener token de localStorage
export function getToken() {
  return localStorage.getItem('auth_token');
}

// Eliminar token (logout)
export function removeToken() {
  localStorage.removeItem('auth_token');
}

// Verificar si hay usuario autenticado
export function isAuthenticated() {
  return !!getToken();
}

// Decodificar token
export function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decodificando token:', error);
    return null;
  }
}

// Obtener empresa_id del token actual
export function getEmpresaIdFromToken() {
  const token = getToken();
  if (!token) return null;
  const decoded = decodeToken(token);
  return decoded?.empresa_id || null;
}

// Obtener rol del token actual
export function getRolFromToken() {
  const token = getToken();
  if (!token) return null;
  const decoded = decodeToken(token);
  return decoded?.rol || null;
}

// Obtener teléfono de la empresa del token actual
export function getEmpresaTelefonoFromToken() {
  const token = getToken();
  if (!token) return null;
  const decoded = decodeToken(token);
  return decoded?.empresa_telefono || null;
}

// Obtener nombre de la empresa del token actual
export function getEmpresaNombreFromToken() {
  const token = getToken();
  if (!token) return null;
  const decoded = decodeToken(token);
  return decoded?.empresa_nombre || null;
}

// Login
export async function login(credentials) {
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);

  const response = await fetch(`${API_URL}/api/v1/usuarios/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al iniciar sesión');
  }

  const data = await response.json();
  setToken(data.access_token);
  return data;
}

// Obtener usuario actual
export async function getCurrentUser() {
  const token = getToken();
  if (!token) throw new Error('No hay token');

  const response = await fetch(`${API_URL}/api/v1/usuarios/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener usuario');
  }

  return response.json();
}

// Logout
export function logout() {
  removeToken();
  window.location.href = '/login';
}

// Header de autorización
export function authHeader() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}