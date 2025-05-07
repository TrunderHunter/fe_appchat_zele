import {
  CheckCheck,
  ThumbsUp,
  MoreHorizontal,
  File,
  Image as ImageIcon,
  Video,
  Mic,
} from "lucide-react";
import { useState } from "react";

const MessageBubble = ({ message, isMe }) => {
  const { text, time, status, type, fileUrl, senderName, senderAvatar } =
    message;
  const [showControls, setShowControls] = useState(false);

  const renderMessageContent = () => {
    // Nếu tin nhắn bị thu hồi
    if (message.is_revoked) {
      return <div className="italic text-gray-500">Tin nhắn đã bị thu hồi</div>;
    }

    // Xử lý nội dung tin nhắn dựa vào loại
    switch (type) {
      case "image":
        return (
          <div className="mb-1">
            <img
              src={fileUrl}
              alt="Hình ảnh"
              className="max-h-60 rounded-lg cursor-pointer"
              onClick={() => window.open(fileUrl, "_blank")}
            />
          </div>
        );
      case "video":
        return (
          <div className="mb-1">
            <video
              controls
              className="max-h-60 rounded-lg w-full"
              preload="metadata"
            >
              <source src={fileUrl} />
              Trình duyệt của bạn không hỗ trợ video này.
            </video>
          </div>
        );
      case "file":
        return (
          <div className="flex items-center mb-1">
            <div className="mr-2">
              <File size={24} />
            </div>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {fileUrl ? fileUrl.split("/").pop() : "Tải xuống file"}
            </a>
          </div>
        );
      case "voice":
        return (
          <div className="mb-1">
            <div className="flex items-center">
              <Mic size={20} className="mr-2" />
              <audio controls className="h-8">
                <source src={fileUrl} />
              </audio>
            </div>
          </div>
        );
      default: // text
        return <p className="break-words">{text}</p>;
    }
  };

  return (
    <div className="flex flex-col mb-4">
      {/* Tên người gửi - chỉ hiển thị với tin nhắn từ người khác */}
      {!isMe && (
        <div className="text-sm font-medium text-gray-700 ml-12 mb-1">
          {senderName}
        </div>
      )}

      <div
        className={`flex mb-2 ${
          isMe ? "justify-end" : "justify-start"
        } items-end`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Avatar - chỉ hiển thị cho tin nhắn từ người khác */}
        {!isMe && (
          <div className="mr-2 flex-shrink-0">
            <img
              src={
                senderAvatar ||
                `https://ui-avatars.com/api/?name=${senderName?.charAt(
                  0
                )}&background=random`
              }
              alt={senderName}
              className="w-10 h-10 rounded-full object-cover border border-gray-200"
            />
          </div>
        )}

        <div
          className={`max-w-[70%] px-4 py-2 ${
            isMe
              ? "bg-blue-500 text-white rounded-t-2xl rounded-l-2xl rounded-br-md"
              : "bg-gray-100 text-black rounded-t-2xl rounded-r-2xl rounded-bl-md"
          }`}
        >
          <div className="flex flex-col">
            {renderMessageContent()}

            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-xs opacity-70 whitespace-nowrap">
                {time}
              </span>

              {isMe && (
                <span className="ml-1">
                  {status === "delivered" && (
                    <CheckCheck size={12} className="opacity-70" />
                  )}
                  {status === "seen" && (
                    <CheckCheck
                      size={12}
                      className={isMe ? "text-white" : "text-blue-400"}
                    />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center px-2">
          <button
            className={`text-gray-400 hover:bg-gray-100 p-1 rounded-full ${
              showControls ? "opacity-100" : "opacity-0"
            } transition-opacity`}
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
