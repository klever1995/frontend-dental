import { useState, useEffect, useCallback } from 'react';
import { obtenerCitas, cancelarCita, reagendarCita } from '../services/calcom';
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

  const { isConnected, joinEmpresa, onCitaActualizada } = useSocket();

  // 🔥 Función para recargar citas silenciosamente (sin loading)
  const recargarCitasSilenciosamente = useCallback(async () => {
    try {
      const data = await obtenerCitas();
      setCitas(data);
      setError('');
      setCitaSeleccionadaId(null);
    } catch (err) {
      console.error('Error al recargar citas:', err);
    }
  }, []);

  // 🔥 Función para carga inicial (con loading)
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

  useEffect(() => {
    const empresaId = 1;
    if (isConnected) {
      joinEmpresa(empresaId);
    }
  }, [isConnected, joinEmpresa]);

  // Escuchar evento de cita actualizada (actualización silenciosa)
  useEffect(() => {
    const unsubscribe = onCitaActualizada((data) => {
      console.log('📢 Cita actualizada en tiempo real (Citas):', data);
      recargarCitasSilenciosamente(); // 🔥 Usa recarga silenciosa, no cargarCitas()
    });
    return unsubscribe;
  }, [onCitaActualizada, recargarCitasSilenciosamente]);

  const formatFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'ACCEPTED': { text: 'Confirmada', className: 'status-confirmada' },
      'CANCELLED': { text: 'Cancelada', className: 'status-cancelada' },
      'PENDING': { text: 'Pendiente', className: 'status-pendiente' }
    };
    const s = statusMap[status] || { text: status, className: '' };
    return <span className={`status-badge ${s.className}`}>{s.text}</span>;
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
    
    if (!window.confirm(`¿Cancelar cita de ${cita.cliente_nombre} el ${formatFecha(cita.start_time)}?`)) {
      return;
    }
    
    try {
      setAccionLoading(true);
      await cancelarCita(cita.uid);
      await recargarCitasSilenciosamente(); // 🔥 Recarga silenciosa después de cancelar
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
        nuevaFecha,
        nuevaHora,
        selectedCita.cliente_nombre,
        selectedCita.cliente_email,
        selectedCita.telefono
      );
      setShowModal(false);
      await recargarCitasSilenciosamente(); // 🔥 Recarga silenciosa después de reagendar
      alert('Cita reagendada exitosamente');
    } catch (err) {
      alert('Error al reagendar: ' + err.message);
    } finally {
      setAccionLoading(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    cargarCitasIniciales();
  }, [cargarCitasIniciales]);

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
      <div className="socket-status" style={{ textAlign: 'right', fontSize: '12px', color: isConnected ? '#10b981' : '#ef4444', marginBottom: '10px' }}>
        {isConnected ? '🟢 Tiempo real activo' : '🔴 Conectando...'}
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
                <th>Fecha y Hora</th>
                <th>Estado</th>
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
                  <td>{getStatusBadge(cita.status)}</td>
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
    </div>
  );
}