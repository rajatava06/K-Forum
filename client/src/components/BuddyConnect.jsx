import React, { useState, useEffect } from 'react';
import axios from '../services/axiosSetup';
import { UserPlus, UserCheck, Users, MessageCircle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const BuddyConnect = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [userStats, setUserStats] = useState(null); 

  useEffect(() => {
    fetchSuggestions();
    fetchConnections();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get('/api/users/suggestions');
      setSuggestions(response.data);
      
      const sent = response.data
        .filter(user => user.requestSent)
        .map(user => user._id);
      setSentRequests(sent);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await axios.get('/api/users/connections');
      setConnections(response.data.connections || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const handleConnect = async (userId) => {
    try {
      await axios.post(`/api/users/connect/${userId}`);
      setSentRequests([...sentRequests, userId]);
      toast.success('Connection request sent! ');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  // ADD THIS FUNCTION
  const fetchUserStats = async (userId) => {
    try {
      const response = await axios.get(`/api/users/${userId}`);
      setUserStats({
        connectionCount: response.data.connectionCount || 0,
        acceptedCount: response.data.acceptedCount || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const openUserDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
    fetchUserStats(user._id); 
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

  if (suggestions.length === 0) return null;

  return (
    <>
      <div className="glass-panel rounded-3xl p-5 mt-6 w-full">
        <h3 className="flex items-center gap-2 font-bold text-white mb-4">
          <Users className="w-5 h-5 text-emerald-400" />
          Buddy Connect
        </h3>
        <div className="space-y-4">
          {suggestions.map(user => (
            <div key={user._id} className="flex items-center relative group min-h-[44px] hover:bg-white/5 p-2 rounded-lg transition-all">
              <div className="flex items-center gap-3 pr-12 flex-1">
                <div className="relative shrink-0">
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`}
                    alt={user.name}
                    className="w-10 h-10 rounded-full border border-gray-700 object-cover"
                  />
                  {sentRequests.includes(user._id) && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1">
                      <UserCheck className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                <div className="overflow-hidden cursor-pointer flex-1" onClick={() => openUserDetails(user)}>
                  <h4 className="text-sm font-bold text-gray-200 truncate w-28 lg:w-full hover:text-emerald-400">
                    {user.name}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">{getBranchAbbreviation(user.branch)} • {user.year}Y</p>
                </div>
              </div>
              <button
                onClick={() => handleConnect(user._id)}
                disabled={sentRequests.includes(user._id)}
                className={`
                  absolute right-0 top-1/2 -translate-y-1/2
                  p-2 rounded-xl transition-all duration-300
                  ${sentRequests.includes(user._id)
                    ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                    : 'bg-white/5 text-gray-400 hover:bg-emerald-500 hover:text-white'
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

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <img
                src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.name}`}
                alt={selectedUser.name}
                className="w-20 h-20 rounded-full border-2 border-emerald-400 object-cover"
              />
              <div>
                <h2 className="text-xl font-bold text-white">{selectedUser.name}</h2>
                <p className="text-sm text-gray-400">{getBranchAbbreviation(selectedUser.branch)} • Year {selectedUser.year}</p>
              </div>
            </div>

            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Connections</p>
                <p className="text-lg font-bold text-emerald-400">
                  {userStats?.connectionCount || 0}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Accepted</p>
                <p className="text-lg font-bold text-emerald-400">
                  {userStats?.acceptedCount || 0}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {sentRequests.includes(selectedUser._id) ? (
                <>
                  <button className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/20 text-emerald-400 py-2 rounded-lg font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Request Sent
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      handleConnect(selectedUser._id);
                      setShowModal(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-semibold transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    Send Request
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 py-2 rounded-lg font-semibold transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BuddyConnect;