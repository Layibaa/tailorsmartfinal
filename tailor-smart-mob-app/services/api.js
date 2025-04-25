import { API_URL } from '../utils/constants';

// Mock API functions with dummy responses
export const loginUser = (email, password) => {
  // Simulated successful login response
  return Promise.resolve({
    token: 'mock-token-123',
    user: {
      id: '1',
      name: 'Test User',
      email: email,
      role: 'customer'
    }
  });
};

export const registerUser = (userData) => {
  // Simulated successful registration response
  return Promise.resolve({
    token: 'mock-token-123',
    user: {
      id: '1',
      name: userData.name,
      email: userData.email,
      role: userData.role || 'customer'
    }
  });
};

export const getCurrentUser = () => {
  // Simulated current user response
  return Promise.resolve({
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'customer'
  });
};

// User & Profile Endpoints
export const fetchUserProfile = () => {
  return Promise.resolve({
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    phone: '123-456-7890',
    address: '123 Main St',
    role: 'customer'
  });
};

export const updateUserProfile = (profileData) => {
  return Promise.resolve({ success: true, data: profileData });
};

export const updateUserSettings = (settings) => {
  return Promise.resolve({ success: true, data: settings });
};

export const deleteAccount = () => {
  return Promise.resolve({ success: true });
};

// Tailor Endpoints
export const fetchTailors = () => {
  return Promise.resolve([
    {
      id: '1',
      name: 'John Doe',
      description: 'Expert in formal wear',
      rating: 4.8,
      services: ['Alterations', 'Custom Suits'],
      location: 'New York, NY'
    },
    {
      id: '2',
      name: 'Jane Smith',
      description: 'Specializes in wedding dresses',
      rating: 4.9,
      services: ['Wedding Alterations', 'Custom Dresses'],
      location: 'Los Angeles, CA'
    }
  ]);
};

export const fetchFeaturedTailors = () => {
  return Promise.resolve([
    {
      id: '1',
      name: 'John Doe',
      description: 'Expert in formal wear',
      rating: 4.8,
      services: ['Alterations', 'Custom Suits'],
      location: 'New York, NY'
    }
  ]);
};

export const fetchTailorDetails = (tailorId) => {
  return Promise.resolve({
    id: tailorId,
    name: 'John Doe',
    description: 'Expert in formal wear with over 10 years of experience',
    rating: 4.8,
    services: ['Alterations', 'Custom Suits', 'Repair'],
    location: 'New York, NY',
    portfolio: [
      { id: '1', title: 'Wedding Suit', image: 'https://via.placeholder.com/150' },
      { id: '2', title: 'Evening Gown', image: 'https://via.placeholder.com/150' }
    ],
    reviews: [
      { id: '1', user: 'Alice', rating: 5, comment: 'Excellent work!' },
      { id: '2', user: 'Bob', rating: 4, comment: 'Great quality' }
    ]
  });
};

export const fetchTailorProfile = () => {
  return Promise.resolve({
    id: '1',
    name: 'John Doe',
    description: 'Expert in formal wear',
    services: ['Alterations', 'Custom Suits'],
    location: 'New York, NY',
    experience: '10 years',
    education: 'Fashion Institute of Design'
  });
};

export const updateTailorProfile = (profileData) => {
  return Promise.resolve({ success: true, data: profileData });
};

// Order Endpoints
export const fetchOrders = () => {
  return Promise.resolve([
    {
      id: '1',
      orderNumber: 'ORD123',
      status: 'pending',
      garmentType: 'Suit',
      description: 'Suit alteration',
      createdAt: '2023-01-15T10:30:00Z'
    },
    {
      id: '2',
      orderNumber: 'ORD124',
      status: 'completed',
      garmentType: 'Dress',
      description: 'Hem adjustment',
      createdAt: '2023-01-10T14:15:00Z'
    }
  ]);
};

export const fetchRecentOrders = () => {
  return Promise.resolve([
    {
      id: '1',
      orderNumber: 'ORD123',
      status: 'pending',
      garmentType: 'Suit',
      description: 'Suit alteration',
      createdAt: '2023-01-15T10:30:00Z'
    }
  ]);
};

export const fetchOrderDetails = (orderId) => {
  return Promise.resolve({
    id: orderId,
    orderNumber: 'ORD123',
    status: 'pending',
    garmentType: 'Suit',
    description: 'Suit alteration - take in waist by 2 inches',
    measurements: {
      waist: '32 inches',
      inseam: '30 inches',
      shoulders: '18 inches'
    },
    customer: {
      id: '1',
      name: 'Test User',
      phone: '123-456-7890'
    },
    tailor: {
      id: '1',
      name: 'John Doe'
    },
    price: 120,
    createdAt: '2023-01-15T10:30:00Z',
    estimatedCompletion: '2023-01-25T10:30:00Z'
  });
};

export const createOrder = (orderData) => {
  return Promise.resolve({
    id: '3',
    orderNumber: 'ORD125',
    status: 'pending',
    ...orderData,
    createdAt: new Date().toISOString()
  });
};

export const updateOrderStatus = (orderId, status) => {
  return Promise.resolve({
    id: orderId,
    status: status,
    updatedAt: new Date().toISOString()
  });
};

export const deleteOrder = (orderId) => {
  return Promise.resolve({ success: true });
};

// Chat Endpoints
export const fetchChatList = () => {
  return Promise.resolve([
    {
      id: '1',
      user: {
        id: '2',
        name: 'Jane Smith',
        avatar: 'https://via.placeholder.com/50'
      },
      lastMessage: {
        content: 'Hello, how are you?',
        timestamp: '2023-01-20T14:30:00Z',
        unread: true
      }
    }
  ]);
};

export const fetchMessages = (userId) => {
  return Promise.resolve([
    {
      id: '1',
      sender: '2',
      receiver: '1',
      content: 'Hello, how are you?',
      timestamp: '2023-01-20T14:30:00Z',
      read: true
    },
    {
      id: '2',
      sender: '1',
      receiver: '2',
      content: 'I\'m good, thanks! How about you?',
      timestamp: '2023-01-20T14:32:00Z',
      read: true
    }
  ]);
};

export const sendMessage = (receiverId, content) => {
  return Promise.resolve({
    id: '3',
    sender: '1',
    receiver: receiverId,
    content: content,
    timestamp: new Date().toISOString(),
    read: false
  });
};

// Notification Endpoints
export const fetchNotifications = () => {
  return Promise.resolve([
    {
      id: '1',
      type: 'order_update',
      title: 'Order Status Updated',
      message: 'Your order ORD123 status has been updated to "in progress"',
      read: false,
      createdAt: '2023-01-18T09:45:00Z'
    },
    {
      id: '2',
      type: 'message',
      title: 'New Message',
      message: 'You have a new message from John Doe',
      read: true,
      createdAt: '2023-01-17T16:20:00Z'
    }
  ]);
};

export const markNotificationAsRead = (notificationId) => {
  return Promise.resolve({ success: true });
};

// Admin Endpoints
export const fetchAdminMetrics = () => {
  return Promise.resolve({
    users: {
      total: 120,
      new: 15,
      active: 85
    },
    orders: {
      total: 250,
      pending: 45,
      completed: 195,
      revenue: 12500
    },
    tailors: {
      total: 35,
      topPerformer: {
        id: '1',
        name: 'John Doe',
        completedOrders: 48
      }
    }
  });
};
