import { Props, ReactElementType } from 'shared/ReactTypes';
import {
	FiberNode,
	createFiberFromElement,
	createWorkInProgress
} from './fiber';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './workTags';
import { ChildDeletion, Placement } from './fiberFlags';

function ChildReconciler(shouldTrackEffects: boolean) {
	// 设计成闭包是为了根据shouldTrackEffects返回不同的实现

	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackEffects) {
			return;
		}
		const deletions = returnFiber.deletions;
		if (deletions === null) {
			returnFiber.deletions = [childToDelete];
			returnFiber.flags |= ChildDeletion;
		} else {
			deletions.push(childToDelete);
		}
	}

	// 处理子元素element是REACT_ELEMENT_TYPE类型的节点
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	): FiberNode {
		const key = element.key;
		work: if (currentFiber !== null) {
			// update情况
			if (currentFiber.key === key) {
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						// key type都相同，那就直接复用
						const existing = useFiber(currentFiber, element.props);
						existing.return = returnFiber;
						return existing;
					}
					// 如果key相同，type不同
					deleteChild(returnFiber, currentFiber);
					break work;
				} else {
					if (__DEV__) {
						console.warn('Unknown element type:', element);
						break work;
					}
				}
			} else {
				// 删除旧的，新增新的
				deleteChild(returnFiber, currentFiber);
			}
		}
		// 根据element创建fiber;
		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber;
		return fiber;
	}

	// 处理element是string或者number类型的情况
	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) {
		if (currentFiber !== null) {
			if (currentFiber.tag === HostText) {
				// 类型没变，表示可以复用
				const existing = useFiber(currentFiber, { content });
				existing.return = returnFiber;
				return existing;
			}
			// 删掉原来的节点
			deleteChild(returnFiber, currentFiber);
		}
		const fiber = new FiberNode(HostText, { content }, null);
		fiber.return = returnFiber;

		return fiber;
	}

	function placeSingleChild(fiber: FiberNode) {
		// 传入的fiber为workInProgress Fiber。则fiber.alternate是current fiber
		// current fiber 为null,为首屏渲染的情况
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement;
		}
		return fiber;
	}

	return function reconcilerChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType | null
	) {
		// 判断当前fiber的类型
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFiber, newChild)
					);

				default:
					if (__DEV__) {
						console.warn('Unknown child type:', newChild);
					}
					break;
			}
		}
		// TODO 多节点的情况 ul > li * 3

		// HostText 文本节点的情况
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}
		if (currentFiber !== null) {
			// 兜底
			deleteChild(returnFiber, currentFiber);
		}
		if (__DEV__) {
			console.warn('Unknown child type:', newChild);
		}
		return null;
	};
}

/**
 * 复用fiber节点
 * 对于同一个fiberNode,不管怎么更新，都是在current和workInProgress两个树中的fiberNode反复复用
 * @param fiber 需要复用的目标fiber
 * @param pendingProps
 * @returns
 */
function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
	const clone = createWorkInProgress(fiber, pendingProps);
	clone.index = 0;
	clone.sibling = null;
	return clone;
}

// 追踪副作用
export const reconcilerChildFibers = ChildReconciler(true);
// 不追踪副作用
export const mountChildFibers = ChildReconciler(false);
