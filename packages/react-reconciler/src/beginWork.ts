// 递归中的递阶段

import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import { UpdateQueue, processUpdateQueue } from './updateQueue';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import { mountChildFibers, reconcilerChildFibers } from './childFibers';
import { renderWithHooks } from './fiberHooks';

/**
 * 传入当前正在操作的fiberNode，生成子fiberNode或者null
 *
 * @param {FiberNode} workInProgressFiberNode - The work in progress fiber node.
 * @return {FiberNode | null} The updated fiber node or null.
 */
export const beginWork = (
	workInProgressFiberNode: FiberNode
): FiberNode | null => {
	// 比较，。返回子FiberNode
	switch (workInProgressFiberNode.tag) {
		case HostRoot: // HostRoot; ReactDom.render()挂载的根节点
			return updateHostRoot(workInProgressFiberNode);
		case HostComponent: // 原生DOM节点，如<div />就是HostComponent
			return updateHostComponent(workInProgressFiberNode);
		case FunctionComponent:
			if (__DEV__) {
				console.warn(
					'Function components cannot be updated.',
					workInProgressFiberNode
				);
			}
			return updateFunctionComponent(workInProgressFiberNode);
		case HostText:
			return null;
		default:
			if (__DEV__) {
				console.warn('Unknown work tag:', workInProgressFiberNode.tag);
			}
			break;
	}
	return null;
};

function updateFunctionComponent(workInProgressFiberNode: FiberNode) {
	const nextChild = renderWithHooks(workInProgressFiberNode);
	reconcilerChildren(workInProgressFiberNode, nextChild);
	return workInProgressFiberNode.child;
}

// HostRoot; ReactDom.render()挂载的根节点
function updateHostRoot(workInProgressFiberNode: FiberNode) {
	const baseState = workInProgressFiberNode.memoizedState;
	const updateQueue =
		workInProgressFiberNode.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;

	const { memoizedState } = processUpdateQueue(baseState, pending);
	// 对于首次渲染来说，memoizedState 为 <App />即 updateContainer的参数，亦即
	// ReactDom.createRoot(rootElement).render(<App />), render方法的参数
	workInProgressFiberNode.memoizedState = memoizedState;

	// 此时memoizedState是子节点的reactElement
	const nextChild = workInProgressFiberNode.memoizedState;

	// beginWork的目的是对比子节点的current fiberNode与子节点的ReactElement, 生成子节点的workInProgress FiberNode
	// 字节的ReactElement有了，接着就去找子节点的fiberNode。

	// 该函数会生成子节点的WorkInProgress FiberNode
	reconcilerChildren(workInProgressFiberNode, nextChild);
	return workInProgressFiberNode.child;
}

// 原生DOM节点，如<div />就是HostComponent
// <div><span/></div> span标签相当于div的children属性，而children属性在div的props里面
function updateHostComponent(workInProgressFiberNode: FiberNode) {
	const nextProps = workInProgressFiberNode.pendingProps;
	const nextChild = nextProps.children;
	reconcilerChildren(workInProgressFiberNode, nextChild);
	return workInProgressFiberNode.child;
}

// 对比子节点的current fiberNode与子节点的ReactElement,
// 生成子节点的workInProgress FiberNode
function reconcilerChildren(
	workInProgressFiberNode: FiberNode,
	children: ReactElementType | null
) {
	// 父节点的current
	const current = workInProgressFiberNode.alternate;

	// 理论上，mount流程可能存在大量需要插入的节点，可以做一定的优化
	if (current === null) {
		// mount流程
		workInProgressFiberNode.child = mountChildFibers(
			workInProgressFiberNode,
			null,
			children
		);
	} else {
		// update流程
		workInProgressFiberNode.child = reconcilerChildFibers(
			workInProgressFiberNode,
			current?.child,
			children
		);
	}
}
