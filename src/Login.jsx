import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from './services/auth';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login({ username: email, password });
      navigate('/principal');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* IZQUIERDA - BRANDING */}
      <div className="login-branding">
        {/* Watermark como imagen en lugar de CSS */}
        <img src="/Logo-Letra.png" alt="" className="login-branding__watermark" />
        
        <div className="login-branding__content">
          <img src="/Logo.png" alt="Aurelia" className="login-branding__logo" />
          <p className="login-branding__subtitle">
            Gestiona tus citas de manera inteligente: agenda, reagenda o cancela en segundos con nuestro asistente virtual disponible 24/7 para tu negocio.
          </p>
        </div>

        <div className="login-branding__orb login-branding__orb--1" />
        <div className="login-branding__orb login-branding__orb--2" />
      </div>

      {/* DERECHA - FORMULARIO */}
      <div className="login-form-side">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form__header">
            <h2>Iniciar Sesión</h2>
            <p>Ingresa tus credenciales</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <div className="login-form__field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="correo@ejemplo.com"
              disabled={loading}
            />
          </div>

          <div className="login-form__field">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Iniciando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;