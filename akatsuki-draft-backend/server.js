const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Load environment variables
dotenv.config();

// Connect to Database
const connectDB = require('./src/config/db');
connectDB();

const app = express();

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static folder for uploaded images/documents
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check / API Welcome route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    project: "Akatsuki's Draft: AI-Enabled Content Sharing Platform",
    event: 'Nodevember 4.0',
    version: '1.0.0',
    documentation: {
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        me: 'GET /auth/me',
      },
      posts: {
        createPost: 'POST /posts',
        exploreApproved: 'GET /posts',
        getPostById: 'GET /posts/:id',
        myPosts: 'GET /posts/my-posts',
        updatePost: 'PATCH /posts/:id',
        deletePost: 'DELETE /posts/:id',
      },
      admin: {
        viewPending: 'GET /admin/posts/pending',
        approvePost: 'PATCH /admin/posts/approve/:id',
        rejectPost: 'PATCH /admin/posts/reject/:id',
      },
      ai: {
        improveDraft: 'POST /ai/improve/:postId',
      },
    },
  });
});

// Mount Routes
app.use('/auth', require('./src/routes/authRoutes'));
app.use('/posts', require('./src/routes/postRoutes'));
app.use('/admin', require('./src/routes/adminRoutes'));
app.use('/ai', require('./src/routes/aiRoutes'));

// Error handling middleware
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  Akatsuki's Draft Backend running on port ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
