import React, { useState, useRef } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import CheckIcon from '@mui/icons-material/Check';
import { ThemeProvider, createTheme, TextField, Button, Box, CircularProgress } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

export default function Downloader() {
  const [downloading, setDownloading] = useState(false);
  const downloadUrlRef = useRef(null);

  const [inputError, setInputError] = useState({
    downloadUrl: {
      error: false,
      message: 'Please enter a valid URL.',
    },
  });

  const [downloadError, setDownloadError] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = async () => {
    if (validate()) {
      setDownloading(true);
      window.api.send('download', downloadUrlRef.current.value);
      window.api.receive('download', (data) => {
        setDownloading(false);
        if (data.error) {
          setDownloadError(true);
          setTimeout(() => {
            setDownloadError(false);
          }, 1000);
        } else if (data.finishedDownloading) {
          setDownloadSuccess(true);
          setTimeout(() => {
            setDownloadSuccess(false);
          }, 1000);
        }
      });
    }
  };

  const validate = () => {
    const newInputError = { ...inputError };
    let isValid = true;

    if (!validateUrl()) {
      newInputError.downloadUrl.error = true;
      isValid = false;
    } else {
      newInputError.downloadUrl.error = false;
    }

    setInputError(newInputError);
    return isValid;
  };

  const validateUrl = () => {
    const url = downloadUrlRef.current.value;
    const youtubeRegex = /^(?=.*youtube)(?!.*\blist\b).*$/igm
    const soundCloudRegex = /^(?=.*soundcloud)(?!.*\/sets\/).*$/igm
    return youtubeRegex.test(url) || soundCloudRegex.test(url);
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <div className='bg-gray-800 h-[400px] text-white font-bold p-4 flex flex-col items-center w-[300px] rounded-xl shadow-md shadow-gray-950 relative'>
        <h1 className='text-center text-3xl p-5'>Songify</h1>
        <div className='flex flex-col items-center mb-6'>
          <TextField
            inputRef={downloadUrlRef}
            id='downloadUrl'
            label='Download URL'
            variant='outlined'
            size='small'
            error={inputError.downloadUrl.error}
            helperText={inputError.downloadUrl.error ? inputError.downloadUrl.message : '\u00A0'}
            FormHelperTextProps={{ style: { minHeight: '1.8em' } }}
            onClick={(event) => event.target.select()}
          />
          <Button
            variant='contained'
            component='label'
            sx={{ width: '100%' }}
            onClick={() => window.api.send('selectPath')}
          >
            Select Path
          </Button>
          <Box sx={{ height: 16 }} />
          {!downloadError && !downloadSuccess && (
            <LoadingButton
              loading={downloading}
              loadingPosition='end'
              endIcon={<DownloadIcon />}
              variant='contained'
              sx={{ width: '100%' }}
              onClick={handleDownload}
            >
              Download
            </LoadingButton>
          )}
          {downloadError && (
            <Button
              variant='contained'
              color='error'
              sx={{ width: '100%' }}
            >
              Error
            </Button>
          )}
          {downloadSuccess && (
            <Button
              variant='contained'
              color='success'
              sx={{ width: '100%' }}
            >
              <CheckIcon />
            </Button>
          )}
        </div>
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
});
