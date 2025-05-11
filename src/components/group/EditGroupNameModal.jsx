import React, { useState, useEffect, useRef } from "react";
import { MdClose } from "react-icons/md";
import { toast } from "react-hot-toast";
import useGroupStore from "../../stores/groupStore";

/**
 * Modal chỉnh sửa tên nhóm
 */
const EditGroupNameModal = ({ isOpen, onClose, group }) => {
  const [groupName, setGroupName] = useState(group?.name || "");
  const { updateGroup } = useGroupStore();
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus vào input khi modal mở
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra dữ liệu
    if (!groupName.trim()) {
      toast.error("Tên nhóm không được để trống");
      return;
    }

    if (groupName === group.name) {
      onClose();
      return;
    }

    try {
      const loadingToastId = toast.loading("Đang cập nhật tên nhóm...");
      await updateGroup(group._id, { name: groupName });
      toast.dismiss(loadingToastId);
      toast.success("Đã cập nhật tên nhóm");
      onClose();
    } catch (error) {
      console.error("Error updating group name:", error);
      toast.error("Không thể cập nhật tên nhóm");
    }
  };

  // Xử lý khi click vào overlay nền
  const handleOverlayClick = (e) => {
    // Chỉ đóng modal nếu click vào đúng lớp overlay
    if (e.target === e.currentTarget) {
      onClose();
    }
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
          <h3 className="font-medium text-lg">Đổi tên nhóm</h3>
          <button
            className="p-1 hover:bg-gray-100 rounded-full"
            onClick={onClose}
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">
              Tên nhóm
            </label>
            <input
              ref={inputRef}
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tên nhóm"
              maxLength={100}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGroupNameModal;
