import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import './Chat.css';

const ChatWindow = ({
  conversation,
  messages,
  typingUsers,
  sendingMessage,
  hasMoreMessages,
  onSendMessage,
  onSendFile,
  onUpdateMessage,
  onDeleteMessage,
  onMarkAsRead,
  onTyping,
  onLoadMore,
  scrollToBottom,
  messagesEndRef,
  isConnected
}) => {
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesContainerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isNearBottom && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, isNearBottom, scrollToBottom]);

  // Mark messages as read when conversation changes
  useEffect(() => {
    if (conversation && onMarkAsRead) {
      onMarkAsRead();
    }
  }, [conversation?.conversation_id, onMarkAsRead]);

  // Handle scroll events
  const handleScroll = (e) => {
    const container = e.target;
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Check if user is near bottom
    const nearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsNearBottom(nearBottom);
    setShowScrollToBottom(!nearBottom && messages.length > 10);

    // Load more messages when scrolling to top
    if (scrollTop === 0 && hasMoreMessages && !sendingMessage) {
      onLoadMore();
    }
  };

  // Handle scroll to bottom button click
  const handleScrollToBottom = () => {
    scrollToBottom();
    setShowScrollToBottom(false);
    setIsNearBottom(true);
  };

  // Handle message send
  const handleSendMessage = async (content, replyToMessageId = null) => {
    try {
      await onSendMessage(content, replyToMessageId);
      // Auto-scroll to bottom after sending
      setTimeout(() => {
        scrollToBottom();
        setIsNearBottom(true);
        setShowScrollToBottom(false);
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle file send
  const handleSendFile = async (file, content = '') => {
    try {
      await onSendFile(file, content);
      // Auto-scroll to bottom after sending
      setTimeout(() => {
        scrollToBottom();
        setIsNearBottom(true);
        setShowScrollToBottom(false);
      }, 100);
    } catch (error) {
      console.error('Failed to send file:', error);
    }
  };

  // Handle typing
  const handleTyping = (isTyping) => {
    if (onTyping) {
      onTyping(isTyping);
    }
  };

  // Get conversation title for display
  const getConversationTitle = () => {
    if (conversation.title) return conversation.title;
    
    if (conversation.type === 'direct' && conversation.participants?.length > 0) {
      return conversation.participants[0].name || conversation.participants[0].email;
    }
    
    if (conversation.participants?.length > 0) {
      const names = conversation.participants
        .slice(0, 3)
        .map(p => p.name || p.email)
        .join(', ');
      return conversation.participants.length > 3 
        ? `${names} và ${conversation.participants.length - 3} người khác`
        : names;
    }
    
    return 'Cuộc trò chuyện';
  };

  return (
    <div className="chat-window">
      {/* Connection Status */}
      {!isConnected && (
        <div className="connection-warning">
          <div className="alert alert-warning d-flex align-items-center" role="alert">
            <i className="fas fa-wifi me-2"></i>
            <span>Mất kết nối. Đang thử kết nối lại...</span>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div 
        className="messages-container"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {/* Load More Button */}
        {hasMoreMessages && (
          <div className="load-more-container">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={onLoadMore}
              disabled={sendingMessage}
            >
              {sendingMessage ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Đang tải...
                </>
              ) : (
                <>
                  <i className="fas fa-chevron-up me-2"></i>
                  Tải thêm tin nhắn
                </>
              )}
            </button>
          </div>
        )}

        {/* Messages List */}
        <MessageList
          messages={messages}
          conversation={conversation}
          onUpdateMessage={onUpdateMessage}
          onDeleteMessage={onDeleteMessage}
        />

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator
            typingUsers={typingUsers}
            conversation={conversation}
          />
        )}

        {/* Scroll to Bottom Reference */}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <button
          className="scroll-to-bottom-btn"
          onClick={handleScrollToBottom}
          title="Cuộn xuống dưới"
        >
          <i className="fas fa-chevron-down"></i>
        </button>
      )}

      {/* Message Input */}
      <div className="message-input-container">
        <MessageInput
          onSendMessage={handleSendMessage}
          onSendFile={handleSendFile}
          onTyping={handleTyping}
          disabled={!isConnected}
          placeholder={`Nhập tin nhắn cho ${getConversationTitle()}...`}
        />
      </div>
    </div>
  );
};

export default ChatWindow;
