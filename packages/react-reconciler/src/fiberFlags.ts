export const NoFlags = 0b0000000; // 没有标记
export const Placement = 0b0000001; // 挂载
export const Update = 0b0000010; // 更新
export const ChildDeletion = 0b0000100; // 删除子节点

export type Flags = number;

export const MutationMask = Placement | Update | ChildDeletion;
