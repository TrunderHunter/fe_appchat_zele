import React, { createContext, useContext, useState, useEffect } from "react";
import useAuthStore from "../stores/authStore";
import api from "../utils/apiClient";

// Create context
const StringeeContext = createContext(null);

// Context provider component
export const StringeeProvider = ({ children }) => {
  const { user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [callState, setCallState] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [stringeeClient, setStringeeClient] = useState(null);
  const [token, setToken] = useState(null); // Added token state

  // Initialize Stringee when user logs in
  useEffect(() => {
    if (user?._id) {
      const initStringee = async () => {
        try {
          // Try to fetch token from backend
          const response = await api.get(`/stringee/token?userId=${user._id}`);
          
          // Extract token from response - handle both formats
          let newToken = null;
          if (response && response.token) {
            // Format: { token: "..." }
            newToken = response.token;
          } else if (response && response.data && response.data.token) {
            // Format: { data: { token: "..." } }
            newToken = response.data.token;
          }
          
          if (!newToken) {
            throw new Error("Failed to get Stringee token");
          }
          
          setToken(newToken);
          
          // Initialize Stringee client
          const client = new window.StringeeClient();
          setStringeeClient(client);
          
          // Set up event listeners
          client.on('connect', function() {
            console.log('✅ Stringee connected');
            setIsConnected(true);
          });
          
          // Add the authen event listener
          client.on('authen', function(res) {
            console.log('Stringee authentication result:', res);
            if (res.r === 0) {
              console.log('✅ Stringee authenticated');
              setIsAuthenticated(true);
            } else {
              console.error('❌ Stringee authentication failed:', res);
              setIsAuthenticated(false);
            }
          });
          
          // Add disconnect event listener
          client.on('disconnect', function() {
            console.log('🔌 Stringee disconnected');
            setIsConnected(false);
            setIsAuthenticated(false);
          });
          
          // Handle incoming call
          client.on('incomingcall', function(incomingCall) {
            console.log('📞 Incoming call from:', incomingCall.fromNumber);
            setCurrentCall(incomingCall);
            setCallState("ringing");
            
            // Set up call event listeners
            setupCallEvents(incomingCall);
          });
          
          // Connect to Stringee with the correct token
          client.connect(newToken);
          
        } catch (error) {
          console.error("Failed to initialize Stringee:", error);
          
          // TEMPORARY FALLBACK: Use a hardcoded token for development
          console.warn("Using fallback token generation - FOR DEVELOPMENT ONLY");
          
          // Hardcoded token from your API response
          const hardcodedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImN0eSI6InN0cmluZ2VlLWFwaTt2PTEifQ.eyJqdGkiOiJTSy4wLlBZTFFuSUMxcVFEaUs1YUV3OWtUVUt6MEQ1WTdadENxLTE3NDc1Njk2MTEyNzgiLCJpc3MiOiJTSy4wLlBZTFFuSUMxcVFEaUs1YUV3OWtUVUt6MEQ1WTdadENxIiwiZXhwIjoxNzQ3NTczMjExLCJ1c2VySWQiOiJVU0VSX0lEIiwiaWF0IjoxNzQ3NTY5NjExfQ.skhBwRd0ftNhPXdQ3CjNEUKDGZS5RR80zBA3V4ZGOpg";
          setToken(hardcodedToken);
          
          // Initialize Stringee client with hardcoded token
          try {
            const client = new window.StringeeClient();
            setStringeeClient(client);
            
            // Set up event listeners
            client.on('connect', function() {
              console.log('✅ Stringee connected (fallback)');
              setIsConnected(true);
            });
            
            client.on('authen', function(res) {
              console.log('Stringee authentication result:', res);
              if (res.r === 0) {
                console.log('✅ Stringee authenticated');
                setIsAuthenticated(true);
              } else {
                console.error('❌ Stringee authentication failed:', res);
                setIsAuthenticated(false);
              }
            });
            
            client.on('disconnect', function() {
              console.log('🔌 Stringee disconnected');
              setIsConnected(false);
              setIsAuthenticated(false);
            });
            
            // Handle incoming call
            client.on('incomingcall', function(incomingCall) {
              console.log('📞 Incoming call from:', incomingCall.fromNumber);
              setCurrentCall(incomingCall);
              setCallState("ringing");
              
              // Set up call event listeners
              setupCallEvents(incomingCall);
            });
            
            // Connect to Stringee with hardcoded token
            client.connect(hardcodedToken);
          } catch (fallbackError) {
            console.error("Fallback also failed:", fallbackError);
          }
        }
      };
      
      initStringee();
    }
    
    // Cleanup on unmount
    return () => {
      if (stringeeClient) {
        stringeeClient.disconnect();
        setStringeeClient(null);
        setIsConnected(false);
        setIsAuthenticated(false);
      }
    };
  }, [user?._id]);

  // Set up call event listeners
  const setupCallEvents = (call) => {
    call.on('addlocalstream', function(stream) {
      console.log('📹 Local stream added');
      setLocalStream(stream);
      
      // For audio calls, we need to ensure audio is properly handled
      if (!call.isVideoCall) {
        console.log('Setting up audio stream');
        // Create an audio element to play the local stream (for testing)
        const audioElement = document.createElement('audio');
        audioElement.srcObject = stream;
        audioElement.volume = 0.5; // Set volume to 50%
        audioElement.play().catch(err => console.error('Error playing local audio:', err));
      }
    });
    
    call.on('addremotestream', function(stream) {
      console.log('📹 Remote stream added');
      setRemoteStream(stream);
      
      // Create an audio element to play the remote stream
      const audioElement = document.createElement('audio');
      audioElement.srcObject = stream;
      audioElement.id = 'stringee-remote-audio';
      audioElement.autoplay = true;
      
      // Make sure volume is up
      audioElement.volume = 1.0;
      
      // Add to DOM to ensure it plays
      document.body.appendChild(audioElement);
      
      // Log audio tracks for debugging
      const audioTracks = stream.getAudioTracks();
      console.log(`Remote stream has ${audioTracks.length} audio tracks:`, 
        audioTracks.map(track => ({
          enabled: track.enabled,
          muted: track.muted,
          id: track.id
        }))
      );
      
      // Ensure audio is enabled
      audioTracks.forEach(track => {
        track.enabled = true;
      });
      
      // Play with a slight delay to ensure everything is set up
      setTimeout(() => {
        audioElement.play()
          .then(() => console.log('✅ Remote audio playing'))
          .catch(err => console.error('❌ Error playing remote audio:', err));
      }, 500);
    });
    
    call.on('signalingstate', function(state) {
      // Handle state as object or string
      const stateValue = typeof state === 'object' ? state.code : state;
      console.log('📞 Call state changed:', state);
      
      // Map numeric codes to string states if needed
      let stateString = stateValue;
      if (typeof stateValue === 'number') {
        // Map common state codes to strings
        const stateMap = {
          0: 'calling',
          1: 'ringing',
          2: 'answered',
          3: 'busy',
          4: 'ended'
        };
        stateString = stateMap[stateValue] || `unknown-${stateValue}`;
      }
      
      setCallState(stateString);
      
      // When call ends
      if (stateString === 'ended' || stateValue === 4) {
        setTimeout(() => {
          // Clean up audio elements
          const remoteAudio = document.getElementById('stringee-remote-audio');
          if (remoteAudio) {
            remoteAudio.pause();
            remoteAudio.srcObject = null;
            remoteAudio.remove();
          }
          
          // Clean up state
          setCurrentCall(null);
          setLocalStream(null);
          setRemoteStream(null);
          setCallState(null);
          window.currentStringeeCall = null;
        }, 1000);
      }
    });
    
    call.on('mediastate', function(state) {
      console.log('📞 Media state changed:', state);
    });
    
    call.on('info', function(info) {
      console.log('📞 Call info:', info);
    });
    
    // Add otherdevice event handler
    call.on('otherdevice', function(data) {
      console.log('📞 Call handled on another device:', data);
    });
  };

  // Answer an incoming call
  const answerCall = () => {
    if (!currentCall) {
      console.error('❌ No incoming call to answer');
      return false;
    }
    
    currentCall.answer(function(res) {
      if (res.r === 0) { // FIXED: Changed from res.r !== 0
        console.log('✅ Call answered successfully');
      } else {
        console.error('❌ Failed to answer call:', res);
      }
    });
    
    return true;
  };

  // Hang up the current call
  const hangupCall = () => {
    if (!currentCall) {
      console.error('❌ No active call to hang up');
      return false;
    }
    
    currentCall.hangup(function(res) {
      if (res.r === 0) { // FIXED: Changed from res.r !== 0
        console.log('✅ Call ended successfully');
      } else {
        console.error('❌ Failed to end call:', res);
      }
    });
    
    return true;
  };

  // Make a call
  // Make a call
  const makeCall = (calleeId, isVideoCall = false) => {
    if (!stringeeClient || !isConnected || !isAuthenticated) {
      console.error('❌ Stringee client not ready');
      return null;
    }
    
    try {
      console.log(`Making ${isVideoCall ? 'video' : 'audio'} call to ${calleeId} with client:`, stringeeClient);
      
      // Create a new call with more detailed options
      const callOptions = {
        videoCaptureWidth: 640,
        videoCaptureHeight: 480,
        videoFrameRate: 30,
        audioFrameRate: 16000
      };
      
      // Ensure we're using the correct format for user IDs
      const fromUserId = user._id.toString();
      const toUserId = calleeId.toString();
      
      console.log(`Call from ${fromUserId} to ${toUserId}`);
      
      const call = new window.StringeeCall(stringeeClient, fromUserId, toUserId, isVideoCall, callOptions);
      
      // Important: Keep a reference to the call object to prevent garbage collection
      window.currentStringeeCall = call;
      
      // Set up call event listeners before making the call
      setupCallEvents(call);
      
      // Store the call object in state before making the call
      setCurrentCall(call);
      setCallState('initializing');
      
      // Make the call with a slight delay to ensure everything is set up
      setTimeout(() => {
        call.makeCall(function(res) {
          console.log('Call makeCall response:', res);
          if (res.r === 0) {
            console.log('✅ Call initiated successfully');
            setCallState('calling');
          } else {
            console.error('❌ Failed to make call:', res);
            // Clean up on failure
            setCurrentCall(null);
            setCallState(null);
            window.currentStringeeCall = null;
          }
        });
      }, 500);
      
      return call;
    } catch (error) {
      console.error('❌ Error making call:', error);
      // Clean up on error
      setCurrentCall(null);
      setCallState(null);
      window.currentStringeeCall = null;
      return null;
    }
  };

  // Context value
  const contextValue = {
    isConnected,
    isAuthenticated,
    currentCall,
    callState,
    localStream,
    remoteStream,
    makeCall,
    answerCall,
    hangupCall,
  };

  return (
    <StringeeContext.Provider value={contextValue}>
      {children}
    </StringeeContext.Provider>
  );
};

// Custom hook to use the context
export const useStringee = () => {
  const context = useContext(StringeeContext);
  if (!context) {
    throw new Error("useStringee must be used within a StringeeProvider");
  }
  return context;
};