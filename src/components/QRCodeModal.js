import React from 'react';
import { X } from 'lucide-react';

export const QRCodeModal = ({ url, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md text-center">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Share MobilU</h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X /></button>
      </div>
      <p className="mb-4 text-gray-600 dark:text-gray-400">Scan this code or copy the link to share the app.</p>
      <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg mb-4">
        <p className="break-words text-sm text-gray-700 dark:text-gray-200">{url}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { navigator.clipboard?.writeText(url); onClose(); }} className="flex-1 text-white bg-blue-600 hover:bg-blue-700 py-2 rounded-lg">Copy Link</button>
        <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-gray-700">Close</button>
      </div>
    </div>
  </div>
);
