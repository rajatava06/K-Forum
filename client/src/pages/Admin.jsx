import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from '../services/axiosSetup';
import {
  Shield, Users, MessageSquare, AlertTriangle, TrendingUp,
  Eye, CheckCircle, XCircle, Gamepad2, Plus, Calendar,
  Trash2, Flag, FileText, Check, X, ShieldAlert, Sparkles, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Admin = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [pendingPosts, setPendingPosts] = useState([]);
  const [pendingComments, setPendingComments] = useState([]);
  const [reportedPosts, setReportedPosts] = useState([]);
  const [reportedComments, setReportedComments] = useState([]);
  const [flaggedPosts, setFlaggedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [moderationSubTab, setModerationSubTab] = useState('posts'); // 'posts', 'comments', 'flagged', 'reports'
  const [actionLoading, setActionLoading] = useState({});

  // Wordle Management State
  const [wordleWords, setWordleWords] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [newWordDate, setNewWordDate] = useState('');
  const [newWordHint, setNewWordHint] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchPendingPosts(),
      fetchPendingComments(),
      fetchReportedPosts(),
      fetchReportedComments(),
      fetchFlaggedPosts(),
      fetchWordleWords()
    ]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPendingPosts = async () => {
    try {
      const response = await axios.get('/api/admin/posts/pending');
      setPendingPosts(response.data || []);
    } catch (error) {
      console.error('Error fetching pending posts:', error);
      setPendingPosts([]);
    }
  };

  const fetchPendingComments = async () => {
    try {
      const response = await axios.get('/api/admin/comments/pending');
      setPendingComments(response.data || []);
    } catch (error) {
      console.error('Error fetching pending comments:', error);
      setPendingComments([]);
    }
  };

  const fetchReportedPosts = async () => {
    try {
      const response = await axios.get('/api/admin/reported-posts');
      setReportedPosts(response.data || []);
    } catch (error) {
      console.error('Error fetching reported posts:', error);
      setReportedPosts([]);
    }
  };

  const fetchReportedComments = async () => {
    try {
      const response = await axios.get('/api/admin/reported-comments');
      setReportedComments(response.data || []);
    } catch (error) {
      console.error('Error fetching reported comments:', error);
      setReportedComments([]);
    }
  };

  const fetchFlaggedPosts = async () => {
    try {
      const response = await axios.get('/api/admin/flagged-posts');
      setFlaggedPosts(response.data || []);
    } catch (error) {
      console.error('Error fetching flagged posts:', error);
      setFlaggedPosts([]);
    }
  };

  const fetchWordleWords = async () => {
    try {
      const response = await axios.get('/api/wordle/admin/words');
      setWordleWords(response.data || []);
    } catch (error) {
      console.error('Error fetching wordle words:', error);
    }
  };

  // Post Approval / Rejection
  const handleApprovePost = async (postId) => {
    setActionLoading(prev => ({ ...prev, [postId]: 'approving' }));
    try {
      await axios.post(`/api/admin/posts/${postId}/approve`);
      toast.success('Post approved and published to feed!');
      // Optimistic update
      setPendingPosts(prev => prev.filter(p => p._id !== postId));
      setFlaggedPosts(prev => prev.filter(p => p._id !== postId));
      setReportedPosts(prev => prev.filter(p => p._id !== postId));
      fetchStats();
    } catch (error) {
      console.error('Error approving post:', error);
      toast.error('Failed to approve post');
    } finally {
      setActionLoading(prev => ({ ...prev, [postId]: null }));
    }
  };

  const handleRejectPost = async (postId) => {
    setActionLoading(prev => ({ ...prev, [postId]: 'rejecting' }));
    try {
      await axios.post(`/api/admin/posts/${postId}/reject`);
      toast.success('Post rejected successfully');
      // Optimistic update
      setPendingPosts(prev => prev.filter(p => p._id !== postId));
      setFlaggedPosts(prev => prev.filter(p => p._id !== postId));
      setReportedPosts(prev => prev.filter(p => p._id !== postId));
      fetchStats();
    } catch (error) {
      console.error('Error rejecting post:', error);
      toast.error('Failed to reject post');
    } finally {
      setActionLoading(prev => ({ ...prev, [postId]: null }));
    }
  };

  // Comment Approval / Rejection
  const handleApproveComment = async (commentId) => {
    setActionLoading(prev => ({ ...prev, [commentId]: 'approving' }));
    try {
      await axios.post(`/api/admin/comments/${commentId}/approve`);
      toast.success('Comment approved and published!');
      // Optimistic update
      setPendingComments(prev => prev.filter(c => c._id !== commentId));
      setReportedComments(prev => prev.filter(c => c._id !== commentId));
      fetchStats();
    } catch (error) {
      console.error('Error approving comment:', error);
      toast.error('Failed to approve comment');
    } finally {
      setActionLoading(prev => ({ ...prev, [commentId]: null }));
    }
  };

  const handleRejectComment = async (commentId) => {
    setActionLoading(prev => ({ ...prev, [commentId]: 'rejecting' }));
    try {
      await axios.post(`/api/admin/comments/${commentId}/reject`);
      toast.success('Comment rejected successfully');
      // Optimistic update
      setPendingComments(prev => prev.filter(c => c._id !== commentId));
      setReportedComments(prev => prev.filter(c => c._id !== commentId));
      fetchStats();
    } catch (error) {
      console.error('Error rejecting comment:', error);
      toast.error('Failed to reject comment');
    } finally {
      setActionLoading(prev => ({ ...prev, [commentId]: null }));
    }
  };

  const handleSetWordleWord = async (e) => {
    e.preventDefault();
    if (newWord.length !== 5) {
      toast.error('Word must be exactly 5 letters');
      return;
    }

    try {
      await axios.post('/api/wordle/admin/set-word', {
        word: newWord.toUpperCase(),
        date: newWordDate || undefined,
        hint: newWordHint || undefined
      });
      toast.success('Wordle word set successfully!');
      setNewWord('');
      setNewWordDate('');
      setNewWordHint('');
      fetchWordleWords();
    } catch (error) {
      console.error('Error setting wordle word:', error);
      toast.error('Failed to set wordle word');
    }
  };

  const handleDeleteWord = async (wordId) => {
    if (!confirm('Are you sure you want to delete this word?')) return;

    try {
      await axios.delete(`/api/wordle/admin/words/${wordId}`);
      toast.success('Word deleted');
      fetchWordleWords();
    } catch (error) {
      console.error('Error deleting word:', error);
      toast.error('Failed to delete word');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#17d059]"></div>
      </div>
    );
  }

  const totalPendingModeration = (pendingPosts.length || 0) + (pendingComments.length || 0);

  return (
    <div className="min-h-screen py-8 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="w-8 h-8 text-[#17d059]" />
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Admin Moderation Control
              </h1>
            </div>
            <p className="text-gray-400 text-sm">
              Review and approve user posts & comments, inspect AI safety analysis, and manage community health.
            </p>
          </div>

          <button
            onClick={fetchAllData}
            className="self-start md:self-auto px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center gap-2"
          >
            Refresh Queue
          </button>
        </div>

        {/* Main Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            {
              id: 'moderation',
              label: `Moderation Queue ${totalPendingModeration > 0 ? `(${totalPendingModeration})` : ''}`,
              icon: AlertTriangle,
              highlight: totalPendingModeration > 0
            },
            { id: 'wordle', label: 'Daily Wordle', icon: Gamepad2 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2.5 ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                  : tab.highlight
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                    : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Total Users</p>
                    <p className="text-3xl font-black text-white">{stats.totalUsers || 0}</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Pending Posts</p>
                    <p className="text-3xl font-black text-amber-400">{pendingPosts.length || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Awaiting admin approval</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Pending Comments</p>
                    <p className="text-3xl font-black text-cyan-400">{pendingComments.length || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Awaiting admin approval</p>
                  </div>
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">User Reports</p>
                    <p className="text-3xl font-black text-rose-400">{(reportedPosts.length || 0) + (reportedComments.length || 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">Community flagged items</p>
                  </div>
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                    <Flag className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="glass-panel p-6 rounded-2xl border border-white/5">
                <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Published Live Posts</p>
                <p className="text-2xl font-black text-emerald-400">{stats.publishedPosts || 0}</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-white/5">
                <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Total Comments in DB</p>
                <p className="text-2xl font-black text-white">{stats.totalComments || 0}</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-white/5">
                <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Rejected Content</p>
                <p className="text-2xl font-black text-gray-500">{stats.rejectedPosts || 0}</p>
              </div>
            </div>

            {/* Category Statistics */}
            {stats.categoryStats && (
              <div className="glass-panel rounded-2xl p-6 border border-white/5">
                <h2 className="text-lg font-bold text-white mb-4">Posts by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {stats.categoryStats.map((category) => (
                    <div key={category._id || 'other'} className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
                      <p className="text-2xl font-bold text-emerald-400">{category.count}</p>
                      <p className="text-gray-400 text-xs capitalize mt-1">{(category._id || 'general').replace('-', ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Moderation Tab */}
        {activeTab === 'moderation' && (
          <div className="space-y-6 animate-fade-in">
            {/* Moderation Sub-tabs */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
              <button
                onClick={() => setModerationSubTab('posts')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${moderationSubTab === 'posts'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <FileText className="w-4 h-4" />
                <span>Pending Posts ({pendingPosts.length})</span>
              </button>

              <button
                onClick={() => setModerationSubTab('comments')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${moderationSubTab === 'comments'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Pending Comments ({pendingComments.length})</span>
              </button>

              <button
                onClick={() => setModerationSubTab('flagged')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${moderationSubTab === 'flagged'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span>AI Flagged ({flaggedPosts.length})</span>
              </button>

              <button
                onClick={() => setModerationSubTab('reports')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${moderationSubTab === 'reports'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Flag className="w-4 h-4 text-rose-400" />
                <span>User Reports ({(reportedPosts.length || 0) + (reportedComments.length || 0)})</span>
              </button>
            </div>

            {/* ==================================================== */}
            {/* SUBTAB 1: PENDING POSTS */}
            {/* ==================================================== */}
            {moderationSubTab === 'posts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <span>Posts Awaiting Approval ({pendingPosts.length})</span>
                  </h2>
                  <span className="text-xs text-gray-400">
                    Posts submitted by non-admins requiring verification before going live.
                  </span>
                </div>

                {pendingPosts.length === 0 ? (
                  <div className="glass-panel p-12 rounded-3xl border border-white/5 text-center">
                    <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-3 opacity-80" />
                    <h3 className="text-xl font-bold text-white mb-1">Queue is Empty!</h3>
                    <p className="text-gray-400 text-sm">No user posts are currently pending review.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingPosts.map((post) => {
                      const modInfo = post.moderationInfo || {};
                      const isAiFlagged = modInfo.isUnsafe || (modInfo.confidence && modInfo.confidence >= 0.45);

                      return (
                        <div
                          key={post._id}
                          className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all space-y-4"
                        >
                          {/* Top Row: Meta info & Category */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/5">
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase">
                                {post.category}
                              </span>
                              {post.isAnonymous && (
                                <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full text-[11px]">
                                  Posted Anonymously
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                {new Date(post.createdAt).toLocaleString()}
                              </span>
                            </div>

                            {/* Author Info */}
                            <div className="text-xs text-gray-300">
                              <span className="text-gray-500">Author: </span>
                              <span className="font-semibold text-white">
                                {post.author ? `${post.author.name} (${post.author.studentId || post.author.email})` : 'Unknown'}
                              </span>
                            </div>
                          </div>

                          {/* Post Body */}
                          <div>
                            <h3 className="text-lg font-bold text-white mb-2">{post.title}</h3>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                              {post.content}
                            </p>

                            {/* Poll Options if any */}
                            {post.pollOptions && post.pollOptions.length > 0 && (
                              <div className="mt-3 space-y-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-xs font-bold text-gray-400">Poll Options:</p>
                                {post.pollOptions.map((opt, i) => (
                                  <div key={i} className="text-xs text-gray-300 pl-2">
                                    • {opt.text}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Image Attachments */}
                            {post.attachments && post.attachments.length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-3">
                                {post.attachments.map((att, idx) => (
                                  <a
                                    key={idx}
                                    href={att.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="relative group rounded-xl overflow-hidden border border-white/10"
                                  >
                                    <img
                                      src={att.url}
                                      alt={`Attachment ${idx + 1}`}
                                      className="w-24 h-24 object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                                      <ExternalLink className="w-4 h-4" />
                                    </span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* AI Moderation Analysis Box */}
                          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isAiFlagged
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                            : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                            }`}>
                            <div className="flex items-center gap-3">
                              {isAiFlagged ? (
                                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                              ) : (
                                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                              )}
                              <div>
                                <p className="text-xs font-bold">
                                  {isAiFlagged ? 'AI Flagged Potential Risk' : 'AI Pre-Check: Safe'}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  Confidence Score: {modInfo.confidencePercent || 0}%
                                  {modInfo.categories?.length > 0 && ` | Categories: ${modInfo.categories.join(', ')}`}
                                  {modInfo.flaggedWords?.length > 0 && ` | Words: ${modInfo.flaggedWords.join(', ')}`}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                              onClick={() => handleRejectPost(post._id)}
                              disabled={actionLoading[post._id]}
                              className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                              <span>{actionLoading[post._id] === 'rejecting' ? 'Rejecting...' : 'Reject Post'}</span>
                            </button>

                            <button
                              onClick={() => handleApprovePost(post._id)}
                              disabled={actionLoading[post._id]}
                              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" />
                              <span>{actionLoading[post._id] === 'approving' ? 'Approving...' : 'Approve & Publish'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ==================================================== */}
            {/* SUBTAB 2: PENDING COMMENTS */}
            {/* ==================================================== */}
            {moderationSubTab === 'comments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                    <span>Comments Awaiting Approval ({pendingComments.length})</span>
                  </h2>
                  <span className="text-xs text-gray-400">
                    User comments awaiting verification before appearing on posts.
                  </span>
                </div>

                {pendingComments.length === 0 ? (
                  <div className="glass-panel p-12 rounded-3xl border border-white/5 text-center">
                    <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-3 opacity-80" />
                    <h3 className="text-xl font-bold text-white mb-1">No Pending Comments</h3>
                    <p className="text-gray-400 text-sm">All user comments are approved and up to date.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingComments.map((comment) => {
                      const modInfo = comment.moderationInfo || {};
                      const isAiFlagged = modInfo.isUnsafe || (modInfo.confidence && modInfo.confidence >= 0.45);

                      return (
                        <div
                          key={comment._id}
                          className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all space-y-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/5 text-xs text-gray-400">
                            <div>
                              <span className="text-gray-500">On Post: </span>
                              {comment.post ? (
                                <Link
                                  to={`/post/${comment.post._id}`}
                                  target="_blank"
                                  className="font-bold text-cyan-400 hover:underline inline-flex items-center gap-1"
                                >
                                  {comment.post.title}
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              ) : (
                                <span className="text-gray-500">Deleted post</span>
                              )}
                            </div>

                            <div>
                              <span className="text-gray-500">Author: </span>
                              <span className="font-semibold text-white">
                                {comment.author ? `${comment.author.name} (${comment.author.studentId || comment.author.email})` : 'Unknown'}
                              </span>
                            </div>
                          </div>

                          <div>
                            <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">
                              "{comment.content}"
                            </p>

                            {/* Comment images */}
                            {comment.attachments && comment.attachments.length > 0 && (
                              <div className="mt-3 flex gap-2">
                                {comment.attachments.map((att, i) => (
                                  <a key={i} href={att.url} target="_blank" rel="noreferrer">
                                    <img
                                      src={att.url}
                                      alt="Comment attachment"
                                      className="w-16 h-16 object-cover rounded-lg border border-white/10"
                                    />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* AI Moderation info */}
                          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${isAiFlagged
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                            : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                            }`}>
                            <span>AI Confidence: {modInfo.confidencePercent || 0}% {modInfo.categories?.length > 0 && `(${modInfo.categories.join(', ')})`}</span>
                            <span>{new Date(comment.createdAt).toLocaleString()}</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                              onClick={() => handleRejectComment(comment._id)}
                              disabled={actionLoading[comment._id]}
                              className="px-5 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                              <span>{actionLoading[comment._id] === 'rejecting' ? 'Rejecting...' : 'Reject Comment'}</span>
                            </button>

                            <button
                              onClick={() => handleApproveComment(comment._id)}
                              disabled={actionLoading[comment._id]}
                              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" />
                              <span>{actionLoading[comment._id] === 'approving' ? 'Approving...' : 'Approve Comment'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ==================================================== */}
            {/* SUBTAB 3: AI FLAGGED CONTENT */}
            {/* ==================================================== */}
            {moderationSubTab === 'flagged' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    <span>AI Flagged Content ({flaggedPosts.length})</span>
                  </h2>
                </div>

                {flaggedPosts.length === 0 ? (
                  <div className="glass-panel p-12 rounded-3xl border border-white/5 text-center">
                    <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-3 opacity-80" />
                    <h3 className="text-xl font-bold text-white mb-1">All Clear!</h3>
                    <p className="text-gray-400 text-sm">No content flagged by AI filter.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {flaggedPosts.map((post) => (
                      <div key={post._id} className="glass-panel p-6 rounded-2xl border border-orange-500/20 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-bold text-white">{post.title}</h3>
                            <p className="text-gray-300 text-sm mt-1">{post.content}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              By: {post.author?.name || 'Anonymous'} • {post.category}
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 shrink-0">
                            FLAGGED
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            onClick={() => handleRejectPost(post._id)}
                            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            <span>Remove</span>
                          </button>
                          <button
                            onClick={() => handleApprovePost(post._id)}
                            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ==================================================== */}
            {/* SUBTAB 4: USER REPORTS */}
            {/* ==================================================== */}
            {moderationSubTab === 'reports' && (
              <div className="space-y-6">
                {/* Reported Posts */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-rose-400" />
                    <span>Reported Posts ({reportedPosts.length})</span>
                  </h3>

                  {reportedPosts.length === 0 ? (
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center text-gray-400 text-sm">
                      No user reports on posts.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reportedPosts.map((post) => (
                        <div key={post._id} className="glass-panel p-6 rounded-2xl border border-rose-500/20 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="text-base font-bold text-white">{post.title}</h4>
                              <p className="text-gray-300 text-sm mt-1">{post.content}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                Author: {post.author?.name || 'Anonymous'} • Reports: {post.reports?.length || 0}
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full text-xs font-bold">
                              REPORTED
                            </span>
                          </div>

                          {/* Report Reasons */}
                          {post.reports && post.reports.length > 0 && (
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1.5 text-xs">
                              <p className="font-bold text-rose-400">Report Reasons:</p>
                              {post.reports.map((rep, idx) => (
                                <p key={idx} className="text-gray-300">
                                  • "{rep.reason}" — by {rep.user?.name || 'Anonymous'}
                                </p>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-3 pt-1">
                            <button
                              onClick={() => handleRejectPost(post._id)}
                              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Remove Post</span>
                            </button>
                            <button
                              onClick={() => handleApprovePost(post._id)}
                              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <Check className="w-4 h-4" />
                              <span>Keep / Approve</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reported Comments */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-rose-400" />
                    <span>Reported Comments ({reportedComments.length})</span>
                  </h3>

                  {reportedComments.length === 0 ? (
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center text-gray-400 text-sm">
                      No user reports on comments.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reportedComments.map((comment) => (
                        <div key={comment._id} className="glass-panel p-6 rounded-2xl border border-rose-500/20 space-y-3">
                          <p className="text-sm text-gray-200">"{comment.content}"</p>
                          <p className="text-xs text-gray-500">
                            Author: {comment.author?.name || 'Anonymous'} • On Post: {comment.post?.title || 'Unknown'}
                          </p>

                          {comment.reports && comment.reports.length > 0 && (
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1 text-xs">
                              <p className="font-bold text-rose-400">Report Reasons:</p>
                              {comment.reports.map((rep, idx) => (
                                <p key={idx} className="text-gray-300">• "{rep.reason}"</p>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-3 pt-1">
                            <button
                              onClick={() => handleRejectComment(comment._id)}
                              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Remove Comment</span>
                            </button>
                            <button
                              onClick={() => handleApproveComment(comment._id)}
                              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <Check className="w-4 h-4" />
                              <span>Keep / Approve</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wordle Management Tab */}
        {activeTab === 'wordle' && (
          <div className="space-y-6 animate-fade-in">
            {/* Set New Word */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-amber-400" />
                <span>Set Daily Wordle</span>
              </h2>

              <form onSubmit={handleSetWordleWord} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-bold text-gray-400 mb-2">
                      Word (5 letters) *
                    </label>
                    <input
                      type="text"
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value.toUpperCase().slice(0, 5))}
                      maxLength={5}
                      className="w-full bg-white/5 text-white px-4 py-3 rounded-xl border border-white/10 focus:border-amber-500 focus:outline-none uppercase tracking-widest text-xl font-bold text-center"
                      placeholder="WORDS"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">{newWord.length}/5 letters</p>
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-bold text-gray-400 mb-2">
                      Date (optional)
                    </label>
                    <input
                      type="date"
                      value={newWordDate}
                      onChange={(e) => setNewWordDate(e.target.value)}
                      className="w-full bg-white/5 text-white px-4 py-3 rounded-xl border border-white/10 focus:border-amber-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty for today</p>
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-bold text-gray-400 mb-2">
                      Hint (optional)
                    </label>
                    <input
                      type="text"
                      value={newWordHint}
                      onChange={(e) => setNewWordHint(e.target.value)}
                      className="w-full bg-white/5 text-white px-4 py-3 rounded-xl border border-white/10 focus:border-amber-500 focus:outline-none"
                      placeholder="A clue for players..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={newWord.length !== 5}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span>Set Wordle Word</span>
                </button>
              </form>
            </div>

            {/* Recent Words */}
            <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span>Recent Daily Words</span>
                </h2>
              </div>

              {wordleWords.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No words set yet. Add a word above!
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {wordleWords.map((word) => (
                    <div key={word._id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                          {word.word.split('').map((letter, i) => (
                            <span
                              key={i}
                              className="w-9 h-9 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-400 font-bold text-base"
                            >
                              {letter}
                            </span>
                          ))}
                        </div>
                        <div>
                          <p className="text-white text-sm font-semibold">
                            {new Date(word.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          {word.hint && (
                            <p className="text-gray-400 text-xs">💡 {word.hint}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteWord(word._id)}
                        className="p-2 text-gray-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;