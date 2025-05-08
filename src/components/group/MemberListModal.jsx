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

const MemberListModal = ({ isOpen, onClose, group, onBack }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activePopupMemberId, setActivePopupMemberId] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const popupRef = useRef(null);
  const { user } = useAuthStore();
  const { removeGroupMember, updateGroupMember } = useGroupStore();
  const navigate = useNavigate();

  // Kiểm tra xem người dùng hiện tại có phải là admin của nhóm không
  const isAdmin = group?.members?.some(
    (member) =>
      (typeof member.user === "object" ? member.user._id : member.user) ===
        user?._id && member.role === "admin"
  );

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
      await updateGroupMember(group._id, memberId, { role: "admin" });
      setActivePopupMemberId(null);
      toast.success("Đã cấp quyền quản trị viên");
    } catch (error) {
      console.error("Error making member admin:", error);
      toast.error("Không thể cấp quyền quản trị viên");
    }
  };

  // Xử lý xóa thành viên khỏi nhóm
  const handleRemoveMember = async (memberId) => {
    if (!group?._id || !memberId) return;

    try {
      const confirmed = window.confirm(
        "Bạn có chắc muốn xóa thành viên này khỏi nhóm?"
      );
      if (confirmed) {
        await removeGroupMember(group._id, memberId);
        setActivePopupMemberId(null);
        toast.success("Đã xóa thành viên khỏi nhóm");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Không thể xóa thành viên");
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

  if (!isOpen) return null;

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
          <button className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center">
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
                        <h3 className="font-medium">
                          {isCurrentUser ? "Bạn" : memberName}
                        </h3>
                        {memberRole === "admin" && (
                          <span className="ml-2 text-xs text-gray-500">
                            Trưởng nhóm
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

      {/* Popup Menu - Positioned outside the modal */}
      {activePopupMemberId && (
        <div
          ref={popupRef}
          className="fixed bg-white shadow-lg rounded-md py-1 z-[51] min-w-[180px] border border-gray-200"
          style={{
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
          }}
        >
          {/* Popup content based on selected member */}
          {filteredMembers.map((member) => {
            const memberUser =
              typeof member.user === "object" ? member.user : null;
            const memberId = memberUser?._id || member.user;
            const isCurrentUser = memberId === user?._id;
            const memberRole = member.role || "member";

            if (memberId === activePopupMemberId) {
              return (
                <React.Fragment key={`popup-${memberId}`}>
                  {/* Nếu là admin thì sẽ có chức năng giải tán nhóm */}
                  {isAdmin && memberRole === "admin" && (
                    <button
                      onClick={() => handleRemoveMember(memberId)}
                      className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 text-red-500"
                    >
                      <UserMinus size={16} className="mr-2" />
                      <span>Rời nhóm</span>
                    </button>
                  )}

                  {/* Nếu người dùng hiện tại là admin và thành viên này không phải admin */}
                  {isAdmin && memberRole !== "admin" && !isCurrentUser && (
                    <button
                      onClick={() => handleMakeAdmin(memberId)}
                      className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                    >
                      <ShieldCheck size={16} className="mr-2 text-blue-600" />
                      <span>Cấp quyền quản trị viên</span>
                    </button>
                  )}

                  {/* Xóa khỏi nhóm (chỉ admin mới được xóa và không thể tự xóa mình) */}
                  {isAdmin && !isCurrentUser && (
                    <>
                      <div className="border-t border-gray-200">
                        <button
                          onClick={() => handleRemoveMember(memberId)}
                          className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 text-red-500"
                        >
                          <UserMinus size={16} className="mr-2" />
                          <span>Xóa khỏi nhóm</span>
                        </button>
                      </div>
                    </>
                  )}
                </React.Fragment>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

export default MemberListModal;
