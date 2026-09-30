import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/main.css';
import { store } from './state/store.js';
import App from './router/AppRoutes.jsx';

// 入口：Redux 管理共用資料，Router 管理所有頁面路徑。
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <HashRouter><App /></HashRouter>
    </Provider>
  </React.StrictMode>
);
