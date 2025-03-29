import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Monitor, CheckResult, MonitorStats } from '../types';
import { getMonitorById, getResultsByMonitorId, getMonitorStats, checkMonitorNow } from '../services/api';

const MonitorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [stats, setStats] = useState<MonitorStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const createEmptyStats = (monitor: Monitor): MonitorStats => {
    return {
      monitorId: monitor.id || 0,
      monitorName: monitor.name,
      url: monitor.url,
      lastCheckSuccess: false,
      lastResponseTime: 0,
      lastCheckedAt: new Date().toISOString(),
      totalChecks: 0,
      successfulChecks: 0,
      uptimePercentage: 0,
      averageResponseTime: 0
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        navigate('/monitors');
        return;
      }

      try {
        setLoading(true);
        
        try {
          const monitorResponse = await getMonitorById(Number(id));
          setMonitor(monitorResponse.data);
        } catch (err: any) {
          console.error('Erro ao buscar monitor:', err);
          setError(`Failed to load monitor: ${err.message || 'Unknown error'}`);
          setLoading(false);
          return;
        }
        
        try {
          const resultsResponse = await getResultsByMonitorId(Number(id));
          setResults(resultsResponse.data || []);
          setResultsError(null);
        } catch (err: any) {
          console.error('Erro ao buscar resultados:', err);
          setResults([]);
          setResultsError(`Couldn't load check results: ${err.message || 'Unknown error'}`);
        }
        
        try {
          const statsResponse = await getMonitorStats(Number(id));
          setStats(statsResponse.data);
          setStatsError(null);
        } catch (err: any) {
          console.error('Erro ao buscar estatísticas:', err);
          if (monitor) {
            setStats(createEmptyStats(monitor));
          }
          setStatsError(`Couldn't load statistics: ${err.message || 'Unknown error'}`);
        }
        
        setError(null);
      } catch (err: any) {
        console.error('Erro ao carregar detalhes do monitor:', err);
        setError(`Failed to load monitor details: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);

    return () => clearInterval(interval);
  }, [id, navigate, monitor]);

  const handleCheckNow = async () => {
    if (!id || !monitor) return;

    try {
      await checkMonitorNow(Number(id));
      
      try {
        const resultsResponse = await getResultsByMonitorId(Number(id));
        setResults(resultsResponse.data || []);
        setResultsError(null);
      } catch (err: any) {
        console.error('Erro ao atualizar resultados:', err);
        setResultsError(`Couldn't refresh check results: ${err.message || 'Unknown error'}`);
      }
      
      try {
        const statsResponse = await getMonitorStats(Number(id));
        setStats(statsResponse.data);
        setStatsError(null);
      } catch (err: any) {
        console.error('Erro ao atualizar estatísticas:', err);
        setStatsError(`Couldn't refresh statistics: ${err.message || 'Unknown error'}`);
        if (monitor && !stats) {
          setStats(createEmptyStats(monitor));
        }
      }
    } catch (err: any) {
      console.error('Erro ao verificar monitor:', err);
      setError(`Failed to check monitor: ${err.message || 'Unknown error'}`);
    }
  };

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

  if (!monitor) {
    return <Alert severity="error">Monitor not found</Alert>;
  }

  const chartData = (results || []).slice(0, 20).reverse().map((result) => ({
    time: result.checkedAt ? new Date(result.checkedAt).toLocaleTimeString() : 'Unknown',
    responseTime: result.responseTime || 0,
    status: result.success ? 'Up' : 'Down',
  }));

  const safeStats = stats || createEmptyStats(monitor);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{monitor.name || 'Unnamed Monitor'}</Typography>
        <Button variant="contained" color="primary" onClick={handleCheckNow}>
          Check Now
        </Button>
      </Box>

      {resultsError && <Alert severity="warning" sx={{ mb: 2 }}>{resultsError}</Alert>}
      {statsError && <Alert severity="warning" sx={{ mb: 2 }}>{statsError}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                {safeStats.lastCheckSuccess ? (
                  <>
                    <CheckCircle color="success" sx={{ mr: 1 }} />
                    <Typography variant="h5" color="success.main">
                      Up
                    </Typography>
                  </>
                ) : (
                  <>
                    <ErrorIcon color="error" sx={{ mr: 1 }} />
                    <Typography variant="h5" color="error.main">
                      {results && results.length > 0 ? 'Down' : 'No Data'}
                    </Typography>
                  </>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                Last checked: {safeStats.lastCheckedAt ? new Date(safeStats.lastCheckedAt).toLocaleString() : 'Never'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stats
              </Typography>
              <Typography variant="body1">
                Uptime: {(safeStats.uptimePercentage || 0).toFixed(2)}%
              </Typography>
              <Typography variant="body1">
                Avg Response Time: {(safeStats.averageResponseTime || 0).toFixed(0)} ms
              </Typography>
              <Typography variant="body1">
                Total Checks: {safeStats.totalChecks || 0}
              </Typography>
              {safeStats.totalChecks === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  No check results available yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monitor Info
              </Typography>
              <Typography variant="body1">
                URL: {monitor.url || 'N/A'}
              </Typography>
              <Typography variant="body1">
                Type: {monitor.type || 'N/A'}
              </Typography>
              {monitor.port && (
                <Typography variant="body1">
                  Port: {monitor.port}
                </Typography>
              )}
              <Typography variant="body1">
                Check Interval: {monitor.checkInterval || 0} seconds
              </Typography>
              <Typography variant="body1">
                Status: {monitor.active ? 'Active' : 'Inactive'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Response Time
            </Typography>
            {results && results.length > 0 ? (
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="responseTime"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No check results available to display the chart
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper>
            <TableContainer>
              <Typography variant="h6" sx={{ p: 2 }}>
                Recent Checks
              </Typography>
              {results && results.length > 0 ? (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Response Time</TableCell>
                      <TableCell>Date/Time</TableCell>
                      <TableCell>Message</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.slice(0, 10).map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Chip
                            label={result.success ? 'Success' : 'Failed'}
                            color={result.success ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{result.responseTime || 0} ms</TableCell>
                        <TableCell>
                          {result.checkedAt ? new Date(result.checkedAt).toLocaleString() : 'Unknown'}
                        </TableCell>
                        <TableCell>{result.errorMessage || 'No error'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Box p={2}>
                  <Typography variant="body2" color="text.secondary">
                    No recent check results available
                  </Typography>
                </Box>
              )}
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MonitorDetail; 