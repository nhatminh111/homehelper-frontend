import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import './Chat.css';

const MessageItem = ({
  message,
  conversation,
  showTimestamp = true,
  showAvatar = true,
  showSenderName = true,
  isEditing = false,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onReply
}) => {
  const { user } = useAuth();

  const [editContent, setEditContent] = useState(message.content);
  const [showMenu, setShowMenu] = useState(false);
  
  const messageRef = useRef(null);
  const editInputRef = useRef(null);
  const menuRef = useRef(null);

  // Focus edit input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  // Handle click outside menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentUserId = user?.user_id || user?.userId;
  const isOwnMessage = message.sender_id === currentUserId;
  const isTemporary = typeof message.message_id === 'string' && message.message_id.startsWith('tmp-');
  // Resolve sender info: prefer message.sender, fallback to participant lookup
  const resolvedSender = (() => {
    if (isOwnMessage) {
      return { name: user?.name || 'Bạn', avatar: user?.avatar };
    }
    const fromParticipants = conversation?.participants?.find(p => p.user_id === message.sender_id);
    return fromParticipants || message.sender || null;
  })();

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const hasTimeZone = typeof dateString === 'string' && /Z$|[+-]\d{2}:?\d{2}$/.test(dateString);
    if (hasTimeZone) {
      const hh = String(date.getUTCHours()).padStart(2, '0');
      const mm = String(date.getUTCMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return format(date, 'HH:mm', { locale: vi });
  };

  const handleMouseLeave = () => {
    setShowMenu(false);
  };

  const handleEdit = () => {
    setEditContent(message.content);
    onEdit(message);
    setShowMenu(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    onCancelEdit();
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent.trim() !== message.content) {
      onSaveEdit(message.message_id, editContent.trim());
    } else {
      handleCancelEdit();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDelete = () => {
    onDelete(message.message_id);
    setShowMenu(false);
  };


  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
    // TODO: Show toast notification
  };

  const getMessageTypeIcon = () => {
    switch (message.message_type) {
      case 'image':
        return 'fas fa-image';
      case 'file':
        return 'fas fa-file';
      case 'video':
        return 'fas fa-video';
      case 'audio':
        return 'fas fa-microphone';
      default:
        return null;
    }
  };

  const renderMessageContent = () => {
    if (isEditing) {
      return (
        <div className="message-edit">
          <textarea
            ref={editInputRef}
            className="edit-textarea"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
          />
          <div className="edit-actions">
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSaveEdit}
              disabled={!editContent.trim()}
            >
              <i className="fa-solid fa-check"></i>
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleCancelEdit}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      );
    }

    if (message.message_type === 'image') {
      return (
        <div className="message-image">
          <img
            src={message.file_url}
            alt="Hình ảnh"
            className="image-content"
            loading="lazy"
          />
          {message.content && (
            <div className="image-caption">{message.content}</div>
          )}
        </div>
      );
    }

    if (message.message_type === 'file') {
      return (
        <div className="message-file">
          <div className="file-info">
            <i className="fa-regular fa-file-lines file-icon"></i>
            <div className="file-details">
              <div className="file-name">{message.file_name}</div>
              <div className="file-size">{formatFileSize(message.file_size)}</div>
            </div>
            <a
              href={message.file_url}
              download={message.file_name}
              className="btn btn-sm btn-outline-primary"
            >
              <i className="fa-solid fa-download"></i>
            </a>
          </div>
          {message.content && (
            <div className="file-caption">{message.content}</div>
          )}
        </div>
      );
    }

    return (
      <div className="message-text">
        {message.content}
        {message.is_edited && (
          <span className="edited-indicator" title="Đã chỉnh sửa">
            (đã sửa)
          </span>
        )}
      </div>
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      ref={messageRef}
      className={`message-item ${isOwnMessage ? 'own-message' : 'other-message'}`}
      onMouseLeave={handleMouseLeave}
    >
      {/* Avatar */}
      {!isOwnMessage && showAvatar && (
        <div className="message-avatar">
          {resolvedSender?.avatar ? (
            <img
              src={resolvedSender.avatar}
              alt={resolvedSender.name || 'User'}
              className="avatar-img"
            />
          ) : (
            <div className="avatar-initials">
              {resolvedSender?.name ? resolvedSender.name.charAt(0).toUpperCase() : '?'}
            </div>
          )}
        </div>
      )}
      {/* Keep alignment when avatar is hidden for consecutive messages */}
      {!isOwnMessage && !showAvatar && (
        <div className="message-avatar-spacer"></div>
      )}

      {/* Message Content */}
      <div className="message-content">
        {/* Sender Name */}
        {!isOwnMessage && showSenderName && (
          <div className="sender-name">
            {resolvedSender?.name || 'Người dùng'}
          </div>
        )}

        {/* Message Bubble */}
        <div className="message-bubble">

          {/* Message Content */}
          {renderMessageContent()}

          {/* More Menu */}
          <div className="message-menu" ref={menuRef}>
            <button
              className="menu-btn"
              onClick={() => setShowMenu(!showMenu)}
              title="Thêm tùy chọn"
            >
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </button>

            {showMenu && (
              <div className="menu-dropdown">
                <button className="menu-item" onClick={handleCopyMessage}>
                  <i className="fa-solid fa-copy me-2"></i>
                  Sao chép
                </button>
                {isOwnMessage && !isTemporary && (
                  <>
                    <button className="menu-item" onClick={handleEdit}>
                      <i className="fa-solid fa-pen me-2"></i>
                      Chỉnh sửa
                    </button>
                    <div className="menu-divider"></div>
                    <button className="menu-item text-danger" onClick={handleDelete}>
                      <i className="fa-solid fa-trash me-2"></i>
                      Xóa
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Timestamp */}
        {showTimestamp && (
          <div className="message-timestamp">
            {formatMessageTime(message.created_at)}
            {message.is_edited && (
              <span className="edited-indicator" title="Đã chỉnh sửa">
                (đã sửa)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Spacer for own messages */}
      {isOwnMessage && <div className="message-spacer"></div>}
    </div>
  );
};

export default MessageItem;
