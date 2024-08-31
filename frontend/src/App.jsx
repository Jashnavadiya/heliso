import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import HomePage from './pages/HomePage'
import ReceiverPage from './pages/ReceiverPage';

function App() {


  return (
    <>
    <Routes>
        <Route path="/" element={<HomePage />}/>
        <Route path="/rec" element={<ReceiverPage />}/>
          
      </Routes>
      
    </>
  )
}

export default App
