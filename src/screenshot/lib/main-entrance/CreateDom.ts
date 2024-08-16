import getColor from 'src/screenshot/lib/common-methods/GetColor';
import selectColor from 'src/screenshot/lib/common-methods/SelectColor';
import {
  getTextSize,
  hiddenColorPanelStatus,
  hiddenTextSizeOptionStatus,
  selectTextSize,
  setTextSize
} from 'src/screenshot/lib/common-methods/SelectTextSize';
import { setBrushSize, setMosaicPenSize } from 'src/screenshot/lib/common-methods/SetBrushSize';
import toolbar from 'src/screenshot/lib/config/Toolbar';
import toolClickEvent from 'src/screenshot/lib/split-methods/ToolClickEvent';
import type {
  positionInfoType,
  screenShotType,
  toolbarType
} from 'src/screenshot/lib/type/ComponentType';

export default class CreateDom {
  // 截图区域canvas容器
  private readonly screenShotController: HTMLCanvasElement;
  // 截图工具栏容器
  private readonly toolController: HTMLDivElement;
  // 绘制选项顶部ico容器
  private readonly optionIcoController: HTMLDivElement;
  // 画笔绘制选项容器
  private readonly optionController: HTMLDivElement;
  // 裁剪框大小显示容器
  private readonly cutBoxSizeContainer: HTMLDivElement;
  // 文字工具输入容器
  private readonly textInputController: HTMLDivElement;
  // 截图完成回调函数
  private readonly completeCallback: AnyFunction | undefined;
  // 截图关闭毁掉函数
  private readonly closeCallback: AnyFunction | undefined;
  // 需要隐藏的图标
  private readonly hiddenIcoArr: string[];

  // 截图工具栏图标
  private readonly toolbar: Array<toolbarType>;

  private readonly textFontSizeList = [12, 13, 14, 15, 16, 17, 20, 24, 36, 48, 64, 72, 96];

  constructor(options: screenShotType) {
    this.screenShotController = document.createElement('canvas');
    this.toolController = document.createElement('div');
    this.optionIcoController = document.createElement('div');
    this.optionController = document.createElement('div');
    this.cutBoxSizeContainer = document.createElement('div');
    this.textInputController = document.createElement('div');
    this.completeCallback = options?.completeCallback;
    this.closeCallback = options?.closeCallback;
    this.hiddenIcoArr = [];
    this.optionController.addEventListener('click', (evt) => {
      const target = evt.target as HTMLElement;
      if (target.id === 'colorSelectPanel' || target.id === 'textSizePanel') {
        return;
      }
      // 点击工具栏的其他位置则隐藏文字大小选择面板与颜色选择面板
      hiddenTextSizeOptionStatus();
      hiddenColorPanelStatus();
    });
    // 成功回调函数不存在则设置一个默认的
    if (!options || !Object.prototype.hasOwnProperty.call(options, 'completeCallback')) {
      this.completeCallback = (imgInfo: { base64: string; cutInfo: positionInfoType }) => {
        sessionStorage.setItem('screenShotImg', JSON.stringify(imgInfo));
      };
    }

    // 筛选需要隐藏的图标
    if (options?.hiddenToolIco) {
      for (const iconKey in options.hiddenToolIco) {
        if (options.hiddenToolIco[iconKey]) {
          this.filterHideIcon(iconKey);
        }
      }
    }
    // 为所有dom设置id
    this.setAllControllerId();
    // 为画笔绘制选项角标设置class
    this.setOptionIcoClassName();
    this.toolbar = toolbar;
    // 渲染工具栏
    this.setToolBarIco();
    // 渲染文字大小选择容器
    this.setTextSizeSelectPanel();
    // 渲染画笔相关选项
    this.setBrushSelectPanel();
    // 渲染文本输入
    this.setTextInputPanel();
    // 渲染页面
    this.setDomToBody();
    // 隐藏所有dom
    this.hiddenAllDom();
  }

  // 渲染截图工具栏图标
  private setToolBarIco() {
    for (let i = 0; i < this.toolbar.length; i++) {
      const item = this.toolbar[i];
      // 判断是否有需要隐藏的图标
      let icoHiddenStatus = false;
      for (let j = 0; j < this.hiddenIcoArr.length; j++) {
        if (this.hiddenIcoArr[j] === item.title) {
          icoHiddenStatus = true;
          break;
        }
      }
      // 图标隐藏状态为true则直接跳过本次循环
      if (icoHiddenStatus) continue;
      const itemPanel = document.createElement('div');
      // 撤销按钮单独处理
      if (item.title === 'undo') {
        itemPanel.className = 'item-panel undo-disabled';
        itemPanel.id = 'undoPanel';
      } else {
        itemPanel.className = `item-panel ${item.title}`;
        itemPanel.addEventListener('click', (e) => {
          toolClickEvent(item.title, item.id, e, this.completeCallback, this.closeCallback);
        });
      }
      itemPanel.dataset.title = item.title;
      itemPanel.dataset.id = `${item.id}`;
      this.toolController.append(itemPanel);
    }
    // 有需要隐藏的截图工具栏时，则修改其最小宽度
    if (this.hiddenIcoArr.length > 0) {
      this.toolController.style.minWidth = '24px';
    }
  }

  // 渲染文字大小选择容器
  private setTextSizeSelectPanel() {
    // 创建文字展示容器
    const textSizePanel = document.createElement('div');
    textSizePanel.className = 'text-size-panel';
    textSizePanel.textContent = `${getTextSize()} px`;
    textSizePanel.id = 'textSizePanel';
    // 创建文字大小选择容器
    const textSelectPanel = document.createElement('div');
    textSelectPanel.className = 'text-select-panel';
    textSelectPanel.id = 'textSelectPanel';
    // 创建文字选择下拉
    for (let i = 0; i < this.textFontSizeList.length; i++) {
      const itemPanel = document.createElement('div');
      const size = this.textFontSizeList[i];
      itemPanel.className = 'text-item';
      itemPanel.dataset.value = `${size}`;
      itemPanel.textContent = `${size} px`;
      // 添加点击监听
      itemPanel.addEventListener('click', () => {
        // 隐藏容器
        textSelectPanel.style.display = 'none';
        const currentTextSize = itemPanel.dataset.value;
        // 容器赋值
        textSizePanel.textContent = `${currentTextSize} px`;
        if (currentTextSize) {
          setTextSize(Number(currentTextSize));
        }
      });
      textSelectPanel.append(itemPanel);
    }
    textSizePanel.style.display = 'none';
    textSelectPanel.style.display = 'none';
    // 容器点击时，展示文字大小选择容器
    textSizePanel.addEventListener('click', () => {
      selectTextSize();
    });
    this.optionController.append(textSizePanel);
    this.optionController.append(textSelectPanel);
  }

  // 渲染画笔大小选择图标与颜色选择容器
  private setBrushSelectPanel() {
    // 创建画笔选择容器
    const brushSelectPanel = document.createElement('div');
    brushSelectPanel.id = 'brushSelectPanel';
    brushSelectPanel.className = 'brush-select-panel';
    for (let i = 0; i < 3; i++) {
      // 创建画笔图标容器
      const itemPanel = document.createElement('div');
      itemPanel.className = 'item-panel';
      switch (i) {
        case 0: {
          itemPanel.classList.add('brush-small');
          itemPanel.classList.add('brush-small-active');
          itemPanel.addEventListener('click', (e) => {
            setBrushSize('small', 1, e);
            setMosaicPenSize('small', 1, e);
          });
          break;
        }
        case 1: {
          itemPanel.classList.add('brush-medium');
          itemPanel.addEventListener('click', (e) => {
            setBrushSize('medium', 2, e);
            setMosaicPenSize('medium', 2, e);
          });
          break;
        }
        case 2: {
          itemPanel.classList.add('brush-big');
          itemPanel.addEventListener('click', (e) => {
            setBrushSize('big', 3, e);
            setMosaicPenSize('big', 3, e);
          });
          break;
        }
      }
      brushSelectPanel.append(itemPanel);
    }
    // 右侧颜色选择容器
    const rightPanel = document.createElement('div');
    rightPanel.className = 'right-panel';
    // 创建颜色选择容器
    const colorSelectPanel = document.createElement('div');
    colorSelectPanel.className = 'color-select-panel';
    colorSelectPanel.id = 'colorSelectPanel';
    colorSelectPanel.addEventListener('click', () => {
      selectColor();
    });
    // 创建颜色显示容器
    const colorPanel = document.createElement('div');
    colorPanel.id = 'colorPanel';
    colorPanel.className = 'color-panel';
    colorPanel.style.display = 'none';
    for (let i = 0; i < 10; i++) {
      const colorItem = document.createElement('div');
      colorItem.className = 'color-item';
      colorItem.addEventListener('click', () => {
        getColor(i + 1);
      });
      colorItem.dataset.index = `${i}`;
      colorPanel.append(colorItem);
    }
    rightPanel.append(colorPanel);
    rightPanel.append(colorSelectPanel);
    rightPanel.id = 'rightPanel';
    // 创建颜色下拉箭头选择容器
    const pullDownArrow = document.createElement('div');
    pullDownArrow.className = 'pull-down-arrow';
    pullDownArrow.addEventListener('click', () => {
      selectColor();
    });
    rightPanel.append(pullDownArrow);
    // 向画笔绘制选项容器追加画笔选择和颜色显示容器
    this.optionController.append(brushSelectPanel);
    this.optionController.append(rightPanel);
  }

  // 渲染文本输入区域容器
  private setTextInputPanel() {
    // 让div可编辑
    this.textInputController.contentEditable = 'true';
    // 关闭拼写检查
    this.textInputController.spellcheck = false;
  }

  // 为所有Dom设置id
  private setAllControllerId() {
    this.screenShotController.id = 'screenShotContainer';
    this.toolController.id = 'toolPanel';
    this.optionIcoController.id = 'optionIcoController';
    this.optionController.id = 'optionPanel';
    this.cutBoxSizeContainer.id = 'cutBoxSizePanel';
    this.textInputController.id = 'textInputPanel';
  }

  // 隐藏所有dom
  private hiddenAllDom() {
    this.screenShotController.style.display = 'none';
    this.toolController.style.display = 'none';
    this.optionIcoController.style.display = 'none';
    this.optionController.style.display = 'none';
    this.cutBoxSizeContainer.style.display = 'none';
    this.textInputController.style.display = 'none';
  }

  // 将截图相关dom渲染至body
  private setDomToBody() {
    this.clearBody();
    document.body.append(this.screenShotController);
    document.body.append(this.toolController);
    document.body.append(this.optionIcoController);
    document.body.append(this.optionController);
    document.body.append(this.cutBoxSizeContainer);
    document.body.append(this.textInputController);
  }

  // 清除截图相关dom
  private clearBody() {
    document.querySelector('#screenShotContainer')?.remove();
    document.querySelector('#toolPanel')?.remove();
    document.querySelector('#optionIcoController')?.remove();
    document.querySelector('#optionPanel')?.remove();
    document.querySelector('#optionPanel')?.remove();
    document.querySelector('#textInputPanel')?.remove();
  }

  // 设置画笔绘制选项顶部ico样式
  private setOptionIcoClassName() {
    this.optionIcoController.className = 'ico-panel';
  }

  // 将需要隐藏的图标放入对应的数组中
  private filterHideIcon(icons: string) {
    switch (icons) {
      case 'rightTop': {
        this.hiddenIcoArr.push('right-top');
        break;
      }
      default: {
        this.hiddenIcoArr.push(icons);
        break;
      }
    }
  }
}
