import { useState, useEffect, useCallback } from 'react';
import { obtenerEstadisticasDashboard, obtenerCitas, obtenerEspecialidades } from '../services/calcom';
import { getRolFromToken } from '../services/auth';
import { useSocket } from '../hooks/useSocket';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [citasProximas, setCitasProximas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [especialidadesList, setEspecialidadesList] = useState([]);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState(null);
  
  const userRol = getRolFromToken();
  const isDoctor = userRol === 'doctor';
  const isAdmin = userRol === 'admin';
  
  const { isConnected, joinEmpresa, onCitasActualizadas } = useSocket(); // 🔥 CAMBIADO: onCitaActualizada -> onCitasActualizadas

  const obtenerLunesDeSemana = (offset) => {
    const hoy = new Date();
    const diaActual = hoy.getDay();
    const diasHastaLunes = (diaActual === 0 ? 6 : diaActual - 1);
    const lunesActual = new Date(hoy);
    lunesActual.setDate(hoy.getDate() - diasHastaLunes);
    lunesActual.setHours(0, 0, 0, 0);
    const lunesObjetivo = new Date(lunesActual);
    lunesObjetivo.setDate(lunesActual.getDate() + (offset * 7));
    return lunesObjetivo;
  };

  const fechaReferencia = obtenerLunesDeSemana(semanaOffset).toISOString().split('T')[0];

  const recargarDatos = useCallback(async () => {
    if (isAdmin && !especialidadSeleccionada) return;
    try {
      const [estadisticas, todasCitas] = await Promise.all([
        obtenerEstadisticasDashboard(especialidadSeleccionada, fechaReferencia),
        obtenerCitas(especialidadSeleccionada)
      ]);
      setStats(estadisticas);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const dentro7Dias = new Date();
      dentro7Dias.setDate(hoy.getDate() + 7);
      dentro7Dias.setHours(23, 59, 59, 999);
      const proximas = todasCitas
        .filter(cita => {
          const fechaCita = new Date(cita.start_time);
          return cita.status === 'confirmed' && fechaCita >= hoy && fechaCita <= dentro7Dias;
        })
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
      setCitasProximas(proximas);
      setError('');
    } catch (err) {
      console.error(err);
    }
  }, [especialidadSeleccionada, fechaReferencia, isAdmin]);

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

  // Recargar datos cuando cambia la especialidad o la semana
  useEffect(() => {
    if (!isAdmin || especialidadSeleccionada) {
      setLoading(true);
      recargarDatos().finally(() => setLoading(false));
    }
  }, [recargarDatos, especialidadSeleccionada, semanaOffset, isAdmin]);

  useEffect(() => {
    const empresaId = 1;
    if (isConnected) joinEmpresa(empresaId);
  }, [isConnected, joinEmpresa]);

  // 🔥 CAMBIADO: onCitaActualizada -> onCitasActualizadas
  useEffect(() => {
    const unsubscribe = onCitasActualizadas(() => recargarDatos());
    return unsubscribe;
  }, [onCitasActualizadas, recargarDatos]);

  const irSiguienteSemana = () => setSemanaOffset(prev => prev + 1);
  const irSemanaActual = () => setSemanaOffset(0);
  const esSemanaActual = semanaOffset === 0;

  const obtenerRangoSemana = () => {
    const lunes = obtenerLunesDeSemana(semanaOffset);
    const viernes = new Date(lunes);
    viernes.setDate(lunes.getDate() + 4);
    const inicio = lunes.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const fin = viernes.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    return `${inicio} - ${fin}`;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
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
        <div className="dashboard-error">
          <p>Error: {error}</p>
          <button onClick={() => recargarDatos()} className="retry-btn">Reintentar</button>
        </div>
      </div>
    );
  }

  const lunesSemana = obtenerLunesDeSemana(semanaOffset);
  const diasLaborables = [];
  for (let i = 0; i < 5; i++) {
    const fecha = new Date(lunesSemana);
    fecha.setDate(lunesSemana.getDate() + i);
    diasLaborables.push({
      fecha: fecha,
      fechaStr: fecha.toISOString().split('T')[0],
      nombre: fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
    });
  }

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        {isAdmin && especialidadesList.length > 0 && (
          <div className="dashboard-filtro-especialidad">
            <label htmlFor="especialidad-select">Filtrar por especialidad:</label>
            <select
              id="especialidad-select"
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

      <div className="dashboard-graficas">
        <div className="grafica-card calendario-card">
          <div className="calendario-header-nav">
            <div className="nav-buttons">
              <button className="nav-semana-btn" onClick={irSemanaActual} disabled={esSemanaActual}>
                📍 Semana Actual
              </button>
              <button className="nav-semana-btn" onClick={irSiguienteSemana}>
                Semana Siguiente →
              </button>
            </div>
            <div className="rango-semana">
              <span className="rango-label">Semana: {obtenerRangoSemana()}</span>
            </div>
          </div>
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

        <div className="grafica-card">
          <h3>📋 Próximas Citas</h3>
          {citasProximas.length === 0 ? (
            <p className="no-citas">No hay citas próximas en los siguientes 7 días.</p>
          ) : (
            <div className="lista-proximas-citas">
              {citasProximas.slice(0, 5).map((cita) => (
                <div key={cita.uid || cita.booking_id} className="cita-item">
                  <div className="cita-info">
                    <strong>{cita.cliente_nombre || 'Paciente'}</strong>
                    <span>{new Date(cita.start_time).toLocaleDateString('es-EC')} - {new Date(cita.start_time).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</span>
                    {cita.notas && <span className="cita-notas">{cita.notas.length > 60 ? cita.notas.substring(0, 60) + '…' : cita.notas}</span>}
                    {isDoctor && cita.especialidad && <span className="cita-especialidad">🩺 {cita.especialidad}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-footer">
        <p className="fecha-actual">Actualizado: {new Date(stats?.fecha_actual).toLocaleString('es-EC')}</p>
      </div>
    </div>
  );
}