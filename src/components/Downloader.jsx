import React, { useState, useRef, useEffect } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { ThemeProvider, createTheme, TextField, Button, LinearProgress, IconButton } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ImageDisplay from './ImageDisplay.jsx';

export default function Downloader({ handleRotate, flipFinished }) {
  const [buttonState, setButtonState] = useState({
    error: false,
    success: false,
    downloading: false,
    cancelled: false,
  });

  useEffect(() => {
    console.log(buttonState);
  }, [buttonState]);

  const updateButtonState = (newButtonState, duration) => {
    const updatedButtonState = { ...buttonState, error: false, success: false, downloading: false, cancelled: false };
    updatedButtonState[newButtonState] = !updatedButtonState[newButtonState];
    setButtonState(updatedButtonState);
    
    if (newButtonState === 'success' || newButtonState === 'error') {
      setTimeout(() => {
        setButtonState({ ...buttonState, error: false, success: false, downloading: false, cancelled: false });
      }, [duration]);
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
        <div className='flex flex-col items-center gap-5'>
          <TextField
            id='downloadUrl'
            label='Download URL'
            variant='outlined'
            size='small'
            FormHelperTextProps={{ style: { minHeight: '1.8em' } }}
          />
          <DownloadButton
            buttonState={buttonState}
            updateButtonState={updateButtonState}
          />
        </div>
        <ImageDisplay />
        <footer className='absolute bottom-1 text-gray-700 text-sm'>Created with ❤️ by Sootax#9268</footer>
      </div>
    </ThemeProvider>
  );
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

function DownloadButton({ buttonState, updateButtonState }) {
  const [hovered, setHovered] = useState(false);

  const handleHover = (hoverState) => {
    if (hoverState === 'enter') {
      setHovered(true);
    } else if (hoverState === 'leave') {
      setHovered(false);
    }
  };

  if (buttonState.error || buttonState.success) {
    return (
      <Button
        variant='contained'
        color={buttonState.error ? 'error' : 'success'}
        sx={{ width: '100%' }}
      >
        {buttonState.error ? 'error' : <CheckIcon />}
      </Button>
    );
  } else if (buttonState.downloading) {
    return (
      <Button
        variant='contained'
        color='primary'
        sx={{ width: '100%' }}
        onClick={() => updateButtonState('cancelled', 0)}
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
        onClick={() => updateButtonState('downloading', 0)}
      >
        Download
      </Button>
    );
  }
}
