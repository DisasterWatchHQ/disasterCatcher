let connections = [];

export const notificationController = {
  // Subscribe to notifications
  subscribe: (req, res) => {
    const { latitude, longitude } = req.query;

    // Set headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Store connection with location info
    const connection = {
      res,
      location: { latitude, longitude }
    };
    
    connections.push(connection);

    // Remove connection when client disconnects
    req.on('close', () => {
      connections = connections.filter(conn => conn !== connection);
    });
  },

  // Send notification to all connected clients
  broadcast: (message, location = null, radius = 50) => {
    connections.forEach(connection => {
      if (location) {
        // If location is provided, only send to nearby users
        if (isWithinRadius(connection.location, location, radius)) {
          connection.res.write(`data: ${JSON.stringify(message)}\n\n`);
        }
      } else {
        // If no location, send to all
        connection.res.write(`data: ${JSON.stringify(message)}\n\n`);
      }
    });
  }
};

// Helper function to check if a point is within radius (km)
function isWithinRadius(point1, point2, radius) {
  if (!point1 || !point2) return false;
  
  const lat1 = parseFloat(point1.latitude);
  const lon1 = parseFloat(point1.longitude);
  const lat2 = parseFloat(point2.latitude);
  const lon2 = parseFloat(point2.longitude);

  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance <= radius;
}

function toRad(value) {
  return value * Math.PI / 180;
}