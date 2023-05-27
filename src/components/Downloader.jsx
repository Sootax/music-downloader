import React, { useState, useEffect, useReducer, useContext } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { ThemeProvider, createTheme, TextField, Button, LinearProgress, IconButton } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ImageDisplay from './ImageDisplay.jsx';
import validateUrl from '../helpers/validateUrl.js';
import { ErrorContext } from '../utils/ErrorContext.jsx';

export default function Downloader({ handleRotate, flipFinished }) {
  const initialStatus = {
    downloading: false,
    success: false,
    error: false,
    errorMessage: '',
    progress: 0,
  };

  const reducer = (state, action) => {
    switch (action.type) {
      case 'START_DOWNLOAD':
        return { ...state, downloading: true };
      case 'CANCEL_DOWNLOAD':
        return { ...state, downloading: false, progress: 0 };
      case 'DOWNLOAD_SUCCESS':
        return { ...state, success: true, downloading: false, progress: 0 };
      case 'DOWNLOAD_ERROR':
        return { ...state, error: true, downloading: false, errorMessage: action.payload };
      case 'UPDATE_PROGRESS':
        return { ...state, progress: action.payload };
      case 'CLEAR_ERROR':
        return { ...state, error: false, errorMessage: '' };
      case 'CLEAR_SUCCESS':
        return { ...state, success: false };
      default:
        throw new Error('Unexpected action type: ' + action.type);
    }
  };

  const [status, dispatch] = useReducer(reducer, initialStatus);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [currentSong, setCurrentSong] = useState(null);
  const [, setErrorMessage] = useContext(ErrorContext);

  useEffect(() => {
    let errorMessageTimeout;
    let successMessageTimeout;

    if (status.error) {
      errorMessageTimeout = setTimeout(() => {
        dispatch({ type: 'CLEAR_ERROR' });
      }, 2000);
    }

    if (status.success) {
      successMessageTimeout = setTimeout(() => {
        dispatch({ type: 'CLEAR_SUCCESS' });
      }, 2000);
    }

    return () => {
      if (errorMessageTimeout) {
        clearTimeout(errorMessageTimeout);
      }

      if (successMessageTimeout) {
        clearTimeout(successMessageTimeout);
      }
    };
  }, [status.error, status.success]);

  const cancelDownload = () => {
    window.api.send('CANCEL_DOWNLOAD')
    setCurrentSong(null);
    dispatch({ type: 'CANCEL_DOWNLOAD' });
  }

  const statusListener = () => {
    window.api.receive('STATUS', (newStatus) => {
      if (newStatus.progress && newStatus.progress < 100) {
        dispatch({ type: 'UPDATE_PROGRESS', payload: newStatus.progress });
      } else if (newStatus.progress && newStatus.progress >= 100) {
        dispatch({ type: 'UPDATE_PROGRESS', payload: 100 });
        setTimeout(() => {
          dispatch({ type: 'DOWNLOAD_SUCCESS' });
          setCurrentSong(null);
        }, 500);
      } else if (newStatus.error) {
        setErrorMessage(newStatus.errorMessage);
        dispatch({ type: 'DOWNLOAD_ERROR', payload: newStatus.errorMessage });
      } else if (newStatus.currentSong) {
        setCurrentSong(newStatus.currentSong);
      }
    });
  };

  const handleDownload = () => {
    const validUrl = validateUrl(downloadUrl);
    if (validUrl) {
      dispatch({ type: 'START_DOWNLOAD' });
      window.api.send('START_DOWNLOAD', { url: downloadUrl, match: validUrl });
      statusListener();
    } else {
      setErrorMessage('Invalid URL');
      setTimeout(() => {
        setErrorMessage('');
      }, 500);
      dispatch({ type: 'DOWNLOAD_ERROR', payload: 'Invalid URL' });
    }
  };

  if (flipFinished) {
    return (
      <div className='bg-gray-800 h-[430px] text-white font-bold p-4 flex flex-col items-center w-[300px] rounded-xl shadow-md shadow-gray-950/50 relative'></div>
    );
  }

  return (
    <ThemeProvider theme={defaultTheme}>
      <div className='bg-gray-800 h-[430px] text-white font-bold p-4 flex flex-col items-center w-[300px] rounded-xl shadow-md shadow-gray-950/50 relative'>
        <div className='absolute right-2 top-2'>
          <IconButton onClick={handleRotate}>
            <SettingsIcon />
          </IconButton>
        </div>
        <h1 className='text-center text-3xl p-5'>Songify</h1>
        <div className='flex flex-col items-center'>
          <TextField
            label='Download URL'
            variant='outlined'
            size='small'
            error={status.error}
            sx={{ marginBottom: '0.5rem' }}
            FormHelperTextProps={{ style: { minHeight: '1.8em' } }}
            onChange={(e) => setDownloadUrl(e.target.value)}
            onClick={(e) => e.target.select()}
          />
          <DownloadButton
            status={status}
            dispatch={dispatch}
            handleDownload={handleDownload}
            cancelDownload={cancelDownload}
          />
          <div className='flex w-full mb-2 relative mt-2 h-[20px]'>
            {status.downloading && (
              <>
                <LinearProgress
                  value={status.progress}
                  variant='determinate'
                  sx={{ height: '20px', width: '100%', borderRadius: '5px' }}
                />
                <h1 className='absolute left-0 h-[20px] right-0 m-auto text-center text-[#000000]/80 font-sans text-[14px]'>{`${status.progress}%`}</h1>
              </>
            )}
          </div>
        </div>
        <ImageDisplay currentSong={currentSong} />
        <footer className='absolute bottom-1 text-gray-700 text-sm'>Created with ❤️ by Sootax#9268</footer>
      </div>
    </ThemeProvider>
  );
}

function DownloadButton({ status, handleDownload, cancelDownload }) {
  if (status.error || status.success) {
    return (
      <Button
        variant='contained'
        color={status.error ? 'error' : 'success'}
        sx={{ width: '100%' }}
      >
        {status.error ? 'error' : <CheckIcon />}
      </Button>
    );
  } else if (status.downloading) {
    return (
      <Button
        variant='contained'
        color='primary'
        sx={{ width: '100%' }}
        onClick={cancelDownload}
      >
        Cancel
      </Button>
    );
  } else {
    return (
      <Button
        variant='contained'
        color='primary'
        sx={{ width: '100%' }}
        onClick={handleDownload}
      >
        Download
      </Button>
    );
  }
}

const defaultTheme = createTheme({
  palette: {
    action: {
      disabledBackground: '',
    },
    mode: 'dark',
  },
  overrides: {
    SettingsIcon: {
      root: {
        '&:hover': {
          backgroundColor: 'primary',
        },
      },
    },
  },
});
