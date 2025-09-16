import React from 'react';
import { useLocation } from 'react-router-dom';
import Chat from '../components/chat/Chat';

const ChatPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialConversationId = params.get('conversationId');

  return (
    <div className="container-fluid p-0">
      <Chat initialConversationId={initialConversationId ? parseInt(initialConversationId, 10) : null} />
    </div>
  );
};

export default ChatPage;


