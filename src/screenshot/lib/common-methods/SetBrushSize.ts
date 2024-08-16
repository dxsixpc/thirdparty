import setSelectedClassName from 'src/screenshot/lib/common-methods/SetSelectedClassName';
import InitData from 'src/screenshot/lib/main-entrance/InitData';

/**
 * 设置画笔大小
 * @param size
 * @param index
 * @param mouseEvent
 */
export const setBrushSize = (size: string, index: number, mouseEvent: MouseEvent) => {
  const data = new InitData();
  // 为当前点击项添加选中时的class名
  setSelectedClassName(mouseEvent, index, true);
  let sizeNum = 2;
  switch (size) {
    case 'small': {
      sizeNum = 2;
      break;
    }
    case 'medium': {
      sizeNum = 5;
      break;
    }
    case 'big': {
      sizeNum = 10;
      break;
    }
  }
  data.setPenSize(sizeNum);
  return sizeNum;
};

/**
 * 设置马赛克工具的笔触大小
 * @param size
 * @param index
 * @param mouseEvent
 */
export const setMosaicPenSize = (size: string, index: number, mouseEvent: MouseEvent) => {
  const data = new InitData();
  // 为当前点击项添加选中时的class名
  setSelectedClassName(mouseEvent, index, true);
  let sizeNum = 10;
  switch (size) {
    case 'small': {
      sizeNum = 10;
      break;
    }
    case 'medium': {
      sizeNum = 20;
      break;
    }
    case 'big': {
      sizeNum = 40;
      break;
    }
  }
  data.setMosaicPenSize(sizeNum);
  return sizeNum;
};
