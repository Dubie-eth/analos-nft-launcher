'use client';

import React, { useState, useEffect } from 'react';
import { verificationService, CollectionVerification, SocialPlatform } from '@/lib/verification-service';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  collectionName: string;
  ownerWallet: string;
  onVerificationComplete?: (verification: CollectionVerification) => void;
}

export default function VerificationModal({
  isOpen,
  onClose,
  collectionId,
  collectionName,
  ownerWallet,
  onVerificationComplete
}: VerificationModalProps) {
  const [currentStep, setCurrentStep] = useState<'social-links' | 'proof' | 'complete'>('social-links');
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [proofData, setProofData] = useState<Record<string, { type: string; content: string; url?: string }>>({});
  const [verificationId, setVerificationId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [existingVerification, setExistingVerification] = useState<CollectionVerification | null>(null);

  const platforms = verificationService.getSocialPlatforms();
  const requirements = verificationService.getVerificationRequirements();

  useEffect(() => {
    if (isOpen) {
      loadExistingVerification();
    }
  }, [isOpen, collectionId]);

  const loadExistingVerification = async () => {
    try {
      const verification = await verificationService.getVerificationStatus(collectionId);
      if (verification) {
        setExistingVerification(verification);
        setSocialLinks(verification.socialLinks);
        setSelectedPlatforms(verification.verificationStatus.verifiedPlatforms);
      }
    } catch (error) {
      console.error('Failed to load existing verification:', error);
    }
  };

  const handleSocialLinkChange = (platformId: string, url: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [platformId]: url
    }));
  };

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(id => id !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  };

  const validateAndProceed = () => {
    const filteredLinks = Object.fromEntries(
      Object.entries(socialLinks).filter(([key, value]) => 
        selectedPlatforms.includes(key) && value?.trim()
      )
    );

    const validation = verificationService.validateSocialLinks(filteredLinks);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    if (validation.warnings.length > 0) {
      console.warn('Validation warnings:', validation.warnings);
    }

    setCurrentStep('proof');
    setError('');
  };

  const startVerification = async () => {
    setLoading(true);
    setError('');

    try {
      const filteredLinks = Object.fromEntries(
        Object.entries(socialLinks).filter(([key, value]) => 
          selectedPlatforms.includes(key) && value?.trim()
        )
      );

      const result = await verificationService.startVerification(
        collectionId,
        ownerWallet,
        filteredLinks
      );

      setVerificationId(result.verificationId);
      setCurrentStep('complete');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start verification');
    } finally {
      setLoading(false);
    }
  };

  const completeVerification = async () => {
    setLoading(true);
    setError('');

    try {
      const proofArray = Object.entries(proofData)
        .filter(([platform, data]) => selectedPlatforms.includes(platform) && data.content.trim())
        .map(([platform, data]) => ({
          platform,
          proofType: data.type as 'post' | 'bio' | 'website' | 'custom',
          proofContent: data.content,
          proofUrl: data.url
        }));

      const verificationStatus = await verificationService.completeVerification(
        verificationId,
        proofArray
      );

      const newVerification: CollectionVerification = {
        collectionId,
        collectionName,
        ownerWallet,
        verificationStatus,
        socialLinks,
        badgeDisplay: {
          showBadge: true,
          badgePosition: 'top-right',
          badgeSize: 'medium'
        }
      };

      setExistingVerification(newVerification);
      onVerificationComplete?.(newVerification);
      
      // Show success message briefly before closing
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to complete verification');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setCurrentStep('social-links');
    setSocialLinks({});
    setSelectedPlatforms([]);
    setProofData({});
    setVerificationId('');
    setError('');
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">
            ✅ Social Verification
          </h2>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {['social-links', 'proof', 'complete'].map((step, index) => {
              const stepNames = ['Connect Socials', 'Provide Proof', 'Complete'];
              const isActive = currentStep === step;
              const isCompleted = ['social-links', 'proof'].indexOf(currentStep) > index;
              
              return (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isActive ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' :
                    isCompleted ? 'bg-green-500 text-white' :
                    'bg-white/20 text-gray-400'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className={`ml-2 text-sm ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`}>
                    {stepNames[index]}
                  </span>
                  {index < 2 && (
                    <div className={`w-8 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Existing Verification Status */}
        {existingVerification && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <span className="text-green-400 text-2xl mr-3">✅</span>
              <div>
                <h3 className="text-green-400 font-bold">Already Verified!</h3>
                <p className="text-gray-300 text-sm">
                  This collection is already verified with {existingVerification.verificationStatus.verifiedPlatforms.length} social platform(s)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-400 text-2xl mr-3">❌</span>
              <div>
                <h3 className="text-red-400 font-bold">Verification Error</h3>
                <p className="text-gray-300 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Social Links */}
        {currentStep === 'social-links' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Connect Your Social Media</h3>
              <p className="text-gray-300">
                Link at least one social media account to get your verified collection badge
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {platforms.map((platform) => (
                <div key={platform.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center text-white font-medium">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(platform.id)}
                        onChange={() => handlePlatformToggle(platform.id)}
                        className="mr-3 w-4 h-4 text-purple-600 bg-white/20 border-white/30 rounded focus:ring-purple-500"
                      />
                      <span className="text-2xl mr-2">{platform.icon}</span>
                      {platform.name}
                    </label>
                  </div>
                  
                  {selectedPlatforms.includes(platform.id) && (
                    <input
                      type="url"
                      placeholder={`Enter your ${platform.name} URL`}
                      value={socialLinks[platform.id] || ''}
                      onChange={(e) => handleSocialLinkChange(platform.id, e.target.value)}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4">
              <h4 className="text-blue-400 font-bold mb-2">ℹ️ Verification Requirements</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Connect at least {requirements.minimumPlatforms} social media account</li>
                <li>• Provide proof of ownership (post, bio mention, or website link)</li>
                <li>• Verification is valid for {requirements.verificationPeriod} days</li>
                <li>• Badge indicates social connection only - not an endorsement</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <button
                onClick={validateAndProceed}
                disabled={selectedPlatforms.length === 0}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200"
              >
                Continue to Proof
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Provide Proof */}
        {currentStep === 'proof' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Provide Proof of Ownership</h3>
              <p className="text-gray-300">
                Show that you own these social media accounts
              </p>
            </div>

            {selectedPlatforms.map((platformId) => {
              const platform = platforms.find(p => p.id === platformId);
              if (!platform) return null;

              return (
                <div key={platformId} className="bg-white/10 rounded-xl p-6 border border-white/20">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-3">{platform.icon}</span>
                    <h4 className="text-xl font-bold text-white">{platform.name}</h4>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Proof Type</label>
                      <select
                        value={proofData[platformId]?.type || 'post'}
                        onChange={(e) => setProofData(prev => ({
                          ...prev,
                          [platformId]: { ...prev[platformId], type: e.target.value }
                        }))}
                        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="post">Post mentioning collection</option>
                        <option value="bio">Bio/Profile mention</option>
                        <option value="website">Website link</option>
                        <option value="custom">Custom proof</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Proof Description</label>
                      <textarea
                        placeholder="Describe your proof (e.g., 'Posted about this collection on X', 'Added to bio', etc.)"
                        value={proofData[platformId]?.content || ''}
                        onChange={(e) => setProofData(prev => ({
                          ...prev,
                          [platformId]: { ...prev[platformId], content: e.target.value }
                        }))}
                        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Proof URL (Optional)</label>
                      <input
                        type="url"
                        placeholder="Link to the proof (post, profile, etc.)"
                        value={proofData[platformId]?.url || ''}
                        onChange={(e) => setProofData(prev => ({
                          ...prev,
                          [platformId]: { ...prev[platformId], url: e.target.value }
                        }))}
                        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep('social-links')}
                className="px-8 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold transition-all duration-200"
              >
                Back
              </button>
              <button
                onClick={startVerification}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200"
              >
                {loading ? 'Starting Verification...' : 'Start Verification'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {currentStep === 'complete' && (
          <div className="space-y-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-white mb-2">Verification Started!</h3>
            <p className="text-gray-300 mb-6">
              Your verification request has been submitted. You'll receive your verified badge once approved.
            </p>

            <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/50 rounded-xl p-6">
              <h4 className="text-green-400 font-bold mb-2">Next Steps</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Your verification will be reviewed within 24 hours</li>
                <li>• You'll receive an email notification when approved</li>
                <li>• Your collection will display the verified badge</li>
                <li>• Re-verification required every {requirements.verificationPeriod} days</li>
              </ul>
            </div>

            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4">
              <h4 className="text-yellow-400 font-bold mb-2">⚠️ Important Disclaimer</h4>
              <p className="text-gray-300 text-sm">
                {verificationService.getVerificationDisclaimer()}
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleClose}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-bold transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
