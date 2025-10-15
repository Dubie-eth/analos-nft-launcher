'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { databaseService } from '@/lib/database/database-service';
import { DatabaseStats, BetaApplication, UserProfile } from '@/lib/database/types';

interface DatabaseManagerProps {}

const DatabaseManager: React.FC<DatabaseManagerProps> = () => {
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'applications' | 'backups' | 'logs'>('overview');
  
  // Data states
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [applications, setApplications] = useState<BetaApplication[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<BetaApplication | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  // Form states
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [backupType, setBackupType] = useState<'full' | 'user_profiles' | 'applications' | 'access_grants'>('full');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load database statistics
      const statsResponse = await fetch('/api/database/admin/stats', {
        headers: {
          'x-admin-wallet': publicKey?.toString() || '',
        },
      });
      
      if (statsResponse.ok) {
        const { stats } = await statsResponse.json();
        setStats(stats);
      }
      
      // Load pending applications
      const applicationsResponse = await fetch('/api/database/applications', {
        headers: {
          'x-admin-wallet': publicKey?.toString() || '',
        },
      });
      
      if (applicationsResponse.ok) {
        const { applications } = await applicationsResponse.json();
        setApplications(applications);
      }
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationReview = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      setLoading(true);
      
      const updates = {
        status,
        reviewNotes: status === 'approved' ? reviewNotes : rejectionReason
      };
      
      const response = await fetch('/api/database/applications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-wallet': publicKey?.toString() || '',
        },
        body: JSON.stringify({
          applicationId,
          updates
        }),
      });
      
      if (response.ok) {
        alert(`Application ${status} successfully!`);
        setReviewNotes('');
        setRejectionReason('');
        loadDashboardData();
      } else {
        alert('Failed to update application');
      }
      
    } catch (error) {
      console.error('Failed to review application:', error);
      alert('Error reviewing application');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/database/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-wallet': publicKey?.toString() || '',
        },
        body: JSON.stringify({
          operation: 'backup',
          backupType
        }),
      });
      
      if (response.ok) {
        const { backup } = await response.json();
        alert(`Backup created successfully! File: ${backup.filePath}`);
        loadDashboardData();
      } else {
        alert('Failed to create backup');
      }
      
    } catch (error) {
      console.error('Failed to create backup:', error);
      alert('Error creating backup');
    } finally {
      setLoading(false);
    }
  };

  const exportUserData = async (userId: string, exportType: 'full' | 'profile_only' = 'profile_only') => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/database/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-wallet': publicKey?.toString() || '',
        },
        body: JSON.stringify({
          operation: 'export',
          userId,
          exportType
        }),
      });
      
      if (response.ok) {
        const { exportData } = await response.json();
        
        // Download as JSON file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-data-${userId}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('User data exported successfully!');
      } else {
        alert('Failed to export user data');
      }
      
    } catch (error) {
      console.error('Failed to export user data:', error);
      alert('Error exporting user data');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">🗄️ Database Manager</h1>
        <p className="text-purple-100">
          Secure user profile and application management with encryption and privacy controls
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'applications', label: 'Applications', icon: '📝' },
          { id: 'users', label: 'Users', icon: '👥' },
          { id: 'backups', label: 'Backups', icon: '💾' },
          { id: 'logs', label: 'Access Logs', icon: '📋' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Users</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.totalUsers}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Applications</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalApplications}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Reviews</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingApplications}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Database Size</h3>
              <p className="text-3xl font-bold text-green-600">{formatFileSize(stats.databaseSize)}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Application Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                    <span>Pending</span>
                  </span>
                  <span className="font-semibold">{stats.pendingApplications}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span>Approved</span>
                  </span>
                  <span className="font-semibold">{stats.approvedApplications}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span>Rejected</span>
                  </span>
                  <span className="font-semibold">{stats.rejectedApplications}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Database Info</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Active Access Grants</span>
                  <span className="font-semibold">{stats.activeAccessGrants}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Backups</span>
                  <span className="font-semibold">{stats.totalBackups}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Backup</span>
                  <span className="font-semibold text-sm">
                    {stats.lastBackupAt ? new Date(stats.lastBackupAt).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Beta Applications</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{app.username}</div>
                          <div className="text-sm text-gray-500">
                            {app.walletAddress.slice(0, 8)}...{app.walletAddress.slice(-8)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          app.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                          app.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedApplication(app)}
                          className="text-purple-600 hover:text-purple-900 mr-3"
                        >
                          Review
                        </button>
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApplicationReview(app.id, 'approved')}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApplicationReview(app.id, 'rejected')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Backups Tab */}
      {activeTab === 'backups' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-bold mb-4">Create Backup</h2>
            <div className="flex items-center space-x-4">
              <select
                value={backupType}
                onChange={(e) => setBackupType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              >
                <option value="full">Full Database</option>
                <option value="user_profiles">User Profiles Only</option>
                <option value="applications">Applications Only</option>
                <option value="access_grants">Access Grants Only</option>
              </select>
              <button
                onClick={createBackup}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {loading ? 'Creating...' : 'Create Backup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Review Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Review Application</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <p className="text-gray-900">{selectedApplication.username}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Address</label>
                <p className="text-gray-900 font-mono text-sm">{selectedApplication.walletAddress}</p>
              </div>
              
              {selectedApplication.bio && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <p className="text-gray-900">{selectedApplication.bio}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Social Links</label>
                <div className="space-y-1">
                  {Object.entries(selectedApplication.socials).map(([platform, value]) => (
                    value && (
                      <div key={platform} className="flex items-center space-x-2">
                        <span className="capitalize text-sm">{platform}:</span>
                        <span className="text-sm text-gray-600">{value}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Add review notes..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Reason for rejection..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedApplication(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApplicationReview(selectedApplication.id, 'approved')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => handleApplicationReview(selectedApplication.id, 'rejected')}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              <span>Processing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseManager;
