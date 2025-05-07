import { useEffect, useState } from "react";
import socketManager from "../services/SocketManager";
import useConversationStore from "../stores/conversationStore";
import useAuthStore from "../stores/authStore";
import { toast } from "react-hot-toast";

const useMessageSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuthStore();
  const {
    addNewMessage,
    addNewConversation,
    updateLastMessage,
    fetchConversations,
  } = useConversationStore();

  useEffect(() => {
    if (!user) {
      console.log("useMessageSocket: No user logged in, skipping socket setup");
      return;
    }

    console.log(
      "useMessageSocket: Setting up socket listeners for user",
      user._id
    );

    // Lấy socket đã được khởi tạo từ SocketManager
    const socket = socketManager.getSocket();
    if (!socket) {
      console.warn("useMessageSocket: No socket instance available");
      return;
    }

    // Kiểm tra trạng thái kết nối
    setIsConnected(socketManager.isSocketConnected());

    // Theo dõi thay đổi trạng thái kết nối
    const unsubscribe = socketManager.onConnectionChange((connected) => {
      console.log("Socket connection status changed:", connected);
      setIsConnected(connected);
    });

    // Lắng nghe khi có tin nhắn mới
    socket.on("receiveMessage", (message) => {
      console.log("🔔 Received new message via socket:", message);
      addNewMessage(message);
    });

    // Lắng nghe khi có tin nhắn nhóm mới
    socket.on("receiveGroupMessage", ({ message, conversationId }) => {
      console.log("🔔 Received new group message via socket:", {
        message,
        conversationId,
      });
      addNewMessage({ ...message, conversation_id: conversationId });
    });

    // Lắng nghe khi có cuộc trò chuyện mới
    socket.on("newConversation", (data) => {
      console.log("🔔 Received new conversation via socket:", data);

      // Kiểm tra cấu trúc dữ liệu và trích xuất đúng đối tượng conversation
      const conversation = data.conversation || data;
      const group = data.group;

      // Nếu có thông tin group, kết hợp dữ liệu từ group vào conversation
      if (group && conversation) {
        // Đảm bảo conversation có đủ thông tin từ group
        conversation.name = conversation.name || group.name;
        conversation.avatar = conversation.avatar || group.avatar;
        conversation.type = conversation.type || "group";
        conversation.group_id = conversation.group_id || group._id;

        // Đảm bảo participants chứa đúng thành viên từ group
        if (
          group.members &&
          (!conversation.participants || conversation.participants.length === 0)
        ) {
          conversation.participants = group.members.map((member) => ({
            user_id: member.user._id || member.user,
            name: member.user.name,
          }));
        }
      }

      addNewConversation(conversation);
    });

    // Lắng nghe khi có tin nhắn cuối cùng được cập nhật
    socket.on("updateLastMessage", (conversation) => {
      console.log(
        "🔔 Updating last message for conversation:",
        conversation._id
      );
      updateLastMessage(conversation._id, conversation.last_message);
    });

    // Lắng nghe khi thông tin cuộc trò chuyện được cập nhật
    socket.on(
      "conversationInfoUpdated",
      ({ conversationId, name, avatar, conversation }) => {
        console.log("🔔 Conversation info updated:", conversationId);
        // Cập nhật thông tin cuộc trò chuyện trong store
        fetchConversations().catch((err) => {
          console.error("Error fetching conversations after update:", err);
        });
      }
    );

    // Lắng nghe khi có tin nhắn bị thu hồi
    socket.on("messageRevoked", ({ messageId, is_revoked }) => {
      console.log("🔔 Message revoked:", messageId);
      // Cập nhật UI để hiển thị tin nhắn đã bị thu hồi
      // Có thể thêm logic xử lý tin nhắn bị thu hồi ở đây
    });

    // Lắng nghe khi trạng thái tin nhắn thay đổi
    socket.on("messageStatusUpdated", ({ messageId, status }) => {
      console.log("🔔 Message status updated:", { messageId, status });
      // Cập nhật UI để hiển thị trạng thái mới của tin nhắn
      // Có thể thêm logic xử lý trạng thái tin nhắn ở đây
    });

    // Lắng nghe các lỗi từ server
    socket.on("error", (error) => {
      console.error("Socket error received:", error);
      // Chỉ hiển thị lỗi nếu là lỗi quan trọng
      if (typeof error === "object" && error.message) {
        if (
          !error.message.includes("not found") &&
          !error.message.includes("Không thể tải")
        ) {
          toast.error(`Lỗi: ${error.message}`);
        }
      }
    });

    // Cleanup function
    return () => {
      console.log("useMessageSocket: Cleaning up socket listeners");
      socket.off("receiveMessage");
      socket.off("receiveGroupMessage");
      socket.off("newConversation");
      socket.off("updateLastMessage");
      socket.off("conversationInfoUpdated");
      socket.off("messageRevoked");
      socket.off("messageStatusUpdated");
      socket.off("error");
      unsubscribe(); // Hủy đăng ký theo dõi thay đổi trạng thái kết nối
    };
  }, [
    user,
    addNewMessage,
    addNewConversation,
    updateLastMessage,
    fetchConversations,
  ]);

  return { isConnected };
};

export default useMessageSocket;
