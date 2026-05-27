import { getToken } from './auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'ngrok-skip-browser-warning': 'true'
  };
}

// Obtener todos los usuarios (con filtros opcionales)
export async function obtenerUsuarios() {
  const response = await fetch(`${API_URL}/api/v1/usuarios/`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Error al obtener usuarios');
  return response.json();
}

// Obtener un usuario por ID
export async function obtenerUsuario(id) {
  const response = await fetch(`${API_URL}/api/v1/usuarios/${id}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Error al obtener usuario');
  return response.json();
}

// Crear nuevo usuario (registro)
export async function crearUsuario(data) {
  const response = await fetch(`${API_URL}/api/v1/usuarios/registro`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      'ngrok-skip-browser-warning': 'true'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al crear usuario');
  }
  return response.json();
}

// Actualizar usuario
export async function actualizarUsuario(id, data) {
  const response = await fetch(`${API_URL}/api/v1/usuarios/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      'ngrok-skip-browser-warning': 'true'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al actualizar usuario');
  }
  return response.json();
}

// Eliminar usuario
export async function eliminarUsuario(id) {
  const response = await fetch(`${API_URL}/api/v1/usuarios/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al eliminar usuario');
  }
  return true; // 204 No Content
}