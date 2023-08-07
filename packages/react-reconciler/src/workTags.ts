export const FunctionComponent = 0; // 函数式组件
export const HostRoot = 3; // HostRoot; ReactDom.render()挂载的根节点
export const HostComponent = 5; // 原生DOM节点，如果<div />就是HostComponent
export const HostText = 6; // 标签中的文本，如 <div>text</div>中的text

export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText;
