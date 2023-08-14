// 工作循环

import { beginWork } from './beginWork';
import { commitMutationEffects } from './commitWork';
import { completeWork } from './completeWork';
import { FiberNode, FiberRootNode, createWorkInProgress } from './fiber';
import { MutationMask, NoFlags } from './fiberFlags';
import { HostRoot } from './workTags';

// 指向当前正在工作的节点
let workInProgress: FiberNode | null = null;

/**
 * 初始化给定根节点的新堆栈。
 *
 * @param {FiberRootNode} root - 准备堆栈的根节点。
 */
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
			if (__DEV__) {
				console.warn('workLoop发生错误', e);
			}
			// 重置指针
			workInProgress = null;
		}
	} while (true);

	// 流程结束后生成新的workInProgress Fiber树， 位于root.current.alternate;
	// root current 指向hostRootFiber;
	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;
	// reconciler 阶段结束，进入commit阶段
	commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.finishedWork;
	if (finishedWork === null) {
		return;
	}

	if (__DEV__) {
		console.warn('commit阶段开始', finishedWork);
	}

	// 执行重置操作
	root.finishedWork = null;

	// commit阶段需要执行的操作
	// 1. fiber树的切换
	// 2. 执行Placement对应的操作  执行时间点为mutation阶段和layout阶段之间

	// 判断是否存在3个子阶段需要执行的操作
	// 根据root flags和subtreeFlags判断
	// 子节点是否有待处理的flags
	const subtreeHasEffect =
		(finishedWork.subtreeFlags & MutationMask) !== NoFlags;
	// 当前节点是否有待处理的flags
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

	if (subtreeHasEffect || rootHasEffect) {
		// beforeMutation
		// mutation  处理 Placement
		commitMutationEffects(finishedWork);
		root.current = finishedWork; // fiber树的切换

		// layout
	} else {
		root.current = finishedWork; // fiber树的切换
	}
}

/**
 * 查找给定fiber节点的根节点。
 * 即tag为HostRoot的节点， HostRootFiber
 * @param {FiberNode} fiber - 要开始搜索的纤维节点。
 * @return {Node | null} - 如果找到则返回根节点即FiberRootNode，否则返回null。
 */
function markUpdateFromFiberToRoot(fiber: FiberNode): FiberRootNode | null {
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
	const root = markUpdateFromFiberToRoot(fiber) as FiberRootNode;
	renderRoot(root);
	// 调度功能
}
