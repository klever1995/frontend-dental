import { useState, useEffect } from 'react';
import { obtenerEspecialidades, crearEspecialidad, actualizarEspecialidad, eliminarEspecialidad } from '../services/especialidades';
import { getEmpresaIdFromToken } from '../services/auth';
import '../styles/Especialidades.css';

export default function Especialidades() {
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('crear');
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', activa: true });
  const [accionLoading, setAccionLoading] = useState(false);

  const empresaId = getEmpresaIdFromToken();

  const cargarEspecialidades = async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      const data = await obtenerEspecialidades(empresaId);
      setEspecialidades(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEspecialidades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  const abrirModal = (modo, item = null) => {
    setModalMode(modo);
    if (modo === 'editar' && item) {
      setSelectedId(item.id);
      setFormData({ nombre: item.nombre, descripcion: item.descripcion || '', activa: item.activa });
    } else {
      setSelectedId(null);
      setFormData({ nombre: '', descripcion: '', activa: true });
    }
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setFormData({ nombre: '', descripcion: '', activa: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    setAccionLoading(true);
    try {
      if (modalMode === 'crear') {
        await crearEspecialidad({ empresa_id: empresaId, nombre: formData.nombre, descripcion: formData.descripcion, activa: formData.activa });
        alert('Especialidad creada exitosamente');
      } else {
        await actualizarEspecialidad(selectedId, { nombre: formData.nombre, descripcion: formData.descripcion, activa: formData.activa });
        alert('Especialidad actualizada exitosamente');
      }
      cerrarModal();
      cargarEspecialidades();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setAccionLoading(false);
    }
  };

  const toggleActiva = async (item) => {
    try {
      await actualizarEspecialidad(item.id, { activa: !item.activa });
      cargarEspecialidades();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleEliminar = async (item) => {
    if (!window.confirm(`¿Eliminar la especialidad "${item.nombre}"? Se eliminará también el calendario asociado.`)) return;
    try {
      await eliminarEspecialidad(item.id);
      cargarEspecialidades();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) {
    return <div className="especialidades-container"><div className="loading">Cargando especialidades...</div></div>;
  }

  if (error) {
    return (
      <div className="especialidades-container">
        <div className="error-message">Error: {error}</div>
        <button onClick={cargarEspecialidades} className="retry-btn">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="especialidades-container">
      <div className="especialidades-header">
        <h1>Gestión de Especialidades</h1>
        <button className="btn-crear" onClick={() => abrirModal('crear')}>
          + Nueva Especialidad
        </button>
      </div>

      <div className="especialidades-table-wrapper">
        <table className="especialidades-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {especialidades.map(esp => (
              <tr key={esp.id}>
                <td>{esp.id}</td>
                <td>{esp.nombre}</td>
                <td>{esp.descripcion || '—'}</td>
                <td>
                  <span className={`estado-badge ${esp.activa ? 'activa' : 'inactiva'}`}>
                    {esp.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="acciones">
                  <button className="btn-editar" onClick={() => abrirModal('editar', esp)}>✏️ Editar</button>
                  <button className="btn-toggle" onClick={() => toggleActiva(esp)}>
                    {esp.activa ? '🔴 Desactivar' : '🟢 Activar'}
                  </button>
                  <button className="btn-eliminar" onClick={() => handleEliminar(esp)}>🗑️ Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal especialidades-modal">
            <h2>{modalMode === 'crear' ? 'Nueva Especialidad' : 'Editar Especialidad'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows="3"
                  placeholder="Descripción de la especialidad (opcional)"
                />
              </div>
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.activa}
                    onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                  />
                  Especialidad activa
                </label>
              </div>
              <div className="modal-buttons">
                <button type="submit" disabled={accionLoading}>
                  {accionLoading ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={cerrarModal} disabled={accionLoading}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}