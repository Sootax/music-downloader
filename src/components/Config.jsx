import React, { useState, useRef, useEffect } from 'react';
import { ThemeProvider, createTheme, IconButton, Button, TextField } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

export default function Config({ handleRotate }) {
  const [settings, setSettings] = useState({
    batchSize: 5,
  });
  const batchSizeRef = useRef(null);

  useEffect(() => {
    window.api.send('getSettings');
    window.api.receive('getSettings', (settingsObject) => {
      batchSizeRef.current.value = settingsObject.batchSize;
      setSettings(settingsObject);
    });
  }, []);

  const handleSettings = () => {
    const settingsObject = {
      batchSize: parseInt(batchSizeRef.current.value),
    };
    window.api.send('saveSettings', settingsObject);
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <div className='bg-gray-800 h-[430px] text-white font-bold p-4 flex flex-col items-center w-[300px] rounded-xl relative'>
        <div className='absolute right-2 top-2'>
          <IconButton onClick={handleRotate}>
            <SettingsIcon />
          </IconButton>
        </div>
        <h1 className='text-center text-3xl p-5'>Settings</h1>
        <div className='w-4/5'>
          <Button
            variant='contained'
            component='label'
            sx={{ width: '100%' }}
            onClick={() => window.api.send('selectPath')}
          >
            Select Path
          </Button>
          <div className='flex flex-row mt-4'>
            <TextField
              variant='outlined'
              label='Batch Size'
              type='number'
              size='small'
              inputRef={batchSizeRef}
              defaultValue={settings.batchSize}
            />
          </div>
          <div className='flex mt-24 justify-center items-center'>
            <Button
              variant='contained'
              sx={{ width: '70%' }}
              onClick={handleSettings}
            >
              Save
            </Button>
          </div>
        </div>
        <footer className='absolute bottom-1 text-gray-700 text-sm'>
          Have any issues? 📝{' '}
          <b
            className='cursor-pointer hover:text-blue-400 transition-colors'
            onClick={() => window.api.send('openGithub')}
          >
            Visit me on github!
          </b>
        </footer>
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
});
