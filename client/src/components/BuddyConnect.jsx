import React, { useState, useEffect } from 'react';
import axios from '../services/axiosSetup';
import { UserPlus, UserCheck, Users, Check, X, Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';

const BuddyConnect = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sentRequests, setSentRequests] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch suggestions and requests independently so one failure doesn't block the other
            const [sugRes, reqRes] = await Promise.allSettled([
                axios.get('/api/users/suggestions'),
                axios.get('/api/users/requests')
            ]);

            let suggestionData = sugRes.status === 'fulfilled' ? (sugRes.value.data || []) : [];
            const requestData = reqRes.status === 'fulfilled' ? (reqRes.value.data || []) : [];

            // If suggestions came back empty (mock fallback or genuinely empty), fetch all users
            if (suggestionData.length === 0) {
                try {
                    const allRes = await axios.get('/api/users/all-users');
                    suggestionData = allRes.data || [];
                } catch (e) {
                    console.error('Error fetching all users:', e);
                }
            }

            setSuggestions(suggestionData);
            setRequests(requestData);
        } catch (error) {
            console.error('Error fetching buddy data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (userId) => {
        try {
            await axios.post(`/api/users/connect/${userId}`);
            setSentRequests([...sentRequests, userId]);
            toast.success('Connection request sent!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send request');
        }
    };

    const handleAccept = async (userId) => {
        try {
            await axios.post(`/api/users/connect/${userId}/accept`);
            setRequests(requests.filter(r => r._id !== userId));
            toast.success('Connection accepted! Check your messages.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to accept request');
        }
    };

    const handleReject = async (userId) => {
        try {
            await axios.post(`/api/users/connect/${userId}/reject`);
            setRequests(requests.filter(r => r._id !== userId));
            toast.success('Connection request declined');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to decline request');
        }
    };

    const getBranchAbbreviation = (branch) => {
        const branchMap = {
            'Computer Science Engineering': 'CSE',
            'Information Technology': 'IT',
            'Electronics and Communication': 'ECE',
            'Mechanical Engineering': 'ME',
            'Civil Engineering': 'CE',
            'Electrical Engineering': 'EE',
            'Biotechnology': 'Biotech',
            'Other': 'Other'
        };
        return branchMap[branch] || branch;
    };

    if (loading) return (
        <div className="glass-panel rounded-3xl p-6 mt-6 animate-pulse">
            <div className="h-6 w-32 bg-white/5 rounded mb-4"></div>
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5"></div>
                        <div className="space-y-2">
                            <div className="h-3 w-24 bg-white/5 rounded"></div>
                            <div className="h-2 w-16 bg-white/5 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );


    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Incoming Requests Section */}
            {requests.length > 0 && (
                <div className="glass-panel rounded-3xl p-5 mt-6 w-full border border-emerald-500/20">
                    <h3 className="flex items-center gap-2 font-bold text-white mb-4">
                        <Bell className="w-5 h-5 text-emerald-400" />
                        Connection Requests
                        <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {requests.length}
                        </span>
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
                        {requests.map(user => (
                            <div key={user._id} className="flex items-center justify-between min-h-[44px] hover:bg-white/5 p-2 rounded-2xl transition-colors">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                        alt={user.name}
                                        className="w-10 h-10 rounded-full border border-gray-700 object-cover"
                                    />
                                    <div className="overflow-hidden">
                                        <h4 className="text-sm font-bold text-gray-200 truncate w-24 lg:w-32">{user.name}</h4>
                                        <p className="text-xs text-emerald-400 truncate">{getBranchAbbreviation(user.branch)} • {user.year} Yr</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => handleAccept(user._id)}
                                        className="p-2 rounded-xl transition-all duration-300 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                                        title="Accept"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleReject(user._id)}
                                        className="p-2 rounded-xl transition-all duration-300 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white"
                                        title="Decline"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Suggestions Section */}
            <div className="glass-panel rounded-3xl p-5 mt-6 w-full">
                <h3 className="flex items-center gap-2 font-bold text-white mb-4">
                    <Users className="w-5 h-5 text-emerald-400" />
                    Find Buddies
                </h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar">
                    {suggestions.map(user => (
                        <div key={user._id} className="flex items-center relative group min-h-[44px] hover:bg-white/5 p-2 rounded-2xl transition-colors">
                            <div className="flex items-center gap-3 pr-12">
                                <div className="relative shrink-0">
                                    <img
                                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                        alt={user.name}
                                        className="w-10 h-10 rounded-full border border-gray-700 object-cover"
                                    />
                                    {sentRequests.includes(user._id) && (
                                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-[#0f1115]">
                                            <UserCheck className="w-2 h-2 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <h4 className="text-sm font-bold text-gray-200 truncate w-28 lg:w-32">{user.name}</h4>
                                    <p className="text-xs text-gray-500 truncate">{getBranchAbbreviation(user.branch)} • {user.year} Yr</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleConnect(user._id)}
                                disabled={sentRequests.includes(user._id)}
                                className={`
                                    absolute right-2 top-1/2 -translate-y-1/2
                                    p-2 rounded-xl transition-all duration-300
                                    ${sentRequests.includes(user._id)
                                        ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                                        : 'bg-white/5 text-gray-400 hover:bg-gradient-to-br hover:from-emerald-500 hover:to-teal-400 hover:text-white'
                                    }
                                `}
                                title={sentRequests.includes(user._id) ? "Request Sent" : "Connect"}
                            >
                                {sentRequests.includes(user._id) ? (
                                    <UserCheck className="w-4 h-4" />
                                ) : (
                                    <UserPlus className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BuddyConnect;
