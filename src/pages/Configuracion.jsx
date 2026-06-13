import { useEffect, useState } from 'react';
import { guardarDatosWhatsApp, obtenerEmpresa, actualizarEmpresa } from '../services/empresas';
import { getEmpresaIdFromToken } from '../services/auth';
import '../styles/Configuracion.css';

export default function Configuracion() {
  const [empresaId, setEmpresaId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [empresa, setEmpresa] = useState(null);
  
  // Estado temporal para guardar los IDs que intercepta el listener de mensajes de Meta
  const [metaAssets, setMetaAssets] = useState(null);

  // 1. Obtener ID de la empresa aliada/dentista
  useEffect(() => {
    const id = getEmpresaIdFromToken();
    setMetaAssets(null); 
    setEmpresaId(id);
  }, []);

  // 2. Cargar e Inicializar el SDK de Facebook en caliente
  useEffect(() => {
    window.fbAsyncInit = function() {
      window.FB.init({
        appId      : process.env.REACT_APP_META_APP_ID, 
        cookie     : true,
        xfbml      : true,
        version    : 'v25.0' // 🔴 Forzamos la v25.0 como exige el estándar Embedded Signup v4
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
      if (!event.origin.endsWith('facebook.com') && !event.origin.endsWith('meta.com')) return;

      try {
        const rawData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (rawData.type !== 'WA_EMBEDDED_SIGNUP') return;

        // Si el flujo termina con éxito, capturamos los identificadores comerciales de la ventana
        if (rawData.event && rawData.event.startsWith('FINISH')) {
          const { phone_number_id, waba_id, business_id } = rawData.data || {};
          console.log('1. [Message Event] IDs de activos capturados:', { phone_number_id, waba_id, business_id });

          setMetaAssets({ phone_number_id, waba_id, business_id });
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
        // Ignorar mensajes ajenos a la estructura de Meta
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [empresaId]);

  // 5. Lanzar el modal flotante de Meta y despachar todo al Backend de FastAPI
  const handleConnectWhatsApp = () => {
    if (!window.FB) {
      alert('El SDK de Facebook aún se está cargando. Inténtalo de nuevo en un segundo.');
      return;
    }

    setLoading(true);
    setMetaAssets(null); // Reseteamos capturas previas por seguridad

    window.FB.login(
      (response) => {
        if (response.authResponse && response.authResponse.code) {
          const authCode = response.authResponse.code;
          console.log('2. [Callback OAuth] Código de autorización obtenido:', authCode);

          // Pausa controlada para esperar a que el hook del evento 'message' actualice el estado
          setTimeout(async () => {
            if (!metaAssets || !metaAssets.phone_number_id || !metaAssets.waba_id) {
              alert('No se pudieron recuperar los IDs de activos comerciales de Meta. Por favor, intenta de nuevo.');
              setLoading(false);
              return;
            }

            try {
              console.log('3. [Despacho] Enviando todo unificado a tu endpoint...');
              
              // 🔴 MANDAMOS EL JSON COMPLETO: IDs + Código temporal de 30 segundos
              const result = await guardarDatosWhatsApp(empresaId, {
                phone_number_id: metaAssets.phone_number_id,
                waba_id: metaAssets.waba_id,
                business_id: metaAssets.business_id,
                code: authCode 
              });

              if (result.success) {
                setIsConnected(true);
                alert('¡WhatsApp Business vinculado con éxito!');
                const updated = await obtenerEmpresa(empresaId);
                setEmpresa(updated);
              } else {
                alert('El backend rechazó la vinculación: ' + (result.message || 'Error desconocido'));
              }
            } catch (err) {
              console.error('Error al comunicarse con el backend:', err);
              alert('Error crítico de red al conectar con el servidor dental.');
            } finally {
              setLoading(false);
            }
          }, 800);

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