// Stringee service for handling voice and video calls
class StringeeService {
  constructor() {
    this.client = null;
    this.currentCall = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.serverAddresses = [
      "wss://v1.stringee.com:6899/", 
      "wss://v2.stringee.com:6899/"
    ];
  }

  // Initialize Stringee client with token
  initialize(token) {
    if (!token) {
      console.warn("Cannot initialize Stringee: token is invalid");
      return null;
    }

    // If client already exists and is connected, return it
    if (this.client && this.isConnected) {
      return this.client;
    }

    // Create new client with server addresses
    this.client = new window.StringeeClient(this.serverAddresses);
    
    // Set up event listeners
    this.client.on('connect', () => {
      console.log('Stringee connected');
      this.isConnected = true;
      
      // Notify listeners
      this.notifyListeners('connectionChange', true);
    });

    this.client.on('disconnect', () => {
      console.log('Stringee disconnected');
      this.isConnected = false;
      
      // Notify listeners
      this.notifyListeners('connectionChange', false);
    });

    this.client.on('authen', (res) => {
      console.log('Stringee authentication result:', res);
      if (res.r !== 0) {
        console.error('Stringee authentication failed with message:', res.message);
      }
    });

    // Handle incoming call
    this.client.on('incomingcall', (incomingCall) => {
      this.currentCall = incomingCall;
      this.setupCallEvents(incomingCall);
      
      // Notify listeners about incoming call
      this.notifyListeners('incomingCall', incomingCall);
    });

    // Connect to Stringee server
    this.client.connect(token);
    
    return this.client;
  }

  // Make a call
  makeCall(calleeId, isVideoCall = false) {
    if (!this.client || !this.isConnected) {
      console.error('Stringee client not connected');
      return null;
    }

    const call = new window.StringeeCall(this.client, calleeId, isVideoCall);
    
    // Set up call event listeners
    this.setupCallEvents(call);
    
    // Make the call
    call.makeCall((res) => {
      console.log('Make call result:', res);
    });

    this.currentCall = call;
    return call;
  }

  // Answer an incoming call
  answerCall() {
    if (!this.currentCall) {
      console.error('No incoming call to answer');
      return false;
    }

    this.currentCall.answer((res) => {
      console.log('Answer call result:', res);
    });

    return true;
  }

  // Hang up the current call
  hangupCall() {
    if (!this.currentCall) {
      console.error('No active call to hang up');
      return false;
    }

    this.currentCall.hangup((res) => {
      console.log('Hangup call result:', res);
    });

    this.currentCall = null;
    return true;
  }

  // Set up event listeners for a call
  setupCallEvents(call) {
    call.on('addlocalstream', (stream) => {
      // Handle local stream
      this.notifyListeners('localStream', stream);
    });

    call.on('addremotestream', (stream) => {
      // Handle remote stream
      this.notifyListeners('remoteStream', stream);
    });

    call.on('signalingstate', (state) => {
      console.log('Call state changed:', state);
      // Notify listeners about call state change
      this.notifyListeners('callStateChange', state);
    });
  }

  // Helper method to notify listeners
  notifyListeners(event, data) {
    const callback = this.listeners.get(event);
    if (typeof callback === 'function') {
      callback(data);
    }
  }

  // Register event listeners
  on(event, callback) {
    this.listeners.set(event, callback);
    
    // Return function to unregister listener
    return () => {
      this.listeners.delete(event);
    };
  }

  // Check if client is connected
  isClientConnected() {
    return this.isConnected;
  }

  // Get the Stringee client instance
  getClient() {
    return this.client;
  }

  // Disconnect the client
  disconnect() {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
      this.isConnected = false;
    }
  }
}

// Create a singleton instance
const stringeeService = new StringeeService();
export default stringeeService;