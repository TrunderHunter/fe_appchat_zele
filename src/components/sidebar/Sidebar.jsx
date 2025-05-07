import {
  MessageCircle,
  Users,
  CalendarCheck,
  List,
  LogOut,
} from "lucide-react";
import { useState, memo } from "react";
import useAuthStore from "../../stores/authStore";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import UserProfilePopup from "../user/UserProfilePopup";
import UserAvatar from "../user/UserAvatar";

// Tách phần Avatar thành component riêng và sử dụng memo để tránh re-render
const SidebarUserAvatar = memo(
  ({ onClick }) => {
    // Sử dụng selector để chỉ lấy primary_avatar từ store
    const primary_avatar = useAuthStore((state) => state.user?.primary_avatar);

    return (
      <div
        className="w-10 h-10 rounded-full overflow-hidden cursor-pointer"
        onClick={onClick}
      >
        <UserAvatar src={primary_avatar} size="lg" />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // So sánh chỉ dựa trên onClick function
    return prevProps.onClick === nextProps.onClick;
  }
);

const Sidebar = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        toast.success("Đăng xuất thành công!");
        navigate("/login");
      } else {
        toast.error("Đăng xuất thất bại. Vui lòng thử lại!");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi đăng xuất!");
    }
  };

  // Kiểm tra đường dẫn hiện tại để highlight icon tương ứng
  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  // Điều hướng nhẹ nhàng hơn, chỉ thay đổi URL mà không tải lại trang
  const handleNavigation = (path) => {
    if (!location.pathname.includes(path)) {
      window.history.pushState({}, "", path);
      // Cập nhật location để component re-render
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  // Xử lý click vào avatar
  const toggleProfilePopup = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  return (
    <div className="flex flex-col h-full justify-between relative">
      <div className="flex flex-col items-center gap-4">
        <SidebarUserAvatar onClick={toggleProfilePopup} />

        {isProfileOpen && (
          <UserProfilePopup
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
          />
        )}

        <div
          className={`text-white ${
            isActive("/messages") ? "bg-blue-700" : "hover:bg-blue-700"
          } rounded-full p-2 cursor-pointer hover:bg-blue-800`}
          onClick={() => handleNavigation("/messages")}
          title="Tin nhắn"
        >
          <MessageCircle size={20} />
        </div>

        <div
          className={`text-white ${
            isActive("/friends") ? "bg-blue-700" : "hover:bg-blue-700"
          } rounded-full p-2 cursor-pointer`}
          onClick={() => handleNavigation("/friends")}
          title="Danh sách bạn bè"
        >
          <Users size={20} />
        </div>

        <div className="text-white hover:bg-blue-700 rounded-full p-2 cursor-pointer">
          <CalendarCheck size={20} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 mb-4">
        <div className="text-white hover:bg-blue-700 rounded-full p-2 cursor-pointer">
          <List size={20} />
        </div>

        <div
          className="text-white hover:bg-blue-700 rounded-full p-2 cursor-pointer"
          onClick={handleLogout}
          title="Đăng xuất"
        >
          <LogOut size={20} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
