import React from "react";
import { Users, UserPlus } from "lucide-react";
import { HiOutlineUserGroup } from "react-icons/hi2";
import { MdOutlineGroupAdd } from "react-icons/md";
import { FaUserPlus } from "react-icons/fa";
import useFriendStore from "../../stores/friendStore";

const SidebarNavigation = ({ activeTab, setActiveTab, onAddFriendClick }) => {
  const { friendRequests } = useFriendStore();
  const pendingRequestsCount = friendRequests?.length || 0;

  return (
    <div className="flex flex-col gap-1 p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-lg">Friends</h3>
      </div>

      <button
        className={`flex items-center gap-3 px-4 py-3 rounded-md ${
          activeTab === "friends"
            ? "bg-blue-100 text-blue-600"
            : "hover:bg-gray-100"
        }`}
        onClick={() => setActiveTab("friends")}
      >
        <Users size={20} />
        <span className="font-medium">Danh sách bạn bè</span>
      </button>

      <button
        className={`flex items-center gap-3 px-4 py-3 rounded-md ${
          activeTab === "suggestions"
            ? "bg-blue-100 text-blue-600"
            : "hover:bg-gray-100"
        }`}
        onClick={() => setActiveTab("suggestions")}
      >
        <HiOutlineUserGroup size={20} />
        <span className="font-medium">Danh sách nhóm và cộng đồng</span>
      </button>

      <button
        className={`flex items-center gap-3 px-4 py-3 rounded-md relative ${
          activeTab === "requests"
            ? "bg-blue-100 text-blue-600"
            : "hover:bg-gray-100"
        }`}
        onClick={() => setActiveTab("requests")}
      >
        <UserPlus size={20} />
        <span className="font-medium">Lời mời kết bạn</span>

        {pendingRequestsCount > 0 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full">
            {pendingRequestsCount > 9 ? "9+" : pendingRequestsCount}
          </span>
        )}
      </button>

      {/* Lời mời vào nhóm hoặc cộng đồng */}
      <button
        className={`flex items-center gap-3 px-4 py-3 rounded-md ${
          activeTab === "group-invites"
            ? "bg-blue-100 text-blue-600"
            : "hover:bg-gray-100"
        }`}
        onClick={() => setActiveTab("group-invites")}
      >
        <MdOutlineGroupAdd size={20} />
        <span className="font-medium">Lời mời vào nhóm</span>
      </button>
    </div>
  );
};

export default SidebarNavigation;
