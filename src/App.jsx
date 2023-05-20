import React from 'react';
import Downloader from './components/Downloader.jsx';
import './index.css'

export default function App() {
  return (
    <div className='h-screen bg-gray-900 flex items-center justify-center font-sans'>
      <Downloader />
    </div>
  )
}