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
  alpha,
  Badge,
  Chip,
  Avatar,
  CircularProgress
} from "@mui/material";
import { 
  Notifications as NotificationsIcon,
  ArrowBack,
  CheckCircleOutline,
  DeleteOutline,
  ArchiveOutlined,
  MarkAsUnread,
  ErrorOutline,
  WarningAmber,
  InfoOutlined
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@emotion/react";
import { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { formatDistanceToNow } from 'date-fns';

const NotificationsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [view, setView] = useState('all'); // 'all', 'unread', 'limits'

  const notificationIcons = {
    limit: <WarningAmber color="warning" />,
    error: <ErrorOutline color="error" />,
    info: <InfoOutlined color="info" />,
    default: <NotificationsIcon color="action" />
  };

  const fetchTableLimitNotifications = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/database/', {
        headers: { Authorization: `${localStorage.getItem("token")}` },
      });
      const userDatabases = response.data.data || [];

      const limitNotifications = userDatabases.map(async (db) => {
        try {
          const tableCountResponse = await axiosInstance.get(`/database/table-count?dbName=${db.dbName}`, {
            headers: { Authorization: `${localStorage.getItem("token")}` },
          });

          const tableCount = tableCountResponse.data.data?.tableCount || 0;
          const MAX_TABLES_PER_DB = 3;

          if (tableCount >= MAX_TABLES_PER_DB) {
            return {
              id: `limit-${db.dbId}`,
              message: `Your database "${db.dbName}" has reached the maximum table limit`,
              description: `You've created ${tableCount} tables (limit: ${MAX_TABLES_PER_DB}). Upgrade your plan to add more tables.`,
              dbName: db.dbName,
              isRead: false,
              type: 'limit',
              priority: 'high',
              timestamp: new Date()
            };
          }
          return null;
        } catch (error) {
          console.error(`Error checking table count for ${db.dbName}:`, error);
          return null;
        }
      });

      const resolvedNotifications = (await Promise.all(limitNotifications)).filter(n => n !== null);
      
      setNotifications(prev => {
        const otherNotifications = prev.filter(n => n.type !== 'limit');
        return [...otherNotifications, ...resolvedNotifications];
      });

      // Add some sample notifications for demo purposes
      if (resolvedNotifications.length === 0) {
        setNotifications(prev => [
          ...prev,
          {
            id: 'sample-info',
            message: 'Welcome to DBaaS Notifications',
            description: 'Here you will see important alerts about your databases',
            isRead: false,
            type: 'info',
            priority: 'low',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const cleanupNotifications = async () => {
    try {
      const response = await axiosInstance.get('/database/', {
        headers: { Authorization: `${localStorage.getItem("token")}` },
      });
      const currentDatabases = response.data.data || [];

      setNotifications(prev => prev.filter(notification => {
        if (notification.type !== 'limit') return true;
        return currentDatabases.some(db => db.dbName === notification.dbName);
      }));
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  };

  const handleClearAll = () => {
    setNotifications([]);
    setSelected([]);
  };

  const handleMarkAsRead = (ids) => {
    setNotifications(prev => 
      prev.map(n => ids.includes(n.id) ? { ...n, isRead: true } : n)
    );
    setSelected([]);
  };

  const handleDelete = (ids) => {
    setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
    setSelected([]);
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === 'limit') {
      navigate(`/database/${notification.dbName}`);
    }
    handleMarkAsRead([notification.id]);
  };

  const toggleSelect = (id) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const filteredNotifications = notifications.filter(n => {
    if (view === 'unread') return !n.isRead;
    if (view === 'limits') return n.type === 'limit';
    return true;
  });

  useEffect(() => {
    const initializeNotifications = async () => {
      await cleanupNotifications();
      await fetchTableLimitNotifications();
      
      const interval = setInterval(fetchTableLimitNotifications, 300000);
      return () => clearInterval(interval);
    };

    initializeNotifications();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={60} thickness={4} sx={{ color: theme.palette.primary.main }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ 
          p: 3, 
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.palette.background.paper
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate(-1)}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
            <Chip 
              label={`${notifications.filter(n => !n.isRead).length} unread`} 
              color="primary" 
              size="small"
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<MarkAsUnread />}
              onClick={() => handleMarkAsRead(selected.length > 0 ? selected : notifications.map(n => n.id))}
              disabled={notifications.length === 0 || (selected.length === 0 && notifications.every(n => n.isRead))}
            >
              Mark all as read
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutline />}
              onClick={() => handleDelete(selected.length > 0 ? selected : notifications.map(n => n.id))}
              disabled={notifications.length === 0}
            >
              Delete all
            </Button>
          </Box>
        </Box>

        {/* Filter Tabs */}
        <Box sx={{ 
          display: 'flex', 
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.grey[50]
        }}>
          <Button
            sx={{ 
              px: 3, 
              py: 2,
              borderBottom: view === 'all' ? `2px solid ${theme.palette.primary.main}` : 'none',
              color: view === 'all' ? theme.palette.primary.main : theme.palette.text.secondary
            }}
            onClick={() => setView('all')}
          >
            All
          </Button>
          <Button
            sx={{ 
              px: 3, 
              py: 2,
              borderBottom: view === 'unread' ? `2px solid ${theme.palette.primary.main}` : 'none',
              color: view === 'unread' ? theme.palette.primary.main : theme.palette.text.secondary
            }}
            onClick={() => setView('unread')}
          >
            Unread
          </Button>
          <Button
            sx={{ 
              px: 3, 
              py: 2,
              borderBottom: view === 'limits' ? `2px solid ${theme.palette.primary.main}` : 'none',
              color: view === 'limits' ? theme.palette.primary.main : theme.palette.text.secondary
            }}
            onClick={() => setView('limits')}
          >
            Limits
          </Button>
        </Box>

        {/* Notification List */}
        {filteredNotifications.length > 0 ? (
          <List sx={{ p: 0 }}>
            {filteredNotifications.map((notification) => (
              <Box key={notification.id}>
                <ListItem
                  sx={{
                    px: 2,
                    py: 2,
                    backgroundColor: notification.isRead ? theme.palette.background.paper : alpha(theme.palette.primary.main, 0.05),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      cursor: 'pointer'
                    },
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    borderLeft: notification.priority === 'high' 
                      ? `4px solid ${theme.palette.error.main}`
                      : notification.priority === 'medium'
                      ? `4px solid ${theme.palette.warning.main}`
                      : 'none'
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <ListItemIcon 
                    sx={{ 
                      minWidth: 48,
                      alignSelf: 'flex-start',
                      mt: 1
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(notification.id);
                    }}
                  >
                    {selected.includes(notification.id) ? (
                      <CheckCircleOutline color="primary" />
                    ) : (
                      <Avatar sx={{ 
                        bgcolor: notification.isRead 
                          ? theme.palette.grey[300] 
                          : theme.palette.primary.main,
                        color: notification.isRead 
                          ? theme.palette.text.secondary 
                          : theme.palette.primary.contrastText,
                        width: 32,
                        height: 32
                      }}>
                        {notificationIcons[notification.type] || notificationIcons.default}
                      </Avatar>
                    )}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: notification.isRead ? 'normal' : 600,
                          color: notification.isRead ? theme.palette.text.primary : theme.palette.primary.main
                        }}
                      >
                        {notification.message}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          variant="body2"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            color: theme.palette.text.secondary
                          }}
                        >
                          {notification.description}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 1,
                            color: theme.palette.text.disabled
                          }}
                        >
                          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                        </Typography>
                      </>
                    }
                    sx={{ ml: 2 }}
                  />
                  
                  {!notification.isRead && (
                    <Box sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.primary.main
                    }} />
                  )}
                  
                  <Box sx={{ 
                    position: 'absolute', 
                    bottom: 8, 
                    right: 12,
                    display: 'flex',
                    gap: 1
                  }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead([notification.id]);
                      }}
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1)
                        }
                      }}
                    >
                      <CheckCircleOutline fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete([notification.id]);
                      }}
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.error.main, 0.1)
                        }
                      }}
                    >
                      <DeleteOutline fontSize="small" color="error" />
                    </IconButton>
                  </Box>
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
            alignItems: 'center',
            backgroundColor: theme.palette.background.paper
          }}>
            <Box sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3
            }}>
              <NotificationsIcon sx={{
                fontSize: 60,
                color: theme.palette.text.disabled
              }} />
            </Box>
            <Typography variant="h5" sx={{
              color: theme.palette.text.secondary,
              mb: 1.5
            }}>
              No notifications found
            </Typography>
            <Typography variant="body1" sx={{
              color: theme.palette.text.disabled,
              maxWidth: '500px',
              mb: 3
            }}>
              {view === 'all' 
                ? "You're all caught up! When you get new notifications, they'll appear here."
                : view === 'unread'
                ? "You don't have any unread notifications right now."
                : "No database limit notifications at this time."}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={fetchTableLimitNotifications}
              startIcon={<NotificationsIcon />}
            >
              Refresh Notifications
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default NotificationsPage;