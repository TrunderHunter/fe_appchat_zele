import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';

// Utility function để tạo các hàm debounce cho scroll handlers
export const createScrollHandlers = () => {
  // Debounced handler cho việc tải tin nhắn cũ
  const debouncedLoadOlderMessages = debounce((callback) => {
    callback();
  }, 300);

  // Throttled handler cho việc cập nhật sticky header
  const throttledUpdateStickyHeader = throttle((container, dateMarkersRef, setShowStickyHeader, setCurrentStickyDate, currentStickyDate) => {
    if (dateMarkersRef.current.size === 0) {
      return;
    }
    
    // Xác định ngày hiển thị dựa trên vị trí cuộn hiện tại
    let currentDate = null;
    let minDistance = Infinity;

    // Tìm marker gần nhất phía trên vị trí cuộn hiện tại
    dateMarkersRef.current.forEach((position, date) => {
      const distance = container.scrollTop - position;
      if (distance >= -50 && distance < minDistance) {
        // -50 là ngưỡng để bắt đầu hiển thị ngày mới sớm hơn một chút
        minDistance = distance;
        currentDate = date;
      }
    });

    // Chỉ hiển thị header khi đã cuộn xuống một chút
    setShowStickyHeader(container.scrollTop > 60);

    // Cập nhật ngày hiển thị
    if (currentDate !== currentStickyDate) {
      setCurrentStickyDate(currentDate);
    }
  }, 100);

  // Debounced handler cho việc cập nhật vị trí markers
  const debouncedUpdateDateMarkerPositions = debounce((container, dateMarkersRef) => {
    if (!container) return;

    // Xóa markers cũ
    dateMarkersRef.current.clear();

    // Tìm tất cả các divider ngày trong container
    const dateElements = container.querySelectorAll("[data-date]");
    dateElements.forEach((element) => {
      const date = element.getAttribute("data-date");
      const rect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const relativePosition =
        rect.top - containerRect.top + container.scrollTop;

      dateMarkersRef.current.set(date, relativePosition);
    });
  }, 200);

  return {
    debouncedLoadOlderMessages,
    throttledUpdateStickyHeader,
    debouncedUpdateDateMarkerPositions
  };
};
