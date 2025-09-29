import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Minimal server is running'
  });
  console.log('✅ Health check responded');
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Start server
console.log('🚀 Starting minimal server...');
console.log(`📡 Port: ${PORT}`);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`✅ Minimal server started on port ${PORT}`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
}).on('error', (error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});
