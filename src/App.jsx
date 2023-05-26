import React, { useState, useEffect, useContext } from 'react';
import Downloader from './components/Downloader.jsx';
import Config from './components/Config.jsx';
import toast, { Toaster } from 'react-hot-toast';
import { ErrorContext } from './utils/ErrorContext.jsx';
import './index.css';

export default function App() {
  const [flip, setFlip] = useState(false);
  const [flipFinished, setFlipFinished] = useState(false);
  const [errorMessage] = useContext(ErrorContext);

  useEffect(() => {
    if (errorMessage.length > 0) {
      toast.error(errorMessage, {
        duration: 2000,
        position: 'top-center',
        style: {
          background: '#1F2937',
          color: 'white',
          width: '300px',
        },
      });
    }
  }, [errorMessage])

  useEffect(() => {
    window.api.send('componentReady');
  }, []);

  const handleRotate = () => {
    setFlip(!flip);
    setTimeout(() => {
      setFlipFinished(!flipFinished);
    }, 180);
  };

  return (
      <div className='flex min-h-screen items-center justify-center bg-blue-800 bg-gradient-to-br from-gray-900 via-gray-800/90 to-gray-800 overflow-hidden'>
        <Toaster />
        <div className='group h-[400px] w-[300px] [perspective:1000px]'>
          <div
            className={`relative h-full w-full rounded-xl shadow-xl transition-all duration-[500ms] [transform-style:preserve-3d] ${
              flip && '[transform:rotateY(180deg)]'
            }`}
          >
            <div className='absolute'>
              <div className='h-full w-full'>
                <Downloader
                  handleRotate={handleRotate}
                  flipFinished={flipFinished}
                />
              </div>
            </div>
            <div className='absolute [transform:rotateY(180deg)] [backface-visibility:hidden]'>
              <div className='h-full w-full'>
                <Config
                  handleRotate={handleRotate}
                  flipFinis
                />
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
