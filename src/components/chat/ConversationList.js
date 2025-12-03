import { useSocket } from '../../contexts/SocketContext';
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow, formatDistance, parseISO } from 'date-fns';
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


// Sort and Deduplicate conversations
  const sortedConversations = useMemo(() => {
    const uniqueMap = new Map();
    conversations.forEach((conv) => {
      const id = conv.conversation_id || conv.id;
      if (!id) return; 
      if (!uniqueMap.has(id)) {
        uniqueMap.set(id, conv);
      }
    });
    const uniqueConversations = Array.from(uniqueMap.values());
    const sorted = [...uniqueConversations];
    
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

    let isoString = dateString;
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateString)) {
      isoString = dateString.replace(' ', 'T');
    }
    let msgDate;
    let now = new Date();
    // Nếu là UTC (có Z hoặc dạng ISO UTC), ép về giờ Việt Nam
    if (/(Z|\+00:00)$/.test(isoString)) {
      msgDate = new Date(new Date(isoString).getTime() + 7 * 60 * 60 * 1000);
      now = new Date(now.getTime() + 7 * 60 * 60 * 1000 - now.getTimezoneOffset() * 60000);
    } else {
      msgDate = new Date(isoString);
    }
    const diffMs = now.getTime() - msgDate.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'vừa xong';
    if (diffHour < 1) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    // Hiển thị ngày/tháng theo giờ Việt Nam
    return msgDate.getDate().toString().padStart(2, '0') + '-' +
      (msgDate.getMonth() + 1).toString().padStart(2, '0') +
      (msgDate.getFullYear() !== now.getFullYear() ? '-' + msgDate.getFullYear() : '');
  };


const getConversationTitle = (conversation) => {
    // 1. Ưu tiên Title nếu có (cho nhóm chat đã đặt tên)
    if (conversation.title && conversation.title.trim() !== '') {
      return conversation.title;
    }
    
    const participants = conversation.participants || [];
    
    // 2. Logic tìm "người kia"
    // Chỉ cần có người tham gia, ta sẽ cố gắng hiển thị tên, không quan tâm type là 'direct' hay không
    if (participants.length > 0) {
      // Ép kiểu về String để so sánh an toàn (tránh lỗi 5 !== "5")
      const myId = String(currentUserId);
      
      // Tìm người không phải là mình
      const other = participants.find(p => {
        const pId = String(p.user_id || p.userId || p.id || '');
        return pId !== myId;
      });

      // Nếu tìm thấy người kia thì lấy, nếu không (chat với chính mình hoặc lỗi) thì lấy người đầu tiên
      const target = other || participants[0];
      
      // Kiểm tra các trường tên phổ biến
      return target.name || target.full_name || target.username || target.email || 'Người dùng không tên';
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
      let content = last.content || last.text || last.message || '';
      const type = last.message_type || last.type;

      // Hide protocol messages
      if (typeof content === 'string') {
        if (content.startsWith('[NEG_REQ]')) {
          return `${prefix}Đề nghị chốt giá`;
        }
        if (content.startsWith('[NEG_ACK]')) {
          return `${prefix}Đã chấp nhận chốt giá`;
        }
        if (content.startsWith('[NEG_REJ]')) {
          return `${prefix}Đã từ chối chốt giá`;
        }
      }

      if (type === 'image') return `${prefix}📷 Hình ảnh`;
      if (type === 'file') return `${prefix}📎 Tệp đính kèm`;
      if (content) return `${prefix}${content}`;
    }

    // Fallbacks if backend provides flattened fields
    let flatContent = conversation.last_message_content || conversation.last_message_text || conversation.last_message_preview || '';
    if (typeof flatContent === 'string') {
      if (flatContent.startsWith('[NEG_REQ]')) {
        return conversation.type === 'direct' ? 'Đề nghị chốt giá' : `${conversation.last_message_sender_name}: Đề nghị chốt giá`;
      }
      if (flatContent.startsWith('[NEG_ACK]')) {
        return conversation.type === 'direct' ? 'Đã chấp nhận chốt giá' : `${conversation.last_message_sender_name}: Đã chấp nhận chốt giá`;
      }
      if (flatContent.startsWith('[NEG_REJ]')) {
        return conversation.type === 'direct' ? 'Đã từ chối chốt giá' : `${conversation.last_message_sender_name}: Đã từ chối chốt giá`;
      }
    }
    if (flatContent) {
      if (conversation.type === 'direct') return flatContent;
      const senderName = conversation.last_message_sender_name;
      return `${senderName}: ${flatContent}`;
    }

    return conversation.type === 'direct' ? 'Bắt đầu cuộc trò chuyện' : 'Chưa có tin nhắn';
  };

  const { isUserOnline } = useSocket();

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
          sortedConversations.map((conversation, idx) => {
            let isOnline = false;
            if (conversation.type === 'direct' && conversation.participants?.length > 0) {
              const other = conversation.participants.find(p => (p.user_id ?? p.userId) !== currentUserId) || conversation.participants[0];
              isOnline = other ? isUserOnline(other.user_id ?? other.userId) : false;
            }
            return (
              <ConversationItem
                key={`${conversation.conversation_id || 'unknown'}-${idx}`}
                conversation={{ ...conversation, is_online: isOnline }}
                isActive={currentConversation?.conversation_id === conversation.conversation_id}
                title={getConversationTitle(conversation)}
                avatar={getConversationAvatar(conversation)}
                subtitle={getConversationSubtitle(conversation)}
                lastMessageTime={(() => {
                  const rawTime = conversation.last_message_time || conversation.last_message_at || conversation.updated_at || conversation.created_at;
                  const formatted = formatLastMessageTime(rawTime);
                  return formatted;
                })()}
                unreadCount={conversation.unread_count || 0}
                onClick={() => conversation?.conversation_id && onConversationSelect(conversation.conversation_id)}
              />
            );
          })
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
