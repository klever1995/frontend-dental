import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';// 🔥 Cambia el puerto

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Conectar al servidor Socket.IO con header para ngrok
    const socketInstance = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      transportOptions: {
        polling: {
          extraHeaders: {
            'ngrok-skip-browser-warning': 'true'  // 🔥 Necesario para ngrok
          }
        }
      }
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Conectado al WebSocket');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Desconectado del WebSocket');
      setIsConnected(false);
    });

    socketInstance.on('conexion_exitosa', (data) => {
      console.log('✅', data.message);
    });

    setSocket(socketInstance);

    // Limpiar al desmontar
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Función para unirse a una sala específica por empresa
  const joinEmpresa = (empresaId) => {
    if (socket && isConnected) {
      socket.emit('join_empresa', empresaId);
      console.log(`📌 Unido a sala empresa_${empresaId}`);
    }
  };

  // 🔥 NUEVO: Suscribirse al evento cita_actualizada
  const onCitaActualizada = (callback) => {
    if (socket) {
      socket.on('cita_actualizada', callback);
      return () => {
        socket.off('cita_actualizada', callback);
      };
    }
    return () => {};
  };

  return {
    socket,
    isConnected,
    joinEmpresa,
    onCitaActualizada,  // 🔥 Cambiado de onNuevaVenta
  };
};