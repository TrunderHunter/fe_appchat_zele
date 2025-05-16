import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import socketManager from "../../services/SocketManager";
import useAuthStore from "../../stores/authStore";
import {
  BsCheck2All,
  BsHandThumbsUp,
  BsHandThumbsUpFill,
  BsFiletypeDocx,
  BsMic,
  BsReply,
  BsClipboard,
  BsTrash,
  BsReplyAll,
} from "react-icons/bs";
import { MdOutlineContentCopy, MdKeyboardArrowRight } from "react-icons/md";
import { AiOutlineExclamationCircle } from "react-icons/ai";
import { PiDotsThreeCircleLight } from "react-icons/pi";
import { TiPinOutline } from "react-icons/ti";
import { IoIosStarOutline } from "react-icons/io";
import { BsListCheck } from "react-icons/bs";
import ForwardMessageModal from "./ForwardMessageModal";

const MessageBubble = ({ message, isMe }) => {
  // Trích xuất thông tin tin nhắn, đảm bảo xử lý cả tin nhắn thường và tin nhắn chuyển tiếp
  const {
    text,
    time,
    status,
    type,
    fileUrl,
    senderName,
    senderAvatar,
    _id,
    file_meta,
  } = message;
  const [showControls, setShowControls] = useState(false);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState("bottom"); // "bottom" or "top"
  const popupRef = useRef(null);
  const buttonRef = useRef(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(message.likes?.length || 0);
  const [showForwardModal, setShowForwardModal] = useState(false);

  const handleLike = () => {
    if (!isLiked) {
      setIsLiked(true);
      setLikeCount((prevCount) => prevCount + 1);
      toast.success("Đã thích tin nhắn");
      // Ở đây có thể gọi API để lưu phản ứng vào cơ sở dữ liệu
      // Ví dụ: likeMessage(message._id)
    } else {
      setIsLiked(false);
      setLikeCount((prevCount) => Math.max(0, prevCount - 1));
      // Gọi API để bỏ thích tin nhắn
      // Ví dụ: unlikeMessage(message._id)
    }
  };

  const handleReply = () => {
    toast.success("Trả lời tin nhắn");
    // Xử lý trả lời tin nhắn
    // Có thể emit một sự kiện hoặc gọi hàm callback
  };

  const handleForward = () => {
    setShowForwardModal(true);
    setShowMessageActions(false);
  };

  const handleCopy = () => {
    const content = type === "text" ? text : fileUrl;
    navigator.clipboard.writeText(content);
    toast.success("Đã sao chép nội dung tin nhắn");
  };
  const handleDelete = () => {
    toast.success("Đã xóa tin nhắn");
    setShowPopup(false);
    // Xử lý xóa tin nhắn
    // Gọi API để xóa tin nhắn
  };

  const handlePin = () => {
    toast.success("Đã ghim tin nhắn");
    setShowPopup(false);
  };

  const handleBookmark = () => {
    toast.success("Đã đánh dấu tin nhắn");
    setShowPopup(false);
  };

  const handleReport = () => {
    toast.success("Đã báo cáo tin nhắn");
    setShowPopup(false);
  };
  const handleRevoke = () => {
    // Sử dụng socket để thu hồi tin nhắn
    const socket = socketManager.getSocket();
    const userId = useAuthStore.getState().user._id;

    if (socket) {
      console.log(`Emitting revokeMessage for message: ${_id}`);

      // Đảm bảo rằng _id tồn tại và có giá trị
      if (!_id) {
        toast.error("Không thể thu hồi tin nhắn: ID tin nhắn không hợp lệ");
        setShowPopup(false);
        return;
      }

      socket.emit("revokeMessage", {
        messageId: _id,
        userId: userId,
      });

      // Thêm xử lý lỗi và thông báo rõ ràng cho người dùng
      toast.loading("Đang thu hồi tin nhắn...", { id: "revoking" });

      // Đặt timeout để kiểm tra nếu không nhận được phản hồi sau 3 giây
      setTimeout(() => {
        toast.dismiss("revoking");
      }, 3000);
    } else {
      toast.error("Không thể thu hồi tin nhắn, vui lòng thử lại sau");
    }
    setShowPopup(false);
  };

  const togglePopup = (e) => {
    e.stopPropagation(); // Ngăn chặn sự kiện lan ra ngoài

    if (!showPopup) {
      const rect = buttonRef.current?.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - (rect?.bottom || 0);

      // Kiểm tra xem có đủ không gian phía dưới để hiển thị popup không (> 200px)
      setPopupPosition(spaceBelow > 200 ? "bottom" : "top");
    }

    setShowPopup(!showPopup);
  };

  // Đóng popup khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowPopup(false);
      }
    };

    if (showPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPopup]);

  // Render các nút công cụ khi hover vào tin nhắn

  const renderMessageActions = () => {
    return (
      <div
        className={`absolute ${
          isMe ? "right-full mr-2" : "left-full ml-2"
        } top-1/2 transform -translate-y-1/2 flex bg-white rounded-lg shadow-md p-1 z-10 
                    ${
                      showMessageActions
                        ? "opacity-100 visible scale-100"
                        : "opacity-0 invisible scale-95"
                    } 
                    transition-all duration-200 ease-in-out`}
        data-tooltip="Các tùy chọn"
      >
        <button
          className="p-1.5 mx-0.5 hover:bg-gray-100 rounded-full transition-colors duration-150 flex items-center justify-center"
          onClick={handleReply}
          title="Trả lời"
        >
          <BsReply size={15} className="text-gray-600" />
        </button>
        <button
          className="p-1.5 mx-0.5 hover:bg-gray-100 rounded-full transition-colors duration-150 flex items-center justify-center"
          onClick={handleForward}
          title="Chuyển tiếp"
        >
          <BsReplyAll size={15} className="text-gray-600" />
        </button>
        <button
          className="p-1.5 mx-0.5 hover:bg-gray-100 rounded-full transition-colors duration-150 flex items-center justify-center"
          onClick={handleCopy}
          title="Sao chép"
        >
          <MdOutlineContentCopy size={15} className="text-gray-600" />
        </button>
        <button
          ref={buttonRef}
          className="p-1.5 mx-0.5 hover:bg-gray-50 rounded-full transition-colors duration-150 flex items-center justify-center"
          onClick={togglePopup}
          title="Thêm tùy chọn"
        >
          <PiDotsThreeCircleLight size={16} className="text-gray-600" />
        </button>{" "}
        <div className="relative">
          {/* Popup Menu */}
          {showPopup && (
            <div
              ref={popupRef}
              className={`absolute ${
                popupPosition === "bottom"
                  ? "top-full mt-1"
                  : "bottom-full mb-1"
              } right-0 bg-white rounded-lg shadow-lg z-50 py-1 w-56`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col divide-y divide-gray-100">
                <button
                  className="flex items-center px-4 py-2.5 hover:bg-gray-50 w-full text-left text-black"
                  onClick={handleCopy}
                >
                  <MdOutlineContentCopy
                    className="mr-3 text-gray-600"
                    size={16}
                  />
                  <span className="text-sm">Sao chép tin nhắn</span>
                </button>

                <button
                  className="flex items-center px-4 py-2.5 hover:bg-gray-50 w-full text-left text-black"
                  onClick={handlePin}
                >
                  <TiPinOutline className="mr-3 text-gray-600" size={16} />
                  <span className="text-sm">Ghim tin nhắn</span>
                </button>

                <button
                  className="flex items-center px-4 py-2.5 hover:bg-gray-50 w-full text-left text-black"
                  onClick={handleBookmark}
                >
                  <IoIosStarOutline className="mr-3 text-gray-600" size={16} />
                  <span className="text-sm">Đánh dấu tin nhắn</span>
                </button>

                <button
                  className="flex items-center px-4 py-2.5 hover:bg-gray-50 w-full text-left text-black"
                  onClick={handleForward}
                >
                  <BsListCheck className="mr-3 text-gray-600" size={16} />
                  <span className="text-sm">Chọn nhiều tin nhắn</span>
                </button>

                <button
                  className="flex items-center px-4 py-2.5 hover:bg-gray-50 w-full text-left text-black"
                  onClick={handleReport}
                >
                  <AiOutlineExclamationCircle
                    className="mr-3 text-gray-600"
                    size={16}
                  />
                  <span className="text-sm">Xem chi tiết</span>
                </button>

                <button
                  className="flex items-center px-4 py-2.5 hover:bg-gray-50 w-full text-left text-black"
                  onClick={handleReport}
                >
                  <span className="text-sm ml-7">Tùy chọn khác</span>
                  <MdKeyboardArrowRight
                    className="mr-3 text-gray-600 ml-auto"
                    size={16}
                  />
                </button>

                {isMe && (
                  <button
                    className="flex items-center px-4 py-2.5 hover:bg-gray-50 w-full text-left text-red-500"
                    onClick={handleRevoke}
                  >
                    <BsTrash className="mr-3 text-red-500" size={16} />
                    <span className="text-sm">Thu hồi</span>
                  </button>
                )}

                {isMe && (
                  <button
                    className="flex items-center px-4 py-2.5 hover:bg-gray-50 w-full text-left text-red-500"
                    onClick={handleDelete}
                  >
                    <BsTrash className="mr-3 text-red-500" size={16} />
                    <span className="text-sm">Xóa chỉ ở phía tôi</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMessageContent = () => {
    // Nếu tin nhắn bị thu hồi
    if (message.is_revoked) {
      return (
        <div className={`italic ${isMe ? "text-blue-100" : "text-gray-500"}`}>
          Tin nhắn đã bị thu hồi
        </div>
      );
    }

    // Sử dụng fileUrl hoặc file_meta.url nếu có
    const imageUrl = fileUrl || message.file_meta?.url;

    // Xử lý nội dung tin nhắn dựa vào loại
    switch (type) {
      case "image":
        return (
          <div className="mb-1">
            <img
              src={imageUrl}
              alt="Hình ảnh"
              className="max-h-60 rounded-lg cursor-pointer"
              onClick={() => window.open(imageUrl, "_blank")}
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
              <source src={imageUrl} />
              Trình duyệt của bạn không hỗ trợ video này.
            </video>
          </div>
        );
      case "file":
        return (
          <div className="flex items-center mb-1">
            <div className="mr-2">
              <BsFiletypeDocx size={24} />
            </div>
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {imageUrl ? imageUrl.split("/").pop() : "Tải xuống file"}
            </a>
          </div>
        );
      case "voice":
        return (
          <div className="mb-1">
            <div className="flex items-center">
              <BsMic size={20} className="mr-2" />
              <audio controls className="h-8">
                <source src={imageUrl} />
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
      )}{" "}
      <div
        className={`flex mb-3 ${
          isMe ? "justify-end" : "justify-start"
        } items-end group relative hover:z-10`}
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

        {/* Container để định vị cả tin nhắn và nút like */}
        <div className="relative max-w-[70%]">
          {/* Nội dung tin nhắn */}
          <div
            className={`w-full px-4 py-2 relative group/msg ${
              isMe
                ? "bg-blue-500 text-white rounded-t-2xl rounded-l-2xl rounded-br-md"
                : "bg-gray-100 text-black rounded-t-2xl rounded-r-2xl rounded-bl-md"
            } hover:shadow-sm transition-shadow duration-200`}
            onMouseEnter={() => {
              setShowMessageActions(true);
              setShowControls(true);
            }}
            onMouseLeave={() => {
              setShowMessageActions(false);
              setShowControls(false);
            }}
          >
            {renderMessageActions()}

            <div className="flex flex-col">
              {/* Hiển thị thông tin về tin nhắn chuyển tiếp */}{" "}
              {message.forwarded_from && (
                <div
                  className={`text-xs mb-2 ${
                    isMe ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  <div className="flex items-center font-medium mb-1">
                    <BsReplyAll
                      size={12}
                      className={`mr-1 ${
                        isMe ? "text-blue-100" : "text-gray-500"
                      }`}
                    />
                    <span>Tin nhắn được chuyển tiếp</span>
                  </div>
                </div>
              )}
              {renderMessageContent()}
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-xs opacity-70 whitespace-nowrap">
                  {time}
                </span>{" "}
                {isMe && (
                  <span className="ml-1">
                    {status === "delivered" && (
                      <BsCheck2All size={12} className="opacity-70" />
                    )}
                    {status === "seen" && (
                      <BsCheck2All
                        size={12}
                        className={isMe ? "text-white" : "text-blue-400"}
                      />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Nút like với vị trí thống nhất ở góc dưới bên phải */}
          <div
            className={`absolute bottom-[-16px] right-[-2px] ${
              showPopup
                ? "hidden"
                : likeCount > 0 || isLiked
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            } transition-all duration-200 flex items-center z-10`}
          >
            <button
              onClick={handleLike}
              className={`rounded-full p-1.5 transform hover:scale-110 active:scale-95 transition-all ${
                isMe ? "bg-blue-600" : "bg-white"
              } shadow-md hover:shadow-lg border-2 ${
                isLiked
                  ? isMe
                    ? "border-white"
                    : "border-blue-500"
                  : "border-transparent"
              }`}
              title={isLiked ? "Bỏ thích tin nhắn" : "Thích tin nhắn"}
            >
              {isLiked ? (
                <BsHandThumbsUpFill
                  size={16}
                  className={isMe ? "text-white" : "text-blue-600"}
                />
              ) : (
                <BsHandThumbsUp
                  size={16}
                  className={isMe ? "text-white" : "text-blue-500"}
                />
              )}{" "}
            </button>
            {likeCount > 0 && (
              <span
                className={`ml-1.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                  isMe ? "bg-blue-700 text-white" : "bg-white text-blue-600"
                } shadow-md border border-gray-200`}
              >
                {likeCount}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Modal chuyển tiếp tin nhắn */}
      {showForwardModal && (
        <ForwardMessageModal
          messageId={_id}
          onClose={() => setShowForwardModal(false)}
        />
      )}
    </div>
  );
};

export default MessageBubble;
