'use client';

import React, { useState, useEffect } from 'react';
import { dataPersistenceService } from '../../lib/data-persistence-service';

interface BackupStatus {
  hasLocalBackup: boolean;
  lastBackupTime: number | null;
  backupCount: number;
}

export const DataBackupPanel: React.FC = () => {
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({
    hasLocalBackup: false,
    lastBackupTime: null,
    backupCount: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    updateBackupStatus();
  }, []);

  const updateBackupStatus = () => {
    const status = dataPersistenceService.getBackupStatus();
    setBackupStatus(status);
  };

  const createBackup = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await dataPersistenceService.createManualBackup();
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        updateBackupStatus();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Backup failed: ${error}` });
    } finally {
      setIsLoading(false);
    }
  };

  const restoreBackup = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await dataPersistenceService.restoreFromBackup();
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        updateBackupStatus();
        // Reload the page to refresh the collections
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Restore failed: ${error}` });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        💾 Data Backup & Restore
      </h3>
      
      <div className="space-y-4">
        {/* Backup Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Local Backup:</span>
              <span className={`ml-2 font-medium ${backupStatus.hasLocalBackup ? 'text-green-600' : 'text-red-600'}`}>
                {backupStatus.hasLocalBackup ? 'Available' : 'Not Available'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Last Backup:</span>
              <span className="ml-2 font-medium text-gray-900">
                {formatTimestamp(backupStatus.lastBackupTime)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Collections:</span>
              <span className="ml-2 font-medium text-gray-900">
                {backupStatus.backupCount}
              </span>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            <div className="flex items-center">
              <span className="mr-2">
                {message.type === 'success' ? '✅' : message.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              {message.text}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={createBackup}
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Creating Backup...' : '📦 Create Backup'}
          </button>
          
          <button
            onClick={restoreBackup}
            disabled={isLoading}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Restoring...' : '🔄 Restore from Backup'}
          </button>
        </div>

        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 How it works</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Automatic Backups:</strong> Your collection data is automatically backed up every minute</li>
            <li>• <strong>Multiple Locations:</strong> Data is stored in localStorage, backend API, and GitHub Gist</li>
            <li>• <strong>Safe Recovery:</strong> If you clear your cache, data can be restored from cloud backup</li>
            <li>• <strong>Manual Control:</strong> Create and restore backups manually anytime</li>
          </ul>
        </div>

        {/* Current Collections */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Current Collections</h4>
          <div className="text-sm text-gray-600">
            {backupStatus.backupCount > 0 ? (
              <span>You have {backupStatus.backupCount} collections backed up</span>
            ) : (
              <span className="text-red-600">No collections found - create a backup or restore from cloud</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataBackupPanel;
