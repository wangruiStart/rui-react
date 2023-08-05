// ReactElement结构

const ReactElement = (type, key, ref, props) => {
	const element = {
		$$type: type,
		key,
		ref,
		props
	};

	return element;
};
