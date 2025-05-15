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
      console.log("🔔 Received new group message via socket:", message);
      addNewMessage(message, conversationId);
    });

    // Lắng nghe khi có tin nhắn được chuyển tiếp đến cá nhân
    socket.on("messageForwarded", ({ message, conversation }) => {
      console.log("🔔 Received forwarded message via socket:", message);

      // Kiểm tra nếu cuộc trò chuyện là mới
      if (
        !useConversationStore
          .getState()
          .conversations.find((conv) => conv._id === conversation._id)
      ) {
        addNewConversation(conversation);
      }

      // Thêm tin nhắn vào cuộc trò chuyện
      addNewMessage(message);

      // Cập nhật tin nhắn cuối cùng của cuộc trò chuyện
      updateLastMessage(conversation._id, message);

      // Hiển thị thông báo nếu người nhận là người đăng nhập hiện tại
      if (message.receiver_id === user?._id) {
        toast.success("Bạn vừa nhận được một tin nhắn đã chuyển tiếp");
      }
    });
    // Lắng nghe khi có tin nhắn được chuyển tiếp đến nhóm
    socket.on("groupMessageForwarded", ({ message, group, conversationId }) => {
      console.log(
        "🔔 Received group forwarded message via socket:",
        message,
        "conversationId:",
        conversationId
      );

      // Thêm tin nhắn vào cuộc trò chuyện nhóm
      // Ưu tiên sử dụng conversationId được cung cấp trực tiếp
      const targetConversationId = conversationId || message.conversation_id;

      if (targetConversationId) {
        console.log("Adding message to conversation:", targetConversationId);
        addNewMessage(message, targetConversationId);

        // Cập nhật tin nhắn cuối cùng của cuộc trò chuyện
        updateLastMessage(targetConversationId, message);
      } else {
        console.error("No conversation ID found for forwarded group message");
      }

      // Hiển thị thông báo
      toast.success(`Tin nhắn đã được chuyển tiếp đến nhóm ${group.name}`);
    });

    // Lắng nghe lỗi khi chuyển tiếp tin nhắn
    socket.on("messageForwardError", ({ error }) => {
      console.error("Error forwarding message:", error);
      toast.error(`Lỗi khi chuyển tiếp tin nhắn: ${error}`);
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
      console.log("🔔 Updating last message for conversation:", conversation);
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
    ); // Lắng nghe khi có tin nhắn bị thu hồi
    socket.on(
      "messageRevoked",
      ({ messageId, is_revoked, isGroupMessage, conversationId }) => {
        console.log(
          "🔔 Message revoked:",
          messageId,
          isGroupMessage ? "(group message)" : "(direct message)"
        );
        // Chỉ xử lý tin nhắn cá nhân ở đây, tin nhắn nhóm được xử lý trong useGroupSocket
        if (!isGroupMessage) {
          // Cập nhật tin nhắn trong store để hiển thị trạng thái thu hồi
          const { updateRevokedMessage } = useConversationStore.getState();
          updateRevokedMessage(messageId);
          toast.success("Tin nhắn đã được thu hồi");
          toast.dismiss("revoking");
        }
      }
    );

    // Lắng nghe khi trạng thái tin nhắn thay đổi
    socket.on("messageStatusUpdated", ({ messageId, status }) => {
      console.log("🔔 Message status updated:", { messageId, status });
      // Cập nhật UI để hiển thị trạng thái mới của tin nhắn
      // Có thể thêm logic xử lý trạng thái tin nhắn ở đây
    });

    // Lắng nghe các lỗi từ server
    socket.on("error", (error) => {
      console.error("Socket error received:", error);
      // Xử lý lỗi revokeMessage đặc biệt
      if (error === "Error revoking message") {
        toast.dismiss("revoking");
        toast.error(
          "Không thể thu hồi tin nhắn, bạn chỉ có thể thu hồi tin nhắn của mình"
        );
        return;
      }

      // Xử lý lỗi tin nhắn không tồn tại
      if (error === "Message not found") {
        toast.dismiss("revoking");
        toast.error("Tin nhắn không tồn tại hoặc đã bị xóa");
        return;
      }

      // Xử lý lỗi không có quyền thu hồi tin nhắn
      if (error === "You are not allowed to revoke this message") {
        toast.dismiss("revoking");
        toast.error("Bạn không có quyền thu hồi tin nhắn này");
        return;
      }

      // Chỉ hiển thị lỗi nếu là lỗi quan trọng
      if (typeof error === "object" && error.message) {
        if (
          !error.message.includes("not found") &&
          !error.message.includes("Không thể tải")
        ) {
          toast.error(`Lỗi: ${error.message}`);
        }
      } else if (typeof error === "string") {
        // Xử lý lỗi chuỗi không được xử lý bởi các điều kiện trên
        toast.error(`Lỗi: ${error}`);
      }
    });

    // Cleanup function
    return () => {
      console.log("useMessageSocket: Cleaning up socket listeners");
      socket.off("receiveMessage");
      socket.off("receiveGroupMessage");
      socket.off("messageForwarded");
      socket.off("groupMessageForwarded");
      socket.off("messageForwardError");
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
