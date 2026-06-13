import { useEffect, useState } from 'react';
import { guardarDatosWhatsApp, obtenerEmpresa, actualizarEmpresa } from '../services/empresas';
import { getEmpresaIdFromToken } from '../services/auth';
import '../styles/Configuracion.css';

export default function Configuracion() {
  const [empresaId, setEmpresaId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [empresa, setEmpresa] = useState(null);

  // 1. Obtener ID de la empresa desde el token
  useEffect(() => {
    const id = getEmpresaIdFromToken();
    setEmpresaId(id);
  }, []);

  // 2. Cargar e inicializar el SDK de Facebook (adaptado del código funcional de GitHub)
  useEffect(() => {
    if (window.FB) return;

    window.fbAsyncInit = function() {
      window.FB.init({
        appId: process.env.REACT_APP_META_APP_ID,
        cookie: true,
        xfbml: false,
        version: 'v25.0'
      });
      console.log("Facebook SDK initialized");
    };

    const loadSDK = () => {
      if (document.getElementById("facebook-jssdk")) return;
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      document.body.appendChild(script);
    };

    loadSDK();
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

  // 4. Escuchar la respuesta interactiva del modal de Meta (Embedded Signup)
  useEffect(() => {
    const handleMessage = async (event) => {
      if (!event.origin.includes('facebook.com') && !event.origin.includes('meta.com')) return;

      try {
        const rawData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (rawData.type !== 'WA_EMBEDDED_SIGNUP') return;

        if (rawData.event && rawData.event.startsWith('FINISH')) {
          const { phone_number_id, waba_id, business_id } = rawData.data || {};
          console.log('IDs capturados del evento message:', { phone_number_id, waba_id, business_id });

          // Guardar temporalmente estos IDs para usarlos después del callback
          window.tempMetaAssets = { phone_number_id, waba_id, business_id };
        }

        if (rawData.event === 'CANCEL') {
          console.warn('Usuario canceló el flujo');
          setLoading(false);
        }

        if (rawData.event === 'ERROR') {
          console.error('Error en Meta:', rawData.data?.error_message);
          setLoading(false);
        }
      } catch (err) {
        // Ignorar mensajes no relacionados
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 5. Función adaptada del código de GitHub para lanzar el signup y procesar el código
  const launchWhatsAppSignup = () => {
    if (!window.FB) {
      alert("Facebook SDK no cargado aún. Intenta de nuevo.");
      return;
    }

    setLoading(true);
    window.tempMetaAssets = null;

    const fbLoginCallback = async (response) => {
      if (response.authResponse && response.authResponse.code) {
        const authCode = response.authResponse.code;
        console.log("Código de autorización obtenido:", authCode);

        // Esperar un momento a que llegue el evento message con los IDs
        setTimeout(async () => {
          const assets = window.tempMetaAssets;
          
          if (!assets || !assets.phone_number_id || !assets.waba_id) {
            alert('No se pudieron recuperar los IDs de WhatsApp. Por favor, intenta de nuevo.');
            setLoading(false);
            return;
          }

          try {
            const result = await guardarDatosWhatsApp(empresaId, {
              phone_number_id: assets.phone_number_id,
              waba_id: assets.waba_id,
              business_id: assets.business_id,
              code: authCode
            });

            if (result.success) {
              setIsConnected(true);
              alert('WhatsApp Business conectado exitosamente');
              const updated = await obtenerEmpresa(empresaId);
              setEmpresa(updated);
            } else {
              alert('Error al conectar: ' + (result.message || 'Error desconocido'));
            }
          } catch (err) {
            console.error('Error en backend:', err);
            alert('Error al comunicarse con el servidor');
          } finally {
            setLoading(false);
          }
        }, 1000);
      } else {
        console.warn('Login cancelado o sin código');
        setLoading(false);
      }
    };

    window.FB.login(fbLoginCallback, {
      config_id: process.env.REACT_APP_META_CONFIGURATION_ID,
      response_type: "code",
      override_default_response_type: true,
      extras: { version: "v4" }
    });
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
      alert('Error al desconectar');
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
              <button className="btn-connect" onClick={launchWhatsAppSignup} disabled={loading}>
                {loading ? 'Abriendo asistente...' : 'Conectar con Meta'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}