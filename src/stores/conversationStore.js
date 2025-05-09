import { create } from "zustand";
import { persist } from "zustand/middleware";
import conversationService from "../services/conversationService";
import messageService from "../services/messageService";
import toast from "react-hot-toast";
import useAuthStore from "./authStore";

// Biến cờ toàn cục để theo dõi quá trình tạo cuộc trò chuyện
let isCreatingConversationMap = {};

const useConversationStore = create(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversation: null,
      currentMessages: [],
      isLoadingConversations: false,
      isLoadingMessages: false,
      error: null,

      // Lấy danh sách cuộc trò chuyện của người dùng
      fetchConversations: async () => {
        set({ isLoadingConversations: true, error: null });
        try {
          const conversations =
            await conversationService.getUserConversations();
          set({
            conversations: conversations,
            isLoadingConversations: false,
          });
          return { success: true, conversations };
        } catch (error) {
          // Xử lý lỗi một cách yên lặng nếu là 404 (không có cuộc trò chuyện)
          if (error.response && error.response.status === 404) {
            set({
              conversations: [],
              isLoadingConversations: false,
              error: null, // Không đặt error để tránh hiển thị thông báo
            });
            return { success: true, conversations: [] };
          }

          // Đối với các lỗi khác, vẫn đặt error nhưng không hiển thị toast
          set({
            isLoadingConversations: false,
            error:
              error.response?.data?.message || "Không thể tải cuộc trò chuyện",
          });
          return { success: false };
        }
      },

      // Lấy cuộc trò chuyện theo ID (thường dùng cho cuộc trò chuyện nhóm)
      getConversationById: async (conversationId) => {
        set({ isLoadingConversations: true, error: null });
        try {
          const conversation = await conversationService.getConversationById(
            conversationId
          );

          if (!conversation) {
            set({
              isLoadingConversations: false,
              error: "Không tìm thấy cuộc trò chuyện",
            });
            return { success: false, error: "Không tìm thấy cuộc trò chuyện" };
          }

          // Cập nhật danh sách cuộc trò chuyện nếu chưa có
          const conversationExists = get().conversations.some(
            (conv) => conv._id === conversation._id
          );

          if (!conversationExists) {
            set((state) => ({
              conversations: [...state.conversations, conversation],
            }));
          }

          set({ isLoadingConversations: false });
          return { success: true, conversation };
        } catch (error) {
          set({
            isLoadingConversations: false,
            error:
              error.response?.data?.message || "Không thể tải cuộc trò chuyện",
          });
          return { success: false, error: error.message };
        }
      },

      // Lấy cuộc trò chuyện giữa người dùng hiện tại và một người dùng khác
      getOrCreateConversationWithUser: async (userId) => {
        // Kiểm tra xem cuộc trò chuyện đang được tạo không
        const conversationKey = `${useAuthStore.getState().user._id}_${userId}`;
        const reversedKey = `${userId}_${useAuthStore.getState().user._id}`;

        if (
          isCreatingConversationMap[conversationKey] ||
          isCreatingConversationMap[reversedKey]
        ) {
          console.log("Conversation creation already in progress, waiting...");

          // Đợi tối đa 5 giây cho quá trình tạo cuộc trò chuyện hoàn tất
          let waitTime = 0;
          while (
            (isCreatingConversationMap[conversationKey] ||
              isCreatingConversationMap[reversedKey]) &&
            waitTime < 5000
          ) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            waitTime += 200;
          }

          // Kiểm tra lại trong danh sách cuộc trò chuyện hiện có
          const existingConversation = get().conversations.find((conv) => {
            if (
              conv.type === "personal" &&
              conv.participants &&
              conv.participants.length === 2
            ) {
              return conv.participants.some((p) => p.user_id === userId);
            }
            return false;
          });

          if (existingConversation) {
            return await get().setCurrentConversation(existingConversation);
          }
        }

        // Đánh dấu là đang tạo cuộc trò chuyện
        isCreatingConversationMap[conversationKey] = true;

        set({ isLoadingConversations: true, error: null });
        try {
          const currentUser = useAuthStore.getState().user;
          // Lấy cuộc trò chuyện nếu đã tồn tại
          let conversation =
            await conversationService.getConversationBetweenUsers(
              currentUser._id,
              userId
            );

          // Nếu chưa tồn tại cuộc trò chuyện, tạo mới bằng cách gửi tin nhắn đầu tiên
          if (!conversation) {
            await messageService.sendMessage(userId, {
              message_type: "text",
              content: "Xin chào!",
            });

            // Tìm lại cuộc trò chuyện vừa được tạo
            conversation =
              await conversationService.getConversationBetweenUsers(
                currentUser._id,
                userId
              );
          }

          // Sau khi có cuộc trò chuyện, fetch tin nhắn
          if (conversation) {
            set({ isLoadingMessages: true });
            const messages = await messageService.getMessagesByConversationId(
              conversation._id
            );

            set({
              currentConversation: conversation,
              currentMessages: messages,
              isLoadingConversations: false,
              isLoadingMessages: false,
            });

            // Đồng thời cập nhật danh sách cuộc trò chuyện nếu cần
            get().fetchConversations();

            // Xóa cờ đánh dấu
            delete isCreatingConversationMap[conversationKey];

            return { success: true, conversation, messages };
          }

          set({ isLoadingConversations: false });
          // Xóa cờ đánh dấu
          delete isCreatingConversationMap[conversationKey];

          return {
            success: false,
            error: "Không thể tìm hoặc tạo cuộc trò chuyện",
          };
        } catch (error) {
          set({
            isLoadingConversations: false,
            isLoadingMessages: false,
            error:
              error.response?.data?.message || "Không thể tạo cuộc trò chuyện",
          });

          // Xóa cờ đánh dấu trong trường hợp lỗi
          delete isCreatingConversationMap[conversationKey];

          return { success: false, error: error.message };
        }
      },

      // Chọn cuộc trò chuyện hiện tại và tải tin nhắn
      setCurrentConversation: async (conversation) => {
        set({
          currentConversation: conversation,
          isLoadingMessages: true,
          error: null,
        });
        try {
          const messages = await messageService.getMessagesByConversationId(
            conversation._id
          );
          set({
            isLoadingMessages: false,
            currentMessages: messages,
          });
          return { success: true };
        } catch (error) {
          // Không hiển thị lỗi nếu không có tin nhắn (200 với mảng rỗng)
          if (error.response && error.response.status === 200) {
            set({
              currentMessages: [],
              isLoadingMessages: false,
              error: null,
            });
            return { success: true };
          }

          // Đặt error nhưng không hiển thị toast
          set({
            isLoadingMessages: false,
            error: error.response?.data?.message || "Không thể tải tin nhắn",
          });
          return { success: false };
        }
      },

      // Gửi tin nhắn trong cuộc trò chuyện hiện tại
      sendMessage: async (content, file = null) => {
        const { currentConversation } = get();
        if (!currentConversation) {
          toast.error("Vui lòng chọn cuộc trò chuyện trước khi gửi tin nhắn");
          return { success: false };
        }

        try {
          // Xác định loại tin nhắn
          let messageType = "text";
          if (file) {
            const fileType = file.type.split("/")[0];
            if (fileType === "image") messageType = "image";
            else if (fileType === "video") messageType = "video";
            else if (fileType === "audio") messageType = "voice";
            else messageType = "file";
          }

          let message;
          if (currentConversation.type === "personal") {
            // Tìm ID người nhận (không phải mình)
            const currentUserId = useAuthStore.getState().user._id;
            const receiverParticipant = currentConversation.participants.find(
              (participant) => participant.user_id !== currentUserId
            );

            if (!receiverParticipant) {
              toast.error("Không thể xác định người nhận");
              return { success: false };
            }

            // Gửi tin nhắn cá nhân
            message = await messageService.sendMessage(
              receiverParticipant.user_id,
              { message_type: messageType, content },
              file
            );
          } else {
            // Gửi tin nhắn nhóm
            message = await messageService.sendGroupMessage(
              currentConversation._id,
              { message_type: messageType, content },
              file
            );
          }

          // Cập nhật danh sách tin nhắn
          set((state) => ({
            currentMessages: [...state.currentMessages, message],
          }));

          return { success: true, message };
        } catch (error) {
          toast.error(
            error.response?.data?.message || "Không thể gửi tin nhắn"
          );
          return { success: false };
        }
      },

      // Thêm tin nhắn mới vào cuộc trò chuyện hiện tại (được gọi khi nhận tin nhắn qua socket)
      addNewMessage: (message) => {
        const { currentConversation, currentMessages, conversations } = get();

        // Nếu không có message hợp lệ
        if (!message || !message._id) {
          console.warn("Invalid message object received", message);
          return;
        }

        console.log("Adding new message:", message);

        // 1. Thêm tin nhắn vào cuộc trò chuyện hiện tại nếu đúng conversation
        if (
          currentConversation &&
          ((currentConversation.type === "personal" &&
            (message.sender_id._id ===
              currentConversation.participants[0].user_id ||
              message.sender_id._id ===
                currentConversation.participants[1].user_id) &&
            (message.receiver_id._id ===
              currentConversation.participants[0].user_id ||
              message.receiver_id._id ===
                currentConversation.participants[1].user_id)) ||
            (currentConversation.type === "group" &&
              currentConversation._id === message.receiver_id._id))
        ) {
          // Kiểm tra xem tin nhắn đã có trong danh sách chưa
          const messageExists = currentMessages.some(
            (msg) => msg._id === message._id
          );

          if (!messageExists) {
            set({
              currentMessages: [...currentMessages, message],
            });
          }
        }

        // 2. Cập nhật tin nhắn cuối cùng trong danh sách cuộc trò chuyện
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            // Với cuộc trò chuyện cá nhân
            if (conv.type === "personal") {
              const participantIds = conv.participants.map((p) => p.user_id);
              // Kiểm tra xem tin nhắn thuộc về cuộc trò chuyện này không
              if (
                participantIds.includes(message.sender_id._id) &&
                participantIds.includes(message.receiver_id._id)
              ) {
                return {
                  ...conv,
                  last_message: message,
                };
              }
            }
            // Với cuộc trò chuyện nhóm
            else if (
              conv.type === "group" &&
              conv._id === message.receiver_id._id
            ) {
              return {
                ...conv,
                last_message: message,
              };
            }
            return conv;
          }),
        }));
      },

      // Cập nhật danh sách cuộc trò chuyện khi có cuộc trò chuyện mới (qua socket)
      addNewConversation: (conversation) => {
        console.log("Adding new conversation to store:", conversation);

        // Kiểm tra xem cuộc trò chuyện đã tồn tại trong danh sách chưa
        set((state) => {
          const exists = state.conversations.some(
            (conv) => conv._id === conversation._id
          );

          if (exists) {
            console.log(
              "Conversation already exists in store, not adding duplicate"
            );
            return { conversations: state.conversations };
          } else {
            console.log("Adding new conversation to store");
            return {
              conversations: [conversation, ...state.conversations],
            };
          }
        });
      },

      // Cập nhật cuộc trò chuyện khi có tin nhắn mới
      updateLastMessage: (conversationId, message) => {
        if (!conversationId || !message) {
          console.warn("updateLastMessage called with invalid parameters", {
            conversationId,
            message,
          });
          return;
        }

        console.log("Updating last message for conversation:", conversationId);

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv._id === conversationId
              ? { ...conv, last_message: message }
              : conv
          ),
        }));
      },

      // Cập nhật thông tin cuộc trò chuyện (được gọi khi nhận sự kiện từ socket)
      updateConversation: (conversation) => {
        if (!conversation || !conversation._id) {
          console.warn(
            "updateConversation called with invalid data",
            conversation
          );
          return;
        }

        console.log("Updating conversation:", conversation._id);

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv._id === conversation._id ? { ...conv, ...conversation } : conv
          ),
          // Cập nhật currentConversation nếu đang xem cuộc trò chuyện này
          currentConversation:
            state.currentConversation &&
            state.currentConversation._id === conversation._id
              ? { ...state.currentConversation, ...conversation }
              : state.currentConversation,
        }));
      },

      // Cập nhật thành viên tham gia cuộc trò chuyện (được gọi khi thêm/xóa thành viên)
      updateConversationParticipants: (conversationId, members) => {
        if (!conversationId || !members) {
          console.warn(
            "updateConversationParticipants called with invalid parameters",
            {
              conversationId,
              members,
            }
          );
          return;
        }

        console.log("Updating participants for conversation:", conversationId);

        const participants = members.map((member) => ({
          user_id: member.user._id || member.user,
          name: member.user.name || "Thành viên",
          avatar: member.user.primary_avatar || null,
          role: member.role || "member",
        }));

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv._id === conversationId ? { ...conv, participants } : conv
          ),
          // Cập nhật currentConversation nếu đang xem cuộc trò chuyện này
          currentConversation:
            state.currentConversation &&
            state.currentConversation._id === conversationId
              ? { ...state.currentConversation, participants }
              : state.currentConversation,
        }));
      },

      // Xóa một cuộc trò chuyện (khi thành viên bị xóa khỏi nhóm hoặc nhóm bị xóa)
      removeConversation: (conversationId) => {
        if (!conversationId) {
          console.warn("removeConversation called with invalid conversationId");
          return;
        }

        console.log("Removing conversation from store:", conversationId);

        set((state) => ({
          // Xóa cuộc trò chuyện khỏi danh sách
          conversations: state.conversations.filter(
            (conv) => conv._id !== conversationId
          ),
          // Nếu đang ở cuộc trò chuyện bị xóa, reset currentConversation
          currentConversation:
            state.currentConversation &&
            state.currentConversation._id === conversationId
              ? null
              : state.currentConversation,
          // Nếu đang xem tin nhắn của cuộc trò chuyện bị xóa, xóa cả tin nhắn
          currentMessages:
            state.currentConversation &&
            state.currentConversation._id === conversationId
              ? []
              : state.currentMessages,
        }));
      },

      // Reset store
      resetConversationStore: () => {
        set({
          conversations: [],
          currentConversation: null,
          currentMessages: [],
          isLoadingConversations: false,
          isLoadingMessages: false,
          error: null,
        });
      },

      // Reset error
      resetError: () => set({ error: null }),

      // Reset cuộc trò chuyện hiện tại (khi người dùng bị xóa khỏi nhóm)
      resetCurrentConversation: () => {
        set({
          currentConversation: null,
          currentMessages: [],
          isLoadingMessages: false,
        });
      },
    }),
    {
      name: "conversation-storage",
      partialize: (state) => ({
        conversations: state.conversations,
      }),
    }
  )
);

export default useConversationStore;
