import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { getDashboardStats } from '../api/accounts';
import { errorMessage } from '../api/client';

function StatCard({ title, value, icon, color }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 52, height: 52 }}>{icon}</Avatar>
          <Box>
            <Typography variant="h4">{value}</Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

/** Dashboard: KPI cards + department pie + group-usage bar chart. */
export default function Dashboard() {
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setStats(await getDashboardStats());
      } catch (err) {
        setError(errorMessage(err, 'Failed to load dashboard'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <Alert severity="error">{error}</Alert>;

  const cards = [
    { title: 'Total Accounts', value: stats.totalAccounts, icon: <PeopleIcon />, color: 'primary' },
    { title: 'Active Accounts', value: stats.activeAccounts, icon: <CheckCircleIcon />, color: 'success' },
    { title: 'Inactive Accounts', value: stats.inactiveAccounts, icon: <CancelIcon />, color: 'warning' },
    { title: 'Locked Accounts', value: stats.lockedAccounts, icon: <LockIcon />, color: 'error' },
    { title: 'Total Groups', value: stats.totalGroups, icon: <GroupWorkIcon />, color: 'secondary' }
  ];

  const deptData = Object.entries(stats.byDepartment || {}).map(([label, value], i) => ({
    id: i,
    value,
    label
  }));

  const groupUsage = stats.groupUsage || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Overview of accounts and entitlements in the VR Business Portal.
      </Typography>

      <Grid container spacing={2} mb={1}>
        {cards.map((c) => (
          <Grid item xs={12} sm={6} md={2.4} key={c.title}>
            <StatCard {...c} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} mt={1}>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Accounts by Department
              </Typography>
              {deptData.length > 0 ? (
                <PieChart
                  series={[
                    {
                      data: deptData,
                      innerRadius: 40,
                      paddingAngle: 2,
                      cornerRadius: 4,
                      highlightScope: { faded: 'global', highlighted: 'item' }
                    }
                  ]}
                  height={280}
                />
              ) : (
                <Typography color="text.secondary">No data</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Group (Entitlement) Usage
              </Typography>
              {groupUsage.length > 0 ? (
                <BarChart
                  height={280}
                  xAxis={[{ scaleType: 'band', data: groupUsage.map((g) => g.id) }]}
                  series={[
                    {
                      data: groupUsage.map((g) => g.count),
                      label: 'Accounts',
                      color: theme.palette.primary.main
                    }
                  ]}
                />
              ) : (
                <Typography color="text.secondary">No data</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
