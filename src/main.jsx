import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { TournamentProvider } from './context/TournamentContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TournamentProvider>
      <App />
    </TournamentProvider>
  </React.StrictMode>,
)
