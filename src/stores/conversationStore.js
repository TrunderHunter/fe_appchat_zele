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
      isLoadingOlderMessages: false,
      hasMoreMessages: false,
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
      }, // Chọn cuộc trò chuyện hiện tại và tải tin nhắn mới nhất
      setCurrentConversation: async (conversation) => {
        set({
          currentConversation: conversation,
          isLoadingMessages: true,
          error: null,
          // Reset danh sách tin nhắn khi chuyển cuộc trò chuyện
          currentMessages: [],
        });
        try {
          // Lấy 6 tin nhắn mới nhất
          const messages = await messageService.getMessagesByConversationId(
            conversation._id,
            6 // Lấy 6 tin nhắn
          );

          set({
            isLoadingMessages: false,
            // Do tin nhắn được sắp xếp từ mới đến cũ, hiển thị từ dưới lên
            currentMessages: messages.reverse(),
            currentPage: 1,
            hasMoreMessages: messages.length === 6, // Nếu nhận đủ 6 tin nhắn, có thể có thêm tin nhắn cũ hơn
          });
          return { success: true };
        } catch (error) {
          // Không hiển thị lỗi nếu không có tin nhắn (200 với mảng rỗng)
          if (error.response && error.response.status === 200) {
            set({
              currentMessages: [],
              isLoadingMessages: false,
              error: null,
              hasMoreMessages: false,
            });
            return { success: true };
          }

          // Đặt error nhưng không hiển thị toast
          set({
            isLoadingMessages: false,
            error: error.response?.data?.message || "Không thể tải tin nhắn",
            hasMoreMessages: false,
          });
          return { success: false };
        }
      }, // Gửi tin nhắn trong cuộc trò chuyện hiện tại
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
            console.log("Gửi tin nhắn nhóm đến:", currentConversation._id);
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
          console.error("Lỗi khi gửi tin nhắn:", error);
          toast.error(
            error.response?.data?.message || "Không thể gửi tin nhắn"
          );
          return { success: false };
        }
      }, // Thêm tin nhắn mới vào cuộc trò chuyện hiện tại (được gọi khi nhận tin nhắn qua socket)
      addNewMessage: (message) => {
        const { currentConversation, currentMessages, conversations } = get();

        // Nếu không có message hợp lệ
        if (!message || !message._id) {
          console.warn("Invalid message object received", message);
          return;
        }

        console.log("Adding new message:", message);

        // Xử lý trường hợp tin nhắn nhóm có conversation_id
        const conversationId =
          message.conversation_id ||
          (message.receiver_id && message.receiver_id._id
            ? message.receiver_id._id
            : message.receiver_id);

        console.log("Conversation ID extracted from message:", conversationId);

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
              currentConversation._id === conversationId))
        ) {
          // Kiểm tra xem tin nhắn đã có trong danh sách chưa
          const messageExists = currentMessages.some(
            (msg) => msg._id === message._id
          );
          if (!messageExists) {
            set({
              currentMessages: [...currentMessages, message],
            });

            // Đảm bảo cuộn xuống dưới trong ChatWindow
            setTimeout(() => {
              const messageEndElement =
                document.querySelector("[data-message-end]");
              messageEndElement?.scrollIntoView({ behavior: "smooth" });
            }, 100);
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
            } // Với cuộc trò chuyện nhóm
            else if (
              conv.type === "group" &&
              (conv._id === message.receiver_id._id ||
                conv._id === message.conversation_id)
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
      }, // Cập nhật tin nhắn bị thu hồi
      updateRevokedMessage: (messageId) => {
        if (!messageId) {
          console.warn("updateRevokedMessage called with invalid messageId");
          return;
        }

        console.log("Updating revoked message:", messageId);

        // Cập nhật trong danh sách tin nhắn hiện tại
        set((state) => {
          // Debug để kiểm tra xem tin nhắn có tồn tại trong danh sách hiện tại không
          const messageExists = state.currentMessages.some(
            (msg) => msg._id === messageId
          );
          console.log(
            `Message ${messageId} exists in currentMessages: ${messageExists}`
          );

          return {
            currentMessages: state.currentMessages.map((msg) =>
              msg._id === messageId ? { ...msg, is_revoked: true } : msg
            ),
          };
        });

        // Cập nhật trong danh sách cuộc trò chuyện nếu tin nhắn bị thu hồi là tin nhắn cuối cùng
        set((state) => {
          // Kiểm tra và log các cuộc trò chuyện có tin nhắn cuối cùng là tin nhắn này
          const relevantConvs = state.conversations.filter(
            (conv) => conv.last_message && conv.last_message._id === messageId
          );
          console.log(
            `Found ${relevantConvs.length} conversations with last_message ID ${messageId}`
          );

          return {
            conversations: state.conversations.map((conv) => {
              if (conv.last_message && conv.last_message._id === messageId) {
                console.log(
                  `Updating last_message in conversation: ${conv._id}`
                );
                return {
                  ...conv,
                  last_message: { ...conv.last_message, is_revoked: true },
                };
              }
              return conv;
            }),
          };
        });
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
      }, // Tải tin nhắn cũ hơn (khi người dùng cuộn lên trên)
      loadOlderMessages: async () => {
        const {
          currentConversation,
          currentMessages,
          isLoadingOlderMessages,
          hasMoreMessages,
        } = get();

        // Nếu đang tải hoặc không có thêm tin nhắn cũ hơn, không làm gì cả
        if (
          isLoadingOlderMessages ||
          !hasMoreMessages ||
          !currentConversation ||
          currentMessages.length === 0
        ) {
          return { success: false };
        }

        // Đặt cờ đang tải
        set({ isLoadingOlderMessages: true });

        try {
          // Lấy ID của tin nhắn cũ nhất hiện có làm điểm bắt đầu để tải thêm
          const oldestMessageId = currentMessages[0]._id;

          // Tải thêm 6 tin nhắn cũ hơn
          const olderMessages =
            await messageService.getMessagesByConversationId(
              currentConversation._id,
              6,
              oldestMessageId
            );

          if (olderMessages && olderMessages.length > 0) {
            // Đảo ngược để tin nhắn mới nhất ở dưới cùng
            const reversedOlderMessages = olderMessages.reverse();

            set({
              isLoadingOlderMessages: false,
              // Thêm tin nhắn cũ hơn vào đầu mảng hiện tại
              currentMessages: [...reversedOlderMessages, ...currentMessages],
              hasMoreMessages: olderMessages.length === 6, // Còn tin nhắn cũ hơn nếu nhận đủ 6 tin
            });

            return {
              success: true,
              newMessages: reversedOlderMessages,
              hasMore: olderMessages.length === 6,
            };
          } else {
            // Không còn tin nhắn cũ hơn
            set({
              isLoadingOlderMessages: false,
              hasMoreMessages: false,
            });
            return { success: true, newMessages: [], hasMore: false };
          }
        } catch (error) {
          console.error("Error loading older messages:", error);
          set({
            isLoadingOlderMessages: false,
            error:
              error.response?.data?.message || "Không thể tải thêm tin nhắn",
          });
          return { success: false };
        }
      },

      // Reset store
      resetConversationStore: () => {
        set({
          conversations: [],
          currentConversation: null,
          currentMessages: [],
          isLoadingConversations: false,
          isLoadingMessages: false,
          isLoadingOlderMessages: false,
          hasMoreMessages: false,
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
