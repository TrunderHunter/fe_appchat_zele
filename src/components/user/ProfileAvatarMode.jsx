import React from "react";
import { ChevronLeft, X } from "lucide-react";

const ProfileAvatarMode = ({
  contentClasses,
  avatars,
  selectedAvatar,
  isUploading,
  handleFileSelect,
  setSelectedAvatar,
  handleBackToView,
  handleSaveAvatar,
  handleClose,
  AvatarUploadButton,
  AvatarSelectionGrid,
}) => {
  return (
    <div className={contentClasses}>
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <button
          onClick={handleBackToView}
          className="text-gray-500 hover:text-gray-700 mr-4"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-semibold flex-1">Cập nhật ảnh đại diện</h2>
        <button
          className="btn btn-sm btn-circle btn-ghost"
          onClick={handleClose}
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Upload Button */}
        <AvatarUploadButton onFileSelect={handleFileSelect} />

        {/* Avatar Grid */}
        <AvatarSelectionGrid
          avatars={avatars}
          selectedAvatar={selectedAvatar}
          onSelect={setSelectedAvatar}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 p-4 border-t">
        <button className="btn btn-outline" onClick={handleBackToView}>
          Huỷ
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSaveAvatar}
          disabled={isUploading || !selectedAvatar}
        >
          {isUploading ? "Đang tải..." : "Cập nhật"}
        </button>
      </div>
    </div>
  );
};

export default ProfileAvatarMode;
