import {
  MdOutlineNotifications,
  MdOutlineNotificationsOff,
  MdChevronRight,
  MdOutlineAccessTime,
  MdOutlineInsertDriveFile,
  MdThumbUp,
} from "react-icons/md";

const ConversationInfoPanel = ({ user, onClose }) => {
  return (
    <div className="w-[320px] h-full border-l border-gray-200 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
        <h3 className="font-semibold">Thông tin hội thoại</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <MdChevronRight size={18} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* User profile */}
        <div className="p-4 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full overflow-hidden mb-2">
            <img
              src={
                user.avatar ||
                `https://ui-avatars.com/api/?name=${user.name.charAt(
                  0
                )}&background=random&size=80`
              }
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-lg font-medium">{user.name}</h2>
          <p className="text-sm text-gray-500">Đang hoạt động</p>
        </div>

        {/* Actions */}
        <div className="flex justify-around p-2 border-b border-gray-200">
          <div className="flex flex-col items-center">
            <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full">
              <MdOutlineNotifications size={20} className="text-gray-600" />
            </button>
            <span className="text-xs mt-1">Thông báo</span>
          </div>

          <div className="flex flex-col items-center">
            <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full">
              <MdOutlineAccessTime size={20} className="text-gray-600" />
            </button>
            <span className="text-xs mt-1">Đặt giờ</span>
          </div>
        </div>

        {/* Media */}
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium mb-2">Ảnh/Video</h4>
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="aspect-square bg-gray-100 rounded overflow-hidden"
              >
                <img
                  src={`https://picsum.photos/id/${item + 10}/100/100`}
                  alt="Media"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          <button className="text-blue-500 text-sm mt-2 w-full text-center">
            Xem tất cả
          </button>
        </div>

        {/* Files */}
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium mb-2">File</h4>
          <div className="space-y-2">
            <div className="flex items-center p-2 hover:bg-gray-100 rounded">
              <div className="p-2 bg-gray-200 rounded mr-2">
                <MdOutlineInsertDriveFile size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium">FE_AppChat_Zele.rar</p>
                <p className="text-xs text-gray-500">239.16 KB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Custom actions */}
        <div className="p-4">
          <button className="flex items-center p-2 hover:bg-gray-100 rounded w-full">
            <MdOutlineNotificationsOff
              className="mr-3 text-gray-600"
              size={20}
            />
            <span>Tắt thông báo</span>
          </button>

          <button className="flex items-center p-2 hover:bg-gray-100 rounded text-red-500 w-full">
            <span>Xóa đoạn chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationInfoPanel;
