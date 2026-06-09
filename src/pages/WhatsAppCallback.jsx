import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { conectarWhatsApp } from '../services/empresas';
import { getEmpresaIdFromToken } from '../services/auth';

export default function WhatsAppCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const empresaId = getEmpresaIdFromToken();
    if (code && empresaId) {
      conectarWhatsApp(empresaId, code)
        .then(() => {
          alert('✅ WhatsApp conectado exitosamente');
          navigate('/configuracion');
        })
        .catch(err => {
          alert(`Error: ${err.message}`);
          navigate('/configuracion');
        });
    } else {
      alert('No se recibió el código de autorización');
      navigate('/configuracion');
    }
  }, [searchParams, navigate]);

  return <div style={{ textAlign: 'center', marginTop: '50px' }}>Procesando conexión con WhatsApp...</div>;
}