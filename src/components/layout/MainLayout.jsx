import { Outlet, useLocation } from "react-router-dom";
import { memo } from "react";
import Sidebar from "../sidebar/Sidebar";
import MessengerPage from "../../pages/MessengerPage";
import FriendsPage from "../../pages/FriendsPage";
import useAuthStore from "../../stores/authStore";

// Tách Header thành component riêng và sử dụng memo
const Header = memo(() => {
  // Chỉ lấy thuộc tính name từ user thay vì toàn bộ user object
  const userName = useAuthStore((state) => state.user?.name);

  return (
    <div className="bg-gray-200 shadow-md p-2 flex items-center justify-between">
      <p className="text-sm font-semibold text-gray-800 px-4">
        {userName ? `Xin chào, ${userName}` : "Chào mừng bạn đến với ứng dụng!"}
      </p>
      {/* Có thể thêm các nút hoặc biểu tượng khác ở đây */}
    </div>
  );
});

const MainLayout = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const renderContent = () => {
    // Giữ Outlet để các routes con vẫn hoạt động
    // nhưng chúng ta sẽ tự quản lý các thành phần chính
    if (currentPath.includes("/friends")) {
      return <FriendsPage />;
    } else if (currentPath.includes("/messages")) {
      return <MessengerPage />;
    }
    return <Outlet />;
  };

  return (
    <div className="flex h-full w-full bg-blue-50">
      {/* Sidebar component - luôn được giữ nguyên */}
      <div className="w-[62px] bg-blue-600 flex flex-col items-center py-4">
        <Sidebar />
      </div>

      {/* Content area - thay đổi dựa trên currentPath */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header component - đã được tách riêng và memoized */}
        <Header />

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">{renderContent()}</div>
      </div>
    </div>
  );
};

export default MainLayout;
