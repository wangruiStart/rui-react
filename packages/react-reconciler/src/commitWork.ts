import {
	Container,
	appendChildToContainer,
	commitUpdate,
	removeChild
} from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import {
	ChildDeletion,
	MutationMask,
	NoFlags,
	Placement,
	Update
} from './fiberFlags';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';

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

	if ((flags & Update) !== NoFlags) {
		// 此时存在Update标记，即是插入更新操作
		commitUpdate(finishedWork);
		// 将Update从flags中移除
		finishedWork.flags &= ~Update;
	}

	// ChildDeletion flags
	if ((flags & ChildDeletion) !== NoFlags) {
		// 此时存在ChildDeletion标记，即是删除操作
		// deletions: 当前fiberNode下所有需要删除的fiberNode;
		const deletions = finishedWork.deletions;
		if (deletions !== null) {
			deletions.forEach((childFiberToDelete) => {
				commitDeletion(childFiberToDelete);
			});
		}
		// 将Update从flags中移除
		finishedWork.flags &= ~ChildDeletion;
	}
}

// <div>
// 	<App />
// 	1233
// 	<p>
// 		<ChildComponent />
// 	</p>
// </div>
// 对于不同类型的子树
// FC：需要处理useEffect unmount执行，解绑ref
// 对于HostComponent, 需要解绑ref
// 对于子树的根HostComponent(即上面的最外层div标签), 需要移除DOM,
function commitDeletion(childFiberToDelete: FiberNode) {
	let rootHostNode: FiberNode | null = null;

	// 递归子树
	commitNestedComponent(childFiberToDelete, (unmountFiber) => {
		switch (unmountFiber.tag) {
			case HostComponent:
				if (rootHostNode === null) {
					rootHostNode = unmountFiber;
				}
				break;
			// TODO 解绑ref

			case HostText:
				if (rootHostNode === null) {
					rootHostNode = unmountFiber;
				}
				return;
			case FunctionComponent:
				// TODO useEffect unmount执行
				break;
			default:
				if (__DEV__) {
					console.warn('未处理的unmount类型', unmountFiber);
				}
		}
	});
	// 移除rootHostNode的DOM

	if (rootHostNode !== null) {
		const hostParent = getHostParent(childFiberToDelete);
		if (hostParent !== null) {
			removeChild((rootHostNode as FiberNode).stateNode, hostParent);
		}
	}
	childFiberToDelete.return = null;
	childFiberToDelete.child = null;

	/**
	 * 递归子树
	 * @param root 递归子树的根节点
	 * @param onCommitUnmount  递归到的当前fiber的回调函数
	 */
	function commitNestedComponent(
		root: FiberNode,
		onCommitUnmount: (fiber: FiberNode) => void
	) {
		let node = root;
		while (true) {
			onCommitUnmount(node);
			if (node.child !== null) {
				node.child.return = node;
				node = node.child;
				continue;
			}
			if (node === root) {
				// 这是终止条件
				return;
			}
			while (node.sibling === null) {
				if (node.return === null || node.return === root) {
					return;
				}
				// 向上归
				node = node.return;
			}
			node.sibling.return = node.return;
			node = node.sibling;
		}
	}
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
		appendChildToContainer(hostParent, finishedWork.stateNode);
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
