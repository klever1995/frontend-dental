import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmpresaNombreFromToken, logout } from './services/auth';
import Dashboard from './pages/Dashboard';
import Citas from './pages/Citas';
import Clientes from './pages/Clientes';
import Configuracion from './pages/Configuracion';
import './Principal.css';

export default function Principal() {
  const [seccionActual, setSeccionActual] = useState('dashboard');
  const navigate = useNavigate();
  const empresaNombre = getEmpresaNombreFromToken() || 'Clínica Dental';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderSeccion = () => {
    switch (seccionActual) {
      case 'dashboard':
        return <Dashboard />;
      case 'citas':
        return <Citas />;
      case 'clientes':
        return <Clientes />;
      case 'configuracion':
        return <Configuracion />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="principal-container">
      <header className="principal-header">
        <div className="principal-logo">
          <span>🦷 {empresaNombre}</span>
        </div>

        <nav className="principal-nav">
          <button
            onClick={() => setSeccionActual('dashboard')}
            className={`principal-nav-btn ${seccionActual === 'dashboard' ? 'active' : ''}`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setSeccionActual('citas')}
            className={`principal-nav-btn ${seccionActual === 'citas' ? 'active' : ''}`}
          >
            📅 Citas
          </button>
          <button
            onClick={() => setSeccionActual('clientes')}
            className={`principal-nav-btn ${seccionActual === 'clientes' ? 'active' : ''}`}
          >
            👥 Clientes
          </button>
          <button
            onClick={() => setSeccionActual('configuracion')}
            className={`principal-nav-btn ${seccionActual === 'configuracion' ? 'active' : ''}`}
          >
            ⚙️ Configuración
          </button>
        </nav>

        <div className="principal-header-right">
          <button className="principal-logout-btn" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="principal-content">
        {renderSeccion()}
      </main>
    </div>
  );
}