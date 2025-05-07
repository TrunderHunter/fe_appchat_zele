import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, MoreHorizontal, ChevronDown, UserRound } from "lucide-react";
import useFriendStore from "../../stores/friendStore";
import { useNavigate } from "react-router-dom";
import FriendPopupMenu from "./FriendPopupMenu";

const FriendList = () => {
  // Avatar mặc định dạng data URI - một hình tròn màu xám (thay vì URL)
  const defaultAvatar =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23CCCCCC'/%3E%3Ctext x='50' y='62' font-size='35' text-anchor='middle' fill='%23FFFFFF'%3EU%3C/text%3E%3C/svg%3E";

  const { friends = [], isLoading, fetchFriends } = useFriendStore();
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");
  const [sortOrder, setSortOrder] = useState("A-Z");
  const [filterType, setFilterType] = useState("all");
  const [activePopup, setActivePopup] = useState(null);

  const popupRef = useRef(null);

  // Đóng popup khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setActivePopup(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch friends when component mounts
  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // Map backend friends data to component format - sử dụng useMemo
  const formattedFriends = useMemo(() => {
    return (friends || []).map((friend) => ({
      id: friend._id,
      name: friend.name,
      avatar: friend.primary_avatar || defaultAvatar,
      status: Math.random() > 0.5 ? "online" : "offline", // Randomly assign status for now
      email: friend.email,
      phone: friend.phone,
    }));
  }, [friends, defaultAvatar]); // Chỉ tính toán lại khi friends thay đổi

  // Lọc và sắp xếp bạn bè - sử dụng useMemo thay vì useEffect
  const filteredFriends = useMemo(() => {
    let result = [...formattedFriends];

    // Lọc theo trạng thái online/offline
    if (filterType !== "all") {
      result = result.filter((friend) => friend.status === filterType);
    }

    // Lọc theo tên
    if (searchText.trim() !== "") {
      result = result.filter((friend) =>
        friend.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Sắp xếp theo tên
    result.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === "A-Z" ? comparison : -comparison;
    });

    return result;
  }, [formattedFriends, filterType, searchText, sortOrder]);

  // Nhóm bạn bè theo chữ cái đầu tiên - sử dụng useMemo thay vì useEffect
  const alphabetGroups = useMemo(() => {
    const groups = {};
    filteredFriends.forEach((friend) => {
      const firstChar = friend.name.charAt(0).toUpperCase();
      if (!groups[firstChar]) {
        groups[firstChar] = [];
      }
      groups[firstChar].push(friend);
    });
    return groups;
  }, [filteredFriends]);

  const startConversation = (friendId) => {
    navigate(`/messages?friend=${friendId}`);
  };

  // Toggle popup menu
  const handleMoreOptionsClick = (e, friendId) => {
    e.stopPropagation();
    setActivePopup(activePopup === friendId ? null : friendId);
  };

  // Handle popup menu options
  const handleViewInfo = (e, friendId) => {
    e.stopPropagation();
    console.log("View info for friend:", friendId);
    // TODO: Implement view info functionality
    setActivePopup(null);
  };

  const handleBlockUser = (e, friendId) => {
    e.stopPropagation();
    console.log("Block user:", friendId);
    // TODO: Implement block user functionality
    setActivePopup(null);
  };

  const handleDeleteFriend = (e, friendId) => {
    e.stopPropagation();
    console.log("Delete friend:", friendId);
    // TODO: Implement delete friend functionality
    setActivePopup(null);
  };

  const handleSetCategory = (e, friendId) => {
    e.stopPropagation();
    console.log("Set category for friend:", friendId);
    // TODO: Implement set category functionality
    setActivePopup(null);
  };

  const handleSetNickname = (e, friendId) => {
    e.stopPropagation();
    console.log("Set nickname for friend:", friendId);
    // TODO: Implement set nickname functionality
    setActivePopup(null);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            Danh sách bạn bè ({formattedFriends.length})
          </h1>
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
              placeholder="Tìm bạn"
              className="w-full border rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* Bộ lọc sắp xếp */}
          <div className="relative w-1/5 flex-shrink-0">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full border rounded-lg px-2 py-2 pr-6 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="A-Z">Tên (A-Z)</option>
              <option value="Z-A">Tên (Z-A)</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>

          {/* Bộ lọc trạng thái */}
          <div className="relative w-1/5 flex-shrink-0">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border rounded-lg px-2 py-2 pr-6 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Danh sách bạn bè */}
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Đang tải danh sách bạn bè...</p>
          </div>
        ) : Object.keys(alphabetGroups).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <div className="bg-gray-100 rounded-full p-6 mb-4">
              <Search size={32} className="text-gray-400" />
            </div>
            <p>
              {searchText.trim()
                ? "Không tìm thấy bạn bè nào"
                : "Bạn chưa có bạn bè nào"}
            </p>
          </div>
        ) : (
          Object.keys(alphabetGroups)
            .sort()
            .map((letter) => (
              <div key={letter} className="mb-1">
                <div className="px-4 py-2 bg-gray-50">
                  <h2 className="font-semibold">{letter}</h2>
                </div>
                {alphabetGroups[letter].map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                    onClick={() => startConversation(friend.id)}
                  >
                    <div className="flex items-center">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3">
                        {friend.avatar ? (
                          <img
                            src={friend.avatar}
                            alt={friend.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                            <UserRound size={20} className="text-gray-500" />
                          </div>
                        )}
                        {friend.status === "online" && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{friend.name}</h3>
                        {friend.phone && (
                          <p className="text-xs text-gray-500">
                            {friend.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <div
                        className="text-gray-500 cursor-pointer p-2 hover:bg-gray-200 rounded-full"
                        onClick={(e) => handleMoreOptionsClick(e, friend.id)}
                      >
                        <MoreHorizontal size={20} />
                      </div>

                      {/* Moved popup menu to a separate component */}
                      {activePopup === friend.id && (
                        <FriendPopupMenu
                          ref={popupRef}
                          friend={friend}
                          onViewInfo={handleViewInfo}
                          onBlockUser={handleBlockUser}
                          onDeleteFriend={handleDeleteFriend}
                          onSetCategory={handleSetCategory}
                          onSetNickname={handleSetNickname}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default FriendList;
