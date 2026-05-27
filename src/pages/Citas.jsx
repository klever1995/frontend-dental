import { useState, useEffect, useCallback } from 'react';
import { obtenerCitas, cancelarCita, reagendarCita, obtenerEspecialidades } from '../services/calcom';
import { getRolFromToken } from '../services/auth';
import { useSocket } from '../hooks/useSocket';
import '../styles/Citas.css';

export default function Citas() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [citaSeleccionadaId, setCitaSeleccionadaId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [accionLoading, setAccionLoading] = useState(false);
  const [showMotivoModal, setShowMotivoModal] = useState(false);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  
  // Estados para filtro de especialidad
  const [especialidadesList, setEspecialidadesList] = useState([]);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState(null);
  
  const userRol = getRolFromToken();
  const isAdmin = userRol === 'admin';
  
  const { isConnected, joinEmpresa, onCitasActualizadas } = useSocket(); // 🔥 CAMBIADO: onCitaActualizada -> onCitasActualizadas

  // Recargar citas con filtro de especialidad
  const recargarCitasSilenciosamente = useCallback(async () => {
    if (isAdmin && !especialidadSeleccionada) return;
    try {
      const data = await obtenerCitas(especialidadSeleccionada);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const citasFuturas = data.filter(cita => new Date(cita.start_time) >= hoy);
      setCitas(citasFuturas);
      setError('');
      setCitaSeleccionadaId(null);
    } catch (err) {
      console.error('Error al recargar citas:', err);
    }
  }, [especialidadSeleccionada, isAdmin]);

  const cargarCitasIniciales = useCallback(async () => {
    try {
      setLoading(true);
      await recargarCitasSilenciosamente();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [recargarCitasSilenciosamente]);

  // Cargar especialidades si es admin
  useEffect(() => {
    if (isAdmin) {
      obtenerEspecialidades()
        .then(data => {
          setEspecialidadesList(data);
          if (data.length > 0) setEspecialidadSeleccionada(data[0].id);
        })
        .catch(err => console.error(err));
    }
  }, [isAdmin]);

  // Recargar cuando cambie la especialidad
  useEffect(() => {
    if (!isAdmin || especialidadSeleccionada) {
      cargarCitasIniciales();
    }
  }, [especialidadSeleccionada, isAdmin, cargarCitasIniciales]);

  useEffect(() => {
    const empresaId = 1;
    if (isConnected) {
      joinEmpresa(empresaId);
    }
  }, [isConnected, joinEmpresa]);

  // 🔥 CAMBIADO: onCitaActualizada -> onCitasActualizadas
  useEffect(() => {
    const unsubscribe = onCitasActualizadas((data) => {
      console.log('📢 Cita actualizada en tiempo real (Citas):', data);
      recargarCitasSilenciosamente();
    });
    return unsubscribe;
  }, [onCitasActualizadas, recargarCitasSilenciosamente]);

  const formatFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatHora = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearTelefono = (telefono) => {
    if (!telefono) return '—';
    if (telefono.startsWith('+593')) {
      return '0' + telefono.slice(4);
    }
    return telefono;
  };

  const obtenerCitaSeleccionada = () => {
    return citas.find(cita => cita.uid === citaSeleccionadaId);
  };

  const handleCancelar = async () => {
    const cita = obtenerCitaSeleccionada();
    if (!cita) {
      alert('Selecciona una cita primero');
      return;
    }
    
    if (!window.confirm(`¿Cancelar cita de ${cita.cliente_nombre} el ${formatFecha(cita.start_time)} a las ${formatHora(cita.start_time)}?`)) {
      return;
    }
    
    try {
      setAccionLoading(true);
      await cancelarCita(cita.uid, cita.calendar_id);
      await recargarCitasSilenciosamente();
      alert('Cita cancelada exitosamente');
    } catch (err) {
      alert('Error al cancelar: ' + err.message);
    } finally {
      setAccionLoading(false);
    }
  };

  const abrirModalReagendar = () => {
    const cita = obtenerCitaSeleccionada();
    if (!cita) {
      alert('Selecciona una cita primero');
      return;
    }
    
    setSelectedCita(cita);
    const fechaLocal = new Date(cita.start_time);
    setNuevaFecha(fechaLocal.toISOString().split('T')[0]);
    setNuevaHora(fechaLocal.toTimeString().slice(0, 5));
    setShowModal(true);
  };

  const handleReagendar = async () => {
    if (!nuevaFecha || !nuevaHora) {
      alert('Por favor completa fecha y hora');
      return;
    }
    
    try {
      setAccionLoading(true);
      await reagendarCita(
        selectedCita.uid,
        selectedCita.calendar_id,
        nuevaFecha,
        nuevaHora,
        selectedCita.cliente_nombre,
        selectedCita.cliente_email,
        selectedCita.telefono,
        selectedCita.cedula,
        selectedCita.notas
      );
      setShowModal(false);
      await recargarCitasSilenciosamente();
      alert('Cita reagendada exitosamente');
    } catch (err) {
      alert('Error al reagendar: ' + err.message);
    } finally {
      setAccionLoading(false);
    }
  };

  const verMotivo = (notas) => {
    if (!notas || notas === '—') {
      alert('No hay motivo registrado para esta cita.');
      return;
    }
    setMotivoSeleccionado(notas);
    setShowMotivoModal(true);
  };

  if (loading) {
    return (
      <div className="citas-container">
        <div className="loading">Cargando citas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="citas-container">
        <div className="error-message">Error: {error}</div>
        <button onClick={cargarCitasIniciales} className="retry-btn">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="citas-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        {isAdmin && especialidadesList.length > 0 && (
          <div className="citas-filtro-especialidad">
            <label htmlFor="citas-especialidad-select">Filtrar por especialidad:</label>
            <select
              id="citas-especialidad-select"
              value={especialidadSeleccionada || ''}
              onChange={(e) => setEspecialidadSeleccionada(parseInt(e.target.value))}
            >
              {especialidadesList.map(esp => (
                <option key={esp.id} value={esp.id}>🩺 {esp.nombre}</option>
              ))}
            </select>
          </div>
        )}
        <div className="socket-status" style={{ fontSize: '12px', color: isConnected ? '#10b981' : '#ef4444' }}>
          {isConnected ? '🟢 Tiempo real activo' : '🔴 Conectando...'}
        </div>
      </div>

      <div className="citas-acciones">
        <button 
          className="btn-cancelar" 
          onClick={handleCancelar}
          disabled={!citaSeleccionadaId || accionLoading}
        >
          Cancelar cita
        </button>
        <button 
          className="btn-reagendar" 
          onClick={abrirModalReagendar}
          disabled={!citaSeleccionadaId || accionLoading}
        >
          Reagendar cita
        </button>
      </div>

      {citas.length === 0 ? (
        <p className="no-citas">No hay citas agendadas.</p>
      ) : (
        <div className="table-responsive">
          <table className="citas-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Seleccionar</th>
                <th>Paciente</th>
                <th>Email</th>
                <th>Cédula</th>
                <th>Teléfono</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Motivo de la cita</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((cita) => (
                <tr key={cita.uid} className={citaSeleccionadaId === cita.uid ? 'fila-seleccionada' : ''}>
                  <td>
                    <input
                      type="radio"
                      name="citaSeleccionada"
                      checked={citaSeleccionadaId === cita.uid}
                      onChange={() => setCitaSeleccionadaId(cita.uid)}
                      disabled={accionLoading}
                    />
                  </td>
                  <td>{cita.cliente_nombre || 'No especificado'}</td>
                  <td>{cita.cliente_email || 'No especificado'}</td>
                  <td>{cita.cedula || '—'}</td>
                  <td>{formatearTelefono(cita.telefono)}</td>
                  <td>{formatFecha(cita.start_time)}</td>
                  <td>{formatHora(cita.start_time)}</td>
                  <td>
                    {cita.notas ? (
                      <button 
                        className="btn-ver-motivo"
                        onClick={() => verMotivo(cita.notas)}
                      >
                        Ver
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Reagendar cita</h2>
            <p>Paciente: <strong>{selectedCita?.cliente_nombre}</strong></p>
            <div className="form-group">
              <label>Nueva fecha:</label>
              <input
                type="date"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Nueva hora:</label>
              <input
                type="time"
                value={nuevaHora}
                onChange={(e) => setNuevaHora(e.target.value)}
              />
            </div>
            <div className="modal-buttons">
              <button onClick={handleReagendar} disabled={accionLoading}>
                {accionLoading ? 'Procesando...' : 'Confirmar'}
              </button>
              <button onClick={() => setShowModal(false)} disabled={accionLoading}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showMotivoModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Motivo de la cita</h2>
            <p>{motivoSeleccionado}</p>
            <div className="modal-buttons">
              <button onClick={() => setShowMotivoModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}