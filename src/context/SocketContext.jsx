import React, { createContext, useState, useEffect, useContext } from "react";
import useAuthStore from "../stores/authStore";
import useFriendRequestSocket from "../hooks/useFriendRequestSocket";
import socketManager from "../services/SocketManager";

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(
    socketManager.isSocketConnected()
  );
  const { user, isAuthenticated } = useAuthStore();

  // Theo dõi trạng thái kết nối socket thông qua SocketManager
  useEffect(() => {
    // Đăng ký listener cho trạng thái kết nối
    const unsubscribe = socketManager.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    // Cleanup khi component unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []); // Chỉ chạy một lần khi mount

  // Truyền socket vào hook xử lý friend request
  const socket = socketManager.getSocket();
  useFriendRequestSocket(socket);

  const value = {
    socket,
    isConnected,
    // Thêm các phương thức tiện ích
    reconnect: () => {
      if (isAuthenticated && user?._id) {
        return socketManager.initialize(user._id);
      }
      return null;
    },
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
