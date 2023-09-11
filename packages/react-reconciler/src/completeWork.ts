// 递归中的归阶段

import {
	Instance,
	Container,
	createInstance,
	createTextInstance,
	appendInitialChild
} from 'hostConfig';
import { FiberNode } from './fiber';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import { NoFlags, Update } from './fiberFlags';
import { updateFiberProps } from 'react-dom/src/SyntheticEvent';

function markUpdate(fiber: FiberNode) {
	fiber.flags |= Update;
}

// 返回子fiber或者null
export const completeWork = (
	workInProgressFiberNode: FiberNode
): FiberNode | null => {
	const newProps = workInProgressFiberNode.pendingProps;
	const current = workInProgressFiberNode.alternate;
	switch (workInProgressFiberNode.tag) {
		case HostComponent:
			if (current !== null && workInProgressFiberNode.stateNode) {
				// 更新流程
				// 1. 判断props是否变化 {onClick: xx} {onClick: yy}
				// 2. 如果变化，打一个Update的flag

				updateFiberProps(workInProgressFiberNode.stateNode, newProps);
			} else {
				// 1. 构建DOM
				const instance = createInstance(workInProgressFiberNode.type, newProps);
				// 2. 将DOM插入DOM树中
				appendAllChildren(instance, workInProgressFiberNode);
				workInProgressFiberNode.stateNode = instance;
			}
			bubbleProperties(workInProgressFiberNode);
			return null;
		case HostText:
			if (current !== null && workInProgressFiberNode.stateNode) {
				// 更新流程
				const oldText = current.memoizedProps.content;
				const newText = newProps.content;
				if (oldText !== newText) {
					markUpdate(workInProgressFiberNode);
				}
			} else {
				// 1. 构建DOM
				const instance = createTextInstance(newProps.content);
				workInProgressFiberNode.stateNode = instance;
			}
			bubbleProperties(workInProgressFiberNode);
			return null;
		case HostRoot:
			bubbleProperties(workInProgressFiberNode);
			return null;
		case FunctionComponent:
			bubbleProperties(workInProgressFiberNode);
			return null;
		default:
			if (__DEV__) {
				console.warn('Unknown work tag:', workInProgressFiberNode);
			}
			break;
	}
	return null;
};

/* 
function A() {
	return <div></div>
}
<B>
	<A/>
	<A/>
</B>
B 组件中插入A实际上插入的是A组件返回的div
 */

function appendAllChildren(
	parent: Container | Instance,
	workInProgressFiberNode: FiberNode
) {
	let node = workInProgressFiberNode.child;

	while (node !== null) {
		// 原生DOM节点，如果<div />就是HostComponent
		if (node.tag === HostComponent || node.tag === HostText) {
			appendInitialChild(parent, node?.stateNode);
		} else if (node.child !== null) {
			// TODO 这里检查一下此时node child的return指针是否已经指向了node
			console.log('node', node);

			node.child.return = node;
			node = node.child;
			continue;
		}

		// 1.此时已经找到最底层的child节点，并已经加载父节点上

		// 3. 归到最初的节点，递归结束
		if (node === workInProgressFiberNode) {
			return;
		}

		// 2. 到最底层后，从底往上依次处理每一层的兄弟节点。
		while (node.sibling === null) {
			if (node.return === null || node.return === workInProgressFiberNode) {
				return;
			}
			// 兄弟节点处理完，再往上归一层
			node = node?.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

// 冒泡收集子节点的flags
function bubbleProperties(workInProgressFiberNode: FiberNode) {
	let subtreeFlags = NoFlags;
	let child = workInProgressFiberNode.child;

	while (child !== null) {
		subtreeFlags |= child.subtreeFlags;
		subtreeFlags |= child.flags;

		child.return = workInProgressFiberNode;
		child = child.sibling;
	}
	workInProgressFiberNode.subtreeFlags |= subtreeFlags;
}
