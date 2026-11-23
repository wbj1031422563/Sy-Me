import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './mock/index.js'
import './index.css'
import './features/showroom-props/register-showroom-props.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
