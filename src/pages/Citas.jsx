import { useState, useEffect } from 'react';
import { obtenerCitas, cancelarCita, reagendarCita } from '../services/calcom';
import '../styles/Citas.css';

export default function Citas() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [citaSeleccionadaId, setCitaSeleccionadaId] = useState(null);
  
  // Estado para el modal de reagendar
  const [showModal, setShowModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [accionLoading, setAccionLoading] = useState(false);

  useEffect(() => {
    cargarCitas();
  }, []);

  const cargarCitas = async () => {
    try {
      setLoading(true);
      const data = await obtenerCitas();
      setCitas(data);
      setError('');
      setCitaSeleccionadaId(null); // Resetear selección al recargar
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
      await cargarCitas();
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
        selectedCita.cliente_email
      );
      setShowModal(false);
      await cargarCitas();
      alert('Cita reagendada exitosamente');
    } catch (err) {
      alert('Error al reagendar: ' + err.message);
    } finally {
      setAccionLoading(false);
    }
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
        <button onClick={cargarCitas} className="retry-btn">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="citas-container">
      {/* Botones de acción arriba */}
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
                  <td>{formatFecha(cita.start_time)}</td>
                  <td>{getStatusBadge(cita.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para reagendar */}
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