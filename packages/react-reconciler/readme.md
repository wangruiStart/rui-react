# reconciler的工作方式

对于同一个节点，比较其ReactElement与 fiberNode. 生成子fiberNode。井根据比较的结果生成不同标记（插入、删除、移动…），对应不同宿主环境APl的执行。

比如挂载 `<div></div>`

```js
// React Element <div></div>
jsx('div');
// 对应的fiberNode
null;
// 生成子fiberNode
// 对应标记
Placement;
```

将`<div></div>`更新为`<p></p>`:

```js
// React Element <p></p>
jsx("p")
// 对应的fiberNode
FiberNode {type: 'div'}
// 生成子fiberNode
// 对应标记
Deletion Placement
```

当所有React Element比t较完后，会生成一棵fberNode树，一共会存在两棵fiberNode树：

1. current：与视图中真实Ul对应的fiberNode树
2. workInProgress：触发更新后，正在reconciler中计算的fiberNode树

## JSX消费的顺序

### DFS 深度优先遍历与 BFS 广度优先遍历详解

以DFS（深度优先遍历）的顺序遍历`React Element`，这意味着：

1. 如果有子节点，遍历子节点
2. 如果没有子节点，遍历兄弟节点
   例子：

```jsx
<Card>
	<h3>你好</h3>
	<p>p</p>
</Card>
```
这是个递归的过程，存在递、归两个阶段：
1. 递：对应beginWork
2. 归：对应completeWork

## 更新

常见的触发更新的方式：
* ReactDOM.createRootO.render（或老版的ReacpOM.render)
* this.setState
* useState的dispatch方法
我们希望实现一套统一的更新机制，他的特点是：
* 兼容上述触发更新的方式
* 方便后续扩展（优先级机制..）

### 更新机制的组成部分
* 代表更新的数据结构 -- update
* 代表消费的数据结构 -- updateQueue

![Alt text](image.png)

接下来要做的工作：
* 实现mount时调用的API
* 将API接入更新机制

需要考虑的事情:
* 更新可能发生于任意组件，而更新的流程是从根节点递归的
* 需要一个统一的根节点保存通用信息

![Alt text](image-1.png)