import type { Options } from './types';
import isApple from './utils/isApple';

export const resolveUrl = (url: string, baseUrl: string | null): string => {
  // url is absolute already
  if (/^[a-z]+:\/\//i.test(url)) {
    return url;
  }

  // url is absolute already, without protocol
  if (/^\/\//.test(url)) {
    return globalThis.location.protocol + url;
  }

  // dataURI, mailto:, tel:, etc.
  if (/^[a-z]+:/i.test(url)) {
    return url;
  }

  const doc = document.implementation.createHTMLDocument();
  const base = doc.createElement('base');
  const a = doc.createElement('a');

  doc.head.append(base);
  doc.body.append(a);

  if (baseUrl) {
    base.href = baseUrl;
  }

  a.href = url;

  return a.href;
};

export const uuid = (() => {
  // generate uuid for className of pseudo elements.
  // We should not use GUIDs, otherwise pseudo elements sometimes cannot be captured.
  let counter = 0;

  // ref: http://stackoverflow.com/a/6248722/2519373
  const random = () =>
    // eslint-disable-next-line no-bitwise
    `0000${Math.trunc(Math.random() * 36 ** 4).toString(36)}`.slice(-4);

  return () => {
    counter += 1;
    return `u${random()}${counter}`;
  };
})();

export const delay = <T>(ms: number) => {
  return (args: T) =>
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(args), ms);
    });
};

export const toArray = <T>(arrayLike: any): T[] => {
  const arr: T[] = [];

  for (let i = 0, l = arrayLike.length; i < l; i++) {
    arr.push(arrayLike[i]);
  }

  return arr;
};

const px = (node: HTMLElement, styleProperty: string) => {
  const win = node.ownerDocument.defaultView || globalThis;
  const val = win.getComputedStyle(node).getPropertyValue(styleProperty);
  return val ? Number.parseFloat(val.replace('px', '')) : 0;
};

const getNodeWidth = (node: HTMLElement) => {
  const leftBorder = px(node, 'border-left-width');
  const rightBorder = px(node, 'border-right-width');
  return node.clientWidth + leftBorder + rightBorder;
};

const getNodeHeight = (node: HTMLElement) => {
  const topBorder = px(node, 'border-top-width');
  const bottomBorder = px(node, 'border-bottom-width');
  return node.clientHeight + topBorder + bottomBorder;
};

export const getImageSize = (targetNode: HTMLElement, options: Options = {}) => {
  const width = options.width || getNodeWidth(targetNode);
  const height = options.height || getNodeHeight(targetNode);
  return { width, height };
};

export const getPixelRatio = () => {
  let ratio: number;

  let FINAL_PROCESS: NodeJS.Process;
  try {
    FINAL_PROCESS = process;
  } catch {}

  // @ts-expect-error
  const val = FINAL_PROCESS && FINAL_PROCESS.env ? FINAL_PROCESS.env.devicePixelRatio : null;
  if (val) {
    ratio = Number.parseInt(val, 10);
    if (Number.isNaN(ratio)) {
      ratio = 1;
    }
  }
  // @ts-expect-error
  return ratio || window.devicePixelRatio || 1;
};

export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  options: Options = {}
): Promise<Blob | null> => {
  if (canvas.toBlob) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, options.type ?? 'image/png', options.quality ?? 1);
    });
  }

  return new Promise((resolve) => {
    const binaryString = globalThis.atob(
      canvas.toDataURL(options.type ?? undefined, options.quality ?? undefined).split(',')[1]
    );
    const len = binaryString.length;
    const binaryArray = new Uint8Array(len);

    for (let i = 0; i < len; i += 1) {
      binaryArray[i] = binaryString.codePointAt(i) ?? 0;
    }

    resolve(
      new Blob([binaryArray], {
        type: options.type ?? 'image/png'
      })
    );
  });
};

export const createImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const img = new Image();
    img.addEventListener('load', () => {
      svg.remove();
      if (globalThis && globalThis.requestAnimationFrame) {
        globalThis.requestAnimationFrame(() => {
          resolve(img);
        });
      } else {
        resolve(img);
      }
    });
    img.addEventListener('error', (error) => {
      svg.remove();
      reject(error);
    });
    svg.append(img);
    img.crossOrigin = 'anonymous';
    img.decoding = 'sync';
    img.loading = 'eager';
    img.src = url;
    document.body.append(svg);
  });
};

export const svgToDataURL = async (svg: SVGElement): Promise<string> => {
  const svgUrl = await Promise.resolve()
    .then(() => new XMLSerializer().serializeToString(svg))
    .then(svgImgToWebP)
    .then(encodeURIComponent)
    .then((html) => `data:image/svg+xml;charset=utf-8,${html}`);
  return svgUrl;
};

export const nodeToSvg = (node: HTMLElement, width: number, height: number): SVGElement => {
  const xmlns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(xmlns, 'svg');
  const foreignObject = document.createElementNS(xmlns, 'foreignObject');

  svg.setAttribute('width', `${width}`);
  svg.setAttribute('height', `${height}`);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  foreignObject.setAttribute('width', '100%');
  foreignObject.setAttribute('height', '100%');
  foreignObject.setAttribute('x', '0');
  foreignObject.setAttribute('y', '0');
  foreignObject.setAttribute('externalResourcesRequired', 'true');

  svg.append(foreignObject);
  foreignObject.append(node);
  return svg;
};

export const shouldEmbed = (url: string): boolean => {
  const URL_REGEX = /url\((["']?)([^"']+?)\1\)/g;
  return url.search(URL_REGEX) !== -1;
};

export const svgImgToWebP = (svgStr: string) => {
  return new Promise<string>((resolve) => {
    if (isApple()) {
      let svgData = svgStr ?? '';
      const base64Regex = /data:image\/(png|jpeg);base64,([\d+/=A-Za-z]+)/g;
      let match: RegExpExecArray | null;
      const promises: Promise<void>[] = [];

      while ((match = base64Regex.exec(svgData)) !== null) {
        if (match) {
          const mimeType = match[1];
          const base64Data = match[2];
          promises.push(
            convertToWebP(base64Data, mimeType, match).then(({ webpDataUrl, matchArr }) => {
              svgData = svgData.replace(matchArr?.[0], webpDataUrl);
            })
          );
        }
      }

      Promise.all(promises).then(() => {
        resolve(svgData);
      });
    } else {
      resolve(svgStr);
    }
  });
};

const convertToWebP = (base64Data: string, mimeType: string, matchArr: any[]) => {
  return new Promise<{ webpDataUrl: string; matchArr: any[] }>((resolve, reject) => {
    const img = new Image();
    img.src = `data:image/${mimeType};base64,${base64Data}`;
    img.addEventListener('load', () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = function () {
              resolve({ webpDataUrl: reader.result as string, matchArr });
            };
            reader.addEventListener('error', reject);
            reader.readAsDataURL(blob);
          }
        },
        'image/webp',
        0.75 // 这里的质量参数可以调整
      );
    });

    img.addEventListener('error', reject);
  });
};
