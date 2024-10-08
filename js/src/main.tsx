/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import './i18n'
import reportWebVitals from './reportWebVitals'

// if (process.env.REACT_APP_MOCK_API === 'true') {
//     const { worker } = require('./mocks/browser')
//     worker.start()
// }

const container = document.getElementById('wp_tinwing') as HTMLElement
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <React.Suspense fallback="loading">
      <App />
    </React.Suspense>
  </React.StrictMode>,
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals

reportWebVitals()
