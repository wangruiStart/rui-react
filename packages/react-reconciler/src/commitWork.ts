import { Container, appendChildToContainer } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import { MutationMask, NoFlags, Placement } from './fiberFlags';
import { HostComponent, HostRoot, HostText } from './workTags';

let nextEffect: FiberNode | null = null;

export const commitMutationEffects = (finishedWork: FiberNode) => {
	nextEffect = finishedWork;

	while (nextEffect !== null) {
		// 向下遍历
		const child: FiberNode | null = nextEffect.child;
		if (
			(nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
			child !== null
		) {
			// nextEffect节点的子孙节点包含MutationMask定义的标记，即插入更新或者删除
			// 继续向下遍历子节点
			nextEffect = child;
		} else {
			// 此时nextEffect所有子孙节点都不存在MutationMask标记
			// 向上遍历
			up: while (nextEffect !== null) {
				// 具体执行方法，根据flags执行具体的操作
				commitMutationEffectsOnFiber(nextEffect);
				// 再处理兄弟节点
				const sibling: FiberNode | null = nextEffect.sibling;
				if (sibling !== null) {
					nextEffect = sibling;

					// 取消内层循环，继续外层循环
					break up;
				}

				// 如果兄弟节点不存在，则继续向上遍历
				nextEffect = nextEffect.return;
			}
		}
	}
};

function commitMutationEffectsOnFiber(finishedWork: FiberNode) {
	const flags = finishedWork.flags;
	if ((flags & Placement) !== NoFlags) {
		// 此时存在Placement标记，即是插入更新操作
		commitPlacement(finishedWork);
		// 将Placement从flags中移除
		finishedWork.flags &= ~Placement;
	}

	// Update flags

	// ChildDeletion flags
}

// 执行插入操作
function commitPlacement(finishedWork: FiberNode) {
	if (__DEV__) {
		console.warn('执行placement操作', finishedWork);
	}
	// 需要知道 parent DOM,插入的目标位置
	const hostParent = getHostParent(finishedWork);
	if (hostParent !== null) {
		// 当前finishedWork对应的DOM节点
		appendPlacementNodeIntoContainer(finishedWork, hostParent);
	}
}

/**
 * 返回给定 Fiber 节点的最近的宿主组件或宿主文本父级。
 *
 * @param {FiberNode} fiber - 要查找宿主父级的 Fiber 节点。
 * @return {Element | null} 给定 Fiber 节点的最近宿主父级，如果找不到则返回 null。
 */
function getHostParent(fiber: FiberNode): Element | null {
	let parent = fiber.return;
	while (parent !== null) {
		const parentTag = parent.tag;
		if (parentTag === HostComponent || parentTag === HostText) {
			return parent.stateNode as Container;
		}
		if (parentTag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container;
		}
		parent = parent.return;
	}

	if (__DEV__) {
		console.warn('未找到HostParent', fiber);
	}
	return null;
}

/**
 * 遍历所有子孙原生DOM节点到容器中
 *
 * @param {FiberNode} finishedWork - 完成的工作 Fiber 节点。
 * @param {Container} hostParent - 宿主父容器。
 */
function appendPlacementNodeIntoContainer(
	finishedWork: FiberNode,
	hostParent: Container
) {
	// 传进来的fiber不一定是原生DOM，所以需要向下遍历，找到原生DOM节点
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		appendChildToContainer(finishedWork.stateNode, hostParent);
		return;
	}

	const child = finishedWork.child;
	if (child !== null) {
		appendPlacementNodeIntoContainer(child, hostParent);
		let sibling = child.sibling;

		while (sibling !== null) {
			appendPlacementNodeIntoContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}
