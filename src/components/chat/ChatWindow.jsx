import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  MdPhone,
  MdVideoCall,
  MdInfo,
} from "react-icons/md";
import MessageBubble from "./MessageBubble";
import DateDivider from "./DateDivider";
import StickyDateHeader from "./StickyDateHeader";
import MessageInput from "./MessageInput";
import ConversationInfoPanel from "./ConversationInfoPanel";
import UserProfileModal from "../user/UserProfileModal";
import GroupInfoModal from "../group/GroupInfoModal";
import useConversationStore from "../../stores/conversationStore";
import useAuthStore from "../../stores/authStore";
import { toast } from "react-hot-toast";
import socketManager from "../../services/SocketManager";
import useGroupStore from "../../stores/groupStore";
import { formatMessageTime, groupMessagesByDate } from "../../utils/formatters";
import { createScrollHandlers } from "../../utils/scrollUtils";
import { useStringee } from "../../context/StringeeContext";
const ChatWindow = ({ conversation }) => {
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastConversationIdRef = useRef(null);
  const [showLoadMoreButton, setShowLoadMoreButton] = useState(false);
  const scrollHeightRef = useRef(0);
  const { makeCall, isAuthenticated, isConnected } = useStringee();
  const [currentStickyDate, setCurrentStickyDate] = useState(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const dateMarkersRef = useRef(new Map());

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

  const {
    debouncedLoadOlderMessages, 
    throttledUpdateStickyHeader,
    debouncedUpdateDateMarkerPositions
  } = useMemo(() => createScrollHandlers(), []);

  const updateDateMarkerPositions = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    debouncedUpdateDateMarkerPositions(container, dateMarkersRef);
  }, [debouncedUpdateDateMarkerPositions]);

  const handleLoadOlderMessages = useCallback(async () => {
    try {
      await loadOlderMessages();
    } catch (error) {
      console.error("Lỗi khi tải tin nhắn cũ:", error);
      setShowLoadMoreButton(true);
    }
  }, [loadOlderMessages]);

  const handleCallButtonClick = useCallback((userId, isVideoCall) => {
    if (!userId) {
      toast.error("Không thể xác định người dùng để gọi");
      return;
    }
    
    if (!isConnected || !isAuthenticated) {
      toast.error("Đang kết nối đến dịch vụ cuộc gọi. Vui lòng thử lại sau.");
      console.error("Stringee client not ready: connected=", isConnected, "authenticated=", isAuthenticated);
      return;
    }
    
    console.log(`Initiating ${isVideoCall ? 'video' : 'audio'} call to user: ${userId}`);
    try {
      makeCall(userId, isVideoCall);
    } catch (error) {
      console.error("Error making call:", error);
      toast.error("Không thể thực hiện cuộc gọi. Vui lòng thử lại sau.");
    }
  }, [makeCall, isConnected, isAuthenticated]);
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (
      container.scrollTop === 0 &&
      !isLoadingOlderMessages &&
      hasMoreMessages
    ) {
      debouncedLoadOlderMessages(handleLoadOlderMessages);
    }

    throttledUpdateStickyHeader(
      container, 
      dateMarkersRef, 
      setShowStickyHeader, 
      setCurrentStickyDate, 
      currentStickyDate
    );
  }, [
    isLoadingOlderMessages,
    hasMoreMessages,
    debouncedLoadOlderMessages,
    handleLoadOlderMessages,
    throttledUpdateStickyHeader,
    currentStickyDate,
  ]);

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
    if (!isLoadingMessages && currentMessages.length > 0) {
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
  }, [currentMessages]);

  useEffect(() => {
    if (isLoadingOlderMessages && messagesContainerRef.current) {
      scrollHeightRef.current = messagesContainerRef.current.scrollHeight;
    }
  }, [isLoadingOlderMessages]);

  useEffect(() => {
    if (
      !isLoadingOlderMessages &&
      messagesContainerRef.current &&
      scrollHeightRef.current > 0
    ) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - scrollHeightRef.current;

      if (scrollDiff > 0) {
        messagesContainerRef.current.scrollTop = scrollDiff;
      }

      scrollHeightRef.current = 0;
    }
  }, [isLoadingOlderMessages]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } =
        messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

      if (isNearBottom) {
        scrollToBottom();
      }
    }
  }, [currentMessages.length]);

  useEffect(() => {
    setTimeout(() => {
      updateDateMarkerPositions();
    }, 200);
  }, [currentMessages, updateDateMarkerPositions]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      updateDateMarkerPositions();
    });

    if (messagesContainerRef.current) {
      resizeObserver.observe(messagesContainerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [updateDateMarkerPositions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = useCallback(async (messageText, file) => {
    try {
      console.log("ChatWindow: Sending message to", currentConversation?._id);
      const result = await sendMessage(messageText, file);

      if (result.success) {
        console.log("ChatWindow: Message sent successfully", result.message);
      }

      setTimeout(scrollToBottom, 100);
      
      return result;
    } catch (error) {
      console.error("ChatWindow: Error sending message", error);
      toast.error("Không thể gửi tin nhắn");
      throw error;
    }
  }, [currentConversation, sendMessage]);

  const handleAvatarClick = useCallback(async () => {
    if (currentConversation?.type === "group") {
      await fetchGroupDetails(currentConversation.group_id);
      setShowGroupModal(true);
    } else {
      setShowUserModal(true);
    }
  }, [currentConversation, fetchGroupDetails]);

  const recipient = useMemo(() => {
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
  }, [currentConversation, user]);

  const groupedMessages = useMemo(() => {
    return groupMessagesByDate(currentMessages);
  }, [currentMessages]);

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
            {currentConversation.type === "personal" && (
              <>
                <button 
                  onClick={() => handleCallButtonClick(
                    currentConversation.participants?.find(p => p.user_id !== user._id)?.user_id,
                    false
                  )}
                  className="text-gray-600 hover:bg-gray-100 p-2 rounded-full"
                >
                  <MdPhone size={20} />
                </button>
                <button 
                  onClick={() => handleCallButtonClick(
                    currentConversation.participants?.find(p => p.user_id !== user._id)?.user_id,
                    true
                  )}
                  className="text-gray-600 hover:bg-gray-100 p-2 rounded-full"
                >
                  <MdVideoCall size={20} />
                </button>
              </>
            )}
            <button
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              className="text-gray-600 hover:bg-gray-100 p-2 rounded-full"
            >
              <MdInfo size={20} />
            </button>
          </div>
        </div>
        <div
          className="flex-1 p-4 overflow-y-auto bg-white relative"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {showStickyHeader && currentStickyDate && (
            <StickyDateHeader currentDate={currentStickyDate} />
          )}
          <div className="flex flex-col">
            {isLoadingOlderMessages && (
              <div className="flex justify-center p-2">
                <span className="loading loading-spinner loading-sm text-primary"></span>
                <span className="ml-2 text-sm text-gray-500">
                  Đang tải tin nhắn cũ hơn...
                </span>
              </div>
            )}
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
              )}

            {isLoadingMessages && currentMessages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <span className="loading loading-spinner loading-md text-primary"></span>
              </div>
            ) : currentMessages.length > 0 ? (
              groupedMessages.map((item) => {
                if (item.type === "date") {
                  return <DateDivider key={item.id} date={item.date} />;
                } else if (item.type === "message") {
                  const message = item.message;
                  return (
                    <MessageBubble
                      key={message._id}
                      message={{
                        _id: message._id,
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
        
        <MessageInput
          onSendMessage={handleSendMessage}
          isLoadingMessages={isLoadingMessages}
          conversationType={currentConversation?.type}
          recipientName={recipient.name}
        />
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

export default ChatWindow;
