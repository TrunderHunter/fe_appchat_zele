import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import socketManager from "../../services/SocketManager";
import useAuthStore from "../../stores/authStore";
import messageService from "../../services/messageService";
import { BsPeople, BsPerson, BsReplyAll, BsSearch } from "react-icons/bs";
import { MdSend } from "react-icons/md";
import useConversationStore from "../../stores/conversationStore";
import useGroupStore from "../../stores/groupStore";

const ForwardMessageModal = ({ messageId, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chats"); // "chats" hoặc "groups"
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [messagePreview, setMessagePreview] = useState(null);
  const { user } = useAuthStore();
  const { conversations } = useConversationStore();
  const { groups } = useGroupStore();

  // Fetch message details for preview
  useEffect(() => {
    const fetchMessageDetails = async () => {
      if (!messageId) return;

      try {
        // Find message in current messages or fetch from API
        const messageDetails = await findMessageInStore(messageId);
        setMessagePreview(messageDetails);
      } catch (error) {
        console.error("Error fetching message details:", error);
      }
    };

    fetchMessageDetails();
  }, [messageId]);
  // Helper function to find message in store or fetch from API
  const findMessageInStore = async (msgId) => {
    try {
      // Try to find in current conversation messages first
      const currentConversation =
        useConversationStore.getState().currentConversation;
      const currentMessages = useConversationStore.getState().currentMessages;

      // Kiểm tra trong tin nhắn của cuộc trò chuyện hiện tại trước
      if (currentMessages && currentMessages.length > 0) {
        const foundMessage = currentMessages.find((msg) => msg._id === msgId);
        if (foundMessage) {
          console.log("Found message in current conversation");
          return foundMessage;
        }
      }

      // Kiểm tra trong tất cả các cuộc trò chuyện
      const allConversations = useConversationStore.getState().conversations;
      let message = null;

      for (const conv of allConversations) {
        if (conv.messages && conv.messages.length > 0) {
          const foundMessage = conv.messages.find((msg) => msg._id === msgId);
          if (foundMessage) {
            console.log("Found message in conversation:", conv._id);
            message = foundMessage;
            break;
          }
        }
      }

      if (!message) {
        // Nếu không tìm thấy, thử lấy thông tin từ MessageBubble đang hiển thị
        // Điều này sẽ hoạt động nếu người dùng đã click vào nút chuyển tiếp từ một MessageBubble
        console.log("Message not found in store, trying alternative methods");

        try {
          // Thử lấy tin nhắn từ API (nếu có)
          // Hiện tại API chưa hỗ trợ, nhưng có thể bổ sung sau
          // const response = await messageService.getMessageById(msgId);
          // if (response.data) return response.data;

          // Tìm trong last_message của các cuộc trò chuyện
          for (const conv of allConversations) {
            if (conv.last_message && conv.last_message._id === msgId) {
              console.log("Found in last_message");
              return conv.last_message;
            }
          }
        } catch (err) {
          console.error("Error fetching message details:", err);
        }

        // Nếu không tìm được, tạo placeholder
        console.log("Creating placeholder message");
        message = {
          _id: msgId,
          message_type: "text",
          content: "Tin nhắn được chuyển tiếp",
          sender_id: { _id: user._id, name: user.name },
          timestamp: new Date(),
        };
      }

      return message;
    } catch (error) {
      console.error("Error in findMessageInStore:", error);
      // Fallback an toàn
      return {
        _id: msgId,
        message_type: "text",
        content: "Tin nhắn được chuyển tiếp",
        sender_id: { _id: user._id, name: user.name },
        timestamp: new Date(),
      };
    }
  };

  // Xử lý danh sách bạn bè không trùng lặp từ các cuộc trò chuyện
  const uniqueFriends = [];
  const friendIds = new Set(); // Sử dụng Set để theo dõi ID đã thêm

  conversations?.forEach((conversation) => {
    // Chỉ xử lý cuộc trò chuyện cá nhân (không phải nhóm)
    if (
      !conversation.type ||
      conversation.type === "private" ||
      conversation.type === "personal"
    ) {
      const recipient = conversation.participants.find((participant) => {
        // Đảm bảo so sánh đúng định dạng ID
        const participantId =
          participant.user_id?._id?.toString() ||
          participant.user_id?.toString();
        const currentUserId = user?._id?.toString();
        return participantId !== currentUserId;
      });

      // Kiểm tra nếu tìm thấy người nhận và chưa được thêm vào danh sách
      if (recipient) {
        const recipientId =
          recipient.user_id?._id?.toString() || recipient.user_id?.toString();

        if (recipientId && !friendIds.has(recipientId)) {
          friendIds.add(recipientId);
          uniqueFriends.push({
            _id: conversation._id,
            recipient,
          });
        }
      }
    }
  });

  console.log("Unique friends count:", uniqueFriends.length);

  // Lọc danh sách bạn bè theo từ khóa tìm kiếm
  const filteredChats =
    uniqueFriends?.filter((chat) =>
      chat.recipient?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  console.log("Filtered chats:", filteredChats.length);

  // Lọc danh sách nhóm mà người dùng là thành viên và theo từ khóa tìm kiếm
  const filteredGroups =
    groups?.filter((group) => {
      // Kiểm tra xem người dùng có trong danh sách thành viên của nhóm không
      const isMember = group.members?.some((member) => {
        if (typeof member === "object") {
          const memberId =
            member.user?._id?.toString() || member.user?.toString();
          return memberId === user?._id?.toString();
        }
        return member?.toString() === user?._id?.toString();
      });

      // Chỉ hiển thị nhóm mà người dùng là thành viên và tên nhóm phù hợp với từ khóa tìm kiếm
      return (
        isMember && group.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }) || [];
  // Reset selection when switching tabs
  useEffect(() => {
    setSelectedRecipient(null);
  }, [activeTab]);

  // Đảm bảo danh sách hội thoại và nhóm được tải khi mở modal
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Fetching conversations and groups...");
        const convResult = await useConversationStore
          .getState()
          .fetchConversations();
        const groupResult = await useGroupStore.getState().fetchUserGroups();
        console.log(
          "Fetch completed - Conversations:",
          convResult?.conversations?.length || 0,
          "Groups:",
          groupResult?.groups?.length || 0
        );
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      }
    };

    loadData();
  }, []);

  const handleForward = async () => {
    if (!selectedRecipient) {
      toast.error("Vui lòng chọn người nhận");
      return;
    }

    setIsLoading(true);
    try {
      const isGroup = activeTab === "groups";
      const receiverId = selectedRecipient.id;

      // Có 2 cách thực hiện chuyển tiếp tin nhắn:
      // 1. Sử dụng Socket (real-time, phản hồi nhanh)
      // 2. Sử dụng API (phương án dự phòng nếu socket không hoạt động)

      // Ưu tiên sử dụng Socket nếu có kết nối
      const socket = socketManager.getSocket();
      if (socket && socket.connected) {
        // Phương án 1: Sử dụng Socket
        socket.emit("forwardMessage", {
          senderId: user._id,
          receiverId,
          originalMessageId: messageId,
          isGroup,
        });

        // Đóng modal và hiển thị thông báo
        toast.success("Đang chuyển tiếp tin nhắn...");
        onClose();
      } else {
        // Phương án 2: Sử dụng REST API khi không có kết nối socket
        const { data } = await messageService.forwardMessage(
          receiverId,
          messageId,
          isGroup
        );
        toast.success("Tin nhắn đã được chuyển tiếp thành công");
        onClose();
      }
    } catch (error) {
      console.error("Lỗi khi chuyển tiếp tin nhắn:", error);
      toast.error("Không thể chuyển tiếp tin nhắn. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý chọn người nhận
  const handleSelectRecipient = (id, name, isGroup) => {
    setSelectedRecipient({ id, name, isGroup });
    setActiveTab(isGroup ? "groups" : "chats");
  };
  // Hàm render xem trước tin nhắn
  const renderMessagePreview = () => {
    if (!messagePreview) return null;

    // Xác định loại tin nhắn để hiển thị phù hợp
    const { message_type, content, file_meta } = messagePreview;
    const imageUrl = file_meta?.url;

    // Lấy thông tin người gửi tin nhắn gốc (nếu có)
    const senderName =
      typeof messagePreview.sender_id === "object"
        ? messagePreview.sender_id.name
        : "Người gửi";

    // Format thời gian
    const messageTime = messagePreview.timestamp
      ? new Date(messagePreview.timestamp).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return (
      <div className="card bg-base-100 shadow-sm mb-4 border border-gray-200">
        <div className="card-body p-3">
          <div className="flex justify-between items-center text-xs text-blue-500 mb-2">
            <div className="flex items-center">
              <BsReplyAll className="mr-1" size={14} />
              <span>Tin nhắn được chuyển tiếp từ {senderName}</span>
            </div>
            {messageTime && (
              <span className="text-gray-500">{messageTime}</span>
            )}
          </div>
          {message_type === "text" && (
            <p className="text-sm break-words">{content}</p>
          )}
          {message_type === "image" && imageUrl && (
            <div className="flex flex-col">
              <img
                src={imageUrl}
                alt="Hình ảnh"
                className="max-h-32 object-contain rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">Hình ảnh</p>
            </div>
          )}
          {message_type === "video" && imageUrl && (
            <div className="flex items-center">
              <div className="bg-gray-100 p-2 rounded-md">
                <p className="text-xs">Video</p>
              </div>
            </div>
          )}
          {message_type === "file" && (
            <div className="flex items-center">
              <div className="bg-gray-100 p-2 rounded-md">
                <p className="text-xs">
                  {file_meta?.file_name || "Tệp đính kèm"}
                </p>
              </div>
            </div>
          )}
          {message_type === "voice" && (
            <div className="flex items-center">
              <div className="bg-gray-100 p-2 rounded-md">
                <p className="text-xs">Ghi âm thoại</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-md max-h-[90vh] flex flex-col rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="font-bold text-lg">Chuyển tiếp tin nhắn</h3>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            ×
          </button>
        </div>
        {/* Hiển thị xem trước tin nhắn */}{" "}
        <div className="p-4 flex-1">
          {renderMessagePreview()}
          <div className="w-full mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm bạn bè hoặc nhóm..."
                className="input input-bordered w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <BsSearch className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="tabs tabs-boxed mb-4">
            <button
              className={`tab ${activeTab === "chats" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("chats")}
            >
              <BsPerson className="inline mr-1" /> Cá nhân
            </button>
            <button
              className={`tab ${activeTab === "groups" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("groups")}
            >
              <BsPeople className="inline mr-1" /> Nhóm
            </button>{" "}
          </div>
          <div className="overflow-y-auto max-h-[140px]">
            {activeTab === "chats" ? (
              filteredChats.length > 0 ? (
                <div className="menu bg-base-100 rounded-md w-full">
                  {filteredChats.map((conversation) => {
                    // Sử dụng recipient đã được tạo khi lọc danh sách
                    const { recipient } = conversation;

                    // Lấy ID người nhận dựa theo cấu trúc (có thể khác nhau)
                    const recipientId =
                      recipient?.user_id?._id || recipient?.user_id;

                    return (
                      <div key={conversation._id}>
                        <button
                          className={`flex items-center w-full py-2 px-3 hover:bg-base-200 rounded-lg ${
                            selectedRecipient?.id === recipientId
                              ? "bg-gray-300 bg-opacity-10"
                              : ""
                          }`}
                          onClick={() =>
                            handleSelectRecipient(
                              recipientId,
                              recipient?.name,
                              false
                            )
                          }
                        >
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full mr-3">
                              {recipient?.primary_avatar ? (
                                <img
                                  src={recipient.primary_avatar}
                                  alt={recipient.name}
                                />
                              ) : (
                                <div className="bg-primary text-primary-content grid place-items-center">
                                  {recipient?.name?.charAt(0) || "?"}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium">
                              {recipient?.name || "Người dùng"}
                            </div>
                          </div>
                          {selectedRecipient?.id === recipientId && (
                            <div className="badge badge-primary badge-sm ml-2">
                              ✓
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="alert">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-info shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>Không tìm thấy cuộc trò chuyện nào</span>
                </div>
              )
            ) : filteredGroups.length > 0 ? (
              <div className="menu bg-base-100 rounded-md w-full">
                {filteredGroups.map((group) => (
                  <div key={group._id} className="">
                    <button
                      className={`flex items-center w-full py-2 px-3 hover:bg-base-200 rounded-lg ${
                        selectedRecipient?.id === group._id
                          ? "bg-gray-300 bg-opacity-10"
                          : ""
                      }`}
                      onClick={() =>
                        handleSelectRecipient(group._id, group.name, true)
                      }
                    >
                      <div className="avatar">
                        <div className="w-10 h-10 rounded-full mr-3">
                          {group.avatar ? (
                            <img src={group.avatar} alt={group.name} />
                          ) : (
                            <div className="bg-secondary text-secondary-content grid place-items-center">
                              {group?.name?.charAt(0) || "G"}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{group.name}</div>
                        <div className="text-xs text-gray-500">
                          {group.members?.length || 0} thành viên
                        </div>
                      </div>
                      {selectedRecipient?.id === group._id && (
                        <div className="badge badge-primary badge-sm ml-2">
                          ✓
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-info shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span>Không tìm thấy nhóm nào</span>
              </div>
            )}
          </div>
        </div>
        <div className="border-t p-4 flex justify-end gap-2 mt-auto">
          <button className="btn btn-outline" onClick={onClose}>
            Hủy
          </button>
          <button
            className={`btn ${isLoading ? "loading" : ""} btn-primary`}
            onClick={handleForward}
            disabled={isLoading || !selectedRecipient}
          >
            {isLoading ? (
              "Đang xử lý"
            ) : (
              <>
                <MdSend className="mr-1" /> Chuyển tiếp
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardMessageModal;
