import { useEffect, useState } from 'react';
import { guardarDatosWhatsApp, obtenerEmpresa, actualizarEmpresa } from '../services/empresas';
import { getEmpresaIdFromToken } from '../services/auth';
import '../styles/Configuracion.css';

export default function Configuracion() {
  const [empresaId, setEmpresaId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [empresa, setEmpresa] = useState(null);

  useEffect(() => {
    const id = getEmpresaIdFromToken();
    setEmpresaId(id);
  }, []);

  useEffect(() => {
    const verificarConexion = async () => {
      if (!empresaId) return;

      try {
        const data = await obtenerEmpresa(empresaId);
        setEmpresa(data);
        setIsConnected(data.whatsapp_connected || false);
      } catch (error) {
        console.error('Error al verificar conexión:', error);
      }
    };

    verificarConexion();
  }, [empresaId]);

  useEffect(() => {
    const handleMessage = async (event) => {
      if (!event.origin.includes('facebook.com')) return;

      try {
        const data = JSON.parse(event.data);

        if (data.type !== 'WA_EMBEDDED_SIGNUP') return;

        if (data.event === 'FINISH') {
          const { phone_number_id, waba_id, business_id } = data.data || {};

          console.log('Meta data:', { phone_number_id, waba_id, business_id });

          if (!empresaId || !phone_number_id || !waba_id) return;

          setLoading(true);

          try {
            const result = await guardarDatosWhatsApp(empresaId, {
              phone_number_id,
              waba_id,
              business_id
            });

            if (result.success) {
              setIsConnected(true);
              alert('WhatsApp conectado exitosamente');

              const updated = await obtenerEmpresa(empresaId);
              setEmpresa(updated);
            } else {
              alert('Error al conectar WhatsApp');
            }
          } catch (err) {
            console.error('Error backend:', err);
          } finally {
            setLoading(false);
          }
        }

        if (data.event === 'CANCEL') {
          console.warn('Signup cancelado:', data);
        }

        if (data.event === 'ERROR') {
          console.error('Error Meta:', data);
        }

      } catch (err) {
        console.log('Mensaje no JSON:', event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [empresaId]);

  const handleConnectWhatsApp = () => {
    setLoading(true);

    if (!window.FB) {
      alert('SDK de Facebook no cargado');
      setLoading(false);
      return;
    }

    window.FB.login(
      (response) => {
        console.log('Login response:', response);
        setLoading(false);
      },
      {
        config_id: process.env.REACT_APP_META_CONFIGURATION_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: { setup: {} }
      }
    );
  };

  const handleDisconnect = async () => {
    if (!empresaId) return;

    try {
      await actualizarEmpresa(empresaId, { whatsapp_connected: false });
      setIsConnected(false);
      alert('WhatsApp desconectado');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="configuracion-container">
      <h1 className="configuracion-titulo">Configuración</h1>
      <p className="configuracion-subtitulo">Gestiona la configuración de tu cuenta</p>

      <div className="configuracion-card">
        <h2 className="configuracion-card-titulo">WhatsApp Business</h2>

        <div className="whatsapp-connector">
          {isConnected ? (
            <>
              <div className="status connected">✅ Conectado</div>
              {empresa?.whatsapp_phone_number_id && (
                <div className="details">
                  Phone ID: {empresa.whatsapp_phone_number_id}
                </div>
              )}
              <button className="btn-disconnect" onClick={handleDisconnect}>
                Desconectar
              </button>
            </>
          ) : (
            <>
              <div className="status disconnected">⚠️ No conectado</div>
              <p>Conecta tu cuenta de WhatsApp Business para comenzar a recibir y enviar mensajes.</p>
              <button className="btn-connect" onClick={handleConnectWhatsApp} disabled={loading}>
                {loading ? 'Conectando...' : 'Conectar WhatsApp'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}