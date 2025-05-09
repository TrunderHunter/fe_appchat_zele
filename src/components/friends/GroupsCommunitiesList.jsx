import React, { useState, useEffect } from "react";
import { HiOutlineUserGroup } from "react-icons/hi2";
import { Search, ChevronDown, Plus, UserRound } from "lucide-react";
import useGroupStore from "../../stores/groupStore";
import useGroupSocket from "../../hooks/useGroupSocket";
import useAuthStore from "../../stores/authStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import CreateGroupModal from "../group/CreateGroupModal";

const GroupsCommunitiesList = () => {
  const { groups, isLoading, fetchUserGroups, error } = useGroupStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");
  const [sortOrder, setSortOrder] = useState("recent");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Lấy danh sách nhóm khi component mount
  useEffect(() => {
    fetchUserGroups();
  }, [fetchUserGroups]);

  // Xử lý lỗi
  useEffect(() => {
    if (error) {
      // Chỉ hiển thị thông báo lỗi nếu không phải là "không tìm thấy"
      if (!error.includes("không tìm thấy") && !error.includes("not found")) {
        toast.error(error);
      }
    }
  }, [error]);

  // Lọc nhóm theo tìm kiếm
  const filteredGroups = React.useMemo(() => {
    return groups.filter((group) =>
      group.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [groups, searchText]);

  // Sắp xếp nhóm
  const sortedGroups = React.useMemo(() => {
    let result = [...filteredGroups];

    switch (sortOrder) {
      case "recent":
        return result.sort(
          (a, b) =>
            new Date(b.updated_at || b.created_at) -
            new Date(a.updated_at || a.created_at)
        );
      case "name-asc":
        return result.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return result.sort((a, b) => b.name.localeCompare(a.name));
      case "members":
        return result.sort(
          (a, b) => (b.members?.length || 0) - (a.members?.length || 0)
        );
      default:
        return result;
    }
  }, [filteredGroups, sortOrder]);

  // Chuyển hướng đến trang tin nhắn với nhóm được chọn
  const openGroupChat = (groupId) => {
    if (groupId) {
      navigate(`/messages?group=${groupId}`);
    }
  };

  // Mở modal tạo nhóm
  const handleCreateGroup = () => {
    setCreateModalOpen(true);
  };

  // Đóng modal tạo nhóm
  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
  };

  // Render item nhóm
  const renderGroupItem = (group) => {
    const memberCount = group.members?.length || 0;
    const isAdmin = group.members?.some(
      (m) => (m.user._id || m.user) === user._id && m.role === "admin"
    );

    return (
      <div
        key={group._id}
        className="flex items-center justify-between px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
        onClick={() => openGroupChat(group._id)}
      >
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200 flex items-center justify-center">
            {group.avatar ? (
              <img
                src={group.avatar}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <HiOutlineUserGroup size={24} className="text-gray-500" />
            )}
          </div>
          <div>
            <div className="flex items-center">
              <h3 className="font-medium">{group.name}</h3>
              {isAdmin && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{memberCount} thành viên</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Danh sách nhóm và cộng đồng</h1>
        </div>
      </div>

      <div className="p-4">
        {/* Thanh tìm kiếm và Bộ lọc */}
        <div className="flex items-center justify-between w-full gap-2">
          {/* Thanh tìm kiếm */}
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tìm nhóm"
              className="w-full border rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* Bộ lọc sắp xếp */}
          <div className="relative w-1/3 flex-shrink-0">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full border rounded-lg px-2 py-2 pr-6 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="recent">Gần đây nhất</option>
              <option value="name-asc">Tên (A-Z)</option>
              <option value="name-desc">Tên (Z-A)</option>
              <option value="members">Số thành viên</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Danh sách nhóm */}
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Đang tải danh sách nhóm...</p>
          </div>
        ) : sortedGroups.length === 0 ? (
          <div className="text-gray-500 flex flex-col items-center justify-center h-64">
            <div className="bg-gray-100 rounded-full p-6 mb-4">
              <HiOutlineUserGroup size={48} className="text-gray-400" />
            </div>
            <p>
              {searchText
                ? "Không tìm thấy nhóm nào"
                : "Bạn chưa tham gia nhóm nào"}
            </p>
            <button
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
              onClick={handleCreateGroup}
            >
              Tạo nhóm mới
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {sortedGroups.map(renderGroupItem)}
          </div>
        )}
      </div>

      {/* Modal tạo nhóm */}
      {createModalOpen && (
        <CreateGroupModal
          isOpen={createModalOpen}
          onClose={handleCloseCreateModal}
        />
      )}
    </div>
  );
};

export default GroupsCommunitiesList;
