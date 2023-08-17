import internals from 'shared/internals';
import { FiberNode } from './fiber';
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import {
	UpdateQueue,
	createUpdate,
	createUpdateQueue,
	enqueueUpdate
} from './updateQueue';
import { scheduleUpdateOnFiber } from './workLoop';
import { Action } from 'shared/ReactTypes';

const { currentDispatcher } = internals;

// 当前正在操作的fiber;
let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;

// FiberNode memoizedState -> first Hook ; First Hook next -> next Hook; next Hook next -> next next...
interface Hook {
	// 指向下一个hook
	memoizedState: any;
	updateQueue: unknown;
	next: Hook | null;
}

// function App() {
// 	return <div>这是</div>
// }
// 调用App()会返回<div>这是</div>

export function renderWithHooks(workInProgressFiberNode: FiberNode) {
	// 函数方法主体存放在type属性中
	// 赋值操作
	currentlyRenderingFiber = workInProgressFiberNode;

	workInProgressFiberNode.memoizedState = null;

	const current = workInProgressFiberNode.alternate;
	if (current === null) {
		// 首屏渲染
		currentDispatcher.current = HooksDispatcherOnMount;
	} else {
		// 更新流程
	}

	const Component = workInProgressFiberNode.type;
	const props = workInProgressFiberNode.pendingProps;
	const children = Component(props);

	// 重置操作
	currentlyRenderingFiber = null;
	return children;
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};

function mountState<State>(
	initialState: State | (() => State)
): [State, Dispatch<State>] {
	const hook = mountWorkInProgressHook();
	let memoizedState = null;
	if (initialState instanceof Function) {
		memoizedState = initialState();
	} else {
		memoizedState = initialState;
	}

	const queue = createUpdateQueue<State>();
	hook.updateQueue = queue;
	hook.memoizedState = memoizedState;

	// @ts-ignore
	const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
	queue.dispatch = dispatch;

	return [memoizedState, dispatch];
}

function dispatchSetState<State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
	// const hostRootFiber = root.current;
	// const update = createUpdate<ReactElementType | null>(element);
	// enqueueUpdate(
	// 	hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
	// 	update
	// );
	// scheduleUpdateOnFiber(hostRootFiber);

	// 这里的流程和fiberReconciler中的updateContainer一样，只是updateContainer种action事element

	const update = createUpdate<State>(action);
	enqueueUpdate(updateQueue, update);
	scheduleUpdateOnFiber(fiber);
}

// 构建hook 链，并且返回一个空的hook对象
function mountWorkInProgressHook(): Hook {
	const hook: Hook = {
		memoizedState: null,
		updateQueue: null,
		next: null
	};

	if (workInProgressHook === null) {
		// mount时，并且是第一个hook
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用hook');
		} else {
			workInProgressHook = hook;
			currentlyRenderingFiber.memoizedState = hook;
		}
	} else {
		// mount时，并且不是第一个hook
		workInProgressHook.next = hook;
		workInProgressHook = hook;
	}

	return workInProgressHook;
}
