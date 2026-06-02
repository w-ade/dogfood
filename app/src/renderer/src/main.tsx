import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@xterm/xterm/css/xterm.css'
import 'dialkit/styles.css'
import '@fontsource/geist-mono/400.css'
import '@fontsource/geist-mono/600.css'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
