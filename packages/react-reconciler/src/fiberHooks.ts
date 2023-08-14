import { FiberNode } from './fiber';

// function App() {
// 	return <div>这是</div>
// }
// 调用App()会返回<div>这是</div>

export function renderWithHooks(workInProgressFiberNode: FiberNode) {
	// 函数方法主体存放在type属性中
	const Component = workInProgressFiberNode.type;
	const props = workInProgressFiberNode.pendingProps;
	const children = Component(props);
	return children;
}
