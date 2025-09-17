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
        
        // Cập nhật conversation cho người gửi (last_message, đẩy lên đầu, reset unread_count)
        setConversations(prev => {
          const idx = prev.findIndex(c => c.conversation_id === currentConversation.conversation_id);
          if (idx === -1) return prev.slice();
          const updated = { ...prev[idx] };
          updated.last_message = optimisticMessage;
          updated.last_message_time = optimisticMessage.created_at;
          updated.unread_count = 0;
          // Tạo mảng mới để React nhận biết thay đổi
          const newList = [updated, ...prev.filter((_, i) => i !== idx)];
          return [...newList];
        });
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
  }, [currentConversation, sendingMessage, isConnected, sendMessage, user]);

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
        // Find the latest message not sent by the current user
        const latestMsg = messages
          .filter(msg => msg.sender_id !== user?.user_id)
          .slice(-1)[0];
        if (latestMsg) {
          markMessageAsRead(currentConversation.conversation_id, latestMsg.message_id);
        }
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
      // Leave current conversation (nếu có)
      if (currentConversationRef.current) {
        console.log('[useChat] Leaving conversation:', currentConversationRef.current);
        leaveConversation(currentConversationRef.current);
      }

      // Join new conversation room trước khi load messages để đảm bảo nhận realtime
      console.log('[useChat] Joining conversation:', convId);
      joinConversation(convId);

      // Load new conversation
      const conversation = await chatService.getConversationById(convId);
      setCurrentConversation(conversation);
      currentConversationRef.current = convId;
      console.log('[useChat] Set currentConversationRef:', convId);

      // Load messages
      await loadMessages(convId);
      console.log('[useChat] Loaded messages for:', convId);

      // Mark as read
      await markAsRead();
      console.log('[useChat] Marked as read:', convId);

    } catch (error) {
      setError(error.message);
      console.error('[useChat] Error switching conversation:', error);
    }
  }, [isConnected, leaveConversation, joinConversation, loadMessages, markAsRead]);

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
      console.log('[useChat] socket_new_message event received:', event);
      const { message, conversationId } = event.detail;
      // Ensure message always has is_read, read_by, read_at fields to prevent FE crash
      const safeMessage = {
        is_read: false,
        read_by: [],
        read_at: null,
        ...message
      };
      console.log('[useChat] handleNewMessage:', { conversationId, current: currentConversationRef.current, safeMessage });
      if (String(conversationId) === String(currentConversationRef.current)) {
        setMessages(prev => {
          // Nếu đã có message_id này thì không thêm nữa (tránh double)
          if (prev.some(msg => msg.message_id === safeMessage.message_id)) {
            return prev;
          }
          // Remove only the first optimistic message that matches content, sender, type, and created_at close to real message
          let removed = false;
          const filtered = prev.filter(msg => {
            if (
              !removed &&
              String(msg.message_id).startsWith('tmp-') &&
              msg.content === safeMessage.content &&
              (msg.sender_id === safeMessage.sender_id || msg.sender_id === safeMessage.senderId) &&
              msg.message_type === safeMessage.message_type
            ) {
              // Compare created_at within 10s window
              const optimisticTime = new Date(msg.created_at).getTime();
              const realTime = new Date(safeMessage.created_at).getTime();
              if (Math.abs(optimisticTime - realTime) < 10000) {
                removed = true;
                return false;
              }
            }
            return true;
          });
          return [...filtered, safeMessage];
        });
        console.log('[useChat] Added new message to UI:', safeMessage);
        // Cập nhật conversation trong danh sách (last message, unread, đẩy lên đầu)
        setConversations(prev => {
          const idx = prev.findIndex(c => c.conversation_id === conversationId);
          if (idx === -1) return prev.slice();
          const updated = { ...prev[idx] };
          updated.last_message = safeMessage;
          updated.last_message_time = safeMessage.created_at;
          if (safeMessage.sender_id !== user?.user_id) {
            updated.unread_count = (updated.unread_count || 0) + 1;
          }
          const newList = [updated, ...prev.filter((_, i) => i !== idx)];
          return [...newList];
        });
      } else {
        console.log('[useChat] Message for other conversation, ignored:', conversationId);
        // Nếu là conversation khác, vẫn cần cập nhật last_message và unread_count
        setConversations(prev => {
          const idx = prev.findIndex(c => c.conversation_id === conversationId);
          if (idx === -1) return prev.slice();
          const updated = { ...prev[idx] };
          updated.last_message = safeMessage;
          updated.last_message_time = safeMessage.created_at;
          updated.unread_count = (updated.unread_count || 0) + 1;
          const newList = [updated, ...prev.filter((_, i) => i !== idx)];
          return [...newList];
        });
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
    console.log('[useChat] Adding socket_new_message event listener');
    window.addEventListener('socket_new_message', handleNewMessage);
    window.addEventListener('socket_user_typing', handleUserTyping);
    window.addEventListener('socket_message_read', handleMessageRead);

    return () => {
      console.log('[useChat] Removing socket_new_message event listener');
      window.removeEventListener('socket_new_message', handleNewMessage);
      window.removeEventListener('socket_user_typing', handleUserTyping);
      window.removeEventListener('socket_message_read', handleMessageRead);
    };
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Switch to conversation if provided, but prevent redundant calls
  const lastSwitchedConvIdRef = useRef(null);
  useEffect(() => {
    if (
      conversationId && 
      conversationId !== currentConversationRef.current && 
      !loading &&
      lastSwitchedConvIdRef.current !== conversationId
    ) {
      lastSwitchedConvIdRef.current = conversationId;
      console.log('[useChat] Effect switchConversation:', conversationId);
      switchConversation(conversationId);
    }
  }, [conversationId, loading, switchConversation]);

  // Fallback: nếu mở trực tiếp URL và conversations rỗng -> load thẳng convId
  useEffect(() => {
    if (conversationId && !currentConversation) {
      if (conversations.length === 0 && !loading) {
        console.log('[useChat] Fallback: switchConversation by URL', conversationId);
        switchConversation(conversationId);
      }
    }
  }, [conversationId, conversations, currentConversation, loading, switchConversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentConversationRef.current) {
        leaveConversation(currentConversationRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

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
    
    messagesEndRef,
    getTypingUsers: () => getTypingUsers(currentConversation?.conversation_id),
    isUserOnline
  };
};
