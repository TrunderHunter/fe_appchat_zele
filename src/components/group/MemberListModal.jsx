import React, { useState, useRef, useEffect } from "react";
import {
  X,
  MoreVertical,
  UserPlus,
  UserMinus,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import useAuthStore from "../../stores/authStore";
import useGroupStore from "../../stores/groupStore";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import AddMemberModal from "./AddMemberModal";

const MemberListModal = ({ isOpen, onClose, group, onBack }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activePopupMemberId, setActivePopupMemberId] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const popupRef = useRef(null);
  const { user } = useAuthStore();
  const { removeMember, changeRole, transferOwnership } = useGroupStore();
  const navigate = useNavigate(); // Kiểm tra vai trò của người dùng hiện tại trong nhóm
  const currentUserMember = group?.members?.find(
    (member) =>
      (typeof member.user === "object" ? member.user._id : member.user) ===
      user?._id
  );

  // Xác định vai trò cụ thể
  const currentUserRole = currentUserMember?.role || "member";
  const isAdmin = currentUserRole === "admin";
  const isModerator = currentUserRole === "moderator";
  const isCreator = group?.creator === user?._id;

  // Lọc danh sách thành viên theo từ khóa tìm kiếm
  const filteredMembers = React.useMemo(() => {
    if (!group?.members) return [];

    return group.members.filter((member) => {
      const memberName =
        typeof member.user === "object"
          ? member.user?.name || ""
          : member.displayName || "Thành viên";

      const search = searchTerm || "";

      return memberName.toLowerCase().includes(search.toLowerCase());
    });
  }, [group?.members, searchTerm]);

  // Đóng popup khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setActivePopupMemberId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Xử lý đổi thành viên thành admin
  const handleMakeAdmin = async (memberId) => {
    if (!group?._id || !memberId) return;

    try {
      await changeRole(group._id, memberId, "admin");
      setActivePopupMemberId(null);
      toast.success("Đã cấp quyền quản trị viên");
    } catch (error) {
      console.error("Error making member admin:", error);
      toast.error("Không thể cấp quyền quản trị viên");
    }
  };

  // Xử lý gán quyền Moderator
  const handleMakeModerator = async (memberId) => {
    try {
      if (!group?._id) return;
      await changeRole(group._id, memberId, "moderator");
      toast.success("Đã cấp quyền điều hành viên");
      setActivePopupMemberId(null); // Đóng popup sau khi thực hiện
    } catch (error) {
      console.error("Error making moderator:", error);
      toast.error("Không thể cấp quyền điều hành viên");
    }
  };

  // Xử lý thu hồi quyền, chuyển về thành viên thường
  const handleDemoteToMember = async (memberId) => {
    try {
      if (!group?._id) return;
      await changeRole(group._id, memberId, "member");
      toast.success("Đã thu hồi quyền");
      setActivePopupMemberId(null); // Đóng popup sau khi thực hiện
    } catch (error) {
      console.error("Error demoting to member:", error);
      toast.error("Không thể thu hồi quyền");
    }
  };

  // Xử lý xóa thành viên khỏi nhóm
  const handleRemoveMember = async (memberId) => {
    if (!group?._id || !memberId) return;

    try {
      // Tìm thông tin của thành viên để hiển thị trong thông báo
      const memberToRemove = filteredMembers.find(
        (m) => (typeof m.user === "object" ? m.user._id : m.user) === memberId
      );

      const memberName =
        memberToRemove &&
        (typeof memberToRemove.user === "object"
          ? memberToRemove.user.name
          : memberToRemove.displayName || "thành viên này");

      // Lấy thông tin vai trò của người bị xóa để hiện thị thông báo phù hợp
      const memberRole = memberToRemove?.role || "member";

      // Hiển thị thông báo xác nhận khác nhau cho admin và moderator
      let confirmMessage = `Bạn có chắc muốn xóa ${memberName} khỏi nhóm?`;

      if (isModerator && !isAdmin && memberRole === "member") {
        confirmMessage = `Với tư cách điều hành viên, bạn có chắc muốn xóa thành viên ${memberName} khỏi nhóm?`;
      }

      const confirmed = window.confirm(confirmMessage);

      if (confirmed) {
        const loadingToast = toast.loading("Đang xóa thành viên...");
        try {
          await removeMember(group._id, memberId);

          // Hiển thị thông báo với quyền hạn tương ứng
          if (isAdmin) {
            toast.success(`Quản trị viên đã xóa ${memberName} khỏi nhóm`);
          } else if (isModerator) {
            toast.success(`Điều hành viên đã xóa ${memberName} khỏi nhóm`);
          } else {
            toast.success(`Đã xóa ${memberName} khỏi nhóm`);
          }

          setActivePopupMemberId(null);
        } catch (error) {
          console.error("Error removing member:", error);
          const errorMessage =
            error.response?.data?.message ||
            (isModerator
              ? "Điều hành viên chỉ có thể xóa thành viên thường"
              : "Không thể xóa thành viên");
          toast.error(errorMessage);
        } finally {
          toast.dismiss(loadingToast);
        }
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast.dismiss();
      toast.error(error.message || "Không thể xóa thành viên");
    }
  };

  // Xử lý gửi tin nhắn riêng cho thành viên
  const handlePrivateMessage = (memberId, memberName) => {
    // Chuyển hướng đến cuộc trò chuyện với thành viên đó
    // Lưu ý: Cần thêm logic tạo cuộc trò chuyện mới nếu chưa tồn tại
    toast.success(`Bắt đầu trò chuyện với ${memberName}`);
    setActivePopupMemberId(null);
    onClose(); // Đóng các modal
    navigate("/messenger"); // Chuyển về trang messenger
  };

  // Hàm xử lý hiển thị popup và tính toán vị trí
  const handleTogglePopup = (memberId, event) => {
    // Ngăn sự kiện nổi bọt để tránh click outside handler gọi ngay lập tức
    event.stopPropagation();

    if (activePopupMemberId === memberId) {
      setActivePopupMemberId(null);
      return;
    }

    // Tính toán vị trí popup dựa trên vị trí nút được nhấp
    const rect = event.currentTarget.getBoundingClientRect();
    setPopupPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX - 150, // Dịch sang trái để đảm bảo menu nằm bên phải nút
    });

    setActivePopupMemberId(memberId);
  };

  // Xử lý mở modal thêm thành viên
  const handleOpenAddMemberModal = () => {
    setShowAddMemberModal(true);
  };

  // Xử lý đóng modal thêm thành viên và quay lại danh sách thành viên
  const handleCloseAddMemberModal = () => {
    setShowAddMemberModal(false);
  };

  if (!isOpen) return null;

  // Nếu đang hiển thị modal thêm thành viên
  if (showAddMemberModal) {
    return (
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={onClose}
        onBack={handleCloseAddMemberModal}
        group={group}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-md w-full max-w-md relative">
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b">
          <div className="flex items-center">
            <button
              className="p-1 rounded-full hover:bg-gray-100 mr-2"
              onClick={onBack}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h3 className="font-medium text-lg">Danh sách thành viên</h3>
          </div>
          <button
            className="p-1 hover:bg-gray-100 rounded-full"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Thêm thành viên button */}
        <div className="p-4 border-b">
          <button
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center"
            onClick={handleOpenAddMemberModal}
          >
            <UserPlus size={20} className="mr-2" />
            <span className="font-medium">Thêm thành viên</span>
          </button>
        </div>

        {/* Danh sách thành viên */}
        <div className="max-h-[400px] overflow-y-auto">
          <div className="px-4 py-3 flex items-center justify-between border-b">
            <h4 className="font-medium">
              Danh sách thành viên ({filteredMembers.length})
            </h4>
            <button className="p-1">
              <MoreVertical size={20} />
            </button>
          </div>

          <div className="divide-y">
            {filteredMembers.map((member) => {
              const memberUser =
                typeof member.user === "object" ? member.user : null;
              const memberId = memberUser?._id || member.user;
              const memberName =
                memberUser?.name || member.displayName || "Thành viên";
              const memberAvatar = memberUser?.primary_avatar;
              const isCurrentUser = memberId === user?._id;
              const memberRole = member.role || "member";

              return (
                <div
                  key={memberId}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 relative"
                >
                  <div className="flex items-center">
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
                    <div>
                      <div className="flex items-center">
                        {" "}
                        <h3 className="font-medium">
                          {isCurrentUser ? "Bạn" : memberName}
                        </h3>
                        {memberRole === "admin" && (
                          <span className="ml-2 text-xs text-gray-500">
                            Trưởng nhóm
                          </span>
                        )}
                        {memberRole === "moderator" && (
                          <span className="ml-2 text-xs text-blue-500">
                            Điều hành viên
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nếu là admin hoặc là thành viên khác */}
                  {(isAdmin || !isCurrentUser) && (
                    <button
                      className="p-1.5 rounded-full hover:bg-gray-200"
                      onClick={(e) => handleTogglePopup(memberId, e)}
                    >
                      <MoreVertical size={18} />
                    </button>
                  )}
                </div>
              );
            })}

            {filteredMembers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Không tìm thấy thành viên nào
              </div>
            )}
          </div>
        </div>
      </div>

      {activePopupMemberId && (
        <div
          ref={popupRef}
          className="fixed bg-white shadow-lg rounded-md py-1 z-[51] min-w-[180px] border border-gray-200"
          style={{
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
          }}
        >
          {/* Menu tùy chọn cho từng thành viên */}
          {filteredMembers.map((member) => {
            const memberUser =
              typeof member.user === "object" ? member.user : null;
            const memberId = memberUser?._id || member.user;
            const memberName =
              memberUser?.name || member.displayName || "Thành viên";

            if (memberId !== activePopupMemberId) return null;

            const isCurrentUser = memberId === user?._id;
            const memberRole = member.role || "member";
            const isCreator = group?.creator === memberId;

            return (
              <div key={`popup-${memberId}`}>
                {/* Nhắn tin riêng */}{" "}
                {!isCurrentUser && (
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                    onClick={() => handlePrivateMessage(memberId, memberName)}
                  >
                    <MessageSquare size={16} className="mr-2" />
                    <span>Nhắn tin riêng</span>
                  </button>
                )}
                {/* Cấp quyền admin - chỉ hiển thị với admin */}
                {isAdmin && !isCurrentUser && memberRole !== "admin" && (
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                    onClick={() => handleMakeAdmin(memberId)}
                  >
                    <ShieldCheck size={16} className="mr-2" />
                    <span>Chuyển quyền admin</span>
                  </button>
                )}
                {/* Cấp quyền moderator - chỉ hiển thị với admin và khi thành viên là member thường */}
                {isAdmin && !isCurrentUser && memberRole === "member" && (
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                    onClick={() => handleMakeModerator(memberId)}
                  >
                    <ShieldCheck size={16} className="mr-2" />
                    <span>Cấp quyền điều hành viên</span>
                  </button>
                )}
                {/* Thu hồi quyền moderator - chỉ hiển thị với admin và khi thành viên là moderator */}
                {isAdmin && !isCurrentUser && memberRole === "moderator" && (
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                    onClick={() => handleDemoteToMember(memberId)}
                  >
                    <UserMinus size={16} className="mr-2" />
                    <span>Thu hồi quyền điều hành</span>
                  </button>
                )}{" "}
                {/* Xóa khỏi nhóm - admin có thể xóa bất kỳ thành viên nào (trừ creator), moderator chỉ có thể xóa member thường */}
                {((isAdmin && !isCurrentUser && !isCreator) ||
                  (isModerator &&
                    !isCurrentUser &&
                    memberRole === "member")) && (
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-red-500"
                    onClick={() => handleRemoveMember(memberId)}
                    title={
                      isModerator && !isAdmin
                        ? "Điều hành viên có thể xóa thành viên thường"
                        : "Xóa thành viên khỏi nhóm"
                    }
                  >
                    <UserMinus size={16} className="mr-2" />
                    <span>Xóa khỏi nhóm</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MemberListModal;
