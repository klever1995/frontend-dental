import { getToken } from './auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

// Función auxiliar para obtener headers con autenticación
function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// Obtener todas las citas
export async function obtenerCitas() {
  const response = await fetch(`${API_URL}/api/v1/citas/`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Error al obtener citas');
  }
  
  return response.json();
}

// Consultar slots disponibles
export async function consultarSlots(fechaInicio = null, diasMostrar = 5) {
  let url = `${API_URL}/api/v1/citas/slots?dias_a_mostrar=${diasMostrar}`;
  if (fechaInicio) {
    url += `&fecha_inicio=${fechaInicio}`;
  }
  
  const response = await fetch(url, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Error al consultar horarios');
  }
  
  return response.json();
}

// Agendar cita
export async function agendarCita(clienteNombre, clienteEmail, fecha, hora) {
  const params = new URLSearchParams();
  params.append('cliente_nombre', clienteNombre);
  params.append('cliente_email', clienteEmail);
  params.append('fecha', fecha);
  params.append('hora', hora);
  
  const response = await fetch(`${API_URL}/api/v1/citas/agendar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${getToken()}`
    },
    body: params
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al agendar cita');
  }
  
  return response.json();
}

// Cancelar cita
export async function cancelarCita(bookingId) {
  const response = await fetch(`${API_URL}/api/v1/citas/${bookingId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al cancelar cita');
  }
  
  return response.json();
}

// Reagendar cita
export async function reagendarCita(bookingId, nuevaFecha, nuevaHora, clienteNombre, clienteEmail) {
  const params = new URLSearchParams();
  params.append('nueva_fecha', nuevaFecha);
  params.append('nueva_hora', nuevaHora);
  params.append('cliente_nombre', clienteNombre);
  params.append('cliente_email', clienteEmail);
  
  const response = await fetch(`${API_URL}/api/v1/citas/${bookingId}/reagendar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${getToken()}`
    },
    body: params
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al reagendar cita');
  }
  
  return response.json();
}

// Obtener estadísticas para el Dashboard
export async function obtenerEstadisticasDashboard() {
  const response = await fetch(`${API_URL}/api/v1/citas/dashboard/stats`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al obtener estadísticas');
  }
  
  return response.json();
}