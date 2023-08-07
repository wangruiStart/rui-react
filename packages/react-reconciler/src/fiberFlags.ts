export const NoFlags = 0b0000001; // 没有标记
export const Placement = 0b0000100; // 挂载
export const Update = 0b0001000; // 更新
export const ChildDeletion = 0b0010000; // 删除子节点

export type Flags = number;
