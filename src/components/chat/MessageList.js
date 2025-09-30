import React, { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import MessageItem from './MessageItem';
import './Chat.css';

const MessageList = ({
  messages,
  conversation,
  onUpdateMessage,
  onDeleteMessage
}) => {
  // Log dữ liệu messages để kiểm tra created_at
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message, index) => {
    // Group theo ngày UTC để không bị lệch ngày khi dữ liệu là ISO UTC
    const messageDate = new Date(message.created_at);
    // Lấy yyyy-MM-dd theo UTC
    const dateKey = messageDate.toISOString().slice(0, 10);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push({
      ...message,
      index
    });
    return groups;
  }, {});

  // Format date header
  const formatDateHeader = (dateString) => {

    const [year, month, day] = dateString.split('-');
    const date = new Date(Date.UTC(year, month - 1, day));
    const today = new Date();
    const todayYMD = today.toISOString().slice(0, 10);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayYMD = yesterday.toISOString().slice(0, 10);
    if (dateString === todayYMD) {
      return 'Hôm nay';
    } else if (dateString === yesterdayYMD) {
      return 'Hôm qua';
    } else {
      return format(date, 'EEEE, dd/MM/yyyy', { locale: vi });
    }
  };

  // Check if message should show timestamp
  const shouldShowTimestamp = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    const currentTime = new Date(currentMessage.created_at);
    const previousTime = new Date(previousMessage.created_at);
    const timeDiff = currentTime - previousTime;
    
    // Show timestamp if more than 5 minutes apart
    return timeDiff > 5 * 60 * 1000;
  };

  // Check if message should show avatar (on the LAST message of a consecutive block)
  const shouldShowAvatar = (currentMessage, nextMessage) => {
    if (!nextMessage) return true;

    // Show avatar if next message is different sender or spaced > 5 minutes
    return currentMessage.sender_id !== nextMessage.sender_id ||
           new Date(nextMessage.created_at) - new Date(currentMessage.created_at) > 5 * 60 * 1000;
  };

  // Check if message should show sender name
  const shouldShowSenderName = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    // Show sender name if different sender or more than 5 minutes apart
    return currentMessage.sender_id !== previousMessage.sender_id ||
           new Date(currentMessage.created_at) - new Date(previousMessage.created_at) > 5 * 60 * 1000;
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
  };

  const handleSaveEdit = async (messageId, newContent) => {
    try {
      await onUpdateMessage(messageId, newContent);
      setEditingMessage(null);
    } catch (error) {
      console.error('Failed to update message:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) {
      try {
        await onDeleteMessage(messageId);
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    }
  };

  const handleReplyToMessage = (message) => {
    setReplyingToMessage(message);
  };

  const handleCancelReply = () => {
    setReplyingToMessage(null);
  };

  if (messages.length === 0) {
    return (
      <div className="message-list-empty">
        <div className="empty-content">
          <i className="fas fa-comments fa-3x text-muted mb-3"></i>
          <h5>Chưa có tin nhắn nào</h5>
          <p>Hãy bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn đầu tiên!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list">
      {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
        <div key={dateKey} className="message-date-group">
          {/* Date Header */}
          <div className="date-header">
            <span className="date-text">{formatDateHeader(dateKey)}</span>
          </div>

          {/* Messages for this date */}
          <div className="date-messages">
            {dateMessages.map((message, messageIndex) => {
              const previousMessage = messageIndex > 0 ? dateMessages[messageIndex - 1] : null;
              const nextMessage = messageIndex < dateMessages.length - 1 ? dateMessages[messageIndex + 1] : null;

              return (
                <MessageItem
                  key={message.message_id}
                  message={message}
                  conversation={conversation}
                  showTimestamp={shouldShowTimestamp(message, previousMessage)}
                  showAvatar={shouldShowAvatar(message, nextMessage)}
                  showSenderName={shouldShowSenderName(message, previousMessage)}
                  isEditing={editingMessage?.message_id === message.message_id}
                  isReplying={replyingToMessage?.message_id === message.message_id}
                  onEdit={handleEditMessage}
                  onCancelEdit={handleCancelEdit}
                  onSaveEdit={handleSaveEdit}
                  onDelete={handleDeleteMessage}
                  onReply={handleReplyToMessage}
                  onCancelReply={handleCancelReply}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
