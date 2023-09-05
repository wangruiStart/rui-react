import internals from 'shared/internals';
import { FiberNode } from './fiber';
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import {
	UpdateQueue,
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue
} from './updateQueue';
import { scheduleUpdateOnFiber } from './workLoop';
import { Action } from 'shared/ReactTypes';

const { currentDispatcher } = internals;

// 当前正在操作的fiber;
let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;

// FiberNode memoizedState -> first Hook ; First Hook next -> next Hook; next Hook next -> next next...
interface Hook {
	memoizedState: any;
	updateQueue: unknown;
	// 指向下一个hook
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
		currentDispatcher.current = HooksDispatcherOnUpdate;
	}

	const Component = workInProgressFiberNode.type;
	const props = workInProgressFiberNode.pendingProps;
	const children = Component(props);

	// 重置操作
	currentlyRenderingFiber = null;
	workInProgressHook = null;
	currentHook = null;
	return children;
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};

const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState
};

function updateState<State>(): [State, Dispatch<State>] {
	// 找到当前useState对应的hook数据
	const hook = updateWorkInProgressHook();

	// 计算新state的逻辑
	const queue = hook.updateQueue as UpdateQueue<State>;
	const pending = queue.shared.pending;

	if (pending !== null) {
		const { memoizedState } = processUpdateQueue(hook.memoizedState, pending);
		hook.memoizedState = memoizedState;
	}

	return [hook.memoizedState, queue.dispatch as Dispatch<State>];
}

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

// 交互阶段触发的更新
// render阶段触发的更新
function updateWorkInProgressHook(): Hook {
	// TODO render阶段触发的更新

	// 保存下一个hook
	let nextCurrentHook: Hook | null;

	if (currentHook === null) {
		// 这是FC update时的第一个hook
		const currentFiber = currentlyRenderingFiber?.alternate;
		if (currentFiber !== null) {
			nextCurrentHook = currentFiber?.memoizedState;
		} else {
			// currentFiber 为null,表示是mount阶段，但是mount阶段不应该进入updateWorkInProgressHook
			nextCurrentHook = null;
		}
	} else {
		// 这个FC update时的后续hook
		nextCurrentHook = currentHook.next;
	}

	if (nextCurrentHook === null) {
		// mount或者update时不一致，即hook在if判断语句中
		throw new Error(
			`组件${currentlyRenderingFiber?.type}本次执行的hook与上一次不一致`
		);
	}

	currentHook = nextCurrentHook as Hook;
	const newHook: Hook = {
		memoizedState: currentHook.memoizedState,
		updateQueue: currentHook.updateQueue,
		next: null
	};

	if (workInProgressHook === null) {
		// mount时，并且是第一个hook
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用hook');
		} else {
			workInProgressHook = newHook;
			currentlyRenderingFiber.memoizedState = newHook;
		}
	} else {
		// mount时，并且不是第一个hook
		workInProgressHook.next = newHook;
		workInProgressHook = newHook;
	}

	return workInProgressHook;
}
