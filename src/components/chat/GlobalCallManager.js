import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useAudioCall from '../../hooks/useAudioCall';
import AudioCallModal from './AudioCallModal';
import IncomingCallNotification from './IncomingCallNotification';

const GlobalCallManagerContent = () => {
    // We pass null as conversationId because for incoming calls, 
    // the hook extracts it from the event data.
    const {
        callState,
        callDuration,
        incomingCall,
        error,
        loading,
        acceptCall,
        rejectCall,
        endCall,
        remoteUserInfo,
        localStream,
        remoteStream
    } = useAudioCall(null);

    return (
        <>
            {incomingCall && !callState && (
                <IncomingCallNotification
                    incomingCall={incomingCall}
                    onAccept={acceptCall}
                    onReject={rejectCall}
                />
            )}

            <AudioCallModal
                isOpen={!!callState}
                callState={callState}
                callDuration={callDuration}
                recipientInfo={remoteUserInfo || incomingCall?.caller || { name: 'Unknown', avatar: null }}
                conversationName="Cuộc gọi đến"
                error={error}
                loading={loading}
                onEnd={endCall}
                onClose={() => {
                    // Minimize logic could go here
                }}
                localStream={localStream}
                remoteStream={remoteStream}
            />
        </>
    );
};

const GlobalCallManager = () => {
    const location = useLocation();
    const isChatPage = location.pathname.startsWith('/chat');

    // Only render the content (and thus run the hook) if NOT on chat page
    if (isChatPage) return null;

    return <GlobalCallManagerContent />;
};

export default GlobalCallManager;
