import React, { useState, useEffect } from 'react';
import axios from '../services/axiosSetup';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Send, User } from 'lucide-react';
import toast from 'react-hot-toast';

const Messages = () => {
    const { user: currentUser } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            const response = await axios.get('/api/messages/conversations');
            setConversations(response.data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId) => {
        try {
            const response = await axios.get(`/api/messages/${conversationId}/messages`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSelectConversation = (conv) => {
        setSelectedConv(conv);
        fetchMessages(conv._id);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConv) return;

        try {
            const response = await axios.post(`/api/messages/${selectedConv._id}/messages`, {
                content: newMessage
            });
            setMessages([...messages, response.data]);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#17d059]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-bold text-white mb-6">Chat</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[70vh]">
                    {/* Conversations List */}
                    <div className="md:col-span-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-y-auto">
                        {conversations.length === 0 ? (
                            <div className="p-6 text-center">
                                <MessageCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">No conversations yet</p>
                                <p className="text-gray-500 text-xs mt-1">Connect with buddies to start chatting</p>
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <button
                                    key={conv._id}
                                    onClick={() => handleSelectConversation(conv)}
                                    className={`w-full flex items-center gap-3 p-4 border-b border-white/5 hover:bg-white/5 transition-colors text-left ${
                                        selectedConv?._id === conv._id ? 'bg-white/10' : ''
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#17d059] to-emerald-600 flex items-center justify-center overflow-hidden shrink-0">
                                        {conv.otherUser?.avatar ? (
                                            <img src={conv.otherUser.avatar} alt={conv.otherUser.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5 text-white" />
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-semibold text-white truncate">{conv.otherUser?.name || 'Unknown'}</p>
                                        <p className="text-xs text-gray-400 truncate">
                                            {conv.lastMessage?.content || 'No messages yet'}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Messages Panel */}
                    <div className="md:col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col">
                        {!selectedConv ? (
                            <div className="flex-1 flex items-center justify-center">
                                <p className="text-gray-400">Select a conversation to start chatting</p>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="p-4 border-b border-white/10 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#17d059] to-emerald-600 flex items-center justify-center overflow-hidden">
                                        {selectedConv.otherUser?.avatar ? (
                                            <img src={selectedConv.otherUser.avatar} alt={selectedConv.otherUser.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                    <p className="font-semibold text-white">{selectedConv.otherUser?.name}</p>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {messages.length === 0 ? (
                                        <p className="text-center text-gray-500 text-sm">No messages yet. Say hi!</p>
                                    ) : (
                                        messages.map((msg) => {
                                            const isOwn = msg.sender._id === (currentUser.id || currentUser._id);
                                            return (
                                                <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                                                        isOwn
                                                            ? 'bg-[#17d059] text-white rounded-br-sm'
                                                            : 'bg-gray-700 text-white rounded-bl-sm'
                                                    }`}>
                                                        <p className="text-sm">{msg.content}</p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Input */}
                                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-xl border border-gray-600 focus:border-[#17d059] focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-[#17d059] text-white p-2 rounded-xl hover:bg-[#15b84f] transition-colors"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Messages;