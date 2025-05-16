import { useState, useRef, memo } from "react";
import {
  MdImage,
  MdOutlineEmojiEmotions,
  MdAttachFile,
  MdSend,
  MdThumbUp,
} from "react-icons/md";

const MessageInput = memo(({ 
  onSendMessage, 
  isLoadingMessages, 
  conversationType,
  recipientName
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

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

  const getInputPlaceholder = () => {
    if (isLoadingMessages) return "Đang xử lý...";
    if (conversationType === "group")
      return `Nhập tin nhắn đến ${recipientName || "nhóm"}`;
    return `Nhập tin nhắn đến ${recipientName}`;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || isLoadingMessages) return;

    try {
      setIsUploading(selectedFile !== null);

      const result = await onSendMessage(newMessage, selectedFile);

      if (result.success) {
        setNewMessage("");
        setSelectedFile(null);
      }
    } catch (error) {
      console.error("Error sending message", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
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
        <form onSubmit={handleSend} className="flex items-center">
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
    </>
  );
});

MessageInput.displayName = "MessageInput";

export default MessageInput;
