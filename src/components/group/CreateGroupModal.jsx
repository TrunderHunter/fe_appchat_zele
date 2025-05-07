import { useState, useEffect, useRef } from "react";
import { X, Upload, UserPlus, Trash2 } from "lucide-react";
import useGroupStore from "../../stores/groupStore";
import useAuthStore from "../../stores/authStore";
import useFriendStore from "../../stores/friendStore";
import useConversationStore from "../../stores/conversationStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const { createGroup, error, resetError } = useGroupStore();
  const { friends, fetchFriends } = useFriendStore();
  const { addNewConversation } = useConversationStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Lấy danh sách bạn bè khi modal mở
    if (isOpen) {
      fetchFriends();
      resetError();
    }
  }, [isOpen, fetchFriends, resetError]);

  useEffect(() => {
    // Xử lý lỗi
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Lọc danh sách bạn bè theo tìm kiếm
  const filteredFriends =
    friends?.filter((friend) =>
      friend.name?.toLowerCase().includes(searchText.toLowerCase())
    ) || [];

  // Xử lý khi chọn ảnh đại diện
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // Giới hạn 5MB
        toast.error("Kích thước ảnh quá lớn (tối đa 5MB)");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Xử lý khi xóa ảnh đại diện
  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  // Chọn/bỏ chọn thành viên
  const toggleMember = (friend) => {
    if (selectedMembers.some((member) => member._id === friend._id)) {
      setSelectedMembers((prev) =>
        prev.filter((member) => member._id !== friend._id)
      );
    } else {
      setSelectedMembers((prev) => [...prev, friend]);
    }
  };

  // Tạo nhóm mới
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Tên nhóm không được để trống");
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error("Nhóm phải có ít nhất một thành viên");
      return;
    }

    setIsSubmitting(true);

    try {
      const groupData = {
        name: groupName.trim(),
        description: groupDescription.trim(),
        members: selectedMembers.map((member) => member._id),
        avatar: avatarFile,
      };

      const result = await createGroup(groupData);

      if (result.success) {
        toast.success("Tạo nhóm thành công");

        // Thêm cuộc trò chuyện vào store nếu chưa có
        if (result.conversation) {
          // Kiểm tra xem conversation có đầy đủ thông tin cần thiết không
          const conversationData = {
            _id: result.conversation._id,
            name: result.group.name,
            avatar: result.group.avatar,
            type: "group",
            participants:
              result.conversation.participants ||
              result.group.members.map((m) => ({
                user_id: typeof m.user === "object" ? m.user._id : m.user,
              })),
            group_id: result.group._id,
            created_at:
              result.conversation.created_at || result.group.created_at,
            updated_at:
              result.conversation.updated_at || result.group.updated_at,
          };
          console.log(">>>> Check conversationData group:", conversationData);
          addNewConversation(conversationData);
        }

        // Đóng modal và chuyển đến màn hình chat với nhóm mới
        onClose();

        // Đợi một chút để đảm bảo store được cập nhật trước khi chuyển trang
        setTimeout(() => {
          navigate(`/messages?group=${result.group._id}`);
        }, 300);
      }
    } catch (error) {
      console.error("Error in handleCreateGroup:", error);
      toast.error("Không thể tạo nhóm");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kiểm tra xem bạn có đang được chọn không
  const isMemberSelected = (friendId) => {
    return selectedMembers.some((member) => member._id === friendId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Tạo nhóm mới</h2>
          <button
            className="p-2 rounded-full hover:bg-gray-100"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thông tin nhóm */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Ảnh nhóm
                </label>
                {avatarPreview ? (
                  <div className="relative w-32 h-32 mx-auto">
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={handleRemoveAvatar}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <p className="text-sm text-center text-gray-500">
                      Nhấp để tải ảnh lên
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG (tối đa 5MB)
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên nhóm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Nhập tên nhóm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Mô tả về nhóm của bạn"
                ></textarea>
              </div>

              {/* Danh sách thành viên đã chọn */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Thành viên đã chọn ({selectedMembers.length})
                </label>
                {selectedMembers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map((member) => (
                      <div
                        key={member._id}
                        className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        <span>{member.name}</span>
                        <button
                          onClick={() => toggleMember(member)}
                          className="text-blue-700 hover:text-blue-900"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Chưa có thành viên nào được chọn
                  </p>
                )}
              </div>
            </div>

            {/* Danh sách bạn bè để chọn */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Chọn thành viên từ danh sách bạn bè
              </label>
              <div className="mb-2">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Tìm kiếm bạn bè"
                />
              </div>

              <div className="border rounded-md overflow-hidden h-[350px] overflow-y-auto">
                {filteredFriends.length > 0 ? (
                  filteredFriends.map((friend) => (
                    <div
                      key={friend._id}
                      className={`flex items-center justify-between p-3 border-b cursor-pointer ${
                        isMemberSelected(friend._id)
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => toggleMember(friend)}
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200">
                          {friend.primary_avatar ? (
                            <img
                              src={friend.primary_avatar}
                              alt={friend.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white">
                              {friend.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{friend.name}</h3>
                          <p className="text-xs text-gray-500">
                            {friend.email || friend.phone}
                          </p>
                        </div>
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          checked={isMemberSelected(friend._id)}
                          onChange={() => {}}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-8">
                    <UserPlus size={32} className="text-gray-400 mb-2" />
                    <p className="text-gray-500">Không có bạn bè để hiển thị</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-2">
          <button
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
            onClick={handleCreateGroup}
            disabled={
              isSubmitting || !groupName.trim() || selectedMembers.length === 0
            }
          >
            {isSubmitting ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Đang tạo...
              </>
            ) : (
              "Tạo nhóm"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
