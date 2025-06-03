import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import {
  Drawer as MuiDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  Box,
  alpha
} from "@mui/material";
import React from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";

const Drawer = styled(MuiDrawer)`
  .MuiDrawer-paper {
    width: 300px;
    background: linear-gradient(180deg, #2c3e50 0%, #1a2530 100%);
    color: white;
    position: relative;
    height: 100vh;
    border-right: none;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    
    @media (max-width: 768px) {
      width: 280px;
      position: fixed;
      z-index: 1200;
    }
    
    &:hover {
      box-shadow: 4px 0 25px rgba(0, 0, 0, 0.3);
    }
  }
`;

const Sidebar = ({ items, isBotsScreen, mobileOpen, onClose, ...rest }) => {
  const state = useSelector((store) => store.dbaasStore);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const onClickSidebar = (item) => {
    navigate(item.route);
    if (isMobile) {
      onClose();
    }
  };

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={mobileOpen}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
      }}
      sx={{
        display: { xs: 'block', md: 'block' },
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: 300,
          position: isMobile ? 'fixed' : 'relative',
        },
      }}
    >
      <Box sx={{ 
        display: "flex", 
        flexDirection: "column", 
        height: "100%",
        background: 'linear-gradient(180deg, rgba(44,62,80,0.95) 0%, rgba(26,37,48,0.95) 100%)',
      }}>
        <Box sx={{
          p: '24px 16px',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          minHeight: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 700,
            color: 'white',
            letterSpacing: '1px',
            background: 'linear-gradient(90deg, #fff 0%, #a1c4fd 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            DBaaS
          </Typography>
        </Box>
        <List sx={{ 
          flex: 1, 
          overflow: 'auto',
          py: 2,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(theme.palette.primary.main, 0.4),
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: theme.palette.primary.main,
          }
        }}>
          {items.map((item, index) => (
            <ListItem 
              key={index} 
              disablePadding
              sx={{
                px: 2,
                mb: 0.5,
                '&:hover': {
                  '& .MuiListItemButton-root': {
                    transform: 'translateX(5px)',
                  }
                }
              }}
            >
              <ListItemButton
                onClick={() => onClickSidebar(item)}
                // Highlight "Dashboard" if pathname is exactly "/databases" or starts with "/database/"
                selected={
                  item.route === "/databases"
                    ? pathname === "/databases" || pathname.startsWith("/database/")
                    : pathname === item.route
                }
                sx={{
                  px: 3,
                  py: 1.5,
                  borderRadius: '8px',
                  mx: 1,
                  transition: 'all 0.3s ease',
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                    '& .MuiListItemIcon-root': {
                      color: theme.palette.primary.main,
                    },
                    '& .MuiTypography-root': {
                      fontWeight: 600,
                    }
                  },
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  color: (item.route === "/databases" && 
                          (pathname === "/databases" || pathname.startsWith("/database/"))) 
                          ? theme.palette.primary.main 
                          : 'rgba(255,255,255,0.8)',
                  transition: 'all 0.3s ease',
                }}>
                  <item.icon fontSize="medium" />
                </ListItemIcon>
                <ListItemText
                  primary={item.name}
                  primaryTypographyProps={{
                    fontWeight: (item.route === "/databases" && 
                                (pathname === "/databases" || pathname.startsWith("/database/"))) 
                                ? 600 
                                : 'normal',
                    fontSize: '0.95rem',
                    color: 'white',
                    letterSpacing: '0.5px'
                  }}
                />
                {(item.route === "/databases" && 
                  (pathname === "/databases" || pathname.startsWith("/database/"))) && (
                  <Box sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    ml: 1,
                    boxShadow: `0 0 8px ${theme.palette.primary.main}`
                  }} />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{
          p: 2,
          textAlign: 'center',
          background: 'rgba(0,0,0,0.2)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            DBaaS v1.0.0
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;