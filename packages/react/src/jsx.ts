// ReactElement结构

import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import {
	Key,
	ReactElementType,
	Ref,
	Type,
	Props,
	ElementType
} from 'shared/ReactTypes';

const ReactElement = (
	type: Type,
	key: Key,
	ref: Ref,
	props: Props
): ReactElementType => {
	const element = {
		$$typeof: REACT_ELEMENT_TYPE,
		type,
		key,
		ref,
		props,
		__mark: 'wangRui'
	};

	return element;
};

export function isValidElement(object: any) {
	return (
		typeof object === 'object' &&
		object !== null &&
		object.$$typeof === REACT_ELEMENT_TYPE
	);
}

export const jsx = (type: ElementType, config: any, ...children: any[]) => {
	let key: Key = null;
	const props: Props = {};
	let ref: Ref = null;

	// 遍历config
	for (const prop in config) {
		const value = config[prop];
		if (prop === 'key') {
			if (value !== undefined) {
				key = config.key + '';
			}
			continue;
		}
		if (prop === 'ref') {
			if (value !== undefined) {
				ref = config.ref;
			}
			continue;
		}
		if ({}.hasOwnProperty.call(config, prop)) {
			props[prop] = value;
		}

		const childrenLength = children.length;
		if (childrenLength) {
			if (childrenLength === 1) {
				props.children = children[0];
			} else {
				props.children = children;
			}
		}
		return ReactElement(type, key, ref, props);
	}
};

export const jsxDEV = (type: ElementType, config: any) => {
	let key: Key = null;
	const props: Props = {};
	let ref: Ref = null;

	// 遍历config
	for (const prop in config) {
		const value = config[prop];
		if (prop === 'key') {
			if (value !== undefined) {
				key = config.key + '';
			}
			continue;
		}
		if (prop === 'ref') {
			if (value !== undefined) {
				ref = config.ref;
			}
			continue;
		}

		if ({}.hasOwnProperty.call(config, prop)) {
			props[prop] = value;
		}
	}
	return ReactElement(type, key, ref, props);
};
