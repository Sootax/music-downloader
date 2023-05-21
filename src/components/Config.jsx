import React from 'react';
import { ThemeProvider, createTheme, IconButton } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

export default function Config({ handleRotate }) {
  return (
    <ThemeProvider theme={defaultTheme}>
      <div className='bg-gray-800 h-[400px] text-white font-bold p-4 flex flex-col items-center w-[300px] rounded-xl relative'>
        <div className='absolute right-2 top-2'>
          <IconButton onClick={handleRotate}>
            <SettingsIcon />
          </IconButton>
        </div>
        <h1 className='text-center text-3xl p-5'>Settings</h1>
        <footer className='absolute bottom-1 text-gray-700 text-sm'>
          Have any issues? 📝 <b className='cursor-pointer hover:text-blue-400 transition-colors' onClick={() => window.api.send('openGithub')}>Visit me on github!</b>
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
