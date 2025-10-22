'use client';

import React, { useState, useEffect } from 'react';
import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { ANALOS_RPC_URL } from '../config/analos-programs';
import { PAGE_ACCESS, ACCESS_LEVELS, setUserAccessLevel, getUserAccessLevel } from '@/config/access-control';
import { pageAccessService, PageAccessConfig } from '@/lib/database/page-access-service';
import { updateAccessLevelCookie } from '@/hooks/useWalletCookies';
import { useTheme } from '@/contexts/ThemeContext';

interface UserAccess {
  address: string;
  type: 'address' | 'token' | 'nft';
  accessLevel: string; // Now uses ACCESS_LEVELS from config
  tokenThreshold?: number;
  nftCollections?: string[];
  grantedAt: Date;
  grantedBy: string;
  isActive: boolean;
}

interface AccessRule {
  id: string;
  name: string;
  type: 'token' | 'nft' | 'address';
  condition: string;
  threshold?: number;
  collections?: string[];
  isActive: boolean;
}

const UserAccessManager: React.FC = () => {
  const { publicKey } = useWallet();
  const { theme } = useTheme();
  const [connection] = useState(() => {
    // Configure connection for Analos network with extended timeouts
    const conn = new Connection(ANALOS_RPC_URL, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 120000, // 2 minutes for Analos network
    });
    
    // Force disable WebSocket to prevent connection issues
    (conn as any)._rpcWebSocket = null;
    (conn as any)._rpcWebSocketConnected = false;
    
    return conn;
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'rules' | 'pages' | 'analytics'>('users');
  
  // User access data
  const [userAccess, setUserAccess] = useState<UserAccess[]>([]);
  const [accessRules, setAccessRules] = useState<AccessRule[]>([]);
  const [pageConfigs, setPageConfigs] = useState<PageAccessConfig[]>([]);
  
  // Form states
  const [newUserForm, setNewUserForm] = useState({
    address: '',
    type: 'address' as 'address' | 'token' | 'nft',
    accessLevel: 'beta' as 'beta' | 'creator' | 'admin',
    tokenThreshold: 1000,
    nftCollections: [] as string[]
  });

  const [newRuleForm, setNewRuleForm] = useState({
    name: '',
    type: 'token' as 'token' | 'nft' | 'address',
    condition: '',
    threshold: 1000,
    collections: [] as string[]
  });

  // Analytics data
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    betaUsers: 0,
    creatorUsers: 0,
    adminUsers: 0,
    totalAccessRequests: 0,
    activeRules: 0
  });

  // Page access management
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [pageAccessUsers, setPageAccessUsers] = useState<UserAccess[]>([]);

  useEffect(() => {
    loadUserAccess();
    loadAccessRules();
    loadAnalytics();
    loadPageConfigs();
  }, []);

  const loadUserAccess = async () => {
    // In a real implementation, this would fetch from your backend/database
    const mockData: UserAccess[] = [
      {
        address: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
        type: 'address',
        accessLevel: 'admin',
        grantedAt: new Date('2025-10-01'),
        grantedBy: 'System',
        isActive: true
      },
      {
        address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        type: 'token',
        accessLevel: 'creator',
        tokenThreshold: 5000,
        grantedAt: new Date('2025-10-10'),
        grantedBy: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
        isActive: true
      },
      {
        address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        type: 'nft',
        accessLevel: 'beta',
        nftCollections: ['BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr'],
        grantedAt: new Date('2025-10-12'),
        grantedBy: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
        isActive: true
      }
    ];
    setUserAccess(mockData);
  };

  const loadAccessRules = async () => {
    // In a real implementation, this would fetch from your backend/database
    const mockRules: AccessRule[] = [
      {
        id: '1',
        name: 'LOS Holder Access',
        type: 'token',
        condition: 'Hold at least 1,000 LOS tokens',
        threshold: 1000,
        isActive: true
      },
      {
        id: '2',
        name: 'NFT Collection Holder',
        type: 'nft',
        condition: 'Hold NFT from approved collections',
        collections: ['BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr'],
        isActive: true
      },
      {
        id: '3',
        name: 'Whitelisted Address',
        type: 'address',
        condition: 'Manually whitelisted addresses',
        isActive: true
      }
    ];
    setAccessRules(mockRules);
  };

  const loadAnalytics = async () => {
    // In a real implementation, this would calculate from actual data
    setAnalytics({
      totalUsers: userAccess.length,
      betaUsers: userAccess.filter(u => u.accessLevel === 'beta').length,
      creatorUsers: userAccess.filter(u => u.accessLevel === 'creator').length,
      adminUsers: userAccess.filter(u => u.accessLevel === 'admin').length,
      totalAccessRequests: 15, // Mock data
      activeRules: accessRules.filter(r => r.isActive).length
    });
  };

  const loadPageConfigs = async () => {
    try {
      const configs = await pageAccessService.getPageAccessConfigs();
      setPageConfigs(configs);
    } catch (error) {
      console.error('Failed to load page configs:', error);
      // Fallback to default configs
      setPageConfigs(PAGE_ACCESS.map(page => ({
        id: page.path,
        pagePath: page.path,
        pageName: page.name,
        description: page.description,
        requiredLevel: page.requiredLevel,
        adminOnly: page.adminOnly || false,
        publicAccess: page.publicAccess || false,
        isLocked: page.isLocked || false,
        customMessage: page.customMessage,
        allowPublicAccess: page.allowPublicAccess || false,
        requireVerification: page.requireVerification || false,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: 'system'
      })));
    }
  };

  const grantAccess = async () => {
    if (!newUserForm.address) {
      alert('Please enter a valid address');
      return;
    }

    try {
      setLoading(true);
      
      // Validate address format
      try {
        new PublicKey(newUserForm.address);
      } catch {
        alert('Invalid Solana address format');
        return;
      }

      const newAccess: UserAccess = {
        address: newUserForm.address,
        type: newUserForm.type,
        accessLevel: newUserForm.accessLevel,
        tokenThreshold: newUserForm.type === 'token' ? newUserForm.tokenThreshold : undefined,
        nftCollections: newUserForm.type === 'nft' ? newUserForm.nftCollections : undefined,
        grantedAt: new Date(),
        grantedBy: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Current admin
        isActive: true
      };

      setUserAccess(prev => [...prev, newAccess]);
      
      // Reset form
      setNewUserForm({
        address: '',
        type: 'address',
        accessLevel: 'beta',
        tokenThreshold: 1000,
        nftCollections: []
      });

      alert('Access granted successfully!');
      
    } catch (error) {
      console.error('Failed to grant access:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert('Failed to grant access: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const revokeAccess = async (address: string) => {
    if (!confirm('Are you sure you want to revoke access for this user?')) {
      return;
    }

    try {
      setLoading(true);
      
      setUserAccess(prev => 
        prev.map(user => 
          user.address === address 
            ? { ...user, isActive: false }
            : user
        )
      );

      alert('Access revoked successfully!');
      
    } catch (error) {
      console.error('Failed to revoke access:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert('Failed to revoke access: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createAccessRule = async () => {
    if (!newRuleForm.name || !newRuleForm.condition) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const newRule: AccessRule = {
        id: Date.now().toString(),
        name: newRuleForm.name,
        type: newRuleForm.type,
        condition: newRuleForm.condition,
        threshold: newRuleForm.type === 'token' ? newRuleForm.threshold : undefined,
        collections: newRuleForm.type === 'nft' ? newRuleForm.collections : undefined,
        isActive: true
      };

      setAccessRules(prev => [...prev, newRule]);
      
      // Reset form
      setNewRuleForm({
        name: '',
        type: 'token',
        condition: '',
        threshold: 1000,
        collections: []
      });

      alert('Access rule created successfully!');
      
    } catch (error) {
      console.error('Failed to create access rule:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert('Failed to create access rule: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string) => {
    setAccessRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
  };

  // Page access management functions
  const loadPageAccessUsers = (pagePath: string) => {
    const requiredLevel = pageConfigs.find(page => page.pagePath === pagePath)?.requiredLevel;
    if (!requiredLevel) return;

    const levelHierarchy = ['public', 'beta_user', 'premium_user', 'admin'];
    const requiredIndex = levelHierarchy.indexOf(requiredLevel);
    
    const usersWithAccess = userAccess.filter(user => {
      const userIndex = levelHierarchy.indexOf(user.accessLevel);
      return userIndex >= requiredIndex && user.isActive;
    });
    
    setPageAccessUsers(usersWithAccess);
  };

  const updateUserAccessLevel = async (address: string, newLevel: string) => {
    try {
      setLoading(true);
      
      // Update user access level
      const updatedUsers = userAccess.map(user => 
        user.address === address ? { ...user, accessLevel: newLevel } : user
      );
      setUserAccess(updatedUsers);
      
      // Save to localStorage
      localStorage.setItem('user-access', JSON.stringify(updatedUsers));
      
      // Update in access control system
      setUserAccessLevel(address, newLevel);
      
      // Update cookie for server-side middleware enforcement
      updateAccessLevelCookie(address, newLevel);
      
      // Reload page access if a page is selected
      if (selectedPage) {
        loadPageAccessUsers(selectedPage);
      }
      
      // Update analytics
      loadAnalytics();
      
    } catch (error) {
      console.error('Failed to update access level:', error);
      alert('Failed to update access level');
    } finally {
      setLoading(false);
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'admin': return 'text-red-600 bg-red-100';
      case 'creator': return 'text-blue-600 bg-blue-100';
      case 'beta': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getAccessTypeIcon = (type: string) => {
    switch (type) {
      case 'address': return '👤';
      case 'token': return '💰';
      case 'nft': return '🎨';
      default: return '❓';
    }
  };

  // Page management functions
  const togglePageLock = async (pagePath: string) => {
    try {
      setLoading(true);
      
      // Get current page config
      const currentConfig = pageConfigs.find(p => p.pagePath === pagePath);
      if (!currentConfig) {
        alert('❌ Page configuration not found');
        return;
      }
      
      // Update page lock status in database
      await pageAccessService.updatePageLock(pagePath, !currentConfig.isLocked, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW');
      
      // Reload page configs
      await loadPageConfigs();
      
      const lockStatus = !currentConfig.isLocked ? 'locked' : 'unlocked';
      alert(`✅ ${currentConfig.pageName} has been ${lockStatus}!\n\nUsers will now be redirected to the beta signup page when trying to access this page.`);
      
    } catch (error) {
      console.error('Failed to toggle page lock:', error);
      alert('❌ Failed to update page lock status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const syncFeaturesWithPages = async () => {
    try {
      if (!publicKey) {
        console.error('No admin wallet connected');
        return;
      }

      const response = await fetch('/api/sync-features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminWallet: publicKey.toString() })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Features synced with page access:', result);
      } else {
        console.error('Failed to sync features with pages');
      }
    } catch (error) {
      console.error('Error syncing features with pages:', error);
    }
  };

  const updatePageAccessLevel = async (pagePath: string, newLevel: string) => {
    try {
      setLoading(true);
      
      // Update page access level in database
      await pageAccessService.updatePageAccessLevel(pagePath, newLevel, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW');
      
      // Reload page configs
      await loadPageConfigs();
      
      // Auto-sync features after page access level change
      await syncFeaturesWithPages();
      
      const pageName = pageConfigs.find(p => p.pagePath === pagePath)?.pageName || pagePath;
      alert(`✅ ${pageName} access level updated to: ${newLevel} and features synced!`);
      
    } catch (error) {
      console.error('Failed to update page access level:', error);
      alert('❌ Failed to update page access level');
    } finally {
      setLoading(false);
    }
  };

  const updatePageCustomMessage = async (pagePath: string, message: string) => {
    try {
      setLoading(true);
      
      // Update page custom message in database
      await pageAccessService.updatePageCustomMessage(pagePath, message, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW');
      
      // Reload page configs
      await loadPageConfigs();
      
      const pageName = pageConfigs.find(p => p.pagePath === pagePath)?.pageName || pagePath;
      alert(`✅ Custom message updated for ${pageName}`);
      
    } catch (error) {
      console.error('Failed to update custom message:', error);
      alert('❌ Failed to update custom message');
    } finally {
      setLoading(false);
    }
  };

  const updatePagePublicAccess = async (pagePath: string, allowPublic: boolean) => {
    try {
      setLoading(true);
      
      const updatedPages = pageConfigs.map(page => 
        page.pagePath === pagePath ? { ...page, allowPublicAccess: allowPublic } : page
      );
      
      localStorage.setItem('page-access-config', JSON.stringify(updatedPages));
      
    } catch (error) {
      console.error('Failed to update public access:', error);
      alert('Failed to update public access setting');
    } finally {
      setLoading(false);
    }
  };

  const updatePageVerification = async (pagePath: string, requireVerification: boolean) => {
    try {
      setLoading(true);
      
      const updatedPages = pageConfigs.map(page => 
        page.pagePath === pagePath ? { ...page, requireVerification: requireVerification } : page
      );
      
      localStorage.setItem('page-access-config', JSON.stringify(updatedPages));
      
      const pageName = updatedPages.find(p => p.pagePath === pagePath)?.pageName || pagePath;
      alert(`✅ Verification requirement ${requireVerification ? 'enabled' : 'disabled'} for ${pageName}`);
      
    } catch (error) {
      console.error('Failed to update verification requirement:', error);
      alert('❌ Failed to update verification requirement');
    } finally {
      setLoading(false);
    }
  };

  // Emergency functions
  const lockAllPages = async () => {
    if (!confirm('🚨 EMERGENCY LOCK ALL PAGES?\n\nThis will lock ALL pages except Home and Beta Signup. Are you sure?')) {
      return;
    }

    try {
      setLoading(true);
      
      await pageAccessService.lockAllPages('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW');
      
      // Reload page configs
      await loadPageConfigs();
      
      alert('🚨 ALL PAGES LOCKED!\n\nOnly Home, How It Works, and Beta Signup pages remain accessible.');
      
    } catch (error) {
      console.error('Failed to lock all pages:', error);
      alert('❌ Failed to lock all pages');
    } finally {
      setLoading(false);
    }
  };

  const unlockAllPages = async () => {
    if (!confirm('🔓 UNLOCK ALL PAGES?\n\nThis will unlock all pages and restore normal access. Are you sure?')) {
      return;
    }

    try {
      setLoading(true);
      
      await pageAccessService.unlockAllPages('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW');
      
      // Reload page configs
      await loadPageConfigs();
      
      alert('🔓 ALL PAGES UNLOCKED!\n\nNormal access has been restored to all pages.');
      
    } catch (error) {
      console.error('Failed to unlock all pages:', error);
      alert('❌ Failed to unlock all pages');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className={`${theme === 'dark' 
        ? 'bg-gradient-to-r from-purple-800 to-blue-800' 
        : 'bg-gradient-to-r from-purple-600 to-blue-600'
      } rounded-lg p-6 text-white`}>
        <h1 className="text-3xl font-bold mb-2">👥 User Access Management</h1>
        <p className={theme === 'dark' ? 'text-purple-200' : 'text-purple-100'}>
          Manage beta user access based on address, token holdings, or NFT ownership
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className={`flex space-x-1 p-1 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        {[
          { id: 'users', label: 'User Access', icon: '👥' },
          { id: 'rules', label: 'Access Rules', icon: '📋' },
          { id: 'pages', label: 'Page Management', icon: '📄' },
          { id: 'analytics', label: 'Analytics', icon: '📊' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? theme === 'dark' 
                  ? 'bg-gray-700 text-purple-400 shadow-sm' 
                  : 'bg-white text-purple-600 shadow-sm'
                : theme === 'dark'
                  ? 'text-gray-300 hover:text-gray-100'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Users</h3>
              <p className="text-2xl font-bold text-purple-600">{analytics.totalUsers}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Beta Users</h3>
              <p className="text-2xl font-bold text-green-600">{analytics.betaUsers}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Creator Users</h3>
              <p className="text-2xl font-bold text-blue-600">{analytics.creatorUsers}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Admin Users</h3>
              <p className="text-2xl font-bold text-red-600">{analytics.adminUsers}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Access Requests</h3>
              <p className="text-2xl font-bold text-orange-600">{analytics.totalAccessRequests}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Active Rules</h3>
              <p className="text-2xl font-bold text-cyan-600">{analytics.activeRules}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">📈 Access Trends</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Access by Type</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <span>👤</span>
                      <span>Address-based</span>
                    </span>
                    <span className="font-semibold">
                      {userAccess.filter(u => u.type === 'address' && u.isActive).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <span>💰</span>
                      <span>Token-based</span>
                    </span>
                    <span className="font-semibold">
                      {userAccess.filter(u => u.type === 'token' && u.isActive).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <span>🎨</span>
                      <span>NFT-based</span>
                    </span>
                    <span className="font-semibold">
                      {userAccess.filter(u => u.type === 'nft' && u.isActive).length}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Access by Level</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      <span>Beta</span>
                    </span>
                    <span className="font-semibold">{analytics.betaUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                      <span>Creator</span>
                    </span>
                    <span className="font-semibold">{analytics.creatorUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                      <span>Admin</span>
                    </span>
                    <span className="font-semibold">{analytics.adminUsers}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Access Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Grant Access Form */}
          <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-lg border`}>
            <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Grant New Access</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Solana Address *
                  </label>
                  <input
                    type="text"
                    value={newUserForm.address}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, address: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Enter Solana address"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Access Type
                  </label>
                  <select
                    value={newUserForm.type}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="address">👤 Address-based</option>
                    <option value="token">💰 Token Holdings</option>
                    <option value="nft">🎨 NFT Ownership</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Access Level
                  </label>
                  <select
                    value={newUserForm.accessLevel}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, accessLevel: e.target.value as any }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="beta">🟢 Beta Access</option>
                    <option value="creator">🔵 Creator Access</option>
                    <option value="admin">🔴 Admin Access</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {newUserForm.type === 'token' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Token Threshold (LOS)
                    </label>
                    <input
                      type="number"
                      value={newUserForm.tokenThreshold}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, tokenThreshold: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="1"
                    />
                  </div>
                )}

                {newUserForm.type === 'nft' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NFT Collections (one per line)
                    </label>
                    <textarea
                      value={newUserForm.nftCollections.join('\n')}
                      onChange={(e) => setNewUserForm(prev => ({ 
                        ...prev, 
                        nftCollections: e.target.value.split('\n').filter(addr => addr.trim()) 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={4}
                      placeholder="Enter NFT collection addresses, one per line"
                    />
                  </div>
                )}

                <button
                  onClick={grantAccess}
                  disabled={loading || !newUserForm.address}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {loading ? 'Granting Access...' : 'Grant Access'}
                </button>
              </div>
            </div>
          </div>

          {/* User Access List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Current User Access</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Access Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conditions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Granted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {userAccess.map((user) => (
                    <tr key={user.address}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.address.slice(0, 8)}...{user.address.slice(-8)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.grantedBy === 'System' ? 'System' : `${user.grantedBy.slice(0, 8)}...`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="flex items-center space-x-1">
                          <span>{getAccessTypeIcon(user.type)}</span>
                          <span className="text-sm capitalize">{user.type}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccessLevelColor(user.accessLevel)}`}>
                          {user.accessLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.type === 'token' && user.tokenThreshold && (
                          <span>≥ {user.tokenThreshold.toLocaleString()} LOS</span>
                        )}
                        {user.type === 'nft' && user.nftCollections && (
                          <span>{user.nftCollections.length} collection(s)</span>
                        )}
                        {user.type === 'address' && (
                          <span>Direct access</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.grantedAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive 
                            ? 'text-green-800 bg-green-100' 
                            : 'text-red-800 bg-red-100'
                        }`}>
                          {user.isActive ? 'Active' : 'Revoked'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {user.isActive && user.accessLevel !== 'admin' && (
                          <button
                            onClick={() => revokeAccess(user.address)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Revoke
                          </button>
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

      {/* Access Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Create Rule Form */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create Access Rule</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={newRuleForm.name}
                    onChange={(e) => setNewRuleForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., LOS Holder Access"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Type
                  </label>
                  <select
                    value={newRuleForm.type}
                    onChange={(e) => setNewRuleForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="token">💰 Token Holdings</option>
                    <option value="nft">🎨 NFT Ownership</option>
                    <option value="address">👤 Address-based</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition Description *
                  </label>
                  <input
                    type="text"
                    value={newRuleForm.condition}
                    onChange={(e) => setNewRuleForm(prev => ({ ...prev, condition: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Hold at least 1,000 LOS tokens"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {newRuleForm.type === 'token' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Token Threshold (LOS)
                    </label>
                    <input
                      type="number"
                      value={newRuleForm.threshold}
                      onChange={(e) => setNewRuleForm(prev => ({ ...prev, threshold: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="1"
                    />
                  </div>
                )}

                {newRuleForm.type === 'nft' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NFT Collections (one per line)
                    </label>
                    <textarea
                      value={newRuleForm.collections.join('\n')}
                      onChange={(e) => setNewRuleForm(prev => ({ 
                        ...prev, 
                        collections: e.target.value.split('\n').filter(addr => addr.trim()) 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={4}
                      placeholder="Enter NFT collection addresses, one per line"
                    />
                  </div>
                )}

                <button
                  onClick={createAccessRule}
                  disabled={loading || !newRuleForm.name || !newRuleForm.condition}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {loading ? 'Creating Rule...' : 'Create Rule'}
                </button>
              </div>
            </div>
          </div>

          {/* Access Rules List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Access Rules</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {accessRules.map((rule) => (
                <div key={rule.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{rule.name}</h3>
                        <span className="flex items-center space-x-1">
                          <span>{getAccessTypeIcon(rule.type)}</span>
                          <span className="text-sm text-gray-600 capitalize">{rule.type}</span>
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          rule.isActive 
                            ? 'text-green-800 bg-green-100' 
                            : 'text-gray-800 dark:text-gray-300 bg-gray-100 dark:bg-gray-700'
                        }`}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{rule.condition}</p>
                      {rule.threshold && (
                        <p className="text-sm text-gray-500">
                          Threshold: {rule.threshold.toLocaleString()} LOS
                        </p>
                      )}
                      {rule.collections && rule.collections.length > 0 && (
                        <p className="text-sm text-gray-500">
                          Collections: {rule.collections.length}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          rule.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {rule.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Page Management Tab */}
      {activeTab === 'pages' && (
        <div className="space-y-6">
          {/* Quick Lock Controls */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4">🔒 Quick Lock Controls</h2>
            <p className="text-gray-600 mb-6">
              Instantly lock down any page to redirect users to the beta access signup page.
            </p>
            
            {/* Emergency Controls */}
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-3">🚨 Emergency Controls</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={lockAllPages}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  🔒 Lock All Pages
                </button>
                <button
                  onClick={unlockAllPages}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  🔓 Unlock All Pages
                </button>
              </div>
              <p className="text-sm text-red-700 mt-2">
                Use these buttons for emergency situations. Lock All Pages will lock everything except Home, How It Works, and Beta Signup.
              </p>
            </div>

            {/* Features Sync Controls */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">🔄 Features Sync</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={syncFeaturesWithPages}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  🔄 Sync Features with Pages
                </button>
              </div>
              <p className="text-sm text-blue-700 mt-2">
                Automatically updates the features page based on current page access levels. Features will show as LIVE/BETA/DEV based on page configuration.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pageConfigs.map((page) => (
                <div key={page.pagePath} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{page.pageName}</h3>
                    <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePageLock(page.pagePath)}
                        className={`px-3 py-1 text-sm rounded transition-colors font-medium ${
                        page.isLocked
                            ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                            : page.requiredLevel === 'beta_user'
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300'
                            : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                        }`}
                      >
                        {page.isLocked ? '🔒 Locked' : page.requiredLevel === 'beta_user' ? '🧪 Beta' : '🔓 Unlocked'}
                    </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{page.description}</p>
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Required Level:</span> {page.requiredLevel}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Per-Page Customization */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4">⚙️ Per-Page Customization</h2>
            <p className="text-gray-600 mb-6">
              Customize access requirements and settings for individual pages.
            </p>
            
            <div className="space-y-4">
              {pageConfigs.map((page) => (
                <div key={page.pagePath} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{page.pageName}</h3>
                      <p className="text-sm text-gray-600">{page.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                        page.isLocked 
                          ? 'bg-red-100 text-red-700 border border-red-300' 
                          : page.requiredLevel === 'beta_user'
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                          : 'bg-green-100 text-green-700 border border-green-300'
                      }`}>
                        {page.isLocked ? '🔒 Locked' : page.requiredLevel === 'beta_user' ? '🧪 Beta' : '🔓 Unlocked'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => togglePageLock(page.pagePath)}
                      className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                        page.isLocked
                          ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                          : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                      }`}
                    >
                      {page.isLocked ? '🔒 Lock Page' : '🔓 Unlock Page'}
                    </button>
                    
                    <button
                      onClick={() => updatePageAccessLevel(page.pagePath, 'public')}
                      className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                        page.requiredLevel === 'public'
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      🔓 Make Public
                    </button>
                    
                    <button
                      onClick={() => updatePageAccessLevel(page.pagePath, 'beta_user')}
                      className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                        page.requiredLevel === 'beta_user'
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      🧪 Make Beta
                    </button>
                    
                    <button
                      onClick={() => updatePageAccessLevel(page.pagePath, 'premium_user')}
                      className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                        page.requiredLevel === 'premium_user'
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      ⭐ Make Premium
                    </button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Required Access Level
                      </label>
                      <select
                        value={page.requiredLevel}
                        onChange={(e) => updatePageAccessLevel(page.pagePath, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                      >
                        {ACCESS_LEVELS.map((level) => (
                          <option key={level.id} value={level.id}>
                            {level.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Message (Optional)
                      </label>
                      <input
                        type="text"
                        value={page.customMessage || ''}
                        onChange={(e) => updatePageCustomMessage(page.pagePath, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                        placeholder="Custom redirect message..."
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={page.allowPublicAccess || false}
                          onChange={(e) => updatePagePublicAccess(page.pagePath, e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm">Allow Public Access</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={page.requireVerification || false}
                          onChange={(e) => updatePageVerification(page.pagePath, e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm">Require Verification</span>
                      </label>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => togglePageLock(page.pagePath)}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          page.isLocked
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {page.isLocked ? 'Unlock Page' : 'Lock Page'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Page Access Management Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">📄 Page Access Management</h2>
            <p className="text-gray-600">
              Manage which users can access specific pages on the platform
            </p>
          </div>
        </div>

        {/* Page Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Page to Manage Access
          </label>
          <select
            value={selectedPage}
            onChange={(e) => {
              setSelectedPage(e.target.value);
              if (e.target.value) {
                loadPageAccessUsers(e.target.value);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Select a page...</option>
            {pageConfigs.map((page) => (
              <option key={page.pagePath} value={page.pagePath}>
                {page.pageName} - {page.description}
              </option>
            ))}
          </select>
        </div>

        {/* Page Access Details */}
        {selectedPage && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Page Access Details
              </h3>
              {(() => {
                const page = pageConfigs.find(p => p.pagePath === selectedPage);
                if (!page) return null;
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Page Name:</p>
                      <p className="font-medium">{page.pageName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Required Access Level:</p>
                      <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getAccessLevelColor(page.requiredLevel)}`}>
                        {ACCESS_LEVELS.find(level => level.id === page.requiredLevel)?.name || page.requiredLevel}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Description:</p>
                      <p className="text-gray-900">{page.description}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Users with Access */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Users with Access ({pageAccessUsers.length})
              </h3>
              
              {pageAccessUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No users have access to this page</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pageAccessUsers.map((user) => (
                    <div key={user.address} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getAccessTypeIcon(user.type)}</span>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.address.slice(0, 8)}...{user.address.slice(-8)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Type: {user.type} | Granted: {user.grantedAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getAccessLevelColor(user.accessLevel)}`}>
                          {ACCESS_LEVELS.find(level => level.id === user.accessLevel)?.name || user.accessLevel}
                        </span>
                        <select
                          value={user.accessLevel}
                          onChange={(e) => updateUserAccessLevel(user.address, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          {ACCESS_LEVELS.map((level) => (
                            <option key={level.id} value={level.id}>
                              {level.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
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

export default UserAccessManager;
