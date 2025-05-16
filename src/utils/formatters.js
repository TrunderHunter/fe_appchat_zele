/**
 * Định dạng giờ phút của tin nhắn
 * @param {Date|string} timestamp - Thời gian cần định dạng
 * @returns {string} Chuỗi giờ phút đã định dạng (HH:MM)
 */
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return "";

  const messageDate = new Date(timestamp);
  return messageDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Định dạng ngày của tin nhắn dưới dạng nhóm
 * @param {Date|string} timestamp - Thời gian cần định dạng
 * @returns {string} Chuỗi ngày đã định dạng ("Hôm nay", "Hôm qua", hoặc "ngày DD/MM/YYYY")
 */
export const formatMessageDate = (timestamp) => {
  if (!timestamp) return "";

  const messageDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Đặt thời gian về 00:00:00 để so sánh chỉ ngày tháng năm
  const messageDay = new Date(
    messageDate.getFullYear(),
    messageDate.getMonth(),
    messageDate.getDate()
  );
  const todayDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const yesterdayDay = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate()
  );

  if (messageDay.getTime() === todayDay.getTime()) {
    return "Hôm nay";
  } else if (messageDay.getTime() === yesterdayDay.getTime()) {
    return "Hôm qua";
  } else {
    return `Ngày ${messageDate.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })}`;
  }
};

/**
 * Nhóm tin nhắn theo ngày
 * @param {Array} messages - Mảng các tin nhắn cần nhóm
 * @returns {Object} Mảng tin nhắn đã được nhóm theo ngày
 */
export const groupMessagesByDate = (messages) => {
  if (!messages || !messages.length) return [];

  const groups = [];
  let currentDate = null;

  messages.forEach((message) => {
    const timestamp = message.timestamp || new Date();
    const messageDate = new Date(timestamp);
    const dateString = messageDate.toISOString().split("T")[0]; // YYYY-MM-DD

    // Nếu ngày thay đổi hoặc là tin nhắn đầu tiên
    if (currentDate !== dateString) {
      currentDate = dateString;
      groups.push({
        type: "date",
        date: timestamp,
        id: `date-${dateString}`,
      });
    }

    groups.push({
      type: "message",
      message: message,
      id: message._id,
    });
  });

  return groups;
};
