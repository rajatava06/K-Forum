import express from 'express';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { auth } from '../middleware/auth.js';
import { filterProfanity } from '../services/profanityFilter.js';
import User from '../models/User.js';

const router = express.Router();

// Get all conversations for current user
router.get('/conversations', auth, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.userId
        })
            .populate('participants', 'name avatar studentId')
            .sort({ 'lastMessage.timestamp': -1 });

        // Enrich conversations with connection count data
        const enrichedConversations = await Promise.all(conversations.map(async (conv) => {
            const otherParticipant = conv.participants.find(p => p._id.toString() !== req.userId);
            const userDoc = await User.findById(otherParticipant._id).select('connections');
            
            return {
                ...conv.toObject(),
                otherUser: otherParticipant,
                connectionCount: userDoc?.connections?.length || 0
            };
        }));

        res.json(enrichedConversations);
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get messages for a conversation
router.get('/:conversationId/messages', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            conversationId: req.params.conversationId
        })
            .populate('sender', 'name avatar')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send a message
router.post('/:conversationId/messages', auth, async (req, res) => {
    try {
        let { content } = req.body;
        const { conversationId } = req.params;

        // Filter profanity from message
        const cleanContent = filterProfanity(content);

        const newMessage = new Message({
            conversationId,
            sender: req.userId,
            content: cleanContent
        });

        await newMessage.save();

        // Update conversation last message
        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: {
                content: cleanContent,
                sender: req.userId,
                timestamp: new Date()
            }
        });

        const populatedMessage = await newMessage.populate('sender', 'name avatar');

        res.json(populatedMessage);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;