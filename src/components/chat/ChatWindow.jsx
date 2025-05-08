import { useState, useEffect, useRef } from "react";
import {
  MdPhone,
  MdVideoCall,
  MdInfo,
  MdImage,
  MdOutlineEmojiEmotions,
  MdAttachFile,
  MdSend,
  MdThumbUp,
} from "react-icons/md";
import MessageBubble from "./MessageBubble";
import ConversationInfoPanel from "./ConversationInfoPanel";
import UserProfileModal from "../user/UserProfileModal";
import GroupInfoModal from "../group/GroupInfoModal";
import useConversationStore from "../../stores/conversationStore";
import useAuthStore from "../../stores/authStore";
import { toast } from "react-hot-toast";
import socketManager from "../../services/SocketManager";
import useGroupStore from "../../stores/groupStore";

const ChatWindow = ({ conversation }) => {
  const [newMessage, setNewMessage] = useState("");
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const lastConversationIdRef = useRef(null);

  const { user } = useAuthStore();
  const { fetchGroupDetails } = useGroupStore();
  const {
    currentMessages,
    currentConversation,
    sendMessage,
    isLoadingMessages,
    setCurrentConversation,
  } = useConversationStore();

  useEffect(() => {
    const loadConversation = async () => {
      if (
        conversation &&
        (!lastConversationIdRef.current ||
          lastConversationIdRef.current !== conversation._id)
      ) {
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
  }, [conversation, setCurrentConversation]);

  useEffect(() => {
    const socket = socketManager.getSocket();
    if (socket && !socketManager.isSocketConnected()) {
      console.log("ChatWindow: Socket not properly connected");
    }
  }, []);

  useEffect(() => {
    const msgCount = currentMessages.length;
    if (msgCount > 0 && msgCount % 10 === 0) {
      console.log("ChatWindow: Messages count:", msgCount);
    }
  }, [currentMessages]);

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

      const result = await sendMessage(newMessage, selectedFile);

      if (result.success) {
        console.log("ChatWindow: Message sent successfully", result.message);
      }

      setNewMessage("");
      setSelectedFile(null);

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
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Kích thước file không được vượt quá 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleAvatarClick = async () => {
    if (currentConversation?.type === "group") {
      // Fetch group details nếu là nhóm
      await fetchGroupDetails(currentConversation.group_id);
      setShowGroupModal(true);
    } else {
      setShowUserModal(true);
    }
  };

  const getRecipientInfo = () => {
    if (!currentConversation || !user)
      return { name: "Người dùng", avatar: null, isActive: false };

    if (currentConversation.type === "group") {
      return {
        name: currentConversation.name || "Nhóm",
        avatar: currentConversation.avatar,
        isActive: false,
        isGroup: true,
        groupId: currentConversation.group_id,
      };
    }

    const otherParticipant = currentConversation.participants?.find(
      (p) => p.user_id !== user._id
    );

    if (!otherParticipant)
      return { name: "Người dùng", avatar: null, isActive: false };

    return {
      name: otherParticipant.name || "Người dùng",
      avatar: otherParticipant.primary_avatar,
      isActive: Math.random() > 0.5,
      phone: "+84 332 732 933",
      dob: "02 tháng 09, 1971",
      gender: "Nữ",
    };
  };

  const recipient = getRecipientInfo();

  const getInputPlaceholder = () => {
    if (isLoadingMessages) return "Đang xử lý...";
    if (currentConversation?.type === "group")
      return `Nhập tin nhắn đến ${currentConversation.name || "nhóm"}`;
    return `Nhập tin nhắn đến ${recipient.name}`;
  };

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
        <div className="px-4 py-2 flex justify-between items-center border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <div
              className="w-10 h-10 rounded-full overflow-hidden mr-3 cursor-pointer"
              onClick={handleAvatarClick}
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
              <MdPhone size={20} />
            </button>
            <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-full">
              <MdVideoCall size={20} />
            </button>
            <button
              className={`text-gray-600 hover:bg-gray-100 p-2 rounded-full ${
                showInfoPanel ? "bg-gray-100" : ""
              }`}
              onClick={() => setShowInfoPanel(!showInfoPanel)}
            >
              <MdInfo size={20} />
            </button>
          </div>
        </div>

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

        <div className="px-4 py-2 border-t border-gray-200 bg-white flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center">
            <div className="flex items-center gap-2 mr-2">
              <button
                type="button"
                className="text-gray-500 hover:bg-gray-100 p-2 rounded-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <MdImage size={20} />
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
                <MdAttachFile size={20} />
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
                <MdOutlineEmojiEmotions size={20} />
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
                <MdSend size={20} />
              ) : (
                <MdThumbUp size={20} />
              )}
            </button>
          </form>
        </div>
      </div>

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

      <UserProfileModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        recipient={recipient}
      />

      <GroupInfoModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        group={
          currentConversation?.type === "group"
            ? {
                _id: currentConversation?.group_id,
                name: currentConversation?.name,
                avatar: currentConversation?.avatar,
                members:
                  currentConversation?.participants?.map((p) => ({
                    user:
                      typeof p.user_id === "object"
                        ? p.user_id
                        : { _id: p.user_id },
                    role: p.role || "member",
                  })) || [],
                description: currentConversation?.description || "",
                is_public: currentConversation?.is_public || false,
                created_at: currentConversation?.created_at,
                updated_at: currentConversation?.updated_at,
              }
            : null
        }
      />
    </div>
  );
};

const formatMessageTime = (timestamp) => {
  if (!timestamp) return "";

  const messageDate = new Date(timestamp);
  return messageDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default ChatWindow;
