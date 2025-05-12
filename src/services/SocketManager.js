import { io } from "socket.io-client";

// Biến này được sử dụng để theo dõi trạng thái khởi tạo
let isInitializing = false;

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.userId = null;
    this.heartbeatInterval = null;
    this.connectionAttempts = 0;
  }

  // Khởi tạo kết nối socket
  initialize(userId) {
    // Nếu userId không hợp lệ, không khởi tạo
    if (!userId) {
      console.warn("Không thể khởi tạo socket: userId không hợp lệ");
      return null;
    }

    // Nếu socket đã được kết nối cho cùng một userId, không làm gì cả
    if (this.socket && this.isConnected && this.userId === userId) {
      // Giảm số lượng log bằng cách chỉ log khi có nhiều lần gọi
      if (this.connectionAttempts > 0) {
        console.log("Socket already connected for user:", userId);
        this.connectionAttempts = 0;
      } else {
        this.connectionAttempts++;
      }
      return this.socket;
    }

    // Nếu đang trong quá trình khởi tạo, không khởi tạo thêm
    if (isInitializing) {
      console.log("Socket initialization already in progress");
      return this.socket;
    }

    // Đánh dấu đang khởi tạo
    isInitializing = true;

    // Nếu đã có socket cũ, đóng nó trước
    if (this.socket) {
      console.log("Manually disconnecting socket");
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }

    this.userId = userId;
    console.log("Initializing socket connection for user:", userId);

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

    this.socket = io(socketUrl, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    this.socket.on("connect", () => {
      // Đánh dấu kết thúc khởi tạo khi kết nối thành công
      isInitializing = false;
      this.connectionAttempts = 0;

      console.log("Socket connected with ID:", this.socket.id);
      this.isConnected = true;

      // Lưu thông tin user vào socket để dễ truy cập
      this.socket.auth = { user: { id: userId } };

      // Đăng ký userId với socket server
      this.socket.emit("registerUser", userId);

      // Thiết lập heartbeat
      this.setupHeartbeat(userId);

      // Kích hoạt tất cả listeners đã đăng ký
      this.listeners.forEach((callback, event) => {
        if (typeof callback === "function") {
          callback(true);
        }
      });
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
      this.isConnected = false;

      // Dừng heartbeat khi ngắt kết nối
      this.clearHeartbeat();

      // Thông báo cho listeners
      this.listeners.forEach((callback, event) => {
        if (typeof callback === "function") {
          callback(false);
        }
      });

      // Đánh dấu kết thúc khởi tạo nếu bị ngắt kết nối
      isInitializing = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      // Đánh dấu kết thúc khởi tạo nếu có lỗi
      isInitializing = false;
    });

    // Bắt xử lý reconnect
    this.socket.on("reconnect", (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);

      // Đăng ký lại userId với server
      this.socket.emit("registerUser", userId);

      // Thiết lập lại heartbeat
      this.setupHeartbeat(userId);
    });

    return this.socket;
  }

  // Thiết lập heartbeat để duy trì kết nối
  setupHeartbeat(userId) {
    // Xóa bất kỳ interval cũ nào
    this.clearHeartbeat();

    // Thiết lập interval mới
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit("heartbeat", { userId });
      }
    }, 30000); // 30 giây
  }

  // Xóa heartbeat interval
  clearHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Lấy instance socket hiện tại
  getSocket() {
    return this.socket;
  }

  // Kiểm tra trạng thái kết nối
  isSocketConnected() {
    return this.isConnected;
  }

  // Đăng ký listener cho trạng thái kết nối
  onConnectionChange(callback) {
    this.listeners.set("connectionChange", callback);

    // Trả về hàm để hủy đăng ký
    return () => {
      this.listeners.delete("connectionChange");
    };
  }

  // Ngắt kết nối socket
  disconnect() {
    if (this.socket) {
      console.log("Manually disconnecting socket");
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }

    this.clearHeartbeat();
    this.userId = null;
    isInitializing = false;
  }
}

// Export singleton instance
const socketManager = new SocketManager();
export default socketManager;
