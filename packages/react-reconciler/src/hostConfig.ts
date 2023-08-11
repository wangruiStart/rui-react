export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

// 真实代码会在对应的宿主环境实现。这边模拟实现一下
export const createInstance = (...args: any) => {
	return {} as any;
};

export const appendInitialChild = (...args: any) => {
	return {} as any;
};

export const createTextInstance = (...args: any) => {
	return {} as any;
};

export const appendChildToContainer = (...args: any) => {
	return {} as any;
};
