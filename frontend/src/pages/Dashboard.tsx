import React, { useEffect, useState } from 'react';
import { Alert, Box, Card, CardContent, Grid, Typography, CircularProgress } from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import { MonitorStats } from '../types';
import { getAllMonitorStats } from '../services/api';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<MonitorStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await getAllMonitorStats();
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {stats.length === 0 ? (
        <Alert severity="info">
          No monitors found. <Link to="/monitors">Add your first monitor</Link>
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {stats.map((stat) => (
            <Grid item xs={12} sm={6} md={4} key={stat.monitorId}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderLeft: stat.lastCheckSuccess ? '4px solid green' : '4px solid red'
                }}
                component={Link} 
                to={`/monitors/${stat.monitorId}`}
                style={{ textDecoration: 'none' }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" component="div">
                      {stat.monitorName}
                    </Typography>
                    {stat.lastCheckSuccess ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Error color="error" />
                    )}
                  </Box>
                  <Typography color="text.secondary" gutterBottom>
                    {stat.url}
                  </Typography>
                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary">
                      Uptime: {stat.uptimePercentage.toFixed(2)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Response: {stat.averageResponseTime.toFixed(0)} ms
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Last Check: {new Date(stat.lastCheckedAt).toLocaleString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard; 