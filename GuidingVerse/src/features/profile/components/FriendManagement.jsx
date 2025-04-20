import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
    sendFriendRequest,
    getPendingRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriends,
    removeFriend,
} from '../../../services/friendService';
import styles from './FriendManagement.module.css';

function FriendManagement() {
    const { user } = useAuth();
    const [friendCodeInput, setFriendCodeInput] = useState('');
    const [pendingRequests, setPendingRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [isLoading, setIsLoading] = useState({
        pending: false,
        friends: false,
        send: false,
        action: null, // Will store the ID of the user being actioned upon
    });
    const [error, setError] = useState({
        pending: null,
        friends: null,
        send: null,
        action: null,
    });
    const [infoMessage, setInfoMessage] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

    const fetchPendingRequests = useCallback(async () => {
        setIsLoading(prev => ({ ...prev, pending: true }));
        setError(prev => ({ ...prev, pending: null }));
        try {
            const data = await getPendingRequests();
            setPendingRequests(data || []);
        } catch (err) {
            setError(prev => ({ ...prev, pending: err.message || 'Failed to load pending requests.' }));
        } finally {
            setIsLoading(prev => ({ ...prev, pending: false }));
        }
    }, []);

    const fetchFriends = useCallback(async () => {
        setIsLoading(prev => ({ ...prev, friends: true }));
        setError(prev => ({ ...prev, friends: null }));
        try {
            const data = await getFriends();
            setFriends(data || []);
        } catch (err) {
            setError(prev => ({ ...prev, friends: err.message || 'Failed to load friends list.' }));
        } finally {
            setIsLoading(prev => ({ ...prev, friends: false }));
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchPendingRequests();
            fetchFriends();
        }
    }, [user, fetchPendingRequests, fetchFriends]);

    const handleSendRequest = async (e) => {
        e.preventDefault();
        if (!friendCodeInput.trim()) {
            setError(prev => ({ ...prev, send: 'Friend code cannot be empty.' }));
            return;
        }
        setIsLoading(prev => ({ ...prev, send: true }));
        setError(prev => ({ ...prev, send: null }));
        setInfoMessage('');
        try {
            const result = await sendFriendRequest(friendCodeInput.trim());
            setInfoMessage(result.message || 'Friend request sent!');
            setFriendCodeInput('');
            // Optionally, you could add the user to a local list of sent requests 
            // or refetch friends/pending if the backend logic might change status immediately.
        } catch (err) {
            setError(prev => ({ ...prev, send: err.message || 'Failed to send request.' }));
        } finally {
            setIsLoading(prev => ({ ...prev, send: false }));
        }
    };

    const handleAccept = async (senderId) => {
        setIsLoading(prev => ({ ...prev, action: senderId }));
        setError(prev => ({ ...prev, action: null }));
        setInfoMessage('');
        try {
            await acceptFriendRequest(senderId);
            setInfoMessage('Friend request accepted!');
            // Refetch both lists after accepting
            fetchPendingRequests();
            fetchFriends();
        } catch (err) {
            setError(prev => ({ ...prev, action: `Failed to accept request: ${err.message}` }));
        } finally {
            setIsLoading(prev => ({ ...prev, action: null }));
        }
    };

    const handleReject = async (senderId) => {
        setIsLoading(prev => ({ ...prev, action: senderId }));
        setError(prev => ({ ...prev, action: null }));
        setInfoMessage('');
        try {
            await rejectFriendRequest(senderId);
            setInfoMessage('Friend request rejected.');
            // Refetch pending requests
            fetchPendingRequests();
        } catch (err) {
            setError(prev => ({ ...prev, action: `Failed to reject request: ${err.message}` }));
        } finally {
            setIsLoading(prev => ({ ...prev, action: null }));
        }
    };

    const handleRemove = async (friendId) => {
        if (window.confirm('Are you sure you want to remove this friend?')) {
            setIsLoading(prev => ({ ...prev, action: friendId }));
            setError(prev => ({ ...prev, action: null }));
            setInfoMessage('');
            try {
                await removeFriend(friendId);
                setInfoMessage('Friend removed.');
                // Refetch friends list
                fetchFriends();
            } catch (err) {
                setError(prev => ({ ...prev, action: `Failed to remove friend: ${err.message}` }));
            } finally {
                setIsLoading(prev => ({ ...prev, action: null }));
            }
        }
    };

    const handleCopyCode = () => {
        if (user?.friendCode) {
            navigator.clipboard.writeText(user.friendCode).then(() => {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000); // Hide message after 2s
            }, (err) => {
                console.error('Failed to copy friend code: ', err);
                // Maybe show an error message to the user
            });
        }
    };

    if (!user) {
        return <p>Please log in to manage friends.</p>; // Or some other placeholder/loading state
    }

    return (
        <div className={styles.friendContainer}>
            <h3>Friends & Requests</h3>

            {/* Display Friend Code */} 
            <div className={styles.friendCodeSection}>
                 <p>Your Friend Code: <span>{user.friendCode || 'Loading...'}</span></p>
                 <button onClick={handleCopyCode} className={styles.copyButton} disabled={!user.friendCode || copySuccess}>
                     {copySuccess ? 'Copied!' : 'Copy'}
                 </button>
            </div>

            {/* Add Friend Form */} 
            <form onSubmit={handleSendRequest} className={styles.addFriendForm}>
                <input
                    type="text"
                    placeholder="Enter friend code"
                    value={friendCodeInput}
                    onChange={(e) => setFriendCodeInput(e.target.value)}
                    disabled={isLoading.send}
                />
                <button type="submit" disabled={isLoading.send || !friendCodeInput.trim()}>
                    {isLoading.send ? 'Sending...' : 'Add Friend'}
                </button>
            </form>
            {error.send && <p className={styles.error}>{error.send}</p>}
            {infoMessage && <p className={styles.info}>{infoMessage}</p>}
            {error.action && <p className={styles.error}>{error.action}</p>}

            {/* Pending Requests Section */} 
            <div className={styles.listSection}>
                <h4>Pending Requests ({pendingRequests.length})</h4>
                {isLoading.pending && <p className={styles.loading}>Loading pending requests...</p>}
                {error.pending && <p className={styles.error}>{error.pending}</p>}
                {!isLoading.pending && pendingRequests.length === 0 && <p>No pending friend requests.</p>}
                {!isLoading.pending && pendingRequests.length > 0 && (
                    <ul className={styles.pendingList}>
                        {pendingRequests.map((request) => (
                            <li key={request._id || request.id} className={styles.pendingItem}>
                                <div className={styles.userInfo}>
                                    <span>{request.username}</span>
                                </div>
                                <div className={styles.actions}>
                                    <button
                                        onClick={() => handleAccept(request._id || request.id)}
                                        disabled={isLoading.action === (request._id || request.id)}
                                        className={styles.acceptButton}
                                    >
                                        {isLoading.action === (request._id || request.id) ? '...' : 'Accept'}
                                    </button>
                                    <button
                                        onClick={() => handleReject(request._id || request.id)}
                                        disabled={isLoading.action === (request._id || request.id)}
                                        className={styles.rejectButton}
                                    >
                                        {isLoading.action === (request._id || request.id) ? '...' : 'Reject'}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Friends List Section */} 
            <div className={styles.listSection}>
                <h4>Friends ({friends.length})</h4>
                {isLoading.friends && <p className={styles.loading}>Loading friends list...</p>}
                {error.friends && <p className={styles.error}>{error.friends}</p>}
                {!isLoading.friends && friends.length === 0 && <p>You haven't added any friends yet.</p>}
                 {!isLoading.friends && friends.length > 0 && (
                    <ul className={styles.friendList}>
                        {friends.map((friend) => (
                            <li key={friend._id || friend.id} className={styles.friendItem}>
                                <div className={styles.userInfo}>
                                    <span>{friend.username}</span>
                                     {/* Display friend's code? Optional - maybe sensitive */}
                                     {/* ({friend.friendCode}) */}
                                </div>
                                <div className={styles.actions}>
                                    <button
                                        onClick={() => handleRemove(friend._id || friend.id)}
                                        disabled={isLoading.action === (friend._id || friend.id)}
                                        className={styles.removeButton}
                                    >
                                         {isLoading.action === (friend._id || friend.id) ? '...' : 'Remove'}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                 )}
            </div>
        </div>
    );
}

export default FriendManagement; 