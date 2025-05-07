import React, { createContext, useContext, useState } from "react";

// Tạo context
const ModalContext = createContext();

// Custom hook để sử dụng context
export const useModalContext = () => useContext(ModalContext);

// Provider component
export const ModalProvider = ({ children }) => {
  // State cho các loại modal khác nhau
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Duration cho animation (ms)
  const animationDuration = 300;

  // Giá trị context
  const value = {
    // Animation helpers
    animationDuration,

    // Profile modal
    isProfileModalOpen,
    openProfileModal: () => setIsProfileModalOpen(true),
    closeProfileModal: () => setIsProfileModalOpen(false),

    // Có thể thêm các modal khác ở đây trong tương lai
  };

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
};

export default ModalContext;
