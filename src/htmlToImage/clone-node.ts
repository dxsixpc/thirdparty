import { clonePseudoElements } from './clone-pseudos';
import { resourceToDataURL } from './dataurl';
import { getMimeType } from './mimes';
import type { Options } from './types';
import { createImage, toArray } from './util';
import { isInstanceOfElement } from './utils/checkElement';

const cloneCanvasElement = async (canvas: HTMLCanvasElement) => {
  const dataURL = canvas.toDataURL();
  if (dataURL === 'data:,') {
    return canvas.cloneNode(false) as HTMLCanvasElement;
  }
  return createImage(dataURL);
};

const cloneVideoElement = async (video: HTMLVideoElement, options: Options) => {
  if (video.currentSrc) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL();
    return createImage(dataURL);
  }

  const poster = video.poster;
  const contentType = getMimeType(poster);
  const dataURL = await resourceToDataURL(poster, contentType, options);
  return createImage(dataURL);
};

const cloneIFrameElement = async (iframe: HTMLIFrameElement) => {
  try {
    if (iframe?.contentDocument?.body) {
      return (await cloneNode(iframe.contentDocument.body, {}, true)) as HTMLBodyElement;
    }
  } catch (error) {
    console.log('error:', error);
  }

  return iframe.cloneNode(false) as HTMLIFrameElement;
};

const cloneSingleNode = async <T extends HTMLElement>(
  node: T,
  options: Options
): Promise<HTMLElement> => {
  if (isInstanceOfElement(node, HTMLCanvasElement)) {
    return cloneCanvasElement(node);
  }

  if (isInstanceOfElement(node, HTMLVideoElement)) {
    return cloneVideoElement(node, options);
  }

  if (isInstanceOfElement(node, HTMLIFrameElement)) {
    return cloneIFrameElement(node);
  }

  return node.cloneNode(false) as T;
};

const isSlotElement = (node: HTMLElement): node is HTMLSlotElement =>
  node.tagName != null && node.tagName.toUpperCase() === 'SLOT';

const cloneChildren = async <T extends HTMLElement>(
  nativeNode: T,
  clonedNode: T,
  options: Options
): Promise<T> => {
  let children: T[] = [];

  if (isSlotElement(nativeNode) && nativeNode.assignedNodes) {
    children = toArray<T>(nativeNode.assignedNodes());
  } else if (
    isInstanceOfElement(nativeNode, HTMLIFrameElement) &&
    nativeNode.contentDocument?.body
  ) {
    children = toArray<T>(nativeNode.contentDocument.body.childNodes);
  } else {
    children = toArray<T>((nativeNode.shadowRoot ?? nativeNode).childNodes);
  }

  if (children.length === 0 || isInstanceOfElement(nativeNode, HTMLVideoElement)) {
    return clonedNode;
  }

  await children.reduce(
    (deferred, child) =>
      deferred
        .then(() => cloneNode(child, options))
        .then((clonedChild: HTMLElement | null) => {
          if (clonedChild) {
            clonedNode.append(clonedChild);
          }
        }),
    Promise.resolve()
  );

  return clonedNode;
};

const cloneCSSStyle = <T extends HTMLElement>(nativeNode: T, clonedNode: T) => {
  const targetStyle = clonedNode.style;
  if (!targetStyle) {
    return;
  }

  const sourceStyle = window.getComputedStyle(nativeNode);
  if (sourceStyle.cssText) {
    targetStyle.cssText = sourceStyle.cssText;
    targetStyle.transformOrigin = sourceStyle.transformOrigin;
  } else {
    toArray<string>(sourceStyle).forEach((name) => {
      let value = sourceStyle.getPropertyValue(name);
      if (name === 'font-size' && value.endsWith('px')) {
        const reducedFont =
          Math.floor(Number.parseFloat(value.slice(0, Math.max(0, value.length - 2)))) - 0.1;
        value = `${reducedFont}px`;
      }

      if (
        isInstanceOfElement(nativeNode, HTMLIFrameElement) &&
        name === 'display' &&
        value === 'inline'
      ) {
        value = 'block';
      }

      if (name === 'd' && clonedNode.getAttribute('d')) {
        value = `path(${clonedNode.getAttribute('d')})`;
      }

      targetStyle.setProperty(name, value, sourceStyle.getPropertyPriority(name));
    });
  }
};

const cloneInputValue = <T extends HTMLElement>(nativeNode: T, clonedNode: T) => {
  if (isInstanceOfElement(nativeNode, HTMLTextAreaElement)) {
    clonedNode.innerHTML = nativeNode.value;
  }

  if (isInstanceOfElement(nativeNode, HTMLInputElement)) {
    clonedNode.setAttribute('value', nativeNode.value);
  }
};

const cloneSelectValue = <T extends HTMLElement>(nativeNode: T, clonedNode: T) => {
  if (isInstanceOfElement(nativeNode, HTMLSelectElement)) {
    const clonedSelect = clonedNode as any as HTMLSelectElement;
    const selectedOption = [...clonedSelect.children].find(
      (child) => nativeNode.value === child.getAttribute('value')
    );

    if (selectedOption) {
      selectedOption.setAttribute('selected', '');
    }
  }
};

const cloneScrollPosition = <T extends HTMLElement>(nativeNode: T, clonedNode: T) => {
  // If element is not scrolled, we don't need to move the children.
  if (nativeNode.scrollTop === 0 && nativeNode.scrollLeft === 0) {
    return;
  }

  for (let i = 0; i < clonedNode.children.length; i += 1) {
    const child = clonedNode.children[i];
    if (!('style' in child)) {
      return;
    }

    const element = child as HTMLElement;

    // For each of the children, get the current transform and translate it with
    // the native node's scroll position.
    const { transform } = element.style;
    const matrix = new DOMMatrix(transform);

    const { a, b, c, d } = matrix;
    // reset rotation/skew so it wont change the translate direction.
    matrix.a = 1;
    matrix.b = 0;
    matrix.c = 0;
    matrix.d = 1;
    matrix.translateSelf(-nativeNode.scrollLeft, -nativeNode.scrollTop);
    // restore rotation and skew
    matrix.a = a;
    matrix.b = b;
    matrix.c = c;
    matrix.d = d;
    element.style.transform = matrix.toString();
  }
};

const decorate = <T extends HTMLElement>(nativeNode: T, clonedNode: T): T => {
  if (isInstanceOfElement(clonedNode, Element)) {
    cloneCSSStyle(nativeNode, clonedNode);
    clonePseudoElements(nativeNode, clonedNode);
    cloneInputValue(nativeNode, clonedNode);
    cloneSelectValue(nativeNode, clonedNode);
    cloneScrollPosition(nativeNode, clonedNode);
  }

  return clonedNode;
};

const ensureSVGSymbols = async <T extends HTMLElement>(clone: T, options: Options) => {
  const uses = clone.querySelectorAll ? clone.querySelectorAll('use') : [];
  if (uses.length === 0) {
    return clone;
  }

  const processedDefs: { [key: string]: HTMLElement } = {};
  for (const use of uses) {
    const id = use.getAttribute('xlink:href');
    if (id) {
      const exist = clone.querySelector(id);
      const definition = document.querySelector(id) as HTMLElement;
      if (!exist && definition && !processedDefs[id]) {
        processedDefs[id] = (await cloneNode(definition, options, true))!;
      }
    }
  }

  const nodes = Object.values(processedDefs);
  if (nodes.length > 0) {
    const ns = 'http://www.w3.org/1999/xhtml';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('xmlns', ns);
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';
    svg.style.overflow = 'hidden';
    svg.style.display = 'none';

    const defs = document.createElementNS(ns, 'defs');
    svg.append(defs);

    for (const node of nodes) {
      defs.append(node);
    }

    clone.append(svg);
  }

  return clone;
};

export const cloneNode = async <T extends HTMLElement>(
  node: T,
  options: Options,
  isRoot?: boolean
): Promise<T | null> => {
  if ((!isRoot && options.filter && !options.filter(node)) || !node) {
    return null;
  }

  return Promise.resolve(node)
    .then((clonedNode) => cloneSingleNode(clonedNode, options) as Promise<T>)
    .then((clonedNode) => cloneChildren(node, clonedNode, options))
    .then((clonedNode) => decorate(node, clonedNode))
    .then((clonedNode) => ensureSVGSymbols(clonedNode, options));
};
