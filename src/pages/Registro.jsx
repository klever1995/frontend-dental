import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { crearEmpresa } from '../services/empresas';
import '../styles/Registro.css';

const Registro = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre_empresa: '',
    email: '',
    password: '',
    confirm_password: '',
    telefono_whatsapp: '',
    telefono_dueño: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validaciones
    if (formData.password !== formData.confirm_password) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. Crear la empresa
      const empresaData = {
        nombre: formData.nombre_empresa,
        telefono_whatsapp: formData.telefono_whatsapp,
        prompt_personalizado: null,
        telefono_dueño: formData.telefono_dueño,
        activa: true
      };
      
      const nuevaEmpresa = await crearEmpresa(empresaData);
      console.log('Empresa creada:', nuevaEmpresa);
      
      // 2. Crear el usuario administrador asociado a la empresa
      const usuarioData = {
        email: formData.email,
        password: formData.password,
        nombre: 'Administrador',
        rol: 'admin',
        empresa_id: nuevaEmpresa.id,
        especialidad_id: null
      };
      
      // Aquí llamas a tu endpoint de registro de usuario (crearUsuario)
      // Asumiendo que tienes una función crearUsuario en servicios/usuarios.js
      const { crearUsuario } = await import('../services/usuarios');
      await crearUsuario(usuarioData);
      
      alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
      navigate('/login');
      
    } catch (err) {
      console.error('Error en registro:', err);
      setError(err.message || 'Error al registrar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registro-container">
      <div className="registro-card">
        <h2>Crear tu cuenta</h2>
        <p>Registra tu empresa y comienza a usar el sistema</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre de la empresa *</label>
            <input
              type="text"
              name="nombre_empresa"
              value={formData.nombre_empresa}
              onChange={handleChange}
              required
              placeholder="Ej: Clínica Dental Sonrisa"
            />
          </div>
          
          <div className="form-group">
            <label>Email del administrador *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="admin@tuempresa.com"
            />
          </div>
          
          <div className="form-group">
            <label>Contraseña *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          
          <div className="form-group">
            <label>Confirmar contraseña *</label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Número de WhatsApp (ej: 593999999999)</label>
            <input
              type="tel"
              name="telefono_whatsapp"
              value={formData.telefono_whatsapp}
              onChange={handleChange}
              placeholder="Código país + número"
            />
          </div>
          
          <div className="form-group">
            <label>Teléfono del dueño (opcional)</label>
            <input
              type="tel"
              name="telefono_dueño"
              value={formData.telefono_dueño}
              onChange={handleChange}
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar empresa'}
          </button>
        </form>
        
        <p className="login-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default Registro;