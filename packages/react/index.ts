import currentDispatcher, {
	Dispatcher,
	resolveDispatcher
} from './src/currentDispatcher';
import { jsx, isValidElement as isValidElementFunc } from './src/jsx';

export const useState: Dispatcher['useState'] = (initialState) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};

// 内部数据共享层，内部数据不要动，否则你就会被炒鱿鱼
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__ = {
	currentDispatcher: currentDispatcher
};

export const version = '0.0.0';

// TODO: 根据环境区分使用jsx还是jsxDEV
export const createElement = jsx;

export const isValidElement = isValidElementFunc;
