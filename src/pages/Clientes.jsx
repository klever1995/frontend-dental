import { useState } from 'react';
import { obtenerHistorialCitas } from '../services/calcom';
import '../styles/Clientes.css';

export default function Clientes() {
  const [cedula, setCedula] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [buscado, setBuscado] = useState(false);

  const handleBuscar = async () => {
    if (!cedula.trim()) {
      alert('Por favor ingresa un número de cédula');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const data = await obtenerHistorialCitas(cedula, fechaDesde || null, fechaHasta || null);
      setCitas(data.citas || []);
      setBuscado(true);
    } catch (err) {
      setError(err.message);
      setCitas([]);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatearHora = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleTimeString('es-EC', {
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

  const getStatusBadge = (status) => {
    const statusMap = {
      'accepted': { text: 'Confirmada', className: 'status-confirmada' },
      'cancelled': { text: 'Cancelada', className: 'status-cancelada' },
      'pending': { text: 'Pendiente', className: 'status-pendiente' }
    };
    const s = statusMap[status.toLowerCase()] || { text: status, className: '' };
    return <span className={`status-badge ${s.className}`}>{s.text}</span>;
  };

  return (
    <div className="clientes-page">
      <h1 className="titulo">Historial de Citas</h1>
      
      {/* Filtros - Mismo diseño del ejemplo */}
      <div className="filtro-card">
        <div className="filtro-row">
          <div className="input-group">
            <label>Cédula *</label>
            <input
              type="text"
              placeholder="Ingresa el número de cédula"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Fecha desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Fecha hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
          <div className="btn-container">
            <button className="btn-buscar" onClick={handleBuscar} disabled={loading}>
              {loading ? 'Buscando...' : '🔍 Buscar'}
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {buscado && !loading && (
        <div className="resultados-card">
          <h3>Resultados para cédula: {cedula}</h3>
          {citas.length === 0 ? (
            <p className="no-citas">No se encontraron citas pasadas para esta cédula.</p>
          ) : (
            <div className="tabla-wrapper">
              <table className="clientes-table">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Email</th>
                    <th>Cédula</th>
                    <th>Teléfono</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Estado</th>
                </tr>
                </thead>
                <tbody>
                  {citas.map((cita) => (
                    <tr key={cita.uid}>
                      <td>{cita.cliente_nombre || 'No especificado'}</td>
                      <td>{cita.cliente_email || 'No especificado'}</td>
                      <td>{cita.cedula || '—'}</td>
                      <td>{formatearTelefono(cita.telefono)}</td>
                      <td>{formatearFecha(cita.start_time)}</td>
                      <td>{formatearHora(cita.start_time)}</td>
                      <td>{getStatusBadge(cita.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}