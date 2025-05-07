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
        console.log("addNewMessage called with:", message);

        const { currentConversation, currentMessages, conversations } = get();
        const userId = useAuthStore.getState().user?._id;

        // Thêm log chi tiết để debug
        console.log("Current conversation:", currentConversation?._id);
        console.log("Message conversation_id:", message.conversation_id);
        console.log(
          "Message receiver_id:",
          typeof message.receiver_id === "object"
            ? message.receiver_id?._id
            : message.receiver_id
        );
        console.log(
          "Message sender_id:",
          typeof message.sender_id === "object"
            ? message.sender_id?._id
            : message.sender_id
        );

        // Chức năng này sẽ kiểm tra ID của tin nhắn có tồn tại trong currentMessages chưa
        const messageExists = (msgId) => {
          return currentMessages.some((msg) => msg._id === msgId);
        };

        // Kiểm tra xem đây có phải là tin nhắn mới cho cuộc trò chuyện hiện tại không
        if (currentConversation) {
          // Lấy các ID liên quan để kiểm tra
          const receiverId =
            typeof message.receiver_id === "object"
              ? message.receiver_id?._id
              : message.receiver_id;

          const senderId =
            typeof message.sender_id === "object"
              ? message.sender_id?._id
              : message.sender_id;

          // Kiểm tra nhiều trường hợp để xác định tin nhắn thuộc cuộc trò chuyện hiện tại
          const conversationMatches =
            // Trường hợp 1: conversation_id trùng khớp trực tiếp
            (message.conversation_id &&
              message.conversation_id === currentConversation._id) ||
            // Trường hợp 2: Tin nhắn cá nhân - so sánh receiver_id với conversation_id
            (receiverId && receiverId === currentConversation._id) ||
            // Trường hợp 3: Tin nhắn cá nhân - đây là cuộc trò chuyện giữa sender và receiver
            (currentConversation.type === "personal" &&
              currentConversation.participants &&
              currentConversation.participants.length === 2 &&
              ((senderId &&
                currentConversation.participants.some(
                  (p) => p.user_id === senderId
                )) ||
                (receiverId &&
                  currentConversation.participants.some(
                    (p) => p.user_id === receiverId
                  ))));

          console.log("Conversation matches?", conversationMatches);

          if (conversationMatches) {
            // Chỉ thêm tin nhắn vào nếu nó chưa tồn tại
            if (!messageExists(message._id)) {
              console.log(
                "✅ Adding new message to current conversation",
                message
              );

              // Force UI update bằng cách tạo mảng mới
              set((state) => ({
                currentMessages: [...state.currentMessages, message],
              }));

              // Đảm bảo tin nhắn được thêm vào cuối danh sách, sau đó thông báo cho UI cập nhật
              setTimeout(() => {
                console.log(
                  "Current messages length after update:",
                  get().currentMessages.length
                );
              }, 100);
            } else {
              console.log(
                "Message already exists in currentMessages, not adding duplicate"
              );
            }
          } else {
            console.log("Message does not match current conversation");
          }
        } else {
          console.log("No current conversation selected");
        }

        // Luôn cập nhật danh sách cuộc trò chuyện trong store để hiển thị tin nhắn mới nhất
        set((state) => {
          // Tìm cuộc trò chuyện cần cập nhật
          const updatedConversations = state.conversations.map((conv) => {
            const receiverId =
              typeof message.receiver_id === "object"
                ? message.receiver_id?._id
                : message.receiver_id;

            const senderId =
              typeof message.sender_id === "object"
                ? message.sender_id?._id
                : message.sender_id;

            const conversationMatches =
              // Match theo conversation_id
              (message.conversation_id &&
                conv._id === message.conversation_id) ||
              // Hoặc match theo receiver_id
              (receiverId && conv._id === receiverId) ||
              // Hoặc đây là cuộc trò chuyện cá nhân giữa người gửi và người nhận
              (conv.type === "personal" &&
                conv.participants &&
                conv.participants.length === 2 &&
                conv.participants.some(
                  (p) => p.user_id === senderId || p.user_id === receiverId
                ));

            return conversationMatches
              ? { ...conv, last_message: message }
              : conv;
          });

          // Nếu không tìm thấy cuộc trò chuyện phù hợp, có thể cần tải lại danh sách
          const conversationFound = updatedConversations.some(
            (conv) =>
              (message.conversation_id &&
                conv._id === message.conversation_id) ||
              (typeof message.receiver_id === "object" &&
                message.receiver_id &&
                conv._id === message.receiver_id._id) ||
              (message.receiver_id && conv._id === message.receiver_id)
          );

          if (!conversationFound) {
            console.log(
              "Conversation not found in store, might need to refresh conversations list"
            );
            // fetchConversations(); // Có thể gọi ở đây, nhưng cẩn thận với vòng lặp vô hạn
          }

          return {
            conversations: updatedConversations,
          };
        });
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
