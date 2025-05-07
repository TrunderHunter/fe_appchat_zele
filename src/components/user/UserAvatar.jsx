import React, { memo } from 'react';

// Component Avatar được tối ưu hóa với memo để tránh re-render không cần thiết
const UserAvatar = memo(({ 
  src, 
  alt = "User", 
  size = "md", 
  onClick,
  className = ""
}) => {
  // Avatar mặc định dạng data URI
  const defaultAvatar =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23CCCCCC'/%3E%3Ctext x='50' y='62' font-size='35' text-anchor='middle' fill='%23FFFFFF'%3EU%3C/text%3E%3C/svg%3E";

  // Xác định kích thước dựa trên prop size
  const sizeClasses = {
    'xs': 'w-6 h-6',
    'sm': 'w-8 h-8',
    'md': 'w-10 h-10',
    'lg': 'w-12 h-12',
    'xl': 'w-16 h-16',
    '2xl': 'w-20 h-20',
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div 
      className={`${sizeClass} rounded-full overflow-hidden ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <img
        src={src || defaultAvatar}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-200"
        onError={(e) => {
          e.target.src = defaultAvatar;
        }}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Hàm so sánh tùy chỉnh để quyết định có render lại hay không
  // Chỉ re-render nếu src thay đổi hoặc onClick thay đổi
  return prevProps.src === nextProps.src && prevProps.onClick === nextProps.onClick;
});

export default UserAvatar;