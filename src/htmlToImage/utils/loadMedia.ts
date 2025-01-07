import {
  isElementNode,
  isImageElement,
  isSVGImageElementNode,
  isVideoElement
} from './checkElement';
import createImage from './createImage';
import isApple from './isApple';

type LoadMediaOptions = {
  ownerDocument?: Document;
  timeout?: number;
  onError?: (error: Error) => void;
};

type Media = HTMLVideoElement | HTMLImageElement | SVGImageElement;

export const getDocument = <T extends Node>(target?: T | null): Document => {
  return ((target && isElementNode(target as any) ? target?.ownerDocument : target) ??
    globalThis.document) as any;
};

const loadMedia = (media: any, options?: LoadMediaOptions): Promise<any> => {
  // @ts-expect-error
  return new Promise((resolve) => {
    const { timeout, ownerDocument, onError: userOnError } = options ?? {};
    const node: Media =
      typeof media === 'string' ? createImage(media, getDocument(ownerDocument)) : media;
    let timer: any = null;
    let removeEventListeners: null | (() => void) = null;

    const onResolve = () => {
      resolve(node);
      // eslint-disable-next-line no-unused-expressions
      timer && clearTimeout(timer);
      removeEventListeners?.();
    };

    if (timeout) {
      timer = setTimeout(onResolve, timeout);
    }

    if (isVideoElement(node)) {
      const currentSrc = node.currentSrc || node.src;
      if (!currentSrc) {
        if (node.poster) {
          // eslint-disable-next-line no-promise-executor-return
          return loadMedia(node.poster, options).then(resolve);
        }
        onResolve();
        return;
      }
      if (node.readyState >= 2) {
        onResolve();
        return;
      }
      const onLoadeddata = onResolve;
      const onError = (error: any) => {
        userOnError?.(error);
        onResolve();
      };
      removeEventListeners = () => {
        node.removeEventListener('loadeddata', onLoadeddata);
        node.removeEventListener('error', onError);
      };
      node.addEventListener('loadeddata', onLoadeddata, { once: true });
      node.addEventListener('error', onError, { once: true });
    } else {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.append(node);
      document.body.append(svg);
      const currentSrc = isSVGImageElementNode(node)
        ? node.href.baseVal
        : node.currentSrc || node.src;

      if (!currentSrc) {
        onResolve();
        return;
      }

      const onLoad = async () => {
        svg.remove();
        if (isImageElement(node) && 'decode' in node) {
          try {
            await node.decode();

            if (isApple()) {
              // 获取图像并确保 SVG 内部的所有图像已加载
              const svgDoc = new DOMParser().parseFromString(
                decodeURIComponent(node.src.split(',')[1]),
                'image/svg+xml'
              );

              const webpImages = [...svgDoc.querySelectorAll('img, div')]
                .map((element: any) => {
                  // 检查 <image> 标签
                  if (element.tagName.toLowerCase() === 'img') {
                    return element.getAttribute('src');
                  }
                  // 检查 <div> 或其他带背景图片的元素
                  if (element.tagName.toLowerCase() === 'div' && element.style.backgroundImage) {
                    const backgroundImage = element.style.backgroundImage;
                    // 提取 background-image 的 URL，例如 url("data:image/webp;base64,...")
                    const match = backgroundImage.match(
                      /url\(["']?(data:image\/webp;base64,[^"']+)["']?\)/
                    );
                    return match ? match[1] : null;
                  }

                  return null;
                })
                .filter((src) => src && /^data:image\/(webp|png);base64,/.test(src));

              const loadImagesPromises = [...webpImages].map((url) => {
                return new Promise((resolve, reject) => {
                  const imgElement = new Image();
                  imgElement.src = url || '';
                  imgElement.addEventListener('load', resolve);
                  imgElement.addEventListener('error', reject);
                });
              });

              // 等待所有图像加载完成
              await Promise.all(loadImagesPromises);
            }
          } catch (error) {
            console.log('error:', error);
          }
        }
        if (globalThis && globalThis.requestAnimationFrame) {
          globalThis.requestAnimationFrame(() => {
            onResolve();
          });
        } else {
          onResolve();
        }
      };

      const onError = (error: any) => {
        console.log('error:', error);
        svg.remove();
        onResolve();
      };

      if (isImageElement(node) && node.complete) {
        // eslint-disable-next-line no-promise-executor-return
        return onLoad();
      }

      removeEventListeners = () => {
        node.removeEventListener('load', onLoad);
        node.removeEventListener('error', onError);
      };

      node.addEventListener('load', onLoad, { once: true });
      node.addEventListener('error', onError, { once: true });
    }
  });
};

export default loadMedia;
