import { useState, useEffect } from 'react';
import { obtenerEstadisticasDashboard, obtenerCitas } from '../services/calcom';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [citasProximas, setCitasProximas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [estadisticas, todasCitas] = await Promise.all([
        obtenerEstadisticasDashboard(),
        obtenerCitas()
      ]);
      
      setStats(estadisticas);
      
      // Filtrar citas próximas (próximos 7 días y no canceladas)
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const dentro7Dias = new Date();
      dentro7Dias.setDate(hoy.getDate() + 7);
      dentro7Dias.setHours(23, 59, 59, 999);
      
      const proximas = todasCitas
        .filter(cita => {
          const fechaCita = new Date(cita.start_time);
          return cita.status === 'ACCEPTED' && fechaCita >= hoy && fechaCita <= dentro7Dias;
        })
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
      
      setCitasProximas(proximas);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <h1>📊 Dashboard</h1>
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <h1>📊 Dashboard</h1>
        <div className="dashboard-error">
          <p>Error: {error}</p>
          <button onClick={cargarDatos} className="retry-btn">Reintentar</button>
        </div>
      </div>
    );
  }

  // Generar días laborables (lunes a viernes) de los próximos 7 días
  const diasLaborables = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 14; i++) {
    const fecha = new Date();
    fecha.setDate(hoy.getDate() + i);
    const diaSemana = fecha.getDay();
    // Solo lunes (1) a viernes (5)
    if (diaSemana >= 1 && diaSemana <= 5) {
      diasLaborables.push({
        fecha: fecha,
        fechaStr: fecha.toISOString().split('T')[0],
        nombre: fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
      });
    }
    if (diasLaborables.length === 5) break;
  }

  // Verificar si una cita existe en una fecha y hora específica
  const existeCita = (fechaStr, hora) => {
    return citasProximas.some(cita => {
      const fechaCita = new Date(cita.start_time);
      const fechaCitaStr = fechaCita.toISOString().split('T')[0];
      const horaCita = fechaCita.getHours();
      return fechaCitaStr === fechaStr && horaCita === hora;
    });
  };

  return (
    <div className="dashboard-container">

      
      {/* KPIs */}
      <div className="dashboard-kpis">
        <div className="kpi-card">
          <div className="kpi-icon total">📅</div>
          <div className="kpi-info">
            <span className="kpi-label">Total Citas</span>
            <span className="kpi-value">{stats?.total_citas || 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon hoy">⭐</div>
          <div className="kpi-info">
            <span className="kpi-label">Citas de Hoy</span>
            <span className="kpi-value">{stats?.citas_hoy || 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon proximas">📆</div>
          <div className="kpi-info">
            <span className="kpi-label">Próximas (7 días)</span>
            <span className="kpi-value">{stats?.citas_proximas || 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon canceladas">❌</div>
          <div className="kpi-info">
            <span className="kpi-label">Canceladas</span>
            <span className="kpi-value">{stats?.citas_canceladas || 0}</span>
          </div>
        </div>
      </div>

      {/* Calendario Semanal y Ocupación */}
      <div className="dashboard-graficas">
        {/* Calendario Semanal de Horarios - Solo días laborables */}
        <div className="grafica-card calendario-card">
          <h3>📅 Calendario Semanal (Lunes a Viernes - 9:00 a 17:00)</h3>
          <div className="calendario-semanal">
            <div className="calendario-header">
              <div className="hora-columna">Hora</div>
              {diasLaborables.map(dia => (
                <div key={dia.fechaStr} className="dia-header">{dia.nombre}</div>
              ))}
            </div>
            <div className="calendario-cuerpo">
              {Array.from({ length: 9 }, (_, i) => i + 9).map(hora => (
                <div key={hora} className="fila-hora">
                  <div className="hora-label">{hora}:00</div>
                  {diasLaborables.map(dia => {
                    const ocupado = existeCita(dia.fechaStr, hora);
                    return (
                      <div 
                        key={`${dia.fechaStr}-${hora}`} 
                        className={`celda-horario ${ocupado ? 'ocupada' : 'disponible'}`}
                        title={ocupado ? `Ocupado - ${hora}:00` : `Disponible - ${hora}:00`}
                      >
                        {ocupado ? '❌' : '✅'}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="leyenda">
            <span><span className="disponible-badge">✅</span> Disponible</span>
            <span><span className="ocupada-badge">❌</span> Ocupada</span>
          </div>
        </div>

        {/* Gráfico de anillo para ocupación */}
        <div className="grafica-card">
          <h3>📊 Ocupación (Próximos 7 días laborables)</h3>
          <div className="porcentaje-container">
            <svg width="100%" height="auto" viewBox="0 0 60 60" style={{ maxWidth: '260px' }}>
                <circle cx="30" cy="30" r="26" fill="none" stroke="#2a2a30" strokeWidth="5" />
                <circle 
                    cx="30" 
                    cy="30" 
                    r="26" 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="5" 
                    strokeDasharray={`${stats?.porcentaje_ocupacion || 0} ${100 - (stats?.porcentaje_ocupacion || 0)}`}
                    strokeDashoffset="0"
                    transform="rotate(-90 30 30)"
                    strokeLinecap="round"
                />
                <text x="30" y="36" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold">
                    {stats?.porcentaje_ocupacion || 0}%
                </text>
                </svg>
            <div className="porcentaje-info">
              <span className="porcentaje-label">Ocupación</span>
              <span className="porcentaje-detalle">{stats?.citas_proximas || 0} de {stats?.total_slots || 0} slots ocupados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Próximas citas - Tabla */}
      <div className="dashboard-recientes">
        <h3>📋 Próximas Citas</h3>
        {citasProximas.length === 0 ? (
          <p className="no-citas">No hay citas próximas en los siguientes 7 días.</p>
        ) : (
          <div className="tabla-wrapper">
            <table className="tabla-citas">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Email</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {citasProximas.map((cita) => (
                  <tr key={cita.uid}>
                    <td className="paciente-nombre">{cita.cliente_nombre || 'No especificado'}</td>
                    <td>{cita.cliente_email || 'No especificado'}</td>
                    <td>{new Date(cita.start_time).toLocaleDateString('es-EC')}</td>
                    <td>{new Date(cita.start_time).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td><span className="status-confirmada">Confirmada</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="dashboard-footer">
        <p className="fecha-actual">Actualizado: {new Date(stats?.fecha_actual).toLocaleString('es-EC')}</p>
      </div>
    </div>
  );
}