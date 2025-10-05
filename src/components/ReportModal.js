import React, { useState } from 'react';
import { X, ThumbsUp, CheckCircle2 } from 'lucide-react';
import { REPORT_TYPES } from '../utils/constants';

export const ReportModal = ({ report, onSubmit, onClose, onConfirm, onResolve }) => {
  const [reportType, setReportType] = useState(report ? report.type : 'blocked-sidewalk');
  const [description, setDescription] = useState(report ? report.description : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ type: reportType, description, location: { lat: report.location.lat(), lng: report.location.lng() } });
  };

  if (report && report.id) {
    const timeAgo = report.timestamp ? report.timestamp.toLocaleTimeString() : 'Just now';
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{report.type.replace('-', ' ')}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Close dialog"><X /></button>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{report.description || 'No description provided.'}</p>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            <p>Reported at: {timeAgo}</p>
            <p>Confirmations: {report.confirmations || 0}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => onConfirm(report.id)} className="w-full text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 rounded-lg py-3 flex items-center justify-center gap-2"><ThumbsUp size={20} /> Confirm</button>
            <button onClick={() => onResolve(report.id)} className="w-full text-lg font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 rounded-lg py-3 flex items-center justify-center gap-2"><CheckCircle2 size={20} /> Resolved</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="report-dialog-title">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 id="report-dialog-title" className="text-2xl font-bold text-gray-900 dark:text-white">Report an Issue</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Close report dialog"><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="report-type" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Issue Type</label>
            <select id="report-type" value={reportType} onChange={e => setReportType(e.target.value)} className="w-full p-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500">
              {REPORT_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </div>
          <div className="mb-6">
            <label htmlFor="description" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Optional Description</label>
            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows="3" placeholder="e.g., Construction at corner of Forbes and Craig" className="w-full p-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <button type="submit" className="w-full text-xl font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 rounded-lg py-3">Submit Report</button>
        </form>
      </div>
    </div>
  );
};
