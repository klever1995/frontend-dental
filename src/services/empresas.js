// ==============================
// Servicio de empresas
// Comunicación con el backend para gestionar empresas y conexión de WhatsApp
// ==============================
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

// Obtener todas las empresas (admin)
export const listarEmpresas = async (skip = 0, limit = 100) => {
  const response = await fetch(`${API_URL}/api/v1/empresas?skip=${skip}&limit=${limit}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Error al listar empresas');
  return response.json();
};

// Obtener una empresa por ID
export const obtenerEmpresa = async (empresaId) => {
  const response = await fetch(`${API_URL}/api/v1/empresas/${empresaId}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Error al obtener empresa');
  return response.json();
};

// Crear nueva empresa (registro inicial)
export const crearEmpresa = async (empresaData) => {
  const response = await fetch(`${API_URL}/api/v1/empresas/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(empresaData)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al crear empresa');
  }
  return response.json();
};

// Actualizar empresa (incluye campos de WhatsApp)
export const actualizarEmpresa = async (empresaId, empresaData) => {
  const response = await fetch(`${API_URL}/api/v1/empresas/${empresaId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(empresaData)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al actualizar empresa');
  }
  return response.json();
};

// 🔥 NUEVA FUNCIÓN: Guardar los datos de WhatsApp Business después del Embedded Signup
export const guardarDatosWhatsApp = async (empresaId, datos) => {
  const response = await fetch(`${API_URL}/api/v1/empresas/${empresaId}/whatsapp/callback`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(datos)  // datos debe contener phone_number_id, waba_id, business_id
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al guardar datos de WhatsApp');
  }
  return response.json();
};

// Función para conectar WhatsApp (versión antigua, se mantiene por compatibilidad pero no se usa)
export const conectarWhatsApp = async (empresaId, authorizationCode) => {
  const response = await fetch(`${API_URL}/api/v1/empresas/${empresaId}/whatsapp/callback`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ authorization_code: authorizationCode })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al conectar WhatsApp');
  }
  return response.json();
};