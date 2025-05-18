import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useStringee } from "../../context/StringeeContext";
import CallInterface from "./CallInterface";

const CallModal = () => {
  const { currentCall } = useStringee();
  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    if (currentCall) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [currentCall]);
  
  const handleClose = () => {
    setShowModal(false);
  };
  
  if (!showModal) return null;
  
  return createPortal(
    <CallInterface onClose={handleClose} />,
    document.body
  );
};

export default CallModal;