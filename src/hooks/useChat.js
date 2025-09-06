import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import chatService from '../services/chatService';

export const useChat = (conversationId = null) => {
  const { user } = useAuth();
  const { 
    isConnected, 
    joinConversation, 
    leaveConversation, 
    sendMessage, 
    startTyping, 
    stopTyping, 
    markMessageAsRead,
    getTypingUsers,
    isUserOnline
  } = useSocket();

  // State management
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentConversationRef = useRef(conversationId);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load conversations
  const loadConversations = useCallback(async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      const response = await chatService.getConversations(page, limit);
      setConversations(response.conversations || []);
      return response;
    } catch (error) {
      // Nếu backend chưa có bảng/dữ liệu, coi như danh sách rỗng để UI hiển thị trạng thái trống
      setConversations([]);
      // Không hiển thị lỗi phá UI trong trường hợp này
      setError(null);
      return { conversations: [], total: 0, page, limit };
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (convId, page = 1, limit = 50, beforeMessageId = null) => {
    try {
      setLoading(true);
      const response = await chatService.getMessages(convId, page, limit, beforeMessageId);
      
      if (page === 1) {
        setMessages(response.messages || []);
      } else {
        setMessages(prev => [...(response.messages || []), ...prev]);
      }
      
      setHasMoreMessages(response.hasMore || false);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!currentConversation || !hasMoreMessages || loading) return;
    
    const oldestMessage = messages[0];
    const beforeMessageId = oldestMessage?.message_id;
    
    await loadMessages(currentConversation.conversation_id, 1, 50, beforeMessageId);
  }, [currentConversation, hasMoreMessages, loading, messages, loadMessages]);

  // Send text message
  const sendTextMessage = useCallback(async (content, replyToMessageId = null) => {
    if (!currentConversation || !content.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);
      
      // Send via Socket.IO for real-time
      if (isConnected) {
        sendMessage(currentConversation.conversation_id, content.trim(), 'text', replyToMessageId);
        // Optimistic update: show message immediately
        const optimisticMessage = {
          message_id: `tmp-${Date.now()}`,
          conversation_id: currentConversation.conversation_id,
          sender_id: user?.user_id || user?.userId,
          sender: { name: user?.name, email: user?.email, avatar: user?.avatar },
          content: content.trim(),
          message_type: 'text',
          created_at: new Date().toISOString(),
          is_edited: false,
        };
        setMessages(prev => [...prev, optimisticMessage]);
        setTimeout(scrollToBottom, 50);
      } else {
        // Fallback to REST API
        await chatService.sendTextMessage(currentConversation.conversation_id, content.trim(), replyToMessageId);
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setSendingMessage(false);
    }
  }, [currentConversation, sendingMessage, isConnected, sendMessage, user, scrollToBottom]);

  // Send file message
  const sendFileMessage = useCallback(async (file, content = '', replyToMessageId = null) => {
    if (!currentConversation || !file || sendingMessage) return;

    try {
      setSendingMessage(true);
      await chatService.sendFileMessage(currentConversation.conversation_id, file, content, replyToMessageId);
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setSendingMessage(false);
    }
  }, [currentConversation, sendingMessage]);

  // Update message
  const updateMessage = useCallback(async (messageId, content) => {
    try {
      await chatService.updateMessage(messageId, content);
      setMessages(prev => prev.map(msg => 
        msg.message_id === messageId ? { ...msg, content, is_edited: true } : msg
      ));
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Delete message
  const deleteMessage = useCallback(async (messageId) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.message_id !== messageId));
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Mark messages as read
  // Simple client-side throttle to avoid spamming server
  const lastReadRef = useRef(0);
  const markAsRead = useCallback(async () => {
    if (!currentConversation) return;

    const now = Date.now();
    if (now - lastReadRef.current < 5000) return; // at most once per 5s
    lastReadRef.current = now;

    try {
      if (isConnected) {
        markMessageAsRead(currentConversation.conversation_id);
      } else {
        await chatService.markMessagesAsRead(currentConversation.conversation_id);
      }
    } catch (error) {
      console.error('Lỗi đánh dấu đã đọc:', error);
    }
  }, [currentConversation, isConnected, markMessageAsRead]);

  // Handle typing
  const handleTyping = useCallback((isTyping) => {
    if (!currentConversation || !isConnected) return;

    if (isTyping) {
      startTyping(currentConversation.conversation_id);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(currentConversation.conversation_id);
      }, 3000);
    } else {
      stopTyping(currentConversation.conversation_id);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, [currentConversation, isConnected, startTyping, stopTyping]);

  // Switch conversation
  const switchConversation = useCallback(async (convId) => {
    if (convId === currentConversationRef.current) return;

    try {
      // Leave current conversation
      leaveConversation(currentConversationRef.current);

      // Load new conversation
      const conversation = await chatService.getConversationById(convId);
      setCurrentConversation(conversation);
      currentConversationRef.current = convId;

      // Load messages
      await loadMessages(convId);

      // Join new conversation room immediately (queue if socket reconnecting)
      joinConversation(convId);

      // Mark as read
      await markAsRead();

      // Scroll to bottom
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      setError(error.message);
    }
  }, [isConnected, leaveConversation, joinConversation, loadMessages, markAsRead, scrollToBottom]);

  // Create new conversation
  const createConversation = useCallback(async (type, participants, title = null) => {
    try {
      let conversation;
      if (type === 'direct') {
        conversation = await chatService.createDirectConversation(participants[0]);
      } else {
        conversation = await chatService.createGroupConversation(title, participants);
      }
      
      setConversations(prev => [conversation, ...prev]);
      return conversation;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Socket event handlers
  useEffect(() => {
    const handleNewMessage = (event) => {
      const { message, conversationId } = event.detail;
      
      if (conversationId === currentConversationRef.current) {
        setMessages(prev => [...prev, message]);
        setTimeout(scrollToBottom, 100);
      }
    };

    const handleUserTyping = (event) => {
      const { conversationId, userId, userName, isTyping } = event.detail;
      
      if (conversationId === currentConversationRef.current) {
        setTypingUsers(prev => {
          if (isTyping) {
            return [...prev.filter(u => u.userId !== userId), { userId, userName }];
          } else {
            return prev.filter(u => u.userId !== userId);
          }
        });
      }
    };

    const handleMessageRead = (event) => {
      const { conversationId, userId } = event.detail;
      
      if (conversationId === currentConversationRef.current) {
        // Update read status for messages
        setMessages(prev => prev.map(msg => ({
          ...msg,
          read_by: msg.read_by || [],
          read_at: msg.read_at || new Date()
        })));
      }
    };

    // Add event listeners
    window.addEventListener('socket_new_message', handleNewMessage);
    window.addEventListener('socket_user_typing', handleUserTyping);
    window.addEventListener('socket_message_read', handleMessageRead);

    return () => {
      window.removeEventListener('socket_new_message', handleNewMessage);
      window.removeEventListener('socket_user_typing', handleUserTyping);
      window.removeEventListener('socket_message_read', handleMessageRead);
    };
  }, [scrollToBottom]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Switch to conversation if provided
  useEffect(() => {
    if (conversationId && conversationId !== currentConversationRef.current) {
      switchConversation(conversationId);
    }
  }, [conversationId, switchConversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentConversationRef.current && isConnected) {
        leaveConversation(currentConversationRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isConnected, leaveConversation]);

  return {
    // State
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    hasMoreMessages,
    typingUsers,
    sendingMessage,
    isConnected,
    
    // Actions
    loadConversations,
    loadMessages,
    loadMoreMessages,
    sendTextMessage,
    sendFileMessage,
    updateMessage,
    deleteMessage,
    markAsRead,
    handleTyping,
    switchConversation,
    createConversation,
    
    // Utils
    scrollToBottom,
    messagesEndRef,
    getTypingUsers: () => getTypingUsers(currentConversation?.conversation_id),
    isUserOnline
  };
};
