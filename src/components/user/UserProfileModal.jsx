import React from "react";

const UserProfileModal = ({ isOpen, onClose, recipient }) => {
  if (!isOpen) return null;

  console.log("Recipient data:", recipient);
  return (
    <dialog id="userProfileModal" className="modal modal-middle" open>
      <div className="modal-box max-w-md relative p-0 overflow-y-auto scrollbar-hide">
        {/* Fixed header with close button and title */}
        <div className="sticky top-0 z-20 w-full flex justify-center items-center h-12 bg-gradient-to-b from-black/50 to-transparent">
          <h3 className="font-bold text-lg text-white">Thông tin tài khoản</h3>
          <button
            className="btn btn-sm btn-circle absolute right-2 bg-transparent border-none text-white"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="text-center">
          {/* User avatar and name */}
          <div className="h-64 w-full relative">
            {/* Background image - Rice terraces landscape */}
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${
                  recipient.backgroundImage ||
                  "https://images.unsplash.com/photo-1506260408121-e353d10b87c7?q=80&w=1000&auto=format&fit=crop"
                })`,
              }}
            >
              {/* No overlay to maintain natural look */}
            </div>

            {/* Avatar positioned at bottom center of background */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white">
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
            </div>
          </div>

          {/* User name */}
          <h2 className="text-xl font-semibold mt-12 mb-1">{recipient.name}</h2>

          {/* Call and Message buttons */}
          <div className="flex justify-center gap-4 mt-3 mb-6">
            <button className="btn btn-sm bg-gray-200 hover:bg-gray-300 text-black border-none rounded-full w-28">
              Gọi điện
            </button>
            <button className="btn btn-sm bg-blue-50 hover:bg-blue-100 text-blue-600 border-none rounded-full w-28">
              Nhắn tin
            </button>
          </div>

          {/* Add a small gray separator before user information section */}
          <div className="h-2 bg-gray-50 w-full"></div>

          {/* BLOCK 1: User information */}
          <div className="px-4 py-3">
            <h4 className="text-md font-medium mb-2">Thông tin cá nhân</h4>
            <div className="space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-500">Giới tính</span>
                <span>{recipient.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày sinh</span>
                <span>{recipient.dob}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Điện thoại</span>
                <span>{recipient.phone}</span>
              </div>
            </div>
          </div>

          {/* Gray separator that spans full width */}
          <div className="h-2 bg-gray-50 w-full"></div>

          {/* BLOCK 2: User photos */}
          <div className="px-4 py-3">
            <h4 className="text-md font-medium mb-2 text-left">Hình ảnh</h4>
            <div className="text-center text-gray-500">
              Chưa có ảnh nào được chia sẻ
            </div>
          </div>

          {/* Gray separator that spans full width */}
          <div className="h-2 bg-gray-50 w-full"></div>

          {/* BLOCK 3: Functions and actions */}
          <div className="px-4 divide-y divide-gray-100">
            <div className="py-3">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Nhóm chung (2)</span>
              </div>
            </div>

            <div className="py-3">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span>Chia sẻ danh thiếp</span>
              </div>
            </div>

            <div className="py-3">
              <div className="flex items-center gap-2 text-red-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Chặn tin nhắn và cuộc gọi</span>
              </div>
            </div>

            <div className="py-3">
              <div className="flex items-center gap-2 text-red-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Báo xấu</span>
              </div>
            </div>

            <div className="py-3">
              <div className="flex items-center gap-2 text-red-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Xóa khỏi danh sách bạn bè</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </dialog>
  );
};

export default UserProfileModal;
