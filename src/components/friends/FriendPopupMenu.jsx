import React, { forwardRef } from "react";
import { Info, X, UserMinus, Tag, Edit } from "lucide-react";

const FriendPopupMenu = forwardRef(
  (
    {
      friend,
      onViewInfo,
      onBlockUser,
      onDeleteFriend,
      onSetCategory,
      onSetNickname,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200"
      >
        <div className="py-1">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-semibold">Tùy chọn</h3>
          </div>

          <button
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
            onClick={(e) => onViewInfo(e, friend.id)}
          >
            <Info size={16} className="mr-2" />
            Xem thông tin
          </button>

          <button
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
            onClick={(e) => onSetCategory(e, friend.id)}
          >
            <Tag size={16} className="mr-2" />
            Phân loại
          </button>

          <button
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
            onClick={(e) => onSetNickname(e, friend.id)}
          >
            <Edit size={16} className="mr-2" />
            Đặt tên gọi nhớ
          </button>

          <button
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
            onClick={(e) => onBlockUser(e, friend.id)}
          >
            <X size={16} className="mr-2" />
            Chặn người này
          </button>

          <button
            className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left border-t border-gray-100"
            onClick={(e) => onDeleteFriend(e, friend.id)}
          >
            <UserMinus size={16} className="mr-2" />
            Xóa bạn
          </button>
        </div>
      </div>
    );
  }
);

FriendPopupMenu.displayName = "FriendPopupMenu";

export default FriendPopupMenu;
