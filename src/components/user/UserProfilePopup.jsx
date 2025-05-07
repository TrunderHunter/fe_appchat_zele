import React, { useEffect, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import { ArrowUpRight, LogOut } from "lucide-react";
import { useModalContext } from "../../context/ModalContext";
import UserAvatar from "./UserAvatar";

// Tách thành phần hiển thị thông tin user thành component riêng và memo
const UserInfo = memo(({ onOpenProfileModal }) => {
  // Chỉ lấy các thuộc tính cần thiết từ store - tách riêng từng selector
  const name = useAuthStore((state) => state.user?.name || "Người dùng");
  const email = useAuthStore((state) => state.user?.email || "");
  const primary_avatar = useAuthStore((state) => state.user?.primary_avatar);

  // Avatar mặc định dạng data URI - một hình tròn màu xám
  const defaultAvatar =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23CCCCCC'/%3E%3Ctext x='50' y='62' font-size='35' text-anchor='middle' fill='%23FFFFFF'%3EU%3C/text%3E%3C/svg%3E";

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden">
          <UserAvatar src={primary_avatar || defaultAvatar} size="lg" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{name}</h3>
          <p className="text-sm text-gray-500">{email}</p>
        </div>
      </div>
    </div>
  );
});

const UserProfilePopup = ({ isOpen, onClose }) => {
  // Chỉ lấy hàm logout từ store
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const popupRef = useRef(null);

  // Sử dụng ModalContext để quản lý modal ProfileViewMode
  const { openProfileModal, openProfileViewModeModal } = useModalContext();

  // Đóng popup khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Xử lý đăng xuất
  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        navigate("/login");
      }
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  };

  // Xử lý hiển thị profile modal thông qua context
  const handleOpenProfileModal = () => {
    openProfileModal(); // Mở modal hồ sơ thông qua context
    onClose(); // Đóng popup
  };

  // Xử lý mở trang cài đặt
  const navigateToSettings = () => {
    navigate("/settings");
    onClose();
  };

  // Mở ProfileViewMode sử dụng context
  const handleOpenProfileViewMode = () => {
    openProfileViewModeModal();
    onClose(); // Đóng popup menu
  };

  // Nếu popup đóng thì không hiển thị gì
  if (!isOpen) return null;

  return (
    <div
      className="absolute top-16 left-16 bg-white rounded-lg shadow-lg w-64 z-40 border border-gray-200"
      ref={popupRef}
    >
      {/* User info component - đã được tách riêng và memoized */}
      <UserInfo onOpenProfileModal={handleOpenProfileModal} />

      <div className="p-2">
        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded flex items-center cursor-pointer"
          onClick={handleOpenProfileViewMode}
        >
          <span className="flex-1">Hồ sơ của bạn</span>
          <ArrowUpRight size={16} className="text-gray-500" />
        </button>

        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded flex items-center"
          onClick={navigateToSettings}
        >
          <span className="flex-1">Cài đặt</span>
          <ArrowUpRight size={16} className="text-gray-500" />
        </button>
      </div>

      <div className="p-2 border-t border-gray-200">
        <button
          className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 rounded flex items-center"
          onClick={handleLogout}
        >
          <LogOut size={16} className="mr-2" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

export default UserProfilePopup;
