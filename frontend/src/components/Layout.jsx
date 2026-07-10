import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Tooltip,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import ArticleIcon from '@mui/icons-material/Article';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ColorModeContext';

const drawerWidth = 240;

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Accounts', path: '/accounts', icon: <PeopleIcon /> },
  { label: 'Groups', path: '/groups', icon: <GroupWorkIcon /> },
  { label: 'Group Assignments', path: '/assignments', icon: <AssignmentIndIcon /> }
];

/** Application shell: responsive sidebar + top bar with theme toggle & logout. */
export default function Layout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggle } = useColorMode();

  const go = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const drawer = (
    <Box>
      <Toolbar sx={{ gap: 1 }}>
        <GroupWorkIcon color="primary" />
        <Typography variant="h6" noWrap fontWeight={700}>
          VR Portal
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname.startsWith(item.path)}
            onClick={() => go(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
        <Divider sx={{ my: 1 }} />
        <ListItemButton component="a" href="/api-docs" target="_blank" rel="noreferrer">
          <ListItemIcon><ArticleIcon /></ListItemIcon>
          <ListItemText primary="API Docs" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        color="default"
        elevation={1}
        sx={{ width: { md: `calc(100% - ${drawerWidth}px)` }, ml: { md: `${drawerWidth}px` } }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen((o) => !o)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }} noWrap>
            {navItems.find((i) => location.pathname.startsWith(i.path))?.label || 'VR Business Portal'}
          </Typography>

          <Tooltip title={mode === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}>
            <IconButton color="inherit" onClick={toggle}>
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title={user?.displayName || user?.username || 'User'}>
            <Avatar sx={{ width: 32, height: 32, ml: 1, bgcolor: 'primary.main' }}>
              {(user?.displayName || user?.username || '?').charAt(0).toUpperCase()}
            </Avatar>
          </Tooltip>

          <Tooltip title="Log out">
            <IconButton color="inherit" onClick={handleLogout} sx={{ ml: 1 }}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {/* Mobile temporary drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop permanent drawer */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
