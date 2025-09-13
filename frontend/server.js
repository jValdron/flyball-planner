const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 80;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing - return index.html for all non-API routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/graphql')) {
    return res.status(404).send('Not found');
  }

  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Frontend server running on port ${port}`);
});
