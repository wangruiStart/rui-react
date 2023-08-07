import { Key, Props, Ref } from 'shared/ReactTypes';
import { WorkTag } from './workTags';
import { NoFlags, Flags } from './fiberFlags';

// 深度优先遍历
export class FiberNode {
	tag: WorkTag;
	key: Key;
	// 如果是HostComponent <div></div> 则，stateNode保存的就是div这个DOM
	stateNode: any;
	// 如果是function component则tag是FunctionComponent，type则是 function本身 () => {};
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

	// 指向另一科fiberNode树对应的节点
	alternate: FiberNode | null;

	flags: Flags;

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

		this.alternate = null;
		this.flags = NoFlags;
	}
}
