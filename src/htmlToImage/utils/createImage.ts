import getDocument from './getDocument';

const createImage = (url: string, ownerDocument?: Document | null): HTMLImageElement => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const img = getDocument(ownerDocument).createElement('img');
  img.addEventListener('load', () => svg.remove());
  img.addEventListener('error', () => svg.remove());
  svg.append(img);
  img.decoding = 'sync';
  img.loading = 'eager';
  img.src = url;
  document.body.append(svg);
  return img;
};

export default createImage;
