import React from 'react';

export default function StatusBadge({ status }) {
  const isOccupied = status === 'Occupied';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isOccupied
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-gray-100 text-gray-700 border border-gray-200'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
          isOccupied ? 'bg-green-500' : 'bg-gray-400'
        }`}
      ></span>
      {status || 'Vacant'}
    </span>
  );
}
