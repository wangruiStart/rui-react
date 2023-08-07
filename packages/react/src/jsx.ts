// ReactElement结构

import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';

const ReactElement = (type, key, ref, props) => {
	const element = {
		$$type: REACT_ELEMENT_TYPE,
		key,
		ref,
		props
	};

	return element;
};
