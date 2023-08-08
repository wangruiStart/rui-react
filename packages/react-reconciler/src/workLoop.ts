// 工作循环

import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { FiberNode, FiberRootNode, createWorkInProgress } from './fiber';
import { HostRoot } from './workTags';

// 指向当前正在工作的节点
let workInProgress: FiberNode | null = null;

function prepareFreshStack(root: FiberRootNode) {
	workInProgress = createWorkInProgress(root.current, {});
}

// 遍历兄弟节点
function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;
	do {
		completeWork(node);
		const sibling = node.sibling;
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		// 如果兄弟节点不存在，则继续更新父节点
		node = node.return;
		workInProgress = node;
	} while (node !== null);
}
/**
 * Performs the unit of work for a given fiber node.
 *
 * @param {FiberNode} fiber - The fiber node to perform the work on.
 * @return {void} This function does not return a value.
 */
function performUnitOfWork(fiber: FiberNode) {
	const next = beginWork(fiber); // 返回子fiber或者null
	fiber.memoizedProps = fiber.pendingProps;

	if (next === null) {
		// 没有子fiber,已经到最底层
		// 即递阶段结束，开始归操作阶段
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}

function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

function renderRoot(root: FiberRootNode) {
	// 初始化
	prepareFreshStack(root);

	do {
		try {
			workLoop();
			break;
		} catch (e) {
			console.warn('workLoop发生错误', e);
			// 重置指针
			workInProgress = null;
		}
	} while (true);
}
/**
 * 查找给定fiber节点的根节点。
 *
 * @param {FiberNode} fiber - 要开始搜索的纤维节点。
 * @return {Node | null} - 如果找到则返回根节点即FiberRootNode，否则返回null。
 */

function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	let parent = fiber.return;
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}
	if (node.tag === HostRoot) {
		return node.stateNode;
	}
	return null;
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
	const root = markUpdateFromFiberToRoot(fiber);
	renderRoot(root);
	// 调度功能
}
