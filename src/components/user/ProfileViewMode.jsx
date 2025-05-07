import React from "react";
import { Edit2, Camera, X } from "lucide-react";

const ProfileViewMode = ({
  contentClasses,
  user,
  defaultAvatar,
  formatBirthday,
  handleSwitchToAvatar,
  handleSwitchToEdit, // Sử dụng prop này thay vì context
  handleClose,
}) => {
  // Component InfoItem để hiển thị từng thông tin người dùng
  const InfoItem = ({ label, value }) => {
    return (
      <div className="mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-gray-800">{value}</p>
      </div>
    );
  };

  return (
    <div className={contentClasses}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">Thông tin tài khoản</h2>
        <button
          className="btn btn-sm btn-circle btn-ghost"
          onClick={handleClose}
        >
          <X size={20} />
        </button>
      </div>

      {/* Banner với avatar đè lên */}
      <div className="relative pb-5">
        <div className="h-32 bg-red-600 relative overflow-hidden">
          <div className="flex justify-center items-center h-full">
            <span className="text-yellow-300 text-3xl font-bold">VIỆT NAM</span>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Flag_of_Vietnam.svg/1200px-Flag_of_Vietnam.svg.png"
              alt="Ngôi sao vàng"
              className="h-16 ml-4"
            />
          </div>
        </div>

        {/* Avatar đè lên ảnh bìa */}
        <div className="absolute left-4 -bottom-4">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-white cursor-pointer"
              onClick={handleSwitchToAvatar}
            >
              <img
                src={user?.primary_avatar || defaultAvatar}
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={handleSwitchToAvatar}
              className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 text-white hover:bg-blue-600"
            >
              <Camera size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Tên người dùng đặt bên cạnh avatar */}
      <div className="pl-28 pr-4 -mt-2 mb-2">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          {user?.name || "Người dùng"}
          <button
            className="text-blue-500 hover:text-blue-700"
            onClick={handleSwitchToEdit} // Thay đổi từ openProfileEditModeModal sang handleSwitchToEdit
          >
            <Edit2 size={16} />
          </button>
        </h3>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Thông tin cá nhân */}
      <div className="p-4">
        <h4 className="text-gray-700 font-medium mb-4">Thông tin cá nhân</h4>
        <InfoItem label="Giới tính" value={user?.gender || "Nam"} />
        <InfoItem
          label="Ngày sinh"
          value={formatBirthday(user?.dob || "2002-12-28")}
        />
        <InfoItem label="Điện thoại" value={user?.phone || "+84 396 209 345"} />
        <InfoItem label="Email" value={user?.email || "example@gmail.com"} />

        {/* Thông tin quyền riêng tư */}
        <div className="text-sm text-gray-600 mt-4">
          <p>Chỉ bạn bè có số lưu của bạn trong danh bạ mới xem được số này</p>
        </div>
      </div>

      {/* Button */}
      <div className="flex justify-center p-4 border-t">
        <button
          className="btn btn-primary flex items-center gap-2 px-6"
          onClick={handleSwitchToEdit} // Thay đổi từ openProfileEditModeModal sang handleSwitchToEdit
        >
          <span>Cập nhật</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileViewMode;
