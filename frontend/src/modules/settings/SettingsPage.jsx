/**
 * @file SettingsPage.jsx
 * @description Platform and account settings module featuring tabbed views for profile, workspaces, notifications, and security.
 * Platform aur account settings module jo profile, workspaces, notifications, aur security ke tabbed views faraham karta hai.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Briefcase,
  Bell,
  Shield,
  LayoutDashboard,
  Check,
  KeyRound,
  HardDrive,
  Lock,
  Mail,
  Laptop,
  AlertCircle,
  Save,
  Trash2,
  Camera,
  Upload,
} from 'lucide-react';
import { SmartBackButton } from '../../components/SmartBackButton.jsx';

/**
 * Settings tab identifier types.
 * Settings ke mukhtalif tabs ke identifiers.
 *
 * @typedef {'profile' | 'workspaces' | 'notifications' | 'security'} SettingsTab
 */

/**
 * SettingsPage component provides comprehensive user account and platform configuration.
 * Includes interactive tab navigation, SmartBackButton, and direct return to dashboard.
 *
 * SettingsPage component user ke account aur platform ki tafseeli tanzimat (settings) faraham karta hai.
 * Is mein interactive tabs, SmartBackButton, aur dashboard par wapis jane ka direct link shaamil hai.
 *
 * @returns {React.ReactElement} The settings page view / Settings ka safah.
 */
export function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saveFeedback, setSaveFeedback] = useState('');
  const [securityError, setSecurityError] = useState('');
  const fileInputRef = useRef(null);

  // Sync tab with URL search parameter
  // URL ke tab query parameter ke sath sync rakhein
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'workspaces', 'notifications', 'security'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Profile Form State: Initialized from authenticated user stored in localStorage
  // Profile ki Halat: localStorage mein maujood user data se initialize hoti hai
  const [profile, setProfile] = useState(() => {
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        return {
          name: u.name || 'User',
          email: u.email || 'user@docsync.pro',
          title: u.title || 'Senior Software Engineer',
          bio: u.bio || 'Building real-time document collaboration systems with high performance and reliability.',
          timezone: u.timezone || 'Asia/Karachi',
          language: u.language || 'en-US',
          avatarUrl: u.avatarUrl || null,
        };
      }
    } catch (_) {}
    return {
      name: 'User',
      email: 'user@docsync.pro',
      title: 'Senior Software Engineer',
      bio: 'Building real-time document collaboration systems with high performance and reliability.',
      timezone: 'Asia/Karachi',
      language: 'en-US',
      avatarUrl: null,
    };
  });

  // Workspaces Settings State / Workspaces Settings ki Halat
  const [workspaceSettings, setWorkspaceSettings] = useState({
    defaultWorkspace: 'Engineering Core',
    allowExternalSharing: true,
    defaultDocVisibility: 'workspace',
    autoPurgeTrashDays: 30,
  });

  // Notifications State / Notifications ki Halat
  const [notifications, setNotifications] = useState({
    emailMentions: true,
    emailComments: true,
    emailInvites: true,
    emailWeeklyDigest: false,
    inAppRealtime: true,
    inAppSecurity: true,
    soundEffects: false,
  });

  // Security Form State / Security Form ki Halat
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
  });

  /**
   * Shows a transient confirmation banner upon saving settings.
   * Settings mehfooz honay par aarzii tor par tasdeeqi pegham dikhata hai.
   *
   * @param {string} message - Feedback message to show / Dikhaye jane wala pegham.
   */
  const showFeedback = (message) => {
    setSaveFeedback(message);
    setTimeout(() => {
      setSaveFeedback('');
    }, 3500);
  };

  /**
   * Handles photo selection and converts to Base64 image data URL.
   * Profile tasweer ko select karta hai aur base64 format mein convert karke save karta hai.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event
   */
  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showFeedback('Please select a valid image file (PNG, JPG, or GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showFeedback('File size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Url = e.target.result;
      setProfile((prev) => ({ ...prev, avatarUrl: base64Url }));
      try {
        const rawUser = localStorage.getItem('user');
        const currentUser = rawUser ? JSON.parse(rawUser) : {};
        const updatedUser = { ...currentUser, avatarUrl: base64Url };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: updatedUser }));
      } catch (err) {
        console.error('Failed to update avatar in storage', err);
      }
      showFeedback('Profile photo updated successfully!');
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handles profile update submissions and persists them across the app.
   * Saves to localStorage immediately for instant UI refresh, then persists to the
   * backend via PATCH /api/users/me so changes survive page reloads.
   * Profile ki tabdeeli mehfooz karta hai aur poori app mein propagate karta hai.
   *
   * @param {React.FormEvent} event
   */
  const handleSaveProfile = async (event) => {
    event.preventDefault();
    try {
      const rawUser = localStorage.getItem('user');
      const currentUser = rawUser ? JSON.parse(rawUser) : {};
      const updatedUser = {
        ...currentUser,
        name: profile.name,
        email: profile.email,
        title: profile.title,
        bio: profile.bio,
        timezone: profile.timezone,
        language: profile.language,
        avatarUrl: profile.avatarUrl,
      };
      // 1. Persist to localStorage immediately so the header updates at once
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: updatedUser }));

      // 2. Also persist name to the backend so it survives a page reload
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await fetch('/api/users/me', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name: profile.name }),
          });
        } catch (apiErr) {
          console.warn('[Settings]: Backend profile sync failed, localStorage still updated.', apiErr);
        }
      }
    } catch (err) {
      console.error('Failed to save profile', err);
    }
    showFeedback('Profile information updated successfully!');
  };

  /**
   * Handles workspace preferences updates.
   * Workspaces ki tarjeehat ko mehfooz karta hai.
   *
   * @param {React.FormEvent} event
   */
  const handleSaveWorkspaces = (event) => {
    event.preventDefault();
    showFeedback('Workspace preferences saved successfully!');
  };

  /**
   * Handles notification preferences update.
   * Notifications ki tanzimat mehfooz karta hai.
   *
   * @param {React.FormEvent} event
   */
  const handleSaveNotifications = (event) => {
    event.preventDefault();
    showFeedback('Notification preferences saved successfully!');
  };

  /**
   * Handles password update with inline feedback.
   * Connects to POST /api/auth/change-password with current and new password.
   * Password tabdeel karne ka amal sambhalta hai aur backend API se verify karke feedback dikhata hai.
   *
   * @param {React.FormEvent} event
   */
  const handleSaveSecurity = async (event) => {
    event.preventDefault();
    setSecurityError('');

    if (!securityForm.currentPassword) {
      setSecurityError('Please enter your current password.');
      return;
    }

    if (!securityForm.newPassword) {
      setSecurityError('Please enter a new password.');
      return;
    }

    if (securityForm.newPassword.length < 6) {
      setSecurityError('New password must be at least 6 characters long.');
      return;
    }

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityError('New password and confirmation do not match!');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: securityForm.currentPassword,
          newPassword: securityForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setSecurityError(data.message || 'Failed to update password. Please check your current password.');
        return;
      }

      showFeedback(data.message || 'Password updated successfully!');
      setSecurityForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err) {
      console.error('[Settings]: Failed to update password', err);
      setSecurityError('Network error while updating password. Please try again.');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'workspaces', label: 'Workspaces', icon: Briefcase },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header / Balaee Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Navigation Controls and Title */}
          <div className="flex items-center gap-3">
            <SmartBackButton
              fallback="/dashboard"
              title="Go back to previous page"
              aria-label="Go back"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Settings</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                  DocSync Pro
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                Manage your account preferences, workspaces, notifications, and security.
              </p>
            </div>
          </div>

          {/* Quick Return to Dashboard Action */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <LayoutDashboard size={16} className="text-slate-500" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container / Markazi Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* Success Feedback Alert / Kamyabi ka Feedback Pegham */}
        {saveFeedback && (
          <div
            role="status"
            className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-xs animate-in fade-in duration-200"
          >
            <Check size={20} className="text-emerald-600 shrink-0" />
            <span className="text-sm font-medium">{saveFeedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Navigation Sidebar / Bayen Janib Tab Navigation */}
          <nav
            aria-label="Settings navigation"
            className="md:col-span-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0"
            role="tablist"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors text-left ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Tab Content Panel / Dayen Janib Tab Panel */}
          <div className="md:col-span-9 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            {/* 1. Profile Tab / Profile Safah */}
            {activeTab === 'profile' && (
              <section
                id="tabpanel-profile"
                role="tabpanel"
                aria-labelledby="tab-profile"
                className="space-y-6"
              >
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
                  <p className="text-sm text-slate-500">
                    Update your personal profile, display photo, and account details.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  {/* Avatar section with real file picker upload */}
                  {/* Avatar section: File picker ke zariye tasweer upload karne ka amal */}
                  <div className="flex items-center gap-5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoSelect}
                      accept="image/png, image/jpeg, image/gif, image/webp"
                      className="hidden"
                      aria-label="Upload profile photo"
                    />

                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.name}
                        className="w-16 h-16 rounded-full object-cover shadow-xs border-2 border-blue-500"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-xs">
                        {profile.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase() || 'U'}
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-medium text-slate-900">{profile.name}</h3>
                      <p className="text-xs text-slate-500">PNG, JPG, or GIF up to 5MB</p>
                      <button
                        type="button"
                        className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1.5"
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload a new profile photo"
                        aria-label="Upload a new profile photo"
                      >
                        <Camera size={13} />
                        Change photo
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Job Title / Role
                    </label>
                    <input
                      type="text"
                      value={profile.title}
                      onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      rows={3}
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Timezone
                      </label>
                      <select
                        value={profile.timezone}
                        onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Asia/Karachi">Asia/Karachi (UTC+05:00)</option>
                        <option value="UTC">UTC (UTC+00:00)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Language
                      </label>
                      <select
                        value={profile.language}
                        onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="ur">Urdu (اردو)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Save size={16} />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* 2. Workspaces Tab / Workspaces Safah */}
            {activeTab === 'workspaces' && (
              <section
                id="tabpanel-workspaces"
                role="tabpanel"
                aria-labelledby="tab-workspaces"
                className="space-y-6"
              >
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Workspaces & Storage</h2>
                  <p className="text-sm text-slate-500">
                    Configure your workspace defaults, storage quota, and document sharing rules.
                  </p>
                </div>

                <form onSubmit={handleSaveWorkspaces} className="space-y-6">
                  {/* Storage usage summary */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-800 flex items-center gap-2">
                        <HardDrive size={16} className="text-blue-600" />
                        Storage Quota
                      </span>
                      <span className="text-slate-600 font-semibold">4.8 GB of 20 GB used (24%)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24%' }} />
                    </div>
                    <p className="text-xs text-slate-500">
                      Standard enterprise plan includes 20 GB of cloud document storage.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Default Startup Workspace
                      </label>
                      <select
                        value={workspaceSettings.defaultWorkspace}
                        onChange={(e) =>
                          setWorkspaceSettings({
                            ...workspaceSettings,
                            defaultWorkspace: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Engineering Core">Engineering Core</option>
                        <option value="Product Roadmap">Product Roadmap</option>
                        <option value="Design System">Design System</option>
                        <option value="Marketing Hub">Marketing Hub</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Default New Document Visibility
                      </label>
                      <select
                        value={workspaceSettings.defaultDocVisibility}
                        onChange={(e) =>
                          setWorkspaceSettings({
                            ...workspaceSettings,
                            defaultDocVisibility: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="workspace">Entire Workspace (All Members)</option>
                        <option value="private">Private (Only Me)</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={workspaceSettings.allowExternalSharing}
                          onChange={(e) =>
                            setWorkspaceSettings({
                              ...workspaceSettings,
                              allowExternalSharing: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-slate-900">
                            Allow external collaboration links
                          </span>
                          <p className="text-xs text-slate-500">
                            Permit team members to generate view-only or edit links for guest users.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                    <Link
                      to="/workspaces"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View all workspaces →
                    </Link>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Save size={16} />
                      <span>Save Workspace Settings</span>
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* 3. Notifications Tab / Notifications Safah */}
            {activeTab === 'notifications' && (
              <section
                id="tabpanel-notifications"
                role="tabpanel"
                aria-labelledby="tab-notifications"
                className="space-y-6"
              >
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Notification Preferences</h2>
                  <p className="text-sm text-slate-500">
                    Choose what alerts you receive via email and inside the collaboration platform.
                  </p>
                </div>

                <form onSubmit={handleSaveNotifications} className="space-y-6">
                  {/* Email Notifications */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                      Email Alerts
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.emailMentions}
                          onChange={(e) =>
                            setNotifications({ ...notifications, emailMentions: e.target.checked })
                          }
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-slate-900">
                            Document Mentions (@name)
                          </span>
                          <p className="text-xs text-slate-500">
                            Receive an email when a team member mentions you in a comment or document.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.emailComments}
                          onChange={(e) =>
                            setNotifications({ ...notifications, emailComments: e.target.checked })
                          }
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-slate-900">
                            Comments on my documents
                          </span>
                          <p className="text-xs text-slate-500">
                            Get email notifications when new comments or threads are created.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.emailWeeklyDigest}
                          onChange={(e) =>
                            setNotifications({
                              ...notifications,
                              emailWeeklyDigest: e.target.checked,
                            })
                          }
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-slate-900">
                            Weekly Summary Digest
                          </span>
                          <p className="text-xs text-slate-500">
                            Receive a weekly overview of edits, top files, and team workspace changes.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* In-App Notifications */}
                  <div className="pt-4 border-t border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                      In-App Notifications
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.inAppRealtime}
                          onChange={(e) =>
                            setNotifications({
                              ...notifications,
                              inAppRealtime: e.target.checked,
                            })
                          }
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-slate-900">
                            Live Collaboration Alerts
                          </span>
                          <p className="text-xs text-slate-500">
                            Show live toasts when other collaborators join or edit your active document.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.soundEffects}
                          onChange={(e) =>
                            setNotifications({
                              ...notifications,
                              soundEffects: e.target.checked,
                            })
                          }
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-slate-900">
                            Sound Effects
                          </span>
                          <p className="text-xs text-slate-500">
                            Play sound for incoming mentions and critical notifications.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Save size={16} />
                      <span>Save Notification Settings</span>
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* 4. Security Tab / Security Safah */}
            {activeTab === 'security' && (
              <section
                id="tabpanel-security"
                role="tabpanel"
                aria-labelledby="tab-security"
                className="space-y-6"
              >
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Security & Credentials</h2>
                  <p className="text-sm text-slate-500">
                    Manage passwords, two-factor authentication, and monitor active sessions.
                  </p>
                </div>

                <form onSubmit={handleSaveSecurity} className="space-y-5">
                  {securityError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                      {securityError}
                    </div>
                  )}

                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <KeyRound size={16} className="text-blue-600" />
                    Change Password
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={securityForm.currentPassword}
                      onChange={(e) =>
                        setSecurityForm({ ...securityForm, currentPassword: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={securityForm.newPassword}
                        onChange={(e) =>
                          setSecurityForm({ ...securityForm, newPassword: e.target.value })
                        }
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={securityForm.confirmPassword}
                        onChange={(e) =>
                          setSecurityForm({ ...securityForm, confirmPassword: e.target.value })
                        }
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Two-Factor Authentication Status Card */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-slate-900 block">
                        Two-Factor Authentication (2FA)
                      </span>
                      <p className="text-xs text-slate-500">
                        Add an extra layer of security requiring an authenticator app code on login.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !securityForm.twoFactorEnabled;
                        setSecurityForm({ ...securityForm, twoFactorEnabled: nextState });
                        showFeedback(
                          nextState
                            ? 'Two-factor authentication enabled!'
                            : 'Two-factor authentication disabled.'
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        securityForm.twoFactorEnabled
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {securityForm.twoFactorEnabled ? 'Enabled ●' : 'Enable 2FA'}
                    </button>
                  </div>

                  {/* Active Sessions */}
                  <div className="pt-4 border-t border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Active Sessions</h3>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Laptop size={18} className="text-slate-600" />
                        <div>
                          <p className="text-xs font-medium text-slate-900">
                            Windows 11 · Chrome · Current Session
                          </p>
                          <p className="text-[11px] text-slate-500">Islamabad, PK · Active now</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Active
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Save size={16} />
                      <span>Update Security Settings</span>
                    </button>
                  </div>
                </form>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default SettingsPage;
