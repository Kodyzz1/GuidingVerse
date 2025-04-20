// Helper function to get the auth token (reads directly from the correct key)
const getAuthToken = () => {
    return localStorage.getItem('guidingVerseToken') || null;
};

// Helper function to handle API requests
const apiRequest = async (url, method = 'GET', body = null) => {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json' // Add Accept header
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch(url, config);

        // Check if response is OK and seems like JSON before parsing
        if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json(); // Parse and return JSON
            } else {
                // Handle successful responses that aren't JSON (if applicable)
                // For this service, we expect JSON, so non-JSON on success is unexpected
                console.warn(`API Success (${response.status}) but non-JSON response received from ${url}`);
                return await response.text(); // Or return null/empty object based on needs
            }
        } else {
            // Attempt to get error message from response body (as text first)
            let errorMessage = `HTTP error! status: ${response.status} ${response.statusText}`; 
            try {
                 // Try reading as text first, as error responses might be HTML or plain text
                const errorBody = await response.text(); 
                 // If the text looks like JSON, try parsing it for a message field
                 try {
                    const errorData = JSON.parse(errorBody);
                    if (errorData && errorData.message) {
                        errorMessage = errorData.message;
                    }
                 } catch (jsonError) {
                     // If parsing fails, use the raw text if it's not too long or generic
                     if (errorBody && errorBody.length < 500) { // Avoid logging huge HTML pages
                         // Simple check to avoid logging full HTML pages as the primary message
                         if (!errorBody.trim().startsWith('<!DOCTYPE html') && !errorBody.trim().startsWith('<html>')) {
                            errorMessage = errorBody;
                         }
                     }
                 }
            } catch (textError) {
                 console.error('Could not read error response body:', textError);
            }
            throw new Error(errorMessage);
        }

    } catch (error) {
        // Catch fetch errors (network issues) or errors thrown above
        console.error('API Request Error:', error);
        throw error; // Re-throw the error for the component to handle
    }
};

const API_BASE_URL = '/api/friends'; // Adjust if your API base URL is different

// Send a friend request using a friend code
export const sendFriendRequest = async (friendCode) => {
    return apiRequest(`${API_BASE_URL}/request`, 'POST', { friendCode });
};

// Get pending friend requests received by the user
export const getPendingRequests = async () => {
    return apiRequest(`${API_BASE_URL}/requests/pending`);
};

// Accept a friend request
export const acceptFriendRequest = async (senderId) => {
    return apiRequest(`${API_BASE_URL}/requests/accept/${senderId}`, 'POST');
};

// Reject a friend request
export const rejectFriendRequest = async (senderId) => {
    return apiRequest(`${API_BASE_URL}/requests/reject/${senderId}`, 'POST');
};

// Get the list of friends
export const getFriends = async () => {
    return apiRequest(API_BASE_URL); // GET /api/friends
};

// Remove a friend
export const removeFriend = async (friendId) => {
    return apiRequest(`${API_BASE_URL}/${friendId}`, 'DELETE');
}; 