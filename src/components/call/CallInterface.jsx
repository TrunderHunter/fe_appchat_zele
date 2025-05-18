import React, { useEffect, useRef, useState } from "react";
import { MdCallEnd, MdMic, MdMicOff, MdVideocam, MdVideocamOff, MdPhone } from "react-icons/md";
import { useStringee } from "../../context/StringeeContext";
import { toast } from "react-hot-toast";

const CallInterface = ({ onClose }) => {
  const { 
    currentCall, 
    callState, 
    localStream, 
    remoteStream, 
    answerCall, 
    hangupCall 
  } = useStringee();
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  
  // Attach streams to video elements
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
    
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);
  
  // Handle call state changes
  useEffect(() => {
    if (callState === 'answered') {
      toast.success("Cuộc gọi đã được kết nối");
    } else if (callState === 'ended') {
      toast.info("Cuộc gọi đã kết thúc");
      if (onClose) onClose();
    }
  }, [callState, onClose]);
  
  const handleAnswer = () => {
    answerCall();
  };
  
  const handleHangup = () => {
    hangupCall();
  };
  
  const toggleMute = () => {
    if (currentCall) {
      currentCall.mute(!isMuted);
      setIsMuted(!isMuted);
    }
  };
  
  const toggleVideo = () => {
    if (currentCall) {
      currentCall.enableVideo(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };
  
  // Determine if this is an incoming call that hasn't been answered yet
  const isIncomingCall = currentCall && callState === 'ringing' && currentCall.isIncomingCall;
  
  // Determine if this is a video call
  const isVideoCall = currentCall && currentCall.isVideoCall;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
      <div className="relative w-full max-w-2xl h-full max-h-[80vh] bg-base-300 rounded-lg overflow-hidden flex flex-col">
        {/* Video container */}
        <div className="flex-grow relative">
          {/* Remote video (full size) */}
          {isVideoCall && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Local video (small overlay) */}
          {isVideoCall && (
            <div className="absolute bottom-4 right-4 w-1/4 h-1/4 border-2 border-primary rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Audio-only call display */}
          {!isVideoCall && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="avatar placeholder">
                  <div className="bg-neutral-focus text-neutral-content rounded-full w-24">
                    <span className="text-3xl">
                      {currentCall?.fromAlias?.charAt(0) || "U"}
                    </span>
                  </div>
                </div>
                <h3 className="mt-4 text-xl font-semibold">
                  {currentCall?.fromAlias || "Unknown User"}
                </h3>
                <p className="text-base-content/70">
                  {callState === 'ringing' ? 'Đang gọi...' : 
                   callState === 'answered' ? 'Đang trong cuộc gọi' : 
                   'Kết thúc cuộc gọi'}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Call controls */}
        <div className="p-4 bg-base-100 flex items-center justify-center space-x-4">
          {isIncomingCall ? (
            <>
              {/* Incoming call controls */}
              <button 
                className="btn btn-circle btn-success"
                onClick={handleAnswer}
              >
                <MdPhone size={24} />
              </button>
              <button 
                className="btn btn-circle btn-error"
                onClick={handleHangup}
              >
                <MdCallEnd size={24} />
              </button>
            </>
          ) : (
            <>
              {/* Active call controls */}
              <button 
                className={`btn btn-circle ${isMuted ? 'btn-warning' : 'btn-ghost'}`}
                onClick={toggleMute}
              >
                {isMuted ? <MdMicOff size={24} /> : <MdMic size={24} />}
              </button>
              
              {isVideoCall && (
                <button 
                  className={`btn btn-circle ${!isVideoEnabled ? 'btn-warning' : 'btn-ghost'}`}
                  onClick={toggleVideo}
                >
                  {isVideoEnabled ? <MdVideocam size={24} /> : <MdVideocamOff size={24} />}
                </button>
              )}
              
              <button 
                className="btn btn-circle btn-error"
                onClick={handleHangup}
              >
                <MdCallEnd size={24} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallInterface;