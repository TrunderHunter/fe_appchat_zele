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
import DateDivider from "./DateDivider";
import StickyDateHeader from "./StickyDateHeader";
import ConversationInfoPanel from "./ConversationInfoPanel";
import UserProfileModal from "../user/UserProfileModal";
import GroupInfoModal from "../group/GroupInfoModal";
import useConversationStore from "../../stores/conversationStore";
import useAuthStore from "../../stores/authStore";
import { toast } from "react-hot-toast";
import socketManager from "../../services/SocketManager";
import useGroupStore from "../../stores/groupStore";
import { formatMessageTime, groupMessagesByDate } from "../../utils/formatters";

const ChatWindow = ({ conversation }) => {
  const [newMessage, setNewMessage] = useState("");
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const lastConversationIdRef = useRef(null);
  const [showLoadMoreButton, setShowLoadMoreButton] = useState(false);
  const scrollHeightRef = useRef(0);

  // State và refs cho sticky header
  const [currentStickyDate, setCurrentStickyDate] = useState(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const dateMarkersRef = useRef(new Map()); // Lưu vị trí của các marker ngày

  const { user } = useAuthStore();
  const { fetchGroupDetails } = useGroupStore();
  const {
    currentMessages,
    currentConversation,
    sendMessage,
    isLoadingMessages,
    isLoadingOlderMessages,
    hasMoreMessages,
    setCurrentConversation,
    loadOlderMessages,
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

  // Tự động cuộn xuống dưới khi một cuộc hội thoại được tải xong
  useEffect(() => {
    if (!isLoadingMessages && currentMessages.length > 0) {
      // Chờ một chút để DOM cập nhật trước khi cuộn
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [isLoadingMessages]);

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
  }, [currentMessages]); // Lưu vị trí cuộn trước khi bắt đầu tải tin nhắn cũ
  useEffect(() => {
    if (isLoadingOlderMessages && messagesContainerRef.current) {
      // Lưu lại chiều cao hiện tại của container và vị trí cuộn
      scrollHeightRef.current = messagesContainerRef.current.scrollHeight;
    }
  }, [isLoadingOlderMessages]);

  // Xử lý sau khi thêm tin nhắn cũ (khi isLoadingOlderMessages chuyển từ true sang false)
  useEffect(() => {
    if (
      !isLoadingOlderMessages &&
      messagesContainerRef.current &&
      scrollHeightRef.current > 0
    ) {
      // Tính toán vị trí cuộn mới để giữ nguyên vị trí đọc hiện tại
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - scrollHeightRef.current;

      // Thiết lập vị trí cuộn để giữ người dùng ở cùng một vị trí tương đối
      if (scrollDiff > 0) {
        // console.log("Adjusting scroll position by", scrollDiff, "px");
        messagesContainerRef.current.scrollTop = scrollDiff;
      }

      // Reset giá trị lưu trữ
      scrollHeightRef.current = 0;
    }
  }, [isLoadingOlderMessages]);

  // Cuộn xuống dưới cùng khi có tin nhắn mới
  useEffect(() => {
    // Nếu người dùng đang ở gần cuối trang, tự động cuộn xuống khi có tin nhắn mới
    if (messagesContainerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } =
        messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

      if (isNearBottom) {
        scrollToBottom();
      }
    }
  }, [currentMessages.length]);

  // Cập nhật vị trí markers khi tin nhắn thay đổi
  useEffect(() => {
    // Chờ một chút để DOM cập nhật hoàn toàn
    setTimeout(() => {
      updateDateMarkerPositions();
    }, 200);
  }, [currentMessages]);

  // Cập nhật position markers khi kích thước container thay đổi
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      updateDateMarkerPositions();
    });

    if (messagesContainerRef.current) {
      resizeObserver.observe(messagesContainerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Xử lý sự kiện cuộn để tải tin nhắn cũ hơn và cập nhật sticky header
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Xử lý tải tin nhắn cũ khi cuộn đến đầu trang
    if (
      container.scrollTop === 0 &&
      !isLoadingOlderMessages &&
      hasMoreMessages
    ) {
      handleLoadOlderMessages();
    }

    // Xử lý hiển thị sticky header
    if (dateMarkersRef.current.size === 0) {
      // Nếu chưa có markers, tạo lại chúng
      updateDateMarkerPositions();
    } else {
      // Xác định ngày hiển thị dựa trên vị trí cuộn hiện tại
      let currentDate = null;
      let minDistance = Infinity;

      // Tìm marker gần nhất phía trên vị trí cuộn hiện tại
      dateMarkersRef.current.forEach((position, date) => {
        const distance = container.scrollTop - position;
        if (distance >= -50 && distance < minDistance) {
          // -50 là ngưỡng để bắt đầu hiển thị ngày mới sớm hơn một chút
          minDistance = distance;
          currentDate = date;
        }
      });

      // Chỉ hiển thị header khi đã cuộn xuống một chút
      setShowStickyHeader(container.scrollTop > 60);

      // Cập nhật ngày hiển thị
      if (currentDate !== currentStickyDate) {
        setCurrentStickyDate(currentDate);
      }
    }
  };

  // Cập nhật vị trí của các marker ngày
  const updateDateMarkerPositions = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Xóa markers cũ
    dateMarkersRef.current.clear();

    // Tìm tất cả các divider ngày trong container
    const dateElements = container.querySelectorAll("[data-date]");
    dateElements.forEach((element) => {
      const date = element.getAttribute("data-date");
      const rect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const relativePosition =
        rect.top - containerRect.top + container.scrollTop;

      dateMarkersRef.current.set(date, relativePosition);
    });
  };

  // Xử lý tải tin nhắn cũ hơn
  const handleLoadOlderMessages = async () => {
    try {
      await loadOlderMessages();
    } catch (error) {
      console.error("Lỗi khi tải tin nhắn cũ:", error);
      setShowLoadMoreButton(true); // Hiển thị nút tải thêm nếu có lỗi
    }
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

      // Đảm bảo luôn cuộn xuống dưới cùng sau khi gửi tin nhắn
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
          </div>{" "}
        </div>{" "}
        <div
          className="flex-1 p-4 overflow-y-auto bg-white relative"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {/* Hiển thị sticky date header */}
          {showStickyHeader && currentStickyDate && (
            <StickyDateHeader currentDate={currentStickyDate} />
          )}
          <div className="flex flex-col">
            {/* Loading indicator khi tải tin nhắn cũ hơn */}
            {isLoadingOlderMessages && (
              <div className="flex justify-center p-2">
                <span className="loading loading-spinner loading-sm text-primary"></span>
                <span className="ml-2 text-sm text-gray-500">
                  Đang tải tin nhắn cũ hơn...
                </span>
              </div>
            )}
            {/* Nút tải thêm tin nhắn (hiển thị khi có lỗi hoặc không tự động tải được) */}
            {hasMoreMessages &&
              !isLoadingOlderMessages &&
              showLoadMoreButton && (
                <div className="flex justify-center p-2">
                  <button
                    onClick={handleLoadOlderMessages}
                    className="btn btn-sm btn-outline btn-primary"
                  >
                    Tải thêm tin nhắn
                  </button>
                </div>
              )}{" "}
            {/* Danh sách tin nhắn đã được nhóm theo ngày */}
            {isLoadingMessages && currentMessages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <span className="loading loading-spinner loading-md text-primary"></span>
              </div>
            ) : currentMessages.length > 0 ? (
              groupMessagesByDate(currentMessages).map((item) => {
                if (item.type === "date") {
                  return <DateDivider key={item.id} date={item.date} />;
                } else if (item.type === "message") {
                  const message = item.message;
                  return (
                    <MessageBubble
                      key={message._id}
                      message={{
                        _id: message._id, // Thay đổi id thành _id để đảm bảo nhất quán
                        senderId:
                          typeof message.sender_id === "object"
                            ? message.sender_id._id
                            : message.sender_id,
                        text:
                          message.message_type === "text"
                            ? message.content
                            : "",
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
                  );
                }
                return null;
              })
            ) : (
              <div className="flex justify-center items-center h-40 text-gray-400">
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </div>
            )}
            <div ref={messagesEndRef} data-message-end />
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

// formatMessageTime đã được di chuyển sang utils/formatters.js

export default ChatWindow;
