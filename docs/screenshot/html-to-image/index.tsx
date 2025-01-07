import { toPng } from '@zpcscc/thirdparty';
import { Button, Image, Space } from 'antd';
import { useState, type FC } from 'react';

// 截屏
const App: FC = () => {
  const [imgSrc, setImgSrc] = useState<string>('https://zpcscc.top/img/logo.png');

  // 截屏
  const onScreenshot = async () => {
    const url = await toPng(document.body, {
      pixelRatio: 2,
      skipFonts: true,
      drawImageInterval: 0
    });
    setImgSrc(url);
  };

  return (
    <Space direction='vertical' align='center'>
      <Image width={400} height={300} src={imgSrc} />
      <Button type='primary' onClick={onScreenshot}>
        截取全屏
      </Button>
    </Space>
  );
};

export default App;
