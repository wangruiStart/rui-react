import { Key, Props, ReactElementType, Ref } from 'shared/ReactTypes';
import { Container } from 'hostConfig';
import { FunctionComponent, HostComponent, WorkTag } from './workTags';
import { NoFlags, Flags } from './fiberFlags';

// 深度优先遍历
export class FiberNode {
	tag: WorkTag;
	key: Key;
	// 当前FiberNode对应的元素，比如 如果是HostComponent <div></div> 则，stateNode保存的就是div这个DOM
	stateNode: any;
	// 如果是function component则tag是FunctionComponent，type则是 function本身 () => {};
	// 如果是ClassComponent, 指class
	// 如果是HostComponent, 指DOM tagName 小写形式
	type: any;

	// 构成树状结构的属性
	// 指向父FiberNode
	return: FiberNode | null;
	// 指向同级的下个fiberNode;
	sibling: FiberNode | null;
	// 指向子fiberNode;
	child: FiberNode | null;
	// 如果同级有多个fiberNode，则index表示同级fiberNode的下标
	index: number = 0;
	ref: Ref;

	// 工作之前的props
	pendingProps: Props;
	// 工作之后的props
	memoizedProps: Props | null;

	// 保存的是hooks的链表
	memoizedState: any;
	// 指向另一科fiberNode树对应的节点
	alternate: FiberNode | null;

	updateQueue: unknown;

	flags: Flags;
	subtreeFlags: Flags;

	// @param 当前fiberNode下所有需要删除的fiberNode
	deletions: FiberNode[] | null;

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		this.tag = tag;
		this.key = key;
		this.stateNode = null;
		this.type = null;

		this.return = null;
		this.sibling = null;
		this.child = null;
		this.index = 0;
		this.ref = null;

		// 作为工作单元
		this.pendingProps = pendingProps;
		this.memoizedProps = null;
		this.updateQueue = null;

		this.alternate = null;
		this.flags = NoFlags;
		this.subtreeFlags = NoFlags;

		this.deletions = null;
	}
}

// ReactDom.createRoot构建的根节点。其
// current指针指向hostRootFiber。同时hostRootFiber的stateNode指向FiberRootNode
// ReactDom.createRoot(rootElement).render(<App />)
// 负责管理应用的全局：
//  1. current Fiber Tree 与workInProgress Fiber Tree之间的切换
//  2. 应用中任务的过期时间
//  3. 应用的任务调度信息
export class FiberRootNode {
	container: Container; // 宿主环境挂在的节点。即createRoot的参数
	current: FiberNode;
	finishedWork: FiberNode | null;

	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishedWork = null;
	}
}

export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	let workInProgressNode = current.alternate;

	if (workInProgressNode === null) {
		// 首屏渲染场景下 mount场景
		workInProgressNode = new FiberNode(current.tag, pendingProps, current.key);
		workInProgressNode.stateNode = current.stateNode;

		workInProgressNode.alternate = current;
		current.alternate = workInProgressNode;
	} else {
		// update场景
		workInProgressNode.pendingProps = pendingProps;
		workInProgressNode.flags = NoFlags;
		workInProgressNode.subtreeFlags = NoFlags;
		workInProgressNode.deletions = null;
	}

	workInProgressNode.type = current.type;
	workInProgressNode.updateQueue = current.updateQueue;
	workInProgressNode.child = current.child;
	workInProgressNode.memoizedState = current.memoizedState;

	return workInProgressNode;
};

/**
 * Creates a FiberNode from a React element.
 *
 * @param {ReactElementType} element - The React element to create a FiberNode from.
 * @return {FiberNode} The created FiberNode.
 */
export function createFiberFromElement(element: ReactElementType): FiberNode {
	const { type, key, props } = element;

	let fiberTag: WorkTag = FunctionComponent;
	if (typeof type === 'string') {
		// <div /> type: 'div';
		fiberTag = HostComponent;
	} else if (typeof type !== 'function' && __DEV__) {
		console.warn('Unknown element type:', type);
	}

	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;
	return fiber;
}
