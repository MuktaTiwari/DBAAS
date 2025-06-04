import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Paper,
  Container,
  alpha
} from "@mui/material";
import { Notifications, ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@emotion/react";
import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

const NotificationsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTableLimitNotifications = async () => {
    try {
      setLoading(true);
      // Get user's databases
      const response = await axiosInstance.get('/database/', {
        headers: {
          Authorization: `${localStorage.getItem("token")}`,
        },
      });
      const userDatabases = response.data.data || [];

      const limitNotifications = [];

      // Check each database for table limit
      for (const db of userDatabases) {
        const tableCountResponse = await axiosInstance.get(`/database/table-count?dbName=${db.dbName}`, {
          headers: {
            Authorization: `${localStorage.getItem("token")}`,
          },
        });

        const tableCount = tableCountResponse.data.data?.tableCount || 0;
        const MAX_TABLES_PER_DB = 3;

        if (tableCount >= MAX_TABLES_PER_DB) {
          limitNotifications.push({
            id: `limit-${db.dbId}`,
            message: `Database "${db.dbName}" has reached the table limit (${MAX_TABLES_PER_DB})`,
            dbName: db.dbName,
            isRead: false,
            type: 'limit',
            timestamp: new Date()
          });
        }
      }

      setNotifications(prev => {
        // Keep existing notifications that aren't limit notifications
        const otherNotifications = prev.filter(n => n.type !== 'limit');
        // Combine with new limit notifications
        return [...otherNotifications, ...limitNotifications];
      });
    } catch (error) {
      console.error('Error fetching table limit notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const cleanupNotifications = async () => {
    try {
      // Get current databases to verify which notifications are still valid
      const response = await axiosInstance.get('/database/', {
        headers: {
          Authorization: `${localStorage.getItem("token")}`,
        },
      });
      const currentDatabases = response.data.data || [];

      setNotifications(prevNotifications => {
        // Filter out notifications for databases that no longer exist
        return prevNotifications.filter(notification => {
          if (notification.type !== 'limit') return true;
          return currentDatabases.some(db => db.dbName === notification.dbName);
        });
      });
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === 'limit') {
      navigate(`/database/${notification.dbName}`);
    }
    // Mark as read
    setNotifications(prev =>
      prev.map(n => 
        n.id === notification.id ? { ...n, isRead: true } : n
      )
    );
  };

  useEffect(() => {
    const initializeNotifications = async () => {
      await cleanupNotifications();
      await fetchTableLimitNotifications();
      
      // Set up interval to check for table limits periodically
      const interval = setInterval(fetchTableLimitNotifications, 300000); // 5 minutes
      return () => clearInterval(interval);
    };

    initializeNotifications();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: '12px', textAlign: 'center' }}>
          <Typography variant="h6">Loading notifications...</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: '12px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" component="h1">
              Notifications
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleClearAll}
            disabled={notifications.length === 0}
          >
            Clear All
          </Button>
        </Box>

        {notifications.length > 0 ? (
          <List sx={{ width: '100%' }}>
            {notifications.map((notification) => (
              <Box key={notification.id}>
                <ListItem
                  sx={{
                    px: 2,
                    py: 2,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      cursor: 'pointer'
                    },
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <ListItemIcon sx={{ minWidth: 48 }}>
                    <Box sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: notification.isRead
                        ? alpha(theme.palette.primary.main, 0.1)
                        : theme.palette.primary.main,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: notification.isRead
                        ? theme.palette.primary.main
                        : theme.palette.primary.contrastText,
                    }}>
                      {notification.type === 'limit' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                        </svg>
                      ) : (
                        <Notifications fontSize="medium" />
                      )}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: notification.isRead ? 'normal' : 600,
                          color: theme.palette.text.primary
                        }}
                      >
                        {notification.message}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          color: theme.palette.text.secondary
                        }}
                      >
                        {notification.timestamp?.toLocaleString() || 'Just now'}
                      </Typography>
                    }
                    sx={{ ml: 2 }}
                  />
                  {!notification.isRead && (
                    <Box sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.primary.main,
                      ml: 2
                    }} />
                  )}
                </ListItem>
                <Divider />
              </Box>
            ))}
          </List>
        ) : (
          <Box sx={{
            p: 6,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Box sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3
            }}>
              <Notifications sx={{
                fontSize: 48,
                color: theme.palette.text.disabled
              }} />
            </Box>
            <Typography variant="h5" sx={{
              color: theme.palette.text.secondary,
              mb: 1.5
            }}>
              No notifications yet
            </Typography>
            <Typography variant="body1" sx={{
              color: theme.palette.text.disabled,
              maxWidth: '400px'
            }}>
              When you get notifications about your databases (like reaching limits), they'll appear here.
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default NotificationsPage;