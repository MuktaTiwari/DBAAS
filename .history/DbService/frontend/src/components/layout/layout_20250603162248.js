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
import NotificationsPopup
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
               <NotificationsPopup 
                notifications={notifications}
                unreadCount={unreadCount}
                onClearAll={() => setNotifications([])}
              />

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