import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  CssBaseline,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  Divider,
  ListItemIcon,
  Badge, // Consolidated import
  List,
  ListItem,
  ListItemText,
  Popover,
  alpha
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import { navListBasedOnUserType } from "../accessControl/accessControl";
import Sidebar from "../sidebar/sidebar";
import { Logout, Menu as MenuIcon, Notifications, Settings } from "@mui/icons-material";

import axiosInstance from "../../utils/axiosInstance";
const Root = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
`;

const AppContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  height: 100vh;
  overflow: hidden;
`;

const MainContent = styled.main`
  flex: 1;
  overflow-y: auto;
  background-color: #ffffff;
  padding: 24px;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;




export default function Layout({ children }) {
  const navigate = useNavigate();
  const state = useSelector((state) => state.dbaasStore);
  const [navBarItems, setNavBarItems] = useState([]);
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const notificationOpen = Boolean(notificationAnchorEl);

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






  const getNavListByPermission = async () => {
    const navListBasedOnUserRole = await navListBasedOnUserType(state.userData, dispatch, navigate);
    setNavBarItems(navListBasedOnUserRole);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };



  useEffect(() => {
    getNavListByPermission();
  }, []);

  return (
    <Root>
      <CssBaseline />
      <Sidebar
        items={navBarItems}
        isBotsScreen={true}
        mobileOpen={mobileOpen}
        onClose={handleDrawerToggle}
      />
      <AppContent>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: "rgba(255,255,255,0.95)",
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            width: { md: `calc(100% - 300px)` },
            ml: { md: `300px` },
            height: '80px',
            transition: 'all 0.3s ease',
            '& .MuiToolbar-root': {
              height: '100%',
              minHeight: '80px',
              padding: { xs: '0 16px', md: '0 24px' }
            },
            '&:hover': {
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{
                  mr: 2,
                  color: theme.palette.text.primary,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1)
                  }
                }}
              >
                <MenuIcon fontSize="medium" />
              </IconButton>
            )}
            <Box sx={{
              display: "flex",
              alignItems: "center",
              '& img': {
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }
            }}>
              <img
                src="/assets/images/dbaas.svg"
                alt="DBaaS Logo"
                style={{ height: '40px' }}
              />
              <Typography variant="h6" sx={{
                ml: 2,
                fontWeight: 600,
                color: theme.palette.text.primary,
                display: { xs: 'none', sm: 'block' }
              }}>
                DBaaS Dashboard
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 2 },
              '& .MuiIconButton-root': {
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                }
              }
            }}>
              <IconButton
                size="medium"
                color="inherit"
                onClick={handleNotificationClick}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications sx={{ color: theme.palette.text.secondary }} />
                </Badge>
              </IconButton>

              <Popover
                open={notificationOpen}
                anchorEl={notificationAnchorEl}
                onClose={handleNotificationClose}
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
                  <Typography variant="h6" sx={{ fontWeight: 600 , color: theme.palette.primary.contrastText} }>
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
                      onClick={() => setNotifications([])}
                    >
                      Clear all
                    </Button>
                  </Box>
                </Box>

                {notifications.length > 0 ? (
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
                        onClick={() => {
                          if (notification.type === 'limit') {
                            navigate(`/database/${notification.dbName}`);
                            handleNotificationClose();
                          }
                        }}
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

                {notifications.length > 0 && (
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
                      onClick={handleNotificationClose}
                    >
                      Close
                    </Button>
                  </Box>
                )}
              </Popover>

              <IconButton size="medium" color="inherit">
                <Settings sx={{ color: theme.palette.text.secondary }} />
              </IconButton>

              <IconButton
                onClick={handleMenuOpen}
                size="small"
                sx={{
                  ml: 1,
                  '&:hover': {
                    transform: 'scale(1.1)'
                  }
                }}
                aria-controls={open ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`
                    }
                  }}
                >
                  {state.userData.email?.charAt(0).toUpperCase() || "U"}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleMenuClose}
                onClick={handleMenuClose}
                PaperProps={{
                  elevation: 4,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.2))',
                    mt: 1.5,
                    minWidth: 220,
                    borderRadius: '12px',
                    '& .MuiAvatar-root': {
                      width: 36,
                      height: 36,
                      ml: -0.5,
                      mr: 1,
                    },
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem sx={{ py: 1.5 }}>
                  <Avatar />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {state.userData.name || "User"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      {state.userData.email || "user@example.com"}
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem sx={{ py: 1 }}>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  Settings
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={handleLogout} sx={{ py: 1 }}>
                  <ListItemIcon>
                    <Logout fontSize="small" color="error" />
                  </ListItemIcon>
                  <Typography color="error">Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
        <MainContent sx={{
          mt: '80px',
          transition: 'all 0.3s ease',
          '@media (min-width: 900px)': {
            ml: { md: '24px' },
            mr: { md: '24px' },
            borderRadius: '12px 12px 0 0',
            boxShadow: '0 0 20px rgba(0,0,0,0.05)',
          }
        }}>
          <Outlet />
        </MainContent>
      </AppContent>
    </Root>
  );
}