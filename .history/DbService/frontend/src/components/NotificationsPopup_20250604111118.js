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
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton
} from "@mui/material";
import { 
  Notifications as NotificationsIcon,
  ArrowBack,
  CheckCircleOutline,
  DeleteOutline,
  MarkAsUnread,
  ErrorOutline,
  WarningAmber,
  InfoOutlined,
  MoreVert,
  Refresh,
  FilterList,
  StarBorder,
  Star,
  Settings as SettingsIcon
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
  const [view, setView] = useState('all'); // 'all', 'unread', 'limits', 'starred'
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [skeletonCount] = useState(5);

  const notificationIcons = {
    limit: <WarningAmber color="warning" />,
    error: <ErrorOutline color="error" />,
    info: <InfoOutlined color="info" />,
    default: <NotificationsIcon color="action" />
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };

  const fetchTableLimitNotifications = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/database/', {
        headers: { Authorization: `${localStorage.getItem("token")}` },
      });
      const userDatabases = response.data.data || [];

      const limitNotifications = await Promise.all(
        userDatabases.map(async (db) => {
          try {
            const tableCountResponse = await axiosInstance.get(`/database/table-count?dbName=${db.dbName}`, {
              headers: { Authorization: `${localStorage.getItem("token")}` },
            });

            const tableCount = tableCountResponse.data.data?.tableCount || 0;
            const MAX_TABLES_PER_DB = 3;

            if (tableCount >= MAX_TABLES_PER_DB) {
              return {
                id: `limit-${db.dbId}`,
                message: `Table limit reached for "${db.dbName}"`,
                description: `You've created ${tableCount} tables (limit: ${MAX_TABLES_PER_DB}). Upgrade your plan to add more tables.`,
                dbName: db.dbName,
                isRead: false,
                isStarred: false,
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
        })
      );

      const resolvedNotifications = limitNotifications.filter(n => n !== null);
      
      setNotifications(prev => {
        const otherNotifications = prev.filter(n => n.type !== 'limit');
        return [...otherNotifications, ...resolvedNotifications];
      });

      // Add sample notifications if none exist (for demo)
      if (resolvedNotifications.length === 0 && prev.length === 0) {
        setNotifications([
          {
            id: 'sample-info',
            message: 'Welcome to DBaaS Notifications',
            description: 'Here you will see important alerts about your databases',
            isRead: false,
            isStarred: false,
            type: 'info',
            priority: 'low',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
          },
          {
            id: 'sample-tip',
            message: 'Pro Tip: Organize your databases',
            description: 'Use tags and categories to keep your databases organized',
            isRead: true,
            isStarred: true,
            type: 'info',
            priority: 'low',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTableLimitNotifications();
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

  const handleMarkAsUnread = (ids) => {
    setNotifications(prev => 
      prev.map(n => ids.includes(n.id) ? { ...n, isRead: false } : n)
    );
    setSelected([]);
  };

  const handleDelete = (ids) => {
    setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
    setSelected([]);
  };

  const toggleStar = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isStarred: !n.isStarred } : n)
    );
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === 'limit') {
      navigate(`/database/${notification.dbName}`);
    }
    if (!notification.isRead) {
      handleMarkAsRead([notification.id]);
    }
  };

  const toggleSelect = (id, event) => {
    event.stopPropagation();
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const filteredNotifications = notifications.filter(n => {
    if (view === 'unread') return !n.isRead;
    if (view === 'limits') return n.type === 'limit';
    if (view === 'starred') return n.isStarred;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const starredCount = notifications.filter(n => n.isStarred).length;
  const limitCount = notifications.filter(n => n.type === 'limit').length;

  useEffect(() => {
    const initializeNotifications = async () => {
      await cleanupNotifications();
      await fetchTableLimitNotifications();
      
      const interval = setInterval(fetchTableLimitNotifications, 300000);
      return () => clearInterval(interval);
    };

    initializeNotifications();
  }, []);

  const renderLoadingSkeletons = () => (
    <Box sx={{ p: 2 }}>
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: 1 }} />
        </Box>
      ))}
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ 
        borderRadius: '12px', 
        overflow: 'hidden',
        boxShadow: theme.shadows[4]
      }}>
        {/* Header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.palette.background.paper,
          position: 'sticky',
          top: 0,
          zIndex: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Go back">
              <IconButton onClick={() => navigate(-1)}>
                <ArrowBack />
              </IconButton>
            </Tooltip>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
              Notifications Center
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                label={`${unreadCount} unread`} 
                color="primary" 
                size="small"
                variant="outlined"
              />
              <Chip 
                label={`${starredCount} starred`} 
                color="secondary" 
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                <Refresh sx={{ 
                  color: theme.palette.primary.main,
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Filter">
              <IconButton onClick={handleFilterMenuOpen}>
                <FilterList />
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={filterMenuAnchor}
              open={Boolean(filterMenuAnchor)}
              onClose={handleFilterMenuClose}
            >
              <MenuItem onClick={() => { setView('all'); handleFilterMenuClose(); }}>
                All Notifications
              </MenuItem>
              <MenuItem onClick={() => { setView('unread'); handleFilterMenuClose(); }}>
                Unread Only
              </MenuItem>
              <MenuItem onClick={() => { setView('limits'); handleFilterMenuClose(); }}>
                Database Limits
              </MenuItem>
              <MenuItem onClick={() => { setView('starred'); handleFilterMenuClose(); }}>
                Starred
              </MenuItem>
            </Menu>

            <Button
              variant="contained"
              color="primary"
              startIcon={<MarkAsUnread />}
              onClick={() => handleMarkAsRead(selected.length > 0 ? selected : notifications.map(n => n.id))}
              disabled={notifications.length === 0 || (selected.length === 0 && notifications.every(n => n.isRead))}
              size="small"
            >
              Mark Read
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutline />}
              onClick={() => handleDelete(selected.length > 0 ? selected : notifications.map(n => n.id))}
              disabled={notifications.length === 0}
              size="small"
            >
              Delete
            </Button>
            
            <IconButton onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { handleMarkAsUnread(selected.length > 0 ? selected : notifications.map(n => n.id)); handleMenuClose(); }}>
                <ListItemIcon>
                  <MarkAsUnread fontSize="small" />
                </ListItemIcon>
                Mark as Unread
              </MenuItem>
              <MenuItem onClick={() => { handleClearAll(); handleMenuClose(); }}>
                <ListItemIcon>
                  <DeleteOutline fontSize="small" color="error" />
                </ListItemIcon>
                Clear All
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleMenuClose}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                Notification Settings
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Filter Tabs */}
        <Box sx={{ 
          display: 'flex', 
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.grey[50],
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: '6px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.grey[400],
            borderRadius: '3px'
          }
        }}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, newView) => newView && setView(newView)}
            sx={{ width: '100%' }}
          >
            <ToggleButton value="all" sx={{ flex: 1, textTransform: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>All</Typography>
                <Chip label={notifications.length} size="small" sx={{ height: 20 }} />
              </Box>
            </ToggleButton>
            <ToggleButton value="unread" sx={{ flex: 1, textTransform: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>Unread</Typography>
                <Chip label={unreadCount} size="small" sx={{ height: 20 }} color="primary" />
              </Box>
            </ToggleButton>
            <ToggleButton value="limits" sx={{ flex: 1, textTransform: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>Limits</Typography>
                <Chip label={limitCount} size="small" sx={{ height: 20 }} color="warning" />
              </Box>
            </ToggleButton>
            <ToggleButton value="starred" sx={{ flex: 1, textTransform: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>Starred</Typography>
                <Chip label={starredCount} size="small" sx={{ height: 20 }} color="secondary" />
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Notification List */}
        {loading ? (
          renderLoadingSkeletons()
        ) : filteredNotifications.length > 0 ? (
          <List sx={{ p: 0 }}>
            {filteredNotifications.map((notification) => (
              <Box key={notification.id}>
                <ListItem
                  sx={{
                    px: 2,
                    py: 1.5,
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
                      : `4px solid ${theme.palette.grey[300]}`,
                    opacity: notification.isRead ? 0.9 : 1
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <ListItemIcon 
                    sx={{ 
                      minWidth: 40,
                      alignSelf: 'flex-start',
                      mt: 1.5
                    }}
                  >
                    <Tooltip title={selected.includes(notification.id) ? "Deselect" : "Select"}>
                      <IconButton
                        onClick={(e) => toggleSelect(notification.id, e)}
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1)
                          }
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
                            width: 28,
                            height: 28
                          }}>
                            {notificationIcons[notification.type] || notificationIcons.default}
                          </Avatar>
                        )}
                      </IconButton>
                    </Tooltip>
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: notification.isRead ? 'normal' : 600,
                            color: notification.isRead ? theme.palette.text.primary : theme.palette.primary.main,
                            flexGrow: 1
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Tooltip title={notification.isStarred ? "Unstar" : "Star"}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStar(notification.id);
                            }}
                            sx={{
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.secondary.main, 0.1)
                              }
                            }}
                          >
                            {notification.isStarred ? (
                              <Star color="secondary" fontSize="small" />
                            ) : (
                              <StarBorder fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
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
                            color: theme.palette.text.disabled,
                            fontStyle: 'italic'
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
                    gap: 0.5
                  }}>
                    <Tooltip title="Mark as read">
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
                    </Tooltip>
                    <Tooltip title="Delete">
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
                    </Tooltip>
                  </Box>
                </ListItem>
                <Divider sx={{ my: 0 }} />
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
            backgroundColor: theme.palette.background.paper,
            minHeight: '300px',
            justifyContent: 'center'
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
              {view === 'all' 
                ? "No notifications yet"
                : view === 'unread'
                ? "No unread notifications"
                : view === 'limits'
                ? "No database limit alerts"
                : "No starred notifications"}
            </Typography>
            <Typography variant="body1" sx={{
              color: theme.palette.text.disabled,
              maxWidth: '500px',
              mb: 3
            }}>
              {view === 'all' 
                ? "When you receive new notifications, they'll appear here."
                : view === 'unread'
                ? "You're all caught up with your notifications."
                : view === 'limits'
                ? "No databases have reached their table limits."
                : "Star important notifications to find them easily later."}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={handleRefresh}
              startIcon={<Refresh />}
              disabled={refreshing}
            >
              Refresh
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default NotificationsPage;