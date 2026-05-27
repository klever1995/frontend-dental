import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      transportOptions: {
        polling: {
          extraHeaders: {
            'ngrok-skip-browser-warning': 'true'
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

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinEmpresa = (empresaId) => {
    if (socket && isConnected) {
      socket.emit('join_empresa', empresaId);
      console.log(`📌 Unido a sala empresa_${empresaId}`);
    }
  };

  const onCitasActualizadas = (callback) => {
    if (socket) {
      socket.on('citas_actualizadas', callback);
      return () => {
        socket.off('citas_actualizadas', callback);
      };
    }
    return () => {};
  };

  return {
    socket,
    isConnected,
    joinEmpresa,
    onCitasActualizadas,
  };
};