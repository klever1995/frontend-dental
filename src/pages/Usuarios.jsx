import { useState, useEffect } from 'react';
import { obtenerUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from '../services/usuarios';
import { obtenerEspecialidades } from '../services/especialidades';
import '../styles/Usuarios.css';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('crear');
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'doctor',
    especialidad_id: null,
    activo: true
  });
  const [accionLoading, setAccionLoading] = useState(false);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [usuariosData, especialidadesData] = await Promise.all([
        obtenerUsuarios(),
        obtenerEspecialidades(1)
      ]);
      setUsuarios(usuariosData);
      setEspecialidades(especialidadesData);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirModal = (modo, usuario = null) => {
    setModalMode(modo);
    if (modo === 'editar' && usuario) {
      setSelectedId(usuario.id);
      setFormData({
        nombre: usuario.nombre,
        email: usuario.email,
        password: '',
        rol: usuario.rol,
        especialidad_id: usuario.especialidad_id || null,
        activo: usuario.activo
      });
    } else {
      setSelectedId(null);
      setFormData({
        nombre: '',
        email: '',
        password: '',
        rol: 'doctor',
        especialidad_id: null,
        activo: true
      });
    }
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setFormData({
      nombre: '',
      email: '',
      password: '',
      rol: 'doctor',
      especialidad_id: null,
      activo: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.email.trim()) {
      alert('Nombre y email son obligatorios');
      return;
    }
    if (modalMode === 'crear' && !formData.password) {
      alert('La contraseña es obligatoria para nuevos usuarios');
      return;
    }
    setAccionLoading(true);
    try {
      const dataEnviar = {
        empresa_id: 1,
        nombre: formData.nombre,
        email: formData.email,
        rol: formData.rol,
        especialidad_id: formData.especialidad_id || null,
        activo: formData.activo
      };
      if (modalMode === 'crear') {
        dataEnviar.password = formData.password;
        await crearUsuario(dataEnviar);
        alert('Usuario creado exitosamente');
      } else {
        if (formData.password) dataEnviar.password = formData.password;
        await actualizarUsuario(selectedId, dataEnviar);
        alert('Usuario actualizado exitosamente');
      }
      cerrarModal();
      cargarDatos();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setAccionLoading(false);
    }
  };

  const toggleActivo = async (usuario) => {
    try {
      await actualizarUsuario(usuario.id, { activo: !usuario.activo });
      cargarDatos();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleEliminar = async (usuario) => {
    if (!window.confirm(`¿Eliminar al usuario "${usuario.nombre}"?`)) return;
    try {
      await eliminarUsuario(usuario.id);
      cargarDatos();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) {
    return <div className="usuarios-container"><div className="loading">Cargando usuarios...</div></div>;
  }

  if (error) {
    return (
      <div className="usuarios-container">
        <div className="error-message">Error: {error}</div>
        <button onClick={cargarDatos} className="retry-btn">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <h1>Gestión de Usuarios</h1>
        <button className="btn-crear" onClick={() => abrirModal('crear')}>
          + Nuevo Usuario
        </button>
      </div>

      <div className="usuarios-table-wrapper">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Especialidad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.nombre}</td>
                <td>{user.email}</td>
                <td>{user.rol === 'admin' ? 'Administrador' : user.rol === 'doctor' ? 'Doctor' : 'Recepcionista'}</td>
                <td>
                  {user.especialidad_id 
                    ? especialidades.find(e => e.id === user.especialidad_id)?.nombre || '—'
                    : '—'}
                </td>
                <td>
                  <span className={`estado-badge ${user.activo ? 'activo' : 'inactivo'}`}>
                    {user.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="acciones">
                  <button className="btn-editar" onClick={() => abrirModal('editar', user)}>✏️ Editar</button>
                  <button className="btn-toggle" onClick={() => toggleActivo(user)}>
                    {user.activo ? '🔴 Desactivar' : '🟢 Activar'}
                  </button>
                  <button className="btn-eliminar" onClick={() => handleEliminar(user)}>🗑️ Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal usuarios-modal">
            <h2>{modalMode === 'crear' ? 'Nuevo Usuario' : 'Editar Usuario'}</h2>
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
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>{modalMode === 'crear' ? 'Contraseña *' : 'Contraseña (dejar vacío para no cambiar)'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={modalMode === 'crear'}
                />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                >
                  <option value="admin">Administrador</option>
                  <option value="doctor">Doctor</option>
                  <option value="recepcionista">Recepcionista</option>
                </select>
              </div>
              <div className="form-group">
                <label>Especialidad (solo para doctores)</label>
                <select
                  value={formData.especialidad_id || ''}
                  onChange={(e) => setFormData({ ...formData, especialidad_id: e.target.value ? parseInt(e.target.value) : null })}
                  disabled={formData.rol !== 'doctor'}
                >
                  <option value="">Sin especialidad</option>
                  {especialidades.map(esp => (
                    <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  />
                  Usuario activo
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