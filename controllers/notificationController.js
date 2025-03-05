let connections = [];

export const notificationController = {
  subscribe: (req, res) => {
    const { latitude, longitude } = req.query;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const connection = {
      res,
      location: { latitude, longitude }
    };
    
    connections.push(connection);

    req.on('close', () => {
      connections = connections.filter(conn => conn !== connection);
    });
  },

  broadcast: (message, location = null, radius = 50) => {
    connections.forEach(connection => {
      if (location) {

        if (isWithinRadius(connection.location, location, radius)) {
          connection.res.write(`data: ${JSON.stringify(message)}\n\n`);
        }
      } else {
 
        connection.res.write(`data: ${JSON.stringify(message)}\n\n`);
      }
    });
  }
};

function isWithinRadius(point1, point2, radius) {
  if (!point1 || !point2) return false;
  
  const lat1 = parseFloat(point1.latitude);
  const lon1 = parseFloat(point1.longitude);
  const lat2 = parseFloat(point2.latitude);
  const lon2 = parseFloat(point2.longitude);

  const R = 6371; 
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