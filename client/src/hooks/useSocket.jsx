
import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const useSocket = (serverPath = 'http://ecomaravillas.duckdns.org:3001') => {
  const socket = useRef(null);

  useEffect(() => {
    socket.current = io(serverPath);

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [serverPath]);

  const emit = (event, data) => {
    if (socket.current) {
      socket.current.emit(event, data);
    }
  };

  const on = (event, callback) => {
    if (socket.current) {
      socket.current.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socket.current) {
      socket.current.off(event, callback);
    }
  };

  return { emit, on, off };
};

export default useSocket;
