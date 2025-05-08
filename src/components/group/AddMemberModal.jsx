import React, { useState, useEffect, useRef } from "react";
import { X, Search, UserPlus, AlertCircle } from "lucide-react";
import useAuthStore from "../../stores/authStore";
import useFriendStore from "../../stores/friendStore";
import useGroupStore from "../../stores/groupStore";
import { toast } from "react-hot-toast";

const AddMemberModal = ({ isOpen, onClose, group, onBack }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingStatus, setLoadingStatus] = useState({});
  const [loadingFriends, setLoadingFriends] = useState(true);
  const searchRef = useRef(null);
  const { user } = useAuthStore();
  const { friends, fetchFriends } = useFriendStore();
  const { addMember } = useGroupStore();

  // Tải danh sách bạn bè khi modal mở
  useEffect(() => {
    if (isOpen) {
      fetchFriends().finally(() => setLoadingFriends(false));
      // Focus vào ô tìm kiếm
      setTimeout(() => searchRef.current?.focus(), 100);
    }
    return () => {
      // Reset state khi unmount
      setSearchTerm("");
      setLoadingStatus({});
    };
  }, [fetchFriends, isOpen]);

  // Lọc danh sách bạn bè chưa có trong nhóm
  const filteredFriends = React.useMemo(() => {
    if (!friends || !group?.members) return [];

    // Lấy danh sách ID thành viên trong nhóm
    const groupMemberIds = group.members.map((member) =>
      typeof member.user === "object" ? member.user._id : member.user
    );

    // Lọc bạn bè chưa có trong nhóm và tìm theo tên
    return friends
      .filter((friend) => !groupMemberIds.includes(friend._id))
      .filter((friend) =>
        friend.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [friends, group?.members, searchTerm]);

  // Xử lý thêm thành viên sử dụng groupStore
  const handleAddMember = async (friendId) => {
    if (!group?._id || !friendId) return;

    setLoadingStatus((prev) => ({ ...prev, [friendId]: true }));

    try {
      // Sử dụng hàm addMember từ groupStore
      const result = await addMember(group._id, friendId);

      if (result.success) {
        toast.success("Đã thêm thành viên vào nhóm");
      } else {
        toast.error("Không thể thêm thành viên vào nhóm");
      }
    } catch (error) {
      console.error("Lỗi khi thêm thành viên:", error);
      toast.error("Không thể thêm thành viên vào nhóm");
    } finally {
      setLoadingStatus((prev) => ({ ...prev, [friendId]: false }));
    }
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
            <h3 className="font-medium text-lg">Thêm thành viên</h3>
          </div>
          <button
            className="p-1 hover:bg-gray-100 rounded-full"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tìm kiếm */}
        <div className="p-4 border-b">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              ref={searchRef}
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tìm kiếm bạn bè..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Danh sách bạn bè */}
        <div className="max-h-[400px] overflow-y-auto">
          <div className="px-4 py-2 bg-gray-50">
            <h4 className="text-sm text-gray-500">
              Người dùng chưa trong nhóm: {filteredFriends.length}
            </h4>
          </div>

          {loadingFriends ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : filteredFriends.length > 0 ? (
            <div className="divide-y">
              {filteredFriends.map((friend) => (
                <div
                  key={friend._id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50"
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
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600">
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{friend.name}</h3>
                      <p className="text-xs text-gray-500">
                        {friend.phone || friend.email || "Bạn bè"}
                      </p>
                    </div>
                  </div>

                  <button
                    className={`p-2 rounded-full ${
                      loadingStatus[friend._id]
                        ? "bg-gray-100 cursor-not-allowed"
                        : "bg-blue-50 hover:bg-blue-100 text-blue-600"
                    }`}
                    onClick={() => handleAddMember(friend._id)}
                    disabled={loadingStatus[friend._id]}
                  >
                    {loadingStatus[friend._id] ? (
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    ) : (
                      <UserPlus size={18} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-4">
              <AlertCircle size={40} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">
                {friends && friends.length > 0
                  ? "Tất cả bạn bè của bạn đã ở trong nhóm này"
                  : "Bạn chưa có người bạn nào. Hãy kết bạn để thêm thành viên vào nhóm."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
