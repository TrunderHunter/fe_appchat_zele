import React from "react";

const AvatarSelectionGrid = ({ avatars = [], selectedAvatar, onSelect }) => {
  const defaultAvatar =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23CCCCCC'/%3E%3Ctext x='50' y='62' font-size='35' text-anchor='middle' fill='%23FFFFFF'%3EU%3C/text%3E%3C/svg%3E";

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">
        Ảnh đại diện của tôi
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {avatars.length > 0 ? (
          avatars.map((avatar, index) => (
            <div
              key={`avatar-${index}`}
              className={`relative cursor-pointer rounded-full overflow-hidden w-20 h-20 mx-auto ${
                selectedAvatar === avatar ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => onSelect(avatar)}
            >
              <img
                src={avatar}
                alt={`Avatar ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center text-gray-500 py-4">
            Bạn chưa có ảnh đại diện nào
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarSelectionGrid;
