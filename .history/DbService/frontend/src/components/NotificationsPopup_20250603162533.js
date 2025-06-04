import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Divider,
  Popover,
  alpha,
  IconButton
} from "@mui/material";
import { Notifications } from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@emotion/react";

const NotificationsPopup = ({ notifications, unreadCount, onClearAll }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === 'limit') {
      navigate(`/database/${notification.dbName}`);
      handleClose();
    }
  };

  return (
    <>
      <Badge badgeContent={unreadCount} color="error">
        <IconButton
          size="medium"
          color="inherit"
          onClick={handleClick}
          sx={{
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1)
            }
          }}
        >
          <Notifications sx={{ color: theme.palette.text.secondary }} />
        </IconButton>
      </Badge>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }
        }}
      >
        <Box sx={{
          background: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.contrastText }}>
            Notifications
          </Typography>
          <Box>
            <Button
              size="small"
              sx={{
                color: theme.palette.primary.contrastText,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.contrastText, 0.1)
                }
              }}
              onClick={onClearAll}
            >
              Clear all
            </Button>
          </Box>
        </Box>

        {notifications.length > 0 ? (
          <>
            <List sx={{
              p: 0,
              maxHeight: 400,
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(theme.palette.text.primary, 0.2),
                borderRadius: '3px',
              },
            }}>
              {notifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      cursor: 'pointer'
                    },
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Box sx={{
                      width: 32,
                      height: 32,
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
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                        </svg>
                      ) : (
                        <Notifications fontSize="small" />
                      )}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle2"
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
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          color: theme.palette.text.secondary
                        }}
                      >
                        {notification.timestamp?.toLocaleString() || 'Just now'}
                      </Typography>
                    }
                    sx={{ ml: 1 }}
                  />
                  {!notification.isRead && (
                    <Box sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.primary.main,
                      ml: 1
                    }} />
                  )}
                </ListItem>
              ))}
            </List>
            <Box sx={{
              p: 1.5,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              textAlign: 'center'
            }}>
              <Button
                size="small"
                sx={{
                  color: theme.palette.primary.main,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
                onClick={handleClose}
              >
                Close
              </Button>
            </Box>
          </>
        ) : (
          <Box sx={{
            p: 4,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Box sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2
            }}>
              <Notifications sx={{
                fontSize: 40,
                color: theme.palette.text.disabled
              }} />
            </Box>
            <Typography variant="body1" sx={{
              color: theme.palette.text.secondary,
              mb: 1
            }}>
              No new notifications
            </Typography>
            <Typography variant="caption" sx={{
              color: theme.palette.text.disabled
            }}>
              You're all caught up!
            </Typography>
          </Box>
        )}
      </Popover>
    </>
  );
};

export default NotificationsPopup;