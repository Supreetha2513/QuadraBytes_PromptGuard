// API Helper Functions
const API_BASE_URL = 'http://localhost:5000';

const api = {
    // Send message to backend for processing
    sendMessage: async (message, userId = 'demo_user_01') => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    user_id: userId
                })
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    },

    // Get conversation history
    getConversations: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/conversations`);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching conversations:', error);
            throw error;
        }
    },

    // Get user status
    getUserStatus: async (userId = 'demo_user_01') => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user-status/${userId}`);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching user status:', error);
            throw error;
        }
    }
};
