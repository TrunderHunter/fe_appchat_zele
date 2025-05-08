import React, { useState } from "react";
import {
  MdClose,
  MdLink,
  MdSettings,
  MdLogout,
  MdEdit,
  MdContentCopy,
  MdShare,
  MdGroup,
  MdCameraAlt,
} from "react-icons/md";
import { FiUsers } from "react-icons/fi";
import useAuthStore from "../../stores/authStore";
import { toast } from "react-hot-toast";
import useGroupStore from "../../stores/groupStore";
import MemberListModal from "./MemberListModal";

const GroupInfoModal = ({ isOpen, onClose, group }) => {
  const [showMemberList, setShowMemberList] = useState(false);
  const { user } = useAuthStore();
  const { leaveGroup, currentGroup } = useGroupStore();

  // Get API base URL from environment variables
  const apiBaseUrl =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Use currentGroup if available, otherwise use the group prop
  const groupData = currentGroup || group;

  // Xử lý rời nhóm
  const handleLeaveGroup = async () => {
    if (!groupData?._id) return;

    try {
      const confirmed = window.confirm("Bạn có chắc muốn rời khỏi nhóm này?");
      if (confirmed) {
        await leaveGroup(groupData._id);
        toast.success("Đã rời khỏi nhóm");
        onClose();
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error("Không thể rời khỏi nhóm");
    }
  };

  // Xử lý khi click vào overlay nền
  const handleOverlayClick = (e) => {
    // Chỉ đóng modal nếu click vào đúng lớp overlay
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Format invite link for display
  const formatInviteLink = (link) => {
    if (!link) return "";

    try {
      // Parse the URL to get the host and path
      const url = new URL(link);
      const host = url.hostname;
      const path = url.pathname;

      // Get the last part of the path (the code)
      const pathParts = path.split("/").filter((part) => part);
      const code = pathParts[pathParts.length - 1];

      // Format as "hostname/.../code"
      return `${host}/.../${code}`;
    } catch (e) {
      // Fallback if URL parsing fails
      const parts = link.split("/");
      return `${parts[2]}/.../${parts[parts.length - 1]}`;
    }
  };

  // Check if member is current user
  const isCurrentUser = (memberId) => {
    return user && user._id === memberId;
  };

  // Get tooltip text for member
  const getMemberTooltip = (memberUser) => {
    if (!memberUser) return "";

    // If this is the current user
    if (isCurrentUser(memberUser._id)) {
      return "Bạn";
    }

    // Otherwise show the member's name
    return memberUser.name || memberUser.phone || "Thành viên";
  };

  // Full invite link for copying
  const groupInviteLink = groupData?.invite_link?.code
    ? `${apiBaseUrl}/groups/join/${groupData.invite_link.code}`
    : `${apiBaseUrl}/groups/join/${
        groupData?._id?.substring(0, 8) || "kabezh196"
      }`;

  // Nếu modal không mở hoặc không có thông tin nhóm thì không hiển thị
  if (!isOpen || !groupData) return null;

  // Hiển thị danh sách thành viên khi nhấn vào mục thành viên
  if (showMemberList) {
    return (
      <MemberListModal
        isOpen={showMemberList}
        onClose={onClose}
        onBack={() => setShowMemberList(false)}
        group={groupData}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/30"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-md w-full max-w-md max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b sticky top-0 bg-white z-10">
          <h3 className="font-medium text-lg">Thông tin nhóm</h3>
          <button
            className="p-1 hover:bg-gray-100 rounded-full"
            onClick={onClose}
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Group info */}
        <div className="p-6 flex flex-col items-center border-b">
          {/* Group avatar */}
          <div className="relative w-24 h-24 mb-3">
            <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {groupData.avatar ? (
                <img
                  src={groupData.avatar}
                  alt={groupData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <FiUsers size={64} stroke="#9ca3af" strokeWidth={1} />
                </div>
              )}
            </div>
            <button className="absolute bottom-0 right-0 bg-white rounded-full p-1 border border-gray-200">
              <MdCameraAlt size={20} />
            </button>
          </div>

          {/* Group name */}
          <div className="flex items-center mb-2 w-full justify-center">
            <h2 className="font-semibold text-xl max-w-[90%] text-center truncate">
              {groupData.name}
            </h2>
            <button className="ml-2 text-gray-400">
              <MdEdit size={16} />
            </button>
          </div>

          {/* Group creator info if available */}
          {groupData.creator && (
            <div className="text-sm text-gray-500">
              Tạo bởi: {groupData.creator.name || groupData.creator.phone}
            </div>
          )}

          {/* Group creation date if available */}
          {groupData.created_at && (
            <div className="text-xs text-gray-400 mt-1">
              Ngày tạo:{" "}
              {new Date(groupData.created_at).toLocaleDateString("vi-VN")}
            </div>
          )}
        </div>

        {/* Nhắn tin button */}
        <button className="w-full py-3 text-blue-600 font-medium border-b hover:bg-gray-50">
          Nhắn tin
        </button>

        {/* Thành viên section */}
        <div
          className="border-b cursor-pointer hover:bg-gray-50"
          onClick={() => setShowMemberList(true)}
        >
          <div className="px-4 py-3">
            <h4 className="font-medium">
              Thành viên ({groupData.members?.length || 0})
            </h4>
          </div>

          <div className="px-4 py-2 flex flex-wrap gap-2">
            {(groupData.members || []).slice(0, 3).map((member, index) => {
              const memberUser = member.user;
              const memberId = memberUser?._id;
              const memberAvatar = memberUser?.primary_avatar;
              const isAdmin = member.role === "admin";
              const tooltipText = getMemberTooltip(memberUser);
              const isUserSelf = isCurrentUser(memberId);

              return (
                <div
                  key={memberId || index}
                  className="w-12 h-12 relative group"
                  title={tooltipText}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-200">
                    {memberAvatar ? (
                      <img
                        src={memberAvatar}
                        alt={tooltipText}
                        className="w-full h-full object-cover"
                        title={tooltipText}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500"
                        title={tooltipText}
                      >
                        {(memberUser?.name || "").substring(0, 1)}
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[8px] rounded-full px-1 py-0.5">
                      Admin
                    </div>
                  )}
                  {isUserSelf && (
                    <div className="absolute top-0 right-0 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
                  )}
                </div>
              );
            })}

            {groupData.members?.length > 3 && (
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <span>+{groupData.members.length - 3}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ảnh/Video section */}
        <div className="border-b">
          <div className="px-4 py-3">
            <h4 className="font-medium">Ảnh/Video</h4>
          </div>

          <div className="px-4 py-4 text-center text-gray-500">
            Chưa có ảnh nào được chia sẻ trong nhóm này
          </div>
        </div>

        {/* Link tham gia nhóm */}
        <div className="px-4 py-3 flex items-center border-b">
          <MdLink className="text-gray-500 mr-3 flex-shrink-0" size={20} />
          <div className="flex-grow min-w-0">
            <div className="font-medium">Link tham gia nhóm</div>
            <div
              className="text-blue-600 text-sm truncate"
              title={groupInviteLink} // Show full link on hover
            >
              {formatInviteLink(groupInviteLink)}
            </div>
            {groupData.invite_link?.is_active === false && (
              <div className="text-red-500 text-xs mt-1">Link đã hết hạn</div>
            )}
          </div>
          <button
            className="p-2 text-gray-500 hover:bg-gray-100 rounded flex-shrink-0"
            title="Sao chép link"
            onClick={() => {
              navigator.clipboard.writeText(groupInviteLink);
              toast.success("Đã sao chép link vào clipboard");
            }}
          >
            <MdContentCopy size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded ml-1 flex-shrink-0">
            <MdShare size={20} />
          </button>
        </div>

        {/* Quản lý nhóm */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center mb-2">
            <MdSettings className="text-gray-500 mr-3" size={20} />
            <div className="font-medium">Quản lý nhóm</div>
          </div>

          {groupData.settings && (
            <div className="ml-8 text-sm text-gray-600 space-y-1">
              <div>
                <span className="font-medium">Gửi tin nhắn:</span>{" "}
                {groupData.settings.who_can_send_messages === "all"
                  ? "Tất cả thành viên"
                  : "Chỉ quản trị viên"}
              </div>
              <div>
                <span className="font-medium">Thêm thành viên:</span>{" "}
                {groupData.settings.who_can_add_members === "all"
                  ? "Tất cả thành viên"
                  : "Chỉ quản trị viên"}
              </div>
              <div>
                <span className="font-medium">Chia sẻ link:</span>{" "}
                {groupData.settings.who_can_share_invite_link === "all"
                  ? "Tất cả thành viên"
                  : "Chỉ quản trị viên"}
              </div>
            </div>
          )}
        </div>

        {/* Rời nhóm */}
        <div
          className="px-4 py-3 flex items-center text-red-500 cursor-pointer"
          onClick={handleLeaveGroup}
        >
          <MdLogout className="mr-3" size={20} />
          <div className="font-medium">Rời nhóm</div>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;
