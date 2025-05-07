import { useState, useEffect, useRef } from "react";
import {
  Phone,
  Video,
  Info,
  Image,
  Smile,
  Paperclip,
  Send,
  ThumbsUp,
} from "lucide-react";
import MessageBubble from "./MessageBubble";
import ConversationInfoPanel from "./ConversationInfoPanel";
import UserProfileModal from "../user/UserProfileModal";
import useConversationStore from "../../stores/conversationStore";
import useAuthStore from "../../stores/authStore";
import { toast } from "react-hot-toast";
import socketManager from "../../services/SocketManager";

const ChatWindow = ({ conversation }) => {
  const [newMessage, setNewMessage] = useState("");
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const lastConversationIdRef = useRef(null);

  const { user } = useAuthStore();
  const {
    currentMessages,
    currentConversation,
    sendMessage,
    isLoadingMessages,
    setCurrentConversation,
  } = useConversationStore();

  // Theo dõi khi prop conversation thay đổi để cập nhật cuộc trò chuyện hiện tại
  useEffect(() => {
    const loadConversation = async () => {
      if (
        conversation &&
        (!lastConversationIdRef.current ||
          lastConversationIdRef.current !== conversation._id)
      ) {
        // Lưu ID cuộc trò chuyện hiện tại để tránh gọi lại không cần thiết
        lastConversationIdRef.current = conversation._id;

        console.log("ChatWindow: Loading conversation", conversation._id);
        try {
          await setCurrentConversation(conversation);
        } catch (error) {
          console.error("Error setting current conversation:", error);
        }
      }
    };

    loadConversation();
  }, [conversation, setCurrentConversation]); // Bỏ currentConversation khỏi dependencies

  useEffect(() => {
    // Kiểm tra kết nối socket khi component mount
    const socket = socketManager.getSocket();
    if (socket && !socketManager.isSocketConnected()) {
      console.log("ChatWindow: Socket not properly connected");
    }
  }, []);

  // Chỉ log khi số lượng tin nhắn thay đổi đáng kể
  useEffect(() => {
    const msgCount = currentMessages.length;
    if (msgCount > 0 && msgCount % 10 === 0) {
      console.log("ChatWindow: Messages count:", msgCount);
    }
  }, [currentMessages]);

  // Scroll đến tin nhắn mới nhất khi danh sách tin nhắn thay đổi
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || isLoadingMessages) return;

    try {
      setIsUploading(selectedFile !== null);

      console.log("ChatWindow: Sending message to", currentConversation?._id);

      // Gửi tin nhắn với file đính kèm nếu có
      const result = await sendMessage(newMessage, selectedFile);

      if (result.success) {
        console.log("ChatWindow: Message sent successfully", result.message);
      }

      // Reset form sau khi gửi
      setNewMessage("");
      setSelectedFile(null);

      // Scroll đến tin nhắn mới nhất
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("ChatWindow: Error sending message", error);
      toast.error("Không thể gửi tin nhắn");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Kiểm tra kích thước file (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Kích thước file không được vượt quá 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  // Lấy thông tin người nhận
  const getRecipientInfo = () => {
    if (!currentConversation || !user)
      return { name: "Người dùng", avatar: null, isActive: false };

    if (currentConversation.type === "group") {
      return {
        name: currentConversation.name || "Nhóm",
        avatar: currentConversation.avatar,
        isActive: false,
      };
    }

    // Tìm thông tin của người tham gia khác (không phải người dùng hiện tại)
    const otherParticipant = currentConversation.participants?.find(
      (p) => p.user_id !== user._id
    );

    if (!otherParticipant)
      return { name: "Người dùng", avatar: null, isActive: false };

    return {
      name: otherParticipant.name || "Người dùng",
      avatar: otherParticipant.primary_avatar,
      isActive: Math.random() > 0.5, // Chỉ để mô phỏng, sẽ cập nhật khi có dữ liệu thực
      phone: "+84 332 732 933", // Dữ liệu mẫu, cần thay thế bằng dữ liệu thực
      dob: "02 tháng 09, 1971", // Dữ liệu mẫu, cần thay thế bằng dữ liệu thực
      gender: "Nữ", // Dữ liệu mẫu, cần thay thế bằng dữ liệu thực
    };
  };

  const recipient = getRecipientInfo();

  // Tạo placeholder cho input tin nhắn
  const getInputPlaceholder = () => {
    if (isLoadingMessages) return "Đang xử lý...";
    if (currentConversation?.type === "group")
      return `Nhập tin nhắn đến ${currentConversation.name || "nhóm"}`;
    return `Nhập tin nhắn đến ${recipient.name}`;
  };

  // Nếu không có currentConversation, hiển thị thông báo
  if (!currentConversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <h3 className="text-xl font-medium text-gray-500 mb-2">
          Chưa có cuộc trò chuyện nào được chọn
        </h3>
        <p className="text-gray-400">
          Chọn một cuộc trò chuyện hoặc bắt đầu cuộc trò chuyện mới
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full w-full">
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Header */}
        <div className="px-4 py-2 flex justify-between items-center border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <div
              className="w-10 h-10 rounded-full overflow-hidden mr-3 cursor-pointer"
              onClick={() => setShowUserModal(true)}
            >
              <img
                src={
                  recipient.avatar ||
                  `https://ui-avatars.com/api/?name=${recipient.name.charAt(
                    0
                  )}&background=random`
                }
                alt={recipient.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="font-semibold">{recipient.name}</h2>
              <p className="text-xs text-gray-500">
                {recipient.isActive ? "Đang hoạt động" : "Không hoạt động"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-full">
              <Phone size={20} />
            </button>
            <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-full">
              <Video size={20} />
            </button>
            <button
              className={`text-gray-600 hover:bg-gray-100 p-2 rounded-full ${
                showInfoPanel ? "bg-gray-100" : ""
              }`}
              onClick={() => setShowInfoPanel(!showInfoPanel)}
            >
              <Info size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-white">
          <div className="flex flex-col">
            {isLoadingMessages && currentMessages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <span className="loading loading-spinner loading-md text-primary"></span>
              </div>
            ) : currentMessages.length > 0 ? (
              currentMessages.map((message) => (
                <MessageBubble
                  key={message._id}
                  message={{
                    id: message._id,
                    senderId:
                      typeof message.sender_id === "object"
                        ? message.sender_id._id
                        : message.sender_id,
                    text:
                      message.message_type === "text" ? message.content : "",
                    time: formatMessageTime(message.timestamp),
                    status: message.status,
                    type: message.message_type,
                    fileUrl: message.file_meta?.url,
                    is_revoked: message.is_revoked,
                    senderName:
                      typeof message.sender_id === "object"
                        ? message.sender_id.name
                        : "",
                    senderAvatar:
                      typeof message.sender_id === "object"
                        ? message.sender_id.primary_avatar
                        : null,
                  }}
                  isMe={
                    typeof message.sender_id === "object"
                      ? message.sender_id._id === user?._id
                      : message.sender_id === user?._id
                  }
                />
              ))
            ) : (
              <div className="flex justify-center items-center h-40 text-gray-400">
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* File preview */}
        {selectedFile && (
          <div className="px-4 py-2 bg-gray-100 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                {selectedFile.name}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                {(selectedFile.size / 1024).toFixed(0)} KB
              </span>
            </div>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedFile(null)}
            >
              &times;
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="px-4 py-2 border-t border-gray-200 bg-white flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center">
            <div className="flex items-center gap-2 mr-2">
              <button
                type="button"
                className="text-gray-500 hover:bg-gray-100 p-2 rounded-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image size={20} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
              <button
                type="button"
                className="text-gray-500 hover:bg-gray-100 p-2 rounded-full"
              >
                <Paperclip size={20} />
              </button>
            </div>

            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={getInputPlaceholder()}
                className="w-full py-2 px-4 rounded-full bg-gray-100 focus:outline-none"
                disabled={isLoadingMessages || isUploading}
              />
              <button
                type="button"
                className="absolute right-3 top-2 text-gray-500"
              >
                <Smile size={20} />
              </button>
            </div>

            <button
              type="submit"
              disabled={
                (!newMessage.trim() && !selectedFile) ||
                isLoadingMessages ||
                isUploading
              }
              className="ml-2 p-2 text-blue-500 hover:bg-gray-100 rounded-full disabled:opacity-50"
            >
              {isLoadingMessages || isUploading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : newMessage.trim() || selectedFile ? (
                <Send size={20} />
              ) : (
                <ThumbsUp size={20} />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* User Info Panel */}
      {showInfoPanel && (
        <ConversationInfoPanel
          user={{
            id: recipient.id,
            name: recipient.name,
            avatar: recipient.avatar,
            isActive: recipient.isActive,
          }}
          onClose={() => setShowInfoPanel(false)}
        />
      )}

      {/* Using the separate UserProfileModal component */}
      <UserProfileModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        recipient={recipient}
      />
    </div>
  );
};

// Hàm định dạng thời gian tin nhắn
const formatMessageTime = (timestamp) => {
  if (!timestamp) return "";

  const messageDate = new Date(timestamp);
  return messageDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default ChatWindow;
