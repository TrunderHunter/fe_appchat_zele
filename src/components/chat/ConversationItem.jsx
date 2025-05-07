import { MapPin, MoreVertical } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const ConversationItem = ({ conversation, isSelected, onClick }) => {
  const {
    id,
    name,
    avatar,
    lastMessage,
    time,
    unread,
    isActive,
    type,
    members,
    location,
  } = conversation;

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Xử lý avatar (mặc định hoặc avatar nhóm)
  const getAvatar = () => {
    if (avatar) return avatar;

    // Tạo avatar với chữ cái đầu tiên
    const initial = name.charAt(0).toUpperCase();

    // Màu nền cố định cho avatar nhóm không có hình đại diện
    const colorOptions = [
      "5F9EA0", // Cadet Blue
      "6495ED", // Cornflower Blue
      "4682B4", // Steel Blue
      "008080", // Teal
      "1E90FF", // Dodger Blue
      "4169E1", // Royal Blue
      "6A5ACD", // Slate Blue
      "7B68EE", // Medium Slate Blue
      "9370DB", // Medium Purple
      "8A2BE2", // Blue Violet
      "DA70D6", // Orchid
    ];

    // Sử dụng id hoặc name để tạo một số ngẫu nhiên nhưng cố định cho mỗi nhóm
    const getConsistentColor = (identifier) => {
      // Nếu không có ID, sử dụng tên nhóm
      const seed = identifier || name || Math.random().toString();

      // Tính tổng mã ASCII của chuỗi để tạo số hash
      let hashCode = 0;
      for (let i = 0; i < seed.length; i++) {
        hashCode += seed.charCodeAt(i);
      }

      // Lấy màu dựa trên hash
      return colorOptions[hashCode % colorOptions.length];
    };

    // Nếu là nhóm, tạo avatar với màu nền cố định theo ID nhóm
    if (type === "group") {
      const color = getConsistentColor(id);
      return `https://ui-avatars.com/api/?name=${initial}&background=${color}&color=fff&size=48&bold=true`;
    }

    // Avatar mặc định cho cuộc trò chuyện cá nhân
    return `https://ui-avatars.com/api/?name=${initial}&background=random&color=fff&size=40`;
  };

  // Handle right-click (context menu)
  const handleContextMenu = (e) => {
    e.preventDefault();
    setShowMenu(true);
  };

  // Handle menu button click
  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  // Handle menu item click
  const handleMenuItemClick = (action, e) => {
    e.stopPropagation();
    setShowMenu(false);
    // Handle different actions
    console.log(`Action: ${action} for conversation: ${name}`);
    // Here you would implement the actual functionality
  };

  return (
    <div
      className={`p-3 flex cursor-pointer hover:bg-gray-100 relative ${
        isSelected ? "bg-gray-100" : ""
      }`}
      onClick={onClick}
      onContextMenu={handleContextMenu}
    >
      <div className="relative mr-3">
        <div className="w-12 h-12 rounded-full overflow-hidden">
          <img
            src={getAvatar()}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>

        {type === "group" && members && (
          <span className="absolute -bottom-1 -right-1 bg-gray-200 text-xs px-1 rounded-full">
            {members}
          </span>
        )}

        {isActive && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
        )}
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-sm">{name}</h4>
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-1">{time}</span>
            <button
              ref={buttonRef}
              className="p-1 rounded-full hover:bg-gray-200 relative"
              onClick={handleMenuClick}
            >
              <MoreVertical size={16} className="text-gray-500" />

              {/* Conversation Menu Dropdown */}
              {showMenu && (
                <div
                  ref={menuRef}
                  className="absolute bg-white rounded-md shadow-lg z-50 border border-gray-200 top-full right-0 w-48 mt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-2">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={(e) => handleMenuItemClick("pin", e)}
                    >
                      Ghim hội thoại
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={(e) => handleMenuItemClick("classify", e)}
                    >
                      Phân loại
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={(e) => handleMenuItemClick("markUnread", e)}
                    >
                      Đánh dấu chưa đọc
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={(e) => handleMenuItemClick("addToGroup", e)}
                    >
                      Thêm vào nhóm
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={(e) =>
                        handleMenuItemClick("muteNotifications", e)
                      }
                    >
                      Tắt thông báo
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={(e) =>
                        handleMenuItemClick("hideConversation", e)
                      }
                    >
                      Ẩn trò chuyện
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                      onClick={(e) => handleMenuItemClick("delete", e)}
                    >
                      Xóa hội thoại
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                      onClick={(e) => handleMenuItemClick("report", e)}
                    >
                      Báo xấu
                    </button>
                  </div>
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {location && <MapPin size={12} className="text-gray-500" />}
          <p
            className={`text-sm truncate ${
              unread ? "font-medium" : "text-gray-500"
            }`}
          >
            {lastMessage}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
