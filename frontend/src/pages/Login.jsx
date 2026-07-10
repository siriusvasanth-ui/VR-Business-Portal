import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Stack,
  Alert,
  CircularProgress
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../api/client';

/** Login page. Password equals username in this demo auth model. */
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  // Already signed in → redirect declaratively (avoids navigating during render).
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(username.trim(), password);
      toast.success(`Welcome, ${res.user?.displayName || username}`);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = errorMessage(err, 'Login failed');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: 'linear-gradient(135deg, #1565c0 0%, #7b1fa2 100%)'
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack alignItems="center" spacing={1} mb={3}>
            <GroupWorkIcon color="primary" sx={{ fontSize: 48 }} />
            <Typography variant="h5">VR Business Portal</Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to manage accounts &amp; entitlements
            </Typography>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
                fullWidth
              />
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((s) => !s)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading && <CircularProgress size={18} color="inherit" />}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </Stack>
          </form>

          <Typography variant="caption" color="text.secondary" display="block" mt={3} textAlign="center">
            Demo credentials — password is the same as the username
            <br />
            e.g. <strong>vasanth_ram</strong> / <strong>vasanth_ram</strong>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
