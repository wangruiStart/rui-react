import { Action } from 'shared/ReactTypes';

// 当前执行的hook集合
export interface Dispatcher {
	useState: <T>(initialState: T | (() => T)) => [T, Dispatch<T>];
}

export type Dispatch<State> = (action: Action<State>) => void;

const currentDispatcher: { current: Dispatcher | null } = {
	current: null
};

export const resolveDispatcher = () => {
	const dispatcher = currentDispatcher.current;

	if (dispatcher === null) {
		throw new Error('React Hook只能在函数组件中执行');
	}

	return dispatcher;
};

export default currentDispatcher;
