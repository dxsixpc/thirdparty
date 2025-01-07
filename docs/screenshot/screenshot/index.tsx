import { ScreenShot } from '@zpcscc/thirdparty';
import { Button, Flex, Image, Radio, Space, type RadioChangeEvent } from 'antd';
import { useState, type FC } from 'react';

// 自由截屏工具
const App: FC = () => {
  const [imgSrc, setImgSrc] = useState<string>('https://zpcscc.top/img/logo.png');
  const [enableWebRtc, setEnableWebRtc] = useState<boolean>(false);

  // 截屏
  const onScreenshot = () => {
    // eslint-disable-next-line no-new
    new ScreenShot({
      enableWebRtc,
      ratio: 2,
      completeCallback: ({ base64 }) => setImgSrc(base64)
    });
  };

  const onChange = (e: RadioChangeEvent) => {
    const value = e.target.value;
    setEnableWebRtc(value === 'WebRtc');
  };

  return (
    <Space direction='vertical' align='center'>
      <Image width={400} height={300} src={imgSrc} />
      <Flex gap='middle' align='center' justify='center'>
        截屏模式
        <Radio.Group onChange={onChange} defaultValue='html-to-image'>
          <Radio.Button value='WebRtc'>WebRtc</Radio.Button>
          <Radio.Button value='html-to-image'>html-to-image</Radio.Button>
        </Radio.Group>
      </Flex>
      <Button type='primary' onClick={onScreenshot}>
        开始截屏
      </Button>
    </Space>
  );
};

export default App;
