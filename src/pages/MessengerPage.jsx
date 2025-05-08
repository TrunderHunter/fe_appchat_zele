import ConversationList from "../components/chat/ConversationList";
import ChatWindow from "../components/chat/ChatWindow";
import SearchBar from "../components/chat/SearchBar";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import useConversationStore from "../stores/conversationStore";
import useGroupStore from "../stores/groupStore";
import useAuthStore from "../stores/authStore";
import { toast } from "react-hot-toast";

const MessengerPage = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  const {
    getOrCreateConversationWithUser,
    getConversationById,
    fetchConversations,
    isLoading,
    error,
    resetError,
    currentConversation,
  } = useConversationStore();

  const { fetchGroupDetails } = useGroupStore();

  // Xử lý khi truy cập trực tiếp từ URL (ví dụ: /messages?friend=123 hoặc /messages?group=123)
  useEffect(() => {
    const friendId = searchParams.get("friend");
    const groupId = searchParams.get("group");

    if (user) {
      if (friendId) {
        initializeConversation(friendId);
      } else if (groupId) {
        initializeGroupConversation(groupId);
      }
    }
  }, [searchParams, user]);

  // Khởi tạo một cuộc trò chuyện với một user khác
  const initializeConversation = async (userId) => {
    try {
      const {
        success,
        conversation,
        error: convError,
      } = await getOrCreateConversationWithUser(userId);
      if (success && conversation) {
        setSelectedConversation(conversation);
      } else if (convError) {
        // Chỉ hiển thị lỗi nếu là lỗi quan trọng, không phải lỗi không tìm thấy cuộc trò chuyện
        if (
          !convError.includes("Không thể tìm") &&
          !convError.includes("not found")
        ) {
          // toast.error(convError);
        }
      }
    } catch (error) {
      // Chỉ hiển thị lỗi nếu thực sự nghiêm trọng
      if (error.response && error.response.status !== 404) {
        toast.error("Không thể tạo cuộc trò chuyện");
      }
    }
  };

  // Khởi tạo cuộc trò chuyện của nhóm
  const initializeGroupConversation = async (groupId) => {
    try {
      console.log("Initializing group conversation for group:", groupId);

      // Đầu tiên lấy thông tin nhóm để có conversation_id
      const { success: groupSuccess, group } = await fetchGroupDetails(groupId);

      if (groupSuccess && group && group.conversation_id) {
        console.log("Found group with conversation_id:", group.conversation_id);

        // Lấy thông tin conversation từ danh sách conversations đang có
        const existingConversations = await fetchConversations();

        // Tìm conversation trong danh sách đã tải
        let conversation = existingConversations?.conversations?.find(
          (conv) => conv._id === group.conversation_id
        );

        // Nếu không tìm thấy, gọi API để lấy
        if (!conversation) {
          console.log("Conversation not found in cache, fetching from API...");
          const { success: convSuccess, conversation: fetchedConv } =
            await getConversationById(group.conversation_id);

          if (convSuccess && fetchedConv) {
            conversation = fetchedConv;
          }
        }

        if (conversation) {
          // Đảm bảo conversation có đúng thông tin type và tên nhóm
          if (conversation.type !== "group") {
            conversation.type = "group";
          }

          // Thêm tên và avatar của nhóm vào conversation nếu chưa có
          if (!conversation.name && group.name) {
            conversation.name = group.name;
          }

          if (!conversation.avatar && group.avatar) {
            conversation.avatar = group.avatar;
          }

          console.log("Setting selected conversation:", conversation);
          setSelectedConversation(conversation);
        } else {
          console.error("Could not load conversation for group:", groupId);
          toast.error("Không thể tải cuộc trò chuyện của nhóm");
        }
      } else {
        console.error("Could not load group details for:", groupId);
        toast.error("Không thể tải thông tin nhóm");
      }
    } catch (error) {
      console.error("Error initializing group conversation:", error);
      toast.error("Có lỗi xảy ra khi tải cuộc trò chuyện");
    }
  };

  // Cập nhật selected conversation khi current conversation thay đổi
  useEffect(() => {
    if (currentConversation) {
      setSelectedConversation(currentConversation);
    }
  }, [currentConversation]);

  // Hiển thị thông báo lỗi nếu có - chỉ hiển thị các lỗi quan trọng
  useEffect(() => {
    if (error) {
      // Bỏ qua các lỗi liên quan đến việc không tìm thấy cuộc trò chuyện
      if (
        !error.includes("not found") &&
        !error.includes("Không thể tìm") &&
        !error.includes("Không thể tải")
      ) {
        toast.error(error);
      }
      resetError();
    }
  }, [error, resetError]);

  return (
    <div className="flex flex-col flex-1 w-full h-full">
      {/* Conversation Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List */}
        <div className="w-[360px] border-r border-gray-200 bg-white overflow-hidden">
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <ConversationList
            onSelectConversation={setSelectedConversation}
            selectedConversation={selectedConversation}
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex overflow-hidden bg-gray-50">
          {selectedConversation ? (
            <ChatWindow conversation={selectedConversation} />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              {isLoading ? (
                <span className="loading loading-spinner loading-md text-primary"></span>
              ) : (
                <p className="text-gray-500">
                  Chọn một cuộc trò chuyện để bắt đầu
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessengerPage;
