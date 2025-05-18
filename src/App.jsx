import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import MessengerPage from "./pages/MessengerPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyOTPPage from "./pages/VerifyOTPPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import FriendsPage from "./pages/FriendsPage";
import ProtectedRoute from "./components/route/ProtectedRoute";
import PublicRoute from "./components/route/PublicRoute";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import useAuthStore from "./stores/authStore";
import { SocketProvider } from "./context/SocketContext";
import { ModalProvider } from "./context/ModalContext";
import UserProfileModal from "./components/user/UserProfileModal";
import ProfileModal from "./components/user/ProfileModal";
import socketManager from "./services/SocketManager";
import useMessageSocket from "./hooks/useMessageSocket";
import useGroupSocket from "./hooks/useGroupSocket";
import useFriendRequestSocket from "./hooks/useFriendRequestSocket";

// Import StringeeProvider and CallModal
import { StringeeProvider } from "./context/StringeeContext";
import CallModal from "./components/call/CallModal";

function App() {
  const { checkAuth, user, isAuthenticated } = useAuthStore();

  // Kiểm tra trạng thái xác thực khi ứng dụng khởi động
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Removed the Stringee initialization code since it's now handled in StringeeContext

  // Khởi tạo socket khi người dùng đã đăng nhập - chỉ chạy một lần khi auth thay đổi
  useEffect(() => {
    // Nếu người dùng đã đăng nhập và có ID hợp lệ
    if (isAuthenticated && user?._id) {
      // Log ở cấp độ APP - quan trọng nhất
      console.log("App: Khởi tạo kết nối socket cho người dùng", user._id);
      socketManager.initialize(user._id);
    } else if (!isAuthenticated && socketManager.isSocketConnected()) {
      // Ngắt kết nối khi đăng xuất
      socketManager.disconnect();
    }
  }, [isAuthenticated, user?._id]); // Chỉ phụ thuộc vào trạng thái đăng nhập và ID
  
  // Khởi tạo socket cho các sự kiện tin nhắn, nhóm và lời mời kết bạn
  useMessageSocket();
  useGroupSocket();
  useFriendRequestSocket();

  // Thêm listener cho sự kiện popstate (back/forward trong trình duyệt)
  useEffect(() => {
    const handlePopState = () => {
      // Force re-render khi URL thay đổi
      // React Router sẽ nhận biết thay đổi URL và cập nhật state tương ứng
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <ModalProvider>
      <SocketProvider>
        <StringeeProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: "10px",
                background: "#333",
                color: "#fff",
              },
            }}
          />

          {/* Global Modals - Accessible from anywhere in the app */}
          <UserProfileModal />
          <ProfileModal />
          <CallModal />

          <Routes>
            {/* Public Routes - Chỉ hiển thị khi chưa đăng nhập */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-otp" element={<VerifyOTPPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Protected Routes - Chỉ hiển thị khi đã đăng nhập */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Navigate to="/messages" replace />} />
                <Route path="messages" element={<MessengerPage />} />
                <Route path="friends" element={<FriendsPage />} />
                {/* Các route khác nếu cần */}
              </Route>
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </StringeeProvider>
      </SocketProvider>
    </ModalProvider>
  );
}

export default App;
