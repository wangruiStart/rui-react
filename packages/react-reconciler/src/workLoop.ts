// 工作循环

import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { FiberNode } from './fiber';

// 指向当前正在工作的节点
let workInProgress: FiberNode | null = null;

function prepareFreshStack(fiber: FiberNode) {
	workInProgress = fiber;
}

function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
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
	const next = beginWork(fiber);
	fiber.memoizedProps = fiber.pendingProps;

	if (next === null) {
		// 没有子fiber,已经到最底层
		// 即递阶段结束，开始归操作阶段
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}

//TODO: 入口方法，谁调用?
function renderRoot(root: FiberNode) {
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
