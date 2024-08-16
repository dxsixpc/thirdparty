import getCanvas2dCtx from 'src/screenshot/lib/common-methods/CanvasPatch';
import PlugInParameters from 'src/screenshot/lib/main-entrance/PlugInParameters';

const saveCanvasToImage = (
  context: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  width: number,
  height: number
) => {
  const plugInParameters = new PlugInParameters();
  // 获取设备像素比
  const dpr = window.devicePixelRatio || 1;
  // 获取裁剪框区域图片信息
  // 获取裁剪框区域图片信息
  const img = context.getImageData(startX * dpr, startY * dpr, width * dpr, height * dpr);
  // 创建canvas标签，用于存放裁剪区域的图片
  const canvas = document.createElement('canvas');
  // 获取裁剪框区域画布
  const imgContext = getCanvas2dCtx(canvas, width, height);
  if (imgContext) {
    // 将图片放进裁剪框内
    imgContext.putImageData(img, 0, 0);
    const a = document.createElement('a');
    // 获取图片
    a.href = canvas.toDataURL('png');
    // 获取用户传入的文件名
    const imgName = plugInParameters?.getSaveImgTitle() || Date.now();
    // 下载图片
    a.download = `${imgName}.png`;
    a.click();
  }
};

export default saveCanvasToImage;
