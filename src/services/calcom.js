import { getToken } from './auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

// Función auxiliar para obtener headers con autenticación
function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'ngrok-skip-browser-warning': 'true'
  };
}

// Obtener todas las citas (con filtro opcional por especialidad)
export async function obtenerCitas(especialidadId = null) {
  let url = `${API_URL}/api/v1/citas/`;
  if (especialidadId) {
    url += `?especialidad_id=${especialidadId}`;
  }
  
  const response = await fetch(url, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Error al obtener citas');
  }
  
  return response.json();
}

// Consultar slots disponibles para una especialidad específica
export async function consultarSlots(especialidad, fechaInicio = null, diasMostrar = 5) {
  let url = `${API_URL}/api/v1/citas/slots?especialidad=${encodeURIComponent(especialidad)}&dias_a_mostrar=${diasMostrar}`;
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

// Agendar cita (con especialidad)
export async function agendarCita(especialidad, clienteNombre, clienteEmail, clienteCedula, clienteTelefono, fecha, hora, clienteNotas = null) {
  const params = new URLSearchParams();
  params.append('especialidad', especialidad);
  params.append('cliente_nombre', clienteNombre);
  params.append('cliente_email', clienteEmail);
  params.append('cliente_cedula', clienteCedula);
  params.append('cliente_telefono', clienteTelefono);
  params.append('fecha', fecha);
  params.append('hora', hora);
  if (clienteNotas) {
    params.append('cliente_notas', clienteNotas);
  }
  
  const response = await fetch(`${API_URL}/api/v1/citas/agendar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${getToken()}`,
      'ngrok-skip-browser-warning': 'true'
    },
    body: params
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al agendar cita');
  }
  
  return response.json();
}

// Cancelar cita (ahora necesita calendar_id además del event_id)
export async function cancelarCita(eventId, calendarId) {
  const response = await fetch(`${API_URL}/api/v1/citas/${eventId}?calendar_id=${encodeURIComponent(calendarId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al cancelar cita');
  }
  
  return response.json();
}

// Reagendar cita (ahora necesita calendar_id, event_id y especialidad)
export async function reagendarCita(eventId, calendarId, nuevaFecha, nuevaHora, clienteNombre, clienteEmail, clienteTelefono, clienteCedula, clienteNotas = null) {
  const params = new URLSearchParams();
  params.append('calendar_id', calendarId);
  params.append('nueva_fecha', nuevaFecha);
  params.append('nueva_hora', nuevaHora);
  params.append('cliente_nombre', clienteNombre);
  params.append('cliente_email', clienteEmail);
  params.append('cliente_telefono', clienteTelefono);
  params.append('cliente_cedula', clienteCedula);
  if (clienteNotas) {
    params.append('cliente_notas', clienteNotas);
  }
  
  const response = await fetch(`${API_URL}/api/v1/citas/${eventId}/reagendar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${getToken()}`,
      'ngrok-skip-browser-warning': 'true'
    },
    body: params
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al reagendar cita');
  }
  
  return response.json();
}

// Obtener estadísticas para el Dashboard (con filtro opcional por especialidad y fecha)
export async function obtenerEstadisticasDashboard(especialidadId = null, fechaReferencia = null) {
  let url = `${API_URL}/api/v1/citas/dashboard/stats`;
  const params = new URLSearchParams();
  if (especialidadId) {
    params.append('especialidad_id', especialidadId);
  }
  if (fechaReferencia) {
    params.append('fecha_referencia', fechaReferencia);
  }
  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  
  const response = await fetch(url, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al obtener estadísticas');
  }
  
  return response.json();
}

export async function obtenerHistorialCitas(cedula, fechaDesde = null, fechaHasta = null, especialidadId = null) {
  let url = `${API_URL}/api/v1/citas/historial/${cedula}`;
  const params = new URLSearchParams();
  if (fechaDesde) params.append('fecha_desde', fechaDesde);
  if (fechaHasta) params.append('fecha_hasta', fechaHasta);
  if (especialidadId) params.append('especialidad_id', especialidadId);
  if (params.toString()) url += `?${params.toString()}`;
  
  const response = await fetch(url, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al obtener historial');
  }
  
  return response.json();
}

// 🔥 CORREGIDO: ahora recibe empresaId como parámetro obligatorio
export async function obtenerEspecialidades(empresaId) {
  const response = await fetch(`${API_URL}/api/v1/especialidades/?empresa_id=${empresaId}`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Error al obtener especialidades');
  }
  
  return response.json();
}