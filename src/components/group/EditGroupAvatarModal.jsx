import React, { useState, useRef } from "react";
import { MdClose, MdCloudUpload, MdDelete } from "react-icons/md";
import { FiUsers } from "react-icons/fi";
import { toast } from "react-hot-toast";
import useGroupStore from "../../stores/groupStore";

/**
 * Modal chỉnh sửa ảnh đại diện nhóm
 */
const EditGroupAvatarModal = ({ isOpen, onClose, group }) => {
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(group?.avatar || null);
  const fileInputRef = useRef(null);
  const { updateGroup } = useGroupStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra kiểu file
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh");
      return;
    }

    // Kiểm tra kích thước file (giới hạn 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh quá lớn (tối đa 5MB)");
      return;
    }

    setAvatarFile(file);

    // Hiển thị preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Nếu không có sự thay đổi, đóng modal
    if (!avatarFile && avatarPreview === group.avatar) {
      onClose();
      return;
    }

    try {
      setIsLoading(true);
      const loadingToastId = toast.loading("Đang cập nhật ảnh đại diện nhóm...");

      // Tạo FormData để gửi file
      const formData = new FormData();
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      } else if (avatarPreview === null) {
        // Nếu preview là null thì xóa avatar
        formData.append("removeAvatar", "true");
      }

      await updateGroup(group._id, formData, true); // Tham số thứ 3 là isFormData
      toast.dismiss(loadingToastId);
      toast.success("Đã cập nhật ảnh đại diện nhóm");
      onClose();
    } catch (error) {
      console.error("Error updating group avatar:", error);
      toast.error("Không thể cập nhật ảnh đại diện nhóm");
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý khi click vào overlay nền
  const handleOverlayClick = (e) => {
    // Chỉ đóng modal nếu click vào đúng lớp overlay
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-md w-full max-w-md shadow-lg">
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b">
          <h3 className="font-medium text-lg">Đổi ảnh đại diện nhóm</h3>
          <button
            className="p-1 hover:bg-gray-100 rounded-full"
            onClick={onClose}
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          {/* Avatar Preview */}
          <div className="mb-6 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FiUsers size={64} stroke="#9ca3af" strokeWidth={1} />
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleButtonClick}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={isLoading}
              >
                <MdCloudUpload className="mr-2" /> Chọn ảnh
              </button>

              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  disabled={isLoading}
                >
                  <MdDelete className="mr-2" /> Xóa ảnh
                </button>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-500 mb-4 text-center">
            Hỗ trợ định dạng JPG, PNG, GIF. Kích thước tối đa 5MB.
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
              disabled={isLoading}
            >
              {isLoading ? "Đang xử lý..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGroupAvatarModal;
