import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'antd-mobile/es/global/global.css'
import 'antd-mobile/es/global/theme-default.css'
import 'antd-mobile/es/global/theme-dark.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)