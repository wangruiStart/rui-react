# React

## Hook

hook 如何知道自身数据保存在哪?

```jsx
function App() {
 // 为什么useState可以返回正确的数值
 const [count, setCount] = useState(0);
}
```

答案: 可以记录当前正在Render的Function Component 对应的fiberNode，在fiberNode中保存hook数据
