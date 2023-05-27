import React from 'react';

export default function ImageDisplay({ currentSong }) {
  if (!currentSong) {
    return (
      <></>
    )
  }

  return (
    <div className='flex flex-col rounded-lg w-[210px] h-[117,5px] gap-2'>
      <img
        className='rounded-lg shadow-md shadow-black/50 object-cover w-[210px] h-[117.5px]'
        src={currentSong.thumbnail}
      />
      <div className='bg-gray-700 p-2 rounded-lg bg-opacity-30 shadow-md shadow-black/50 h-[36px]'>
        <h1 className='text-sm text-ellipsis whitespace-nowrap overflow-hidden font-bold text-center'>
          {currentSong.title}
        </h1>
      </div>
    </div>
  );
}
