import { useEffect, useState } from 'react';
import { guardarDatosWhatsApp, obtenerEmpresa, actualizarEmpresa } from '../services/empresas';
import { getEmpresaIdFromToken } from '../services/auth';
import '../styles/Configuracion.css';

export default function Configuracion() {
  const [empresaId, setEmpresaId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [empresa, setEmpresa] = useState(null);

  // 1. Obtener ID de la empresa aliada/dentista
  useEffect(() => {
    const id = getEmpresaIdFromToken();
    setEmpresaId(id);
  }, []);

  // 2. Cargar e Inicializar el SDK de Facebook en caliente
  useEffect(() => {
    window.fbAsyncInit = function() {
      window.FB.init({
        appId      : process.env.REACT_APP_META_APP_ID, 
        cookie     : true,
        xfbml      : true,
        version    : 'v19.0' 
      });
    };

    // Cargar el script de forma asíncrona si no existe
    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = "https://connect.facebook.net/es_LA/sdk.js";
      document.body.appendChild(js);
    }
  }, []);

  // 3. Verificar estado actual de la empresa
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

  // 4. Escuchar la respuesta interactiva del modal de Meta (Embedded Signup v4)
  useEffect(() => {
    const handleMessage = async (event) => {
      // Validar estrictamente que venga de dominios de confianza de Meta
      if (!event.origin.endsWith('facebook.com') && !event.origin.endsWith('meta.com')) return;

      try {
        // A veces Meta envía objetos directos y a veces strings JSON
        const rawData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (rawData.type !== 'WA_EMBEDDED_SIGNUP') return;

        // Ajuste Estándar v4: Detecta cualquier variante de éxito (FINISH, FINISH_ONLY_WABA, etc.)
        if (rawData.event && rawData.event.startsWith('FINISH')) {
          // Meta expone estos campos exactos al finalizar con éxito
          const { phone_number_id, waba_id, business_id } = rawData.data || {};
          console.log('Datos capturados de Meta (v4):', { phone_number_id, waba_id, business_id });

          if (!empresaId || !phone_number_id || !waba_id) {
            alert('Faltan parámetros críticos del registro.');
            return;
          }

          setLoading(true);
          try {
            // Mandamos los IDs comerciales directito a tu FastAPI
            const result = await guardarDatosWhatsApp(empresaId, {
              phone_number_id,
              waba_id,
              business_id
            });

            if (result.success) {
              setIsConnected(true);
              alert('¡WhatsApp Business vinculado con éxito!');
              const updated = await obtenerEmpresa(empresaId);
              setEmpresa(updated);
            } else {
              alert('El backend rechazó la vinculación.');
            }
          } catch (err) {
            console.error('Error al comunicarse con el backend:', err);
          } finally {
            setLoading(false);
          }
        }

        if (rawData.event === 'CANCEL') {
          console.warn('El usuario cerró o abandonó el asistente en el paso:', rawData.data?.current_step || 'Desconocido');
          setLoading(false);
        }

        if (rawData.event === 'ERROR') {
          console.error('Ocurrió un error en el asistente de Meta:', rawData.data?.error_message || rawData.error);
          setLoading(false);
        }
      } catch (err) {
        // Ignorar mensajes internos que no correspondan a nuestro flujo estructurado
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [empresaId]);

  // 5. Lanzar el modal flotante de Meta
  const handleConnectWhatsApp = () => {
    if (!window.FB) {
      alert('El SDK de Facebook aún se está cargando. Inténtalo de nuevo en un segundo.');
      return;
    }

    setLoading(true);

    window.FB.login(
      (response) => {
        if (response.authResponse) {
          console.log('Sesión iniciada con éxito en OAuth. Código devuelto:', response.authResponse.code);
        } else {
          console.warn('Inicio de sesión cancelado o ventana cerrada prematuramente.');
          setLoading(false);
        }
      },
      {
        config_id: process.env.REACT_APP_META_CONFIGURATION_ID, 
        response_type: 'code',
        override_default_response_type: true,
        extras: { setup: {} }
      }
    );
  };

  // 6. Desconectar la integración
  const handleDisconnect = async () => {
    if (!empresaId) return;
    if (!window.confirm('¿Estás seguro de que deseas desconectar WhatsApp?')) return;

    try {
      await actualizarEmpresa(empresaId, { whatsapp_connected: false });
      setIsConnected(false);
      setEmpresa(prev => ({ ...prev, whatsapp_connected: false }));
      alert('WhatsApp desvinculado correctamente.');
    } catch (error) {
      console.error('Error al desconectar:', error);
    }
  };

  return (
    <div className="configuracion-container">
      <h1 className="configuracion-titulo">Configuración</h1>
      <p className="configuracion-subtitulo">Gestiona la configuración de tu cuenta médica</p>

      <div className="configuracion-card">
        <h2 className="configuracion-card-titulo">WhatsApp Business</h2>

        <div className="whatsapp-connector">
          {isConnected ? (
            <>
              <div className="status connected">✅ Conectado Correctamente</div>
              {(empresa?.whatsapp_phone_number_id || empresa?.phone_number_id) && (
                <div className="details">
                  <strong>ID de Teléfono activo:</strong> {empresa.whatsapp_phone_number_id || empresa.phone_number_id}
                </div>
              )}
              <button className="btn-disconnect" onClick={handleDisconnect}>
                Desconectar Canal
              </button>
            </>
          ) : (
            <>
              <div className="status disconnected">⚠️ No configurado</div>
              <p>Vincula la línea de WhatsApp de tu consultorio dental para automatizar los recordatorios de citas.</p>
              <button className="btn-connect" onClick={handleConnectWhatsApp} disabled={loading}>
                {loading ? 'Abriendo asistente...' : 'Conectar con Meta'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}