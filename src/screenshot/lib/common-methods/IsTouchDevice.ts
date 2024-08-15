// 检测设备是否支持触摸
const isTouchDevice = (): boolean => {
  // 检查navigator.maxTouchPoints
  const maxTouchPoints = 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0;
  // 检查旧版API navigator.msMaxTouchPoints
  const msMaxTouchPoints =
    'msMaxTouchPoints' in navigator && (navigator as any).msMaxTouchPoints > 0;
  // 检查触摸事件处理器
  const touchEvent = 'ontouchstart' in window;
  // 使用CSS媒体查询检查指针类型
  const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  // 如果以上任何一种方法返回true，则设备支持触摸
  return maxTouchPoints || msMaxTouchPoints || touchEvent || coarsePointer;
};

export default isTouchDevice;
