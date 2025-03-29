import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add, CheckCircle, Error } from '@mui/icons-material';
import { Monitor } from '../types';
import { getMonitors, createMonitor, toggleMonitorStatus, deleteMonitor, checkMonitorNow } from '../services/api';

const MonitorList: React.FC = () => {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [newMonitor, setNewMonitor] = useState<Partial<Monitor>>({
    name: '',
    url: '',
    type: 'HTTP',
    checkInterval: 60,
    active: true,
  });

  const fetchMonitors = async () => {
    try {
      setLoading(true);
      const response = await getMonitors();
      setMonitors(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load monitors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitors();
  }, []);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewMonitor({
      name: '',
      url: '',
      type: 'HTTP',
      checkInterval: 60,
      active: true,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setNewMonitor({
      ...newMonitor,
      [name as string]: value,
    });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setNewMonitor({
      ...newMonitor,
      [name as string]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      await createMonitor(newMonitor as Monitor);
      handleCloseDialog();
      fetchMonitors();
    } catch (err) {
      setError('Failed to create monitor');
      console.error(err);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await toggleMonitorStatus(id);
      fetchMonitors();
    } catch (err) {
      setError('Failed to toggle monitor status');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this monitor?')) {
      try {
        await deleteMonitor(id);
        fetchMonitors();
      } catch (err) {
        setError('Failed to delete monitor');
        console.error(err);
      }
    }
  };

  const handleCheckNow = async (id: number) => {
    try {
      await checkMonitorNow(id);
      fetchMonitors();
    } catch (err) {
      setError('Failed to check monitor');
      console.error(err);
    }
  };

  if (loading && monitors.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Monitors</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleOpenDialog}
        >
          Add Monitor
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {monitors.length === 0 ? (
        <Alert severity="info">
          No monitors found. Add your first monitor using the button above.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>URL</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Interval (s)</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {monitors.map((monitor) => (
                <TableRow key={monitor.id} hover>
                  <TableCell>
                    {monitor.active ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Error color="error" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Link to={`/monitors/${monitor.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {monitor.name}
                    </Link>
                  </TableCell>
                  <TableCell>{monitor.url}</TableCell>
                  <TableCell>{monitor.type}</TableCell>
                  <TableCell>{monitor.checkInterval}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleToggleStatus(monitor.id!)}
                      >
                        {monitor.active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleCheckNow(monitor.id!)}
                      >
                        Check Now
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDelete(monitor.id!)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Monitor</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={newMonitor.name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL / Host"
                name="url"
                value={newMonitor.url}
                onChange={handleChange}
                required
                placeholder="e.g. https://example.com or example.com"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={newMonitor.type || 'HTTP'}
                  onChange={handleSelectChange}
                  label="Type"
                >
                  <MenuItem value="HTTP">HTTP</MenuItem>
                  <MenuItem value="HTTPS">HTTPS</MenuItem>
                  <MenuItem value="PING">PING</MenuItem>
                  <MenuItem value="DNS">DNS</MenuItem>
                  <MenuItem value="PORT">PORT</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Check Interval (seconds)"
                name="checkInterval"
                type="number"
                value={newMonitor.checkInterval}
                onChange={handleChange}
                required
              />
            </Grid>
            {newMonitor.type === 'PORT' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Port"
                  name="port"
                  type="number"
                  value={newMonitor.port || ''}
                  onChange={handleChange}
                  required
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Add Monitor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MonitorList; 