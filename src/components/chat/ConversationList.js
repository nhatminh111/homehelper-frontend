import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow, formatDistance } from 'date-fns';
import { vi } from 'date-fns/locale';
import './Chat.css';

const ConversationList = ({
  conversations,
  currentConversation,
  searchQuery,
  onSearchChange,
  onConversationSelect,
  onCreateConversation,
  onRefresh,
  loading
}) => {
  const [sortBy, setSortBy] = useState('lastMessage'); // 'lastMessage', 'unread', 'alphabetical'
  const { user } = useAuth();
  const currentUserId = user?.user_id || user?.userId;

  // Sort conversations
  const sortedConversations = useMemo(() => {
    const sorted = [...conversations];
    
    switch (sortBy) {
      case 'unread':
        return sorted.sort((a, b) => {
          const aUnread = a.unread_count || 0;
          const bUnread = b.unread_count || 0;
          if (aUnread !== bUnread) return bUnread - aUnread;
          const aTime = a.last_message_time || a.last_message_at || a.updated_at || a.created_at;
          const bTime = b.last_message_time || b.last_message_at || b.updated_at || b.created_at;
          return new Date(bTime) - new Date(aTime);
        });
      case 'alphabetical':
        return sorted.sort((a, b) => {
          const aTitle = a.title || a.participants?.[0]?.name || '';
          const bTitle = b.title || b.participants?.[0]?.name || '';
          return aTitle.localeCompare(bTitle, 'vi');
        });
      case 'lastMessage':
      default:
        return sorted.sort((a, b) => {
          const aTime = a.last_message_time || a.last_message_at || a.updated_at || a.created_at;
          const bTime = b.last_message_time || b.last_message_at || b.updated_at || b.created_at;
          return new Date(bTime) - new Date(aTime);
        });
    }
  }, [conversations, sortBy]);

  const formatLastMessageTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      if (date > now) {
        // If timestamp is in the future (timezone mismatch), still show as past
        return `${formatDistance(date, now, { locale: vi })}`;
      }
      return formatDistanceToNow(date, { addSuffix: true, locale: vi });
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getConversationTitle = (conversation) => {
    if (conversation.title) return conversation.title;
    
    if (conversation.type === 'direct' && conversation.participants?.length > 0) {
      const other = conversation.participants.find(p => (p.user_id ?? p.userId) !== currentUserId) || conversation.participants[0];
      return other?.name || other?.email;
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

  const getConversationAvatar = (conversation) => {
    if (conversation.type === 'direct' && conversation.participants?.length > 0) {
      const other = conversation.participants.find(p => (p.user_id ?? p.userId) !== currentUserId) || conversation.participants[0];
      return other?.avatar;
    }
    
    // For group conversations, show first letter of title or first participant
    return null;
  };

  const getConversationSubtitle = (conversation) => {
    const last = conversation.last_message || conversation.lastMessage;
    if (last) {
      const sender = last.sender;
      const prefix = conversation.type === 'direct' ? '' : `${sender?.name || 'Ai đó'}: `;
      const content = last.content || last.text || last.message || '';
      const type = last.message_type || last.type;

      if (type === 'image') return `${prefix}📷 Hình ảnh`;
      if (type === 'file') return `${prefix}📎 Tệp đính kèm`;
      if (content) return `${prefix}${content}`;
    }

    // Fallbacks if backend provides flattened fields
    const flatContent = conversation.last_message_content || conversation.last_message_text || conversation.last_message_preview || '';
    if (flatContent) {
      if (conversation.type === 'direct') return flatContent;
      const senderName = conversation.last_message_sender_name;
      return `${senderName}: ${flatContent}`;
    }

    return conversation.type === 'direct' ? 'Bắt đầu cuộc trò chuyện' : 'Chưa có tin nhắn';
  };

  return (
    <div className="conversation-list">
      {/* Header */}
      <div className="conversation-header">
        <div className="conversation-title">
          <h5>Cuộc trò chuyện</h5>
          <div className="conversation-actions">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={onRefresh}
              disabled={loading}
              title="Làm mới"
            >
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={onCreateConversation}
              title="Tạo cuộc trò chuyện mới"
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="conversation-search">
          <div className="input-group">
            <span className="input-group-text">
              <i className="fas fa-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                className="btn btn-outline-secondary"
                onClick={() => onSearchChange('')}
                title="Xóa tìm kiếm"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        {/* Sort Options */}
        <div className="conversation-sort">
          <div className="btn-group btn-group-sm" role="group">
            <input
              type="radio"
              className="btn-check"
              name="sortBy"
              id="sort-lastMessage"
              value="lastMessage"
              checked={sortBy === 'lastMessage'}
              onChange={(e) => setSortBy(e.target.value)}
            />
            <label className="btn btn-outline-secondary" htmlFor="sort-lastMessage" title="Sắp xếp theo tin nhắn cuối">
              <i className="fas fa-clock"></i>
            </label>
            
            <input
              type="radio"
              className="btn-check"
              name="sortBy"
              id="sort-unread"
              value="unread"
              checked={sortBy === 'unread'}
              onChange={(e) => setSortBy(e.target.value)}
            />
            <label className="btn btn-outline-secondary" htmlFor="sort-unread" title="Sắp xếp theo chưa đọc">
              <i className="fas fa-envelope"></i>
            </label>
            
            <input
              type="radio"
              className="btn-check"
              name="sortBy"
              id="sort-alphabetical"
              value="alphabetical"
              checked={sortBy === 'alphabetical'}
              onChange={(e) => setSortBy(e.target.value)}
            />
            <label className="btn btn-outline-secondary" htmlFor="sort-alphabetical" title="Sắp xếp theo tên">
              <i className="fas fa-sort-alpha-down"></i>
            </label>
          </div>
        </div>
      </div>

      {/* Conversation List */}
      <div className="conversation-items">
        {loading && conversations.length === 0 ? (
          <div className="conversation-loading">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="conversation-item-skeleton">
                <div className="conversation-avatar-skeleton loading-skeleton"></div>
                <div className="conversation-content-skeleton">
                  <div className="conversation-title-skeleton loading-skeleton"></div>
                  <div className="conversation-subtitle-skeleton loading-skeleton"></div>
                </div>
                <div className="conversation-meta-skeleton">
                  <div className="conversation-time-skeleton loading-skeleton"></div>
                  <div className="conversation-badge-skeleton loading-skeleton"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedConversations.length === 0 ? (
          <div className="conversation-empty">
            <i className="fas fa-comments fa-2x text-muted mb-3"></i>
            <p className="text-muted">
              {searchQuery ? 'Không tìm thấy cuộc trò chuyện nào' : 'Bạn chưa có cuộc trò chuyện nào'}
            </p>
            {!searchQuery && (
              <button
                className="btn btn-primary btn-sm"
                onClick={onCreateConversation}
              >
                <i className="fas fa-plus me-2"></i>
                Tạo cuộc trò chuyện đầu tiên
              </button>
            )}
          </div>
        ) : (
          sortedConversations.map((conversation, idx) => (
            <ConversationItem
              key={conversation.conversation_id ?? `conv-${idx}`}
              conversation={conversation}
              isActive={currentConversation?.conversation_id === conversation.conversation_id}
              title={getConversationTitle(conversation)}
              avatar={getConversationAvatar(conversation)}
              subtitle={getConversationSubtitle(conversation)}
              lastMessageTime={formatLastMessageTime(conversation.last_message_time || conversation.last_message_at || conversation.updated_at || conversation.created_at)}
              unreadCount={conversation.unread_count || 0}
              onClick={() => conversation?.conversation_id && onConversationSelect(conversation.conversation_id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Individual Conversation Item Component
const ConversationItem = ({
  conversation,
  isActive,
  title,
  avatar,
  subtitle,
  lastMessageTime,
  unreadCount,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarContent = () => {
    if (avatar) {
      return <img src={avatar} alt={title} className="conversation-avatar-img" />;
    }
    
    if (conversation.type === 'group') {
      return (
        <div className="conversation-avatar-group">
          <i className="fas fa-users"></i>
        </div>
      );
    }
    
    return (
      <div className="conversation-avatar-initials">
        {getInitials(title)}
      </div>
    );
  };

  return (
    <div
      className={`conversation-item ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="conversation-avatar">
        {getAvatarContent()}
        {conversation.type === 'direct' && (
          <div className={`conversation-status ${conversation.is_online ? 'online' : 'offline'}`}></div>
        )}
      </div>
      
      <div className="conversation-content">
        <div className="conversation-title">
          <span className="conversation-name">{title}</span>
          {conversation.type === 'group' && (
            <span className="conversation-type-badge">
              <i className="fas fa-users"></i>
            </span>
          )}
        </div>
        <div className="conversation-subtitle">
          <span className="conversation-last-message">{subtitle}</span>
        </div>
      </div>
      
      <div className="conversation-meta">
        <div className="conversation-time">
          {lastMessageTime}
        </div>
        {unreadCount > 0 && (
          <div className="conversation-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
        {conversation.is_pinned && (
          <div className="conversation-pinned">
            <i className="fas fa-thumbtack"></i>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
