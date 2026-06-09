import { useState, useEffect } from 'react';
import { obtenerHistorialCitas, obtenerEspecialidades } from '../services/calcom';
import { getRolFromToken, getEspecialidadIdFromToken } from '../services/auth';
import '../styles/Clientes.css';
import { getEmpresaIdFromToken } from '../services/auth';

export default function Clientes() {
  const [cedula, setCedula] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [buscado, setBuscado] = useState(false);
  
  // Estados para filtro de especialidad
  const [especialidadesList, setEspecialidadesList] = useState([]);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState(null);
  
  const userRol = getRolFromToken();
  const isAdmin = userRol === 'admin';
  const userEspecialidadId = getEspecialidadIdFromToken();
  
  // Estados para modal
  const [showMotivoModal, setShowMotivoModal] = useState(false);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');

  // Cargar especialidades si es admin
  useEffect(() => {
    if (isAdmin) {
      const empresaId = getEmpresaIdFromToken();
      if (empresaId) {
        obtenerEspecialidades(empresaId)  
          .then(data => {
            setEspecialidadesList(data);
            if (data.length > 0) setEspecialidadSeleccionada(data[0].id);
          })
          .catch(err => console.error(err));
      }
    }
  }, [isAdmin]);

  const handleBuscar = async () => {
    if (!cedula.trim()) {
      alert('Por favor ingresa un número de cédula');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      // Para admin: usar especialidadSeleccionada; para doctor: usar userEspecialidadId
      const especialidadId = isAdmin ? especialidadSeleccionada : userEspecialidadId;
      const data = await obtenerHistorialCitas(cedula, fechaDesde || null, fechaHasta || null, especialidadId);
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

  const verMotivo = (notas) => {
    if (!notas || notas === '—') {
      alert('No hay motivo registrado para esta cita.');
      return;
    }
    setMotivoSeleccionado(notas);
    setShowMotivoModal(true);
  };

  return (
    <div className="clientes-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="titulo">Historial de Citas</h1>
        {isAdmin && especialidadesList.length > 0 && (
          <div className="clientes-filtro-especialidad">
            <label htmlFor="historial-especialidad-select">Filtrar por especialidad:</label>
            <select
              id="historial-especialidad-select"
              value={especialidadSeleccionada || ''}
              onChange={(e) => setEspecialidadSeleccionada(parseInt(e.target.value))}
            >
              {especialidadesList.map(esp => (
                <option key={esp.id} value={esp.id}>🩺 {esp.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filtros */}
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
                    <th>Motivo de la cita</th>
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
        </div>
      )}

      {/* Modal para mostrar motivo de la cita */}
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