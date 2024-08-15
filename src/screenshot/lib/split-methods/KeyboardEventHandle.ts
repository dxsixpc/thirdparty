// 键盘按下事件处理类
import InitData from 'src/screenshot/lib/main-entrance/InitData';

export default class KeyboardEventHandle {
  // 截图工具栏容器
  private readonly toolController: HTMLDivElement | null = null;

  constructor(screenShotController: HTMLCanvasElement, toolController: HTMLDivElement) {
    const data = new InitData();
    const textInputContainer = document.querySelector('#textInputPanel');
    this.toolController = toolController;
    // 调整截图容器显示权重
    screenShotController.tabIndex = 99998;
    // 监听全局键盘按下事件
    document.body.addEventListener('keydown', (event: KeyboardEvent) => {
      // 文本输入框存在时则终止
      if (data.getTextEditState()) {
        data.setTextEditState(false);
        return;
      }
      if (event.code === 'Escape') {
        // ESC按下，触发取消截图事件
        this.triggerEvent('close');
      }

      if (
        event.code === 'Enter' &&
        textInputContainer &&
        // @ts-expect-error
        textInputContainer.style.display !== 'block'
      ) {
        // Enter按下，触发确认截图事件
        this.triggerEvent('confirm');
      }

      // 按下command+z或者ctrl+z快捷键选中撤销工具
      if ((event.metaKey || event.ctrlKey) && event.code === 'KeyZ') {
        this.triggerEvent('undo');
      }
    });
  }

  /**
   * 触发工具栏指定模块的点击事件
   * @param eventName 事件名, 与截图工具栏中的data-title属性值保持一致
   * @private
   */
  public triggerEvent(eventName: string): void {
    if (this.toolController == null) return;
    for (let i = 0; i < this.toolController.childNodes.length; i++) {
      const childNode = this.toolController.childNodes[i] as HTMLDivElement;
      const toolName = childNode.dataset.title;
      if (toolName === eventName) {
        // 执行参数事件
        childNode.click();
      }
    }
  }
}
