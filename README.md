TailorSmart
TailorSmart is a cross-platform mobile application that connects customers with tailors, allowing them to place custom clothing orders, manage measurements, and communicate in real-time.

Features
Authentication system with three user roles (Customer, Tailor, Admin)
User & tailor profile management
Order creation and management
Real-time chat between customers and tailors
Admin dashboard with metrics
Push notifications for order updates and messages
Reference management for measurements
Tech Stack
Mobile App (Frontend)
React Native with Expo
React Navigation v6
Real-time communication via Socket.io
Secure data storage with Expo SecureStore
Axios for API requests
Backend
Node.js with Express.js
MongoDB database with Mongoose ODM
JWT-based authentication
Real-time communication via Socket.io
bcrypt for password hashing
Project Structure
/tailorsmart
  /client                 # React Native/Expo frontend
    /assets              # Images, fonts, etc.
    /components          # Reusable UI components
    /navigation          # Navigation configuration
    /screens             # Application screens
    /services            # API services
    /utils               # Utility functions
    App.js               # Main app component
  /server                # Express.js backend
    /controllers         # Request handlers
    /middleware          # Express middleware
    /models              # Mongoose models
    /routes              # API routes
    /utils               # Utility functions
    server.js            # Server entry point
  .env                   # Environment variables
  README.md              # Project documentation
Getting Started
Prerequisites
Node.js (v14.x or higher)
MongoDB (See MongoDB Setup Guide)
Expo CLI (npm install -g expo-cli)
Installation
Clone the repository

git clone <repository-url>
cd tailorsmart
Set up environment variables

Copy .env.example to .env in the root directory
Update the variables as needed
Install server dependencies

cd server
npm install
Install client dependencies

cd ../client
npm install
Running the Application
Start the MongoDB server (see MongoDB Setup Guide)

Start the server

cd server
npm start
Start the client

cd ../client
npm start
Use the Expo Go app on your mobile device to scan the QR code, or run on an emulator/simulator

Detailed Setup Instructions
For detailed setup instructions, see SETUP_INSTRUCTIONS.md
For MongoDB setup, see MONGODB_SETUP.md
API Documentation
Authentication
POST /api/auth/register - Register a new user
POST /api/auth/login - Log in a user
GET /api/auth/me - Get current user
Users
GET /api/users/profile - Get user profile
PUT /api/users/profile - Update user profile
PUT /api/users/settings - Update user settings
Tailors
GET /api/tailors - Get all tailors
GET /api/tailors/featured - Get featured tailors
GET /api/tailors/:id - Get tailor details
GET /api/tailors/profile - Get tailor profile
PUT /api/tailors/profile - Update tailor profile
Orders
GET /api/orders - Get all orders
GET /api/orders/recent - Get recent orders
POST /api/orders - Create a new order
GET /api/orders/:id - Get order details
PUT /api/orders/:id/status - Update order status
PUT /api/orders/:id - Update order
DELETE /api/orders/:id - Delete order
Chat
GET /api/chat/list - Get chat list
GET /api/chat/messages/:userId - Get messages with a user
POST /api/chat/messages - Send a message
PUT /api/chat/messages/:id/read - Mark message as read
Notifications
GET /api/notifications - Get all notifications
PUT /api/notifications/:id/read - Mark notification as read
PUT /api/notifications/read-all - Mark all notifications as read
DELETE /api/notifications/:id - Delete notification
DELETE /api/notifications/read - Delete read notifications
Admin
GET /api/admin/metrics - Get admin dashboard metrics
GET /api/admin/users - Get all users
GET /api/admin/users/:id - Get user details
PUT /api/admin/users/:id - Update user
DELETE /api/admin/users/:id - Delete user
License
This project is licensed under the MIT License - see the LICENSE file for details