import React, { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import { toast } from "react-hot-toast";

// Component modal chọn admin mới khi admin hoặc người tạo nhóm rời nhóm
const TransferAdminModal = ({
  isOpen,
  onClose,
  group,
  onSelectMember,
  currentUser,
  excludeMembers = [],
  isOwnerTransfer,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);

  // Focus vào ô tìm kiếm khi mở modal
  useEffect(() => {
    if (isOpen) {
      setSelectedMember(null);
      setSearchTerm("");
    }
  }, [isOpen]);

  // Lọc danh sách thành viên theo từ khóa tìm kiếm và loại trừ các thành viên không hợp lệ
  const filteredMembers = React.useMemo(() => {
    if (!group?.members) return [];

    // Chỉ hiển thị thành viên không phải admin hiện tại và không nằm trong danh sách loại trừ
    return group.members.filter((member) => {
      const memberId =
        typeof member.user === "object" ? member.user._id : member.user;
      const memberName =
        typeof member.user === "object"
          ? member.user?.name || ""
          : "Thành viên";

      // Loại trừ người dùng hiện tại và các thành viên trong danh sách loại trừ
      const shouldExclude =
        memberId === currentUser?._id || excludeMembers.includes(memberId);

      return (
        !shouldExclude &&
        memberName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [group?.members, searchTerm, currentUser?._id, excludeMembers]);

  // Xử lý khi chọn thành viên
  const handleSelectMember = (member) => {
    setSelectedMember(member);
  };

  // Xử lý khi xác nhận chọn thành viên
  const handleConfirm = () => {
    if (selectedMember) {
      onSelectMember(selectedMember);
    } else {
      toast.error("Vui lòng chọn một thành viên để chuyển quyền admin");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-auto bg-black/30">
      {" "}
      <div className="bg-white rounded-md w-full max-w-md max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b sticky top-0 bg-white z-10">
          <h3 className="font-medium text-lg">
            {isOwnerTransfer
              ? "Chọn chủ sở hữu nhóm mới"
              : "Chọn quản trị viên mới"}
          </h3>
          <button
            className="p-1 hover:bg-gray-100 rounded-full"
            onClick={onClose}
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Nội dung chính */}
        <div className="p-4">
          <div className="mb-4">
            {" "}
            <p className="text-gray-600 mb-3">
              {isOwnerTransfer
                ? "Bạn cần chỉ định một chủ sở hữu mới trước khi rời nhóm."
                : "Bạn cần chỉ định một quản trị viên khác trước khi rời nhóm."}
            </p>
            {/* Thanh tìm kiếm */}
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tìm kiếm thành viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Danh sách thành viên */}
          <div className="max-h-80 overflow-y-auto border rounded-md">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => {
                const memberUser =
                  typeof member.user === "object" ? member.user : null;
                const memberId = memberUser?._id || member.user;
                const memberName = memberUser?.name || "Thành viên";
                const memberAvatar = memberUser?.primary_avatar;
                const isSelected =
                  selectedMember &&
                  (selectedMember.user?._id || selectedMember.user) ===
                    memberId;

                return (
                  <div
                    key={memberId}
                    className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                      isSelected ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleSelectMember(member)}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200 flex-shrink-0">
                      {memberAvatar ? (
                        <img
                          src={memberAvatar}
                          alt={memberName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600">
                          {memberName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium">{memberName}</div>
                      <div className="text-xs text-gray-500">
                        {member.role === "moderator"
                          ? "Điều hành viên"
                          : "Thành viên"}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-gray-500">
                Không tìm thấy thành viên phù hợp
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 flex justify-end gap-3">
            <button
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
                !selectedMember ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handleConfirm}
              disabled={!selectedMember}
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferAdminModal;
