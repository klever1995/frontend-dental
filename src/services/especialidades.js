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

export async function obtenerEspecialidades(empresaId = 1) {
  const response = await fetch(`${API_URL}/api/v1/especialidades/?empresa_id=${empresaId}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Error al obtener especialidades');
  return response.json();
}

export async function crearEspecialidad(data) {
  const response = await fetch(`${API_URL}/api/v1/especialidades/`, {
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
    throw new Error(error.detail || 'Error al crear especialidad');
  }
  return response.json();
}

export async function actualizarEspecialidad(id, data) {
  const response = await fetch(`${API_URL}/api/v1/especialidades/${id}`, {
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
    throw new Error(error.detail || 'Error al actualizar especialidad');
  }
  return response.json();
}

export async function eliminarEspecialidad(id) {
  const response = await fetch(`${API_URL}/api/v1/especialidades/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Error al eliminar especialidad');
  }
  return true; 
}