import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	const [num, setNum] = useState(9990);
	return <div onClick={() => setNum(89989789)}>{num}</div>;
}

function Child() {
	return <span>这是我的 rui-react</span>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
