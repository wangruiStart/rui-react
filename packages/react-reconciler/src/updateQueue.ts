// this.setState(value);
// this.setState(()=> value)

import { Action } from 'shared/ReactTypes';
import { Update } from './fiberFlags';
import { Dispatch } from 'react/src/currentDispatcher';

export interface Update<State> {
	action: Action<State>;
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null;
	};
	dispatch: Dispatch<State> | null;
}

export const createUpdate = <State>(action: Action<State>): Update<State> => {
	return { action };
};
/**
+ * 创建一个更新队列。
+ *
+ * @template State - 动作的类型。
+ * @returns {UpdateQueue<Action>} - 创建的更新队列。
+ */
export const createUpdateQueue = <State>() => {
	return {
		shared: {
			pending: null
		},
		dispatch: null
	} as UpdateQueue<State>;
};

/**
+ * 将更新加入更新队列。
+ *
+ * @param {UpdateQueue<Action>} UpdateQueue - 要加入更新的更新队列。
+ * @param {Update<Action>} update - 要加入的更新。
+ */
export const enqueueUpdate = <State>(
	UpdateQueue: UpdateQueue<State>,
	update: Update<State>
) => {
	UpdateQueue.shared.pending = update;
};

/**
 * 处理更新队列并返回记忆化状态。
 *
 * @param {State} baseState - 初始状态
 * @param {Update<State> | null} pendingUpdate - 待处理的更新
 * @return {{ memoizedState: State }} - 包含记忆化状态的对象
 */
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null
): { memoizedState: State } => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState
	};
	if (pendingUpdate !== null) {
		const action = pendingUpdate.action;
		if (action instanceof Function) {
			// baseState 1 update (x) => 2x -> memoizedState 2
			result.memoizedState = action(baseState);
		} else {
			// baseState 1 update 2 -> memoizedState 2
			result.memoizedState = action;
		}
	}

	return result;
};
