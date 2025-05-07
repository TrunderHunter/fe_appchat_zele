import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import useAuthStore from "../../stores/authStore";

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Kiểm tra xác thực khi component mount
    const verifyAuthentication = async () => {
      try {
        // Gọi API để xác thực thông qua cookie
        await checkAuth();
        setIsCheckingAuth(false);
      } catch (error) {
        console.error("Lỗi khi kiểm tra xác thực:", error);
        setIsCheckingAuth(false);
      }
    };

    verifyAuthentication();
  }, [checkAuth]);

  // Hiển thị loading trong khi kiểm tra xác thực
  if (isLoading || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // Nếu chưa đăng nhập, chuyển hướng đến trang login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Nếu đã đăng nhập, hiển thị các route con
  return <Outlet />;
};

export default ProtectedRoute;
