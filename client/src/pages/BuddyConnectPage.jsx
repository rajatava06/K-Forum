import React, { useState, useEffect } from 'react';
import axios from '../services/axiosSetup';
import { Users, UserPlus, UserCheck, CheckCircle2, XCircle, MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import BuddyConnect from '../components/BuddyConnect';

const BuddyConnectPage = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [connections, setConnections] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [loadingConnections, setLoadingConnections] = useState(true);
    const [activeTab, setActiveTab] = useState('requests');

    useEffect(() => {
        fetchRequests();
        fetchConnections();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await axios.get('/api/users/requests');
            setRequests(res.data || []);
        } catch (err) {
            console.error('Error fetching requests:', err);
        } finally {
            setLoadingRequests(false);
        }
    };

    const fetchConnections = async () => {
        try {
            const res = await axios.get('/api/users/connections');
            setConnections(res.data.connections || []);
        } catch (err) {
            console.error('Error fetching connections:', err);
        } finally {
            setLoadingConnections(false);
        }
    };

    const handleAccept = async (userId) => {
        try {
            await axios.post(`/api/users/connect/${userId}/accept`);
            toast.success('🎉 Connection accepted! You can now chat.');
            setRequests(prev => prev.filter(r => r._id !== userId));
            fetchConnections();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to accept');
        }
    };

    const handleReject = async (userId) => {
        try {
            await axios.post(`/api/users/connect/${userId}/reject`);
            toast.success('Request rejected.');
            setRequests(prev => prev.filter(r => r._id !== userId));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reject');
        }
    };

    return (
        <div className="pb-8 pt-4 px-3 md:px-6 max-w-4xl mx-auto min-h-[calc(100vh-140px)]">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-6 text-center">
                Buddy Connect
            </h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-white/10">
                {[
                    { key: 'requests', label: 'Incoming Requests', badge: requests.length },
                    { key: 'connections', label: 'My Buddies', badge: connections.length },
                    { key: 'discover', label: 'Discover' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 ${
                            activeTab === tab.key
                                ? 'bg-emerald-500/20 text-emerald-400 border-b-2 border-emerald-400'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        {tab.label}
                        {tab.badge > 0 && (
                            <span className="bg-emerald-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Incoming Requests Tab */}
            {activeTab === 'requests' && (
                <div className="space-y-3">
                    {loadingRequests ? (
                        <div className="glass-panel rounded-2xl p-6 animate-pulse">
                            {[1, 2].map(i => (
                                <div key={i} className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-white/5" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-32 bg-white/5 rounded" />
                                        <div className="h-2 w-20 bg-white/5 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="glass-panel rounded-2xl p-10 text-center text-gray-400">
                            <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-semibold text-white mb-1">No pending requests</p>
                            <p className="text-sm">When someone sends you a request, it will appear here.</p>
                        </div>
                    ) : (
                        requests.map(requester => (
                            <div key={requester._id} className="glass-panel rounded-2xl p-4 flex items-center gap-4">
                                <img
                                    src={requester.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(requester.name)}&background=10b981&color=fff`}
                                    alt={requester.name}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/30 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white truncate">{requester.name}</h3>
                                    <p className="text-xs text-gray-400">
                                        {requester.branch || 'Student'} • Year {requester.year || '?'}
                                    </p>
                                    {requester.requestedAt && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {new Date(requester.requestedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => handleAccept(requester._id)}
                                        className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-xl font-semibold transition-all"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleReject(requester._id)}
                                        className="flex items-center gap-1.5 bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-400 text-sm px-4 py-2 rounded-xl font-semibold transition-all"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* My Connections Tab */}
            {activeTab === 'connections' && (
                <div className="space-y-3">
                    {loadingConnections ? (
                        <div className="glass-panel rounded-2xl p-6 animate-pulse">
                            {[1, 2].map(i => (
                                <div key={i} className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-white/5" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-32 bg-white/5 rounded" />
                                        <div className="h-2 w-20 bg-white/5 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : connections.length === 0 ? (
                        <div className="glass-panel rounded-2xl p-10 text-center text-gray-400">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-semibold text-white mb-1">No connections yet</p>
                            <p className="text-sm">Accept requests or discover people in the Discover tab.</p>
                        </div>
                    ) : (
                        connections.map(buddy => (
                            <div key={buddy._id} className="glass-panel rounded-2xl p-4 flex items-center gap-4">
                                <img
                                    src={buddy.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(buddy.name)}&background=10b981&color=fff`}
                                    alt={buddy.name}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/30 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white truncate">{buddy.name}</h3>
                                    <p className="text-xs text-gray-400">
                                        {buddy.branch || 'Student'} • Year {buddy.year || '?'}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                                        <span className="text-xs text-emerald-400">Connected</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/messages')}
                                    className="flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 text-sm px-4 py-2 rounded-xl font-semibold transition-all"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Chat
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Discover Tab */}
            {activeTab === 'discover' && (
                <div className="[&>div]:mt-0">
                    <BuddyConnect />
                </div>
            )}
        </div>
    );
};

export default BuddyConnectPage;
