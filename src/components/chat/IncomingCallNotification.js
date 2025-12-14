/**
 * 📞 IncomingCallNotification Component
 * Floating notification for incoming audio calls
 */

import React, { useEffect, useState, useRef } from 'react';
import './IncomingCallNotification.css';

const IncomingCallNotification = ({ incomingCall, onAccept, onReject }) => {
    const [position, setPosition] = useState({ x: 20, y: 80 }); // Initial position (offset from top to avoid header)
    const [isVisible, setIsVisible] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);

    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const audioRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        if (incomingCall) {
            setIsVisible(true);
            setTimeLeft(30);

            // Play ringtone (optional)
            if (audioRef.current) {
                audioRef.current.play().catch(err => {
                    console.log('Cannot play ringtone:', err);
                });
            }

            // Auto-dismiss after 30 seconds
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleReject();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
            };
        } else {
            setIsVisible(false);
        }
    }, [incomingCall]);

    const handleAccept = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        // Do NOT set isVisible(false) here immediately.
        // Let the parent component unmount this notification when it transitions to call state.
        // This prevents a UI flash/gap.
        onAccept(incomingCall);
    };

    const handleReject = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsVisible(false); // For reject, we can hide immediately
        onReject(incomingCall);
    };

    const notificationRef = useRef(null);

    const handleMouseDown = (e) => {
        isDragging.current = true;
        // Calculate the offset from the mouse pointer to the top-left corner of the element
        const rect = notificationRef.current.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // Prevent default text selection behavior
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current || !notificationRef.current) return;

        // Calculate potential new position
        let newX = e.clientX - dragOffset.current.x;
        let newY = e.clientY - dragOffset.current.y;

        // Get window dimensions
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Get element dimensions
        const rect = notificationRef.current.getBoundingClientRect();
        const elementWidth = rect.width;
        const elementHeight = rect.height;

        // Constrain to window bounds
        // min X = 0, max X = windowWidth - elementWidth
        newX = Math.max(0, Math.min(newX, windowWidth - elementWidth));

        // min Y = 0, max Y = windowHeight - elementHeight
        newY = Math.max(0, Math.min(newY, windowHeight - elementHeight));

        setPosition({
            x: newX,
            y: newY
        });
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    if (!isVisible || !incomingCall) {
        return null;
    }

    return (
        <>
            {/* Ringtone audio (optional - you can add a ringtone file) */}
            <audio ref={audioRef} loop>
                {/* <source src="/sounds/ringtone.mp3" type="audio/mpeg" /> */}
            </audio>

            <div
                ref={notificationRef}
                className="incoming-call-notification"
                style={{
                    position: 'fixed',
                    top: `${position.y}px`,
                    left: `${position.x}px`,
                    right: 'auto',
                    bottom: 'auto',
                    transform: 'none', // Override potential center transform
                    cursor: 'move',
                    zIndex: 9999
                }}
                onMouseDown={handleMouseDown}
            >
                <div className="incoming-call-content">
                    {/* Caller Avatar */}
                    <div className="caller-avatar-container">
                        <img
                            src={incomingCall.caller?.avatar || '/default-avatar.png'}
                            alt={incomingCall.caller?.name || 'Caller'}
                            className="caller-avatar"
                        />
                        <div className="avatar-ring"></div>
                    </div>

                    {/* Caller Info */}
                    <div className="caller-details">
                        <h3 className="caller-name">{incomingCall.caller?.name || 'Unknown Caller'}</h3>
                        <p className="call-type">
                            <span className="call-icon">📞</span>
                            Cuộc gọi đến
                        </p>
                        <p className="time-remaining">{timeLeft}s</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="call-actions">
                        <button
                            className="btn-call-action btn-accept"
                            onClick={handleAccept}
                            title="Chấp nhận cuộc gọi"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                            <span>Chấp nhận</span>
                        </button>

                        <button
                            className="btn-call-action btn-reject"
                            onClick={handleReject}
                            title="Từ chối cuộc gọi"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 1L1 23M1 1l22 22"></path>
                            </svg>
                            <span>Từ chối</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default IncomingCallNotification;
