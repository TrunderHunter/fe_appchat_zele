import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { MoreHorizontal } from "lucide-react";
import ConversationItem from "./ConversationItem";
import useConversationStore from "../../stores/conversationStore";
import useAuthStore from "../../stores/authStore";
import { toast } from "react-hot-toast";
import useGroupStore from "../../stores/groupStore";

// Hàm lấy tên của cuộc trò chuyện
const getConversationName = (conversation, currentUserId) => {
  // Nếu là nhóm và đã có tên
  if (conversation.type === "group" && conversation.name) {
    return conversation.name;
  }

  // Nếu là cuộc trò chuyện 1-1, lấy tên của người còn lại
  if (conversation.participants) {
    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== currentUserId
    );

    return otherParticipant?.name || "Người dùng";
  }

  return "Cuộc trò chuyện mới";
};

// Hàm lấy avatar của cuộc trò chuyện
const getConversationAvatar = (conversation, currentUserId) => {
  // Nếu là nhóm hoặc đã có avatar
  if (conversation.type === "group" || conversation.avatar) {
    return conversation.avatar;
  }

  // Nếu là cuộc trò chuyện 1-1, lấy avatar của người còn lại
  if (conversation.participants) {
    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== currentUserId
    );

    return otherParticipant?.primary_avatar || "";
  }

  return "";
};

// Hàm lấy preview tin nhắn cuối cùng
const getLastMessagePreview = (lastMessage) => {
  if (!lastMessage) return "Chưa có tin nhắn";

  if (lastMessage.is_revoked) return "Tin nhắn đã bị thu hồi";

  switch (lastMessage.message_type) {
    case "text":
      return lastMessage.content || "";
    case "image":
      return "Đã gửi một hình ảnh";
    case "video":
      return "Đã gửi một video";
    case "file":
      return "Đã gửi một tập tin";
    case "voice":
      return "Đã gửi tin nhắn thoại";
    default:
      return "Tin nhắn mới";
  }
};

// Hàm định dạng thời gian tin nhắn
const formatMessageTime = (timestamp) => {
  if (!timestamp) return "";

  const messageDate = new Date(timestamp);
  const now = new Date();
  const diffInMs = now - messageDate;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    // Hôm nay: hiển thị giờ:phút
    return messageDate.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffInDays === 1) {
    return "Hôm qua";
  } else if (diffInDays < 7) {
    return `${diffInDays} ngày`;
  } else {
    return messageDate.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  }
};

// Hàm kiểm tra xem người tham gia có đang hoạt động không (tam thời giả lập)
const isParticipantActive = (conversation, currentUserId) => {
  // Đây chỉ là placeholder, sẽ được thay thế bằng logic từ online status thực tế
  return Math.random() > 0.5; // Giả lập status ngẫu nhiên
};

const ConversationList = memo(
  ({ onSelectConversation, selectedConversation }) => {
    const [activeTab, setActiveTab] = useState("all");
    const { user } = useAuthStore();
    const { fetchGroupDetails } = useGroupStore();

    // Sử dụng selectors cụ thể để tránh re-render khi các phần khác của store thay đổi
    const conversations = useConversationStore((state) => state.conversations);
    const fetchConversations = useConversationStore(
      (state) => state.fetchConversations
    );

    const setCurrentConversation = useConversationStore(
      (state) => state.setCurrentConversation
    );
    const isLoadingConversations = useConversationStore(
      (state) => state.isLoadingConversations
    );
    const error = useConversationStore((state) => state.error);

    const loadConversations = async () => {
      try {
        await fetchConversations();
      } catch (err) {
        // Bỏ qua lỗi 404 (không có cuộc trò chuyện)
        if (!(err.response && err.response.status === 404)) {
          console.error("Error loading conversations:", err);
        }
      }
    };

    // Fetch conversations khi component mount
    useEffect(() => {
      loadConversations();
    }, [fetchConversations]);

    // Xử lý thông báo lỗi - chỉ hiển thị các lỗi quan trọng
    useEffect(() => {
      if (
        error &&
        !error.includes("not found") &&
        !error.includes("Không thể tải") &&
        !error.includes("Không tìm thấy")
      ) {
        toast.error(error);
      }
    }, [error]);

    // Lọc cuộc trò chuyện theo tab - sử dụng useMemo để tránh tính toán lại khi render
    const filteredConversations = useMemo(() => {
      // Ensure conversations is an array before filtering
      const conversationsArray = Array.isArray(conversations)
        ? conversations
        : [];

      // Lọc theo tab
      const filtered = conversationsArray.filter((conversation) => {
        if (activeTab === "all") return true;
        if (activeTab === "unread") {
          // Thêm logic lọc tin nhắn chưa đọc khi API hỗ trợ
          return conversation.hasUnreadMessages;
        }
        return true;
      });

      // Sắp xếp theo thời gian tin nhắn mới nhất
      return filtered.sort((a, b) => {
        const timeA =
          a.last_message?.timestamp || a.updated_at || a.created_at || 0;
        const timeB =
          b.last_message?.timestamp || b.updated_at || b.created_at || 0;
        return new Date(timeB) - new Date(timeA);
      });
    }, [conversations, activeTab]);

    // Sử dụng useCallback để tránh tạo lại hàm khi render
    const handleSelectConversation = useCallback(
      async (conversation) => {
        try {
          await setCurrentConversation(conversation);
          onSelectConversation(conversation);
        } catch (error) {
          // Chỉ hiển thị lỗi nếu không phải lỗi không tìm thấy tin nhắn
          if (!(error.response && error.response.status === 404)) {
            toast.error("Không thể mở cuộc trò chuyện");
          }
        }
      },
      [setCurrentConversation, onSelectConversation]
    );

    // Tạo memoized handlers cho tabs để tránh tạo lại các hàm này mỗi khi render
    const setAllTab = useCallback(() => setActiveTab("all"), []);
    const setUnreadTab = useCallback(() => setActiveTab("unread"), []);

    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 flex-shrink-0">
          <button
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === "all"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-500"
            }`}
            onClick={setAllTab}
          >
            Tất cả
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === "unread"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-500"
            }`}
            onClick={setUnreadTab}
          >
            Chưa đọc
          </button>
        </div>

        {/* Conversation List - Thêm pb-16 để đảm bảo không bị che phủ phía dưới */}
        <div className="flex-1 overflow-y-auto pb-14">
          {isLoadingConversations ? (
            <div className="flex justify-center items-center h-full">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => {
              // Memoize các props của conversation để giảm tính toán
              const conversationProps = {
                id: conversation._id,
                name:
                  conversation.name ||
                  getConversationName(conversation, user?._id),
                avatar:
                  conversation.avatar ||
                  getConversationAvatar(conversation, user?._id),
                lastMessage: getLastMessagePreview(conversation.last_message),
                time: formatMessageTime(
                  conversation.last_message?.timestamp ||
                    conversation.updated_at
                ),
                unread: false, // Cập nhật khi API hỗ trợ
                isActive: isParticipantActive(conversation, user?._id),
                type: conversation.type,
                members: conversation.participants?.length,
              };

              // Tạo handler cho conversation cụ thể này
              const handleClick = () => handleSelectConversation(conversation);

              return (
                <ConversationItem
                  key={conversation._id}
                  conversation={conversationProps}
                  isSelected={selectedConversation?._id === conversation._id}
                  onClick={handleClick}
                />
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-56 text-gray-500">
              <p>Chưa có cuộc trò chuyện nào</p>
              <p className="text-sm mt-2">
                Bắt đầu trò chuyện với bạn bè của bạn!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default ConversationList;
