import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Autocomplete,
  TextField,
  Stack,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import {
  listAccounts,
  getAccountGroups,
  assignGroup,
  removeGroup
} from '../api/accounts';
import { listGroups } from '../api/groups';
import { errorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';

/** Group Assignments page: pick an account, view / assign / remove entitlements. */
export default function GroupAssignments() {
  const toast = useToast();
  const [accounts, setAccounts] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [assigned, setAssigned] = useState([]);
  const [toAssign, setToAssign] = useState('');
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState({ open: false, group: null });

  // Load all accounts (a high limit is fine for 10–25 accounts) and all groups.
  useEffect(() => {
    (async () => {
      try {
        const [accRes, grpRes] = await Promise.all([listAccounts({ limit: 1000, sortBy: 'displayName' }), listGroups()]);
        setAccounts(accRes.data);
        setAllGroups(grpRes);
      } catch (err) {
        setError(errorMessage(err, 'Failed to load data'));
      } finally {
        setLoadingLists(false);
      }
    })();
  }, []);

  const loadAssigned = useCallback(async (accountId) => {
    setLoadingGroups(true);
    try {
      setAssigned(await getAccountGroups(accountId));
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to load assignments'));
    } finally {
      setLoadingGroups(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selected) loadAssigned(selected.id);
    else setAssigned([]);
  }, [selected, loadAssigned]);

  const assignedIds = useMemo(() => new Set(assigned.map((g) => g.id)), [assigned]);
  const availableGroups = useMemo(
    () => allGroups.filter((g) => !assignedIds.has(g.id)),
    [allGroups, assignedIds]
  );

  const handleAssign = async () => {
    if (!toAssign || !selected) return;
    setBusy(true);
    try {
      await assignGroup(selected.id, toAssign);
      toast.success(`Assigned ${toAssign} to ${selected.displayName}`);
      setToAssign('');
      loadAssigned(selected.id);
    } catch (err) {
      toast.error(errorMessage(err, 'Assignment failed'));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      await removeGroup(selected.id, confirm.group.id);
      toast.success(`Removed ${confirm.group.id} from ${selected.displayName}`);
      setConfirm({ open: false, group: null });
      loadAssigned(selected.id);
    } catch (err) {
      toast.error(errorMessage(err, 'Removal failed'));
    } finally {
      setBusy(false);
    }
  };

  if (loadingLists) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Group Assignments
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Assign or remove entitlements (groups) for an account.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Account
              </Typography>
              <Autocomplete
                options={accounts}
                value={selected}
                onChange={(_e, v) => setSelected(v)}
                getOptionLabel={(o) => `${o.displayName} (${o.username})`}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                renderInput={(params) => <TextField {...params} label="Account" placeholder="Search…" />}
              />

              {selected && (
                <Box mt={3}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <PersonIcon color="primary" />
                    <Typography variant="subtitle1">{selected.displayName}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {selected.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selected.department} · {selected.accountType}
                  </Typography>
                  <Chip
                    size="small"
                    label={selected.status}
                    color={selected.status === 'active' ? 'success' : 'default'}
                    sx={{ mt: 1 }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Assigned Entitlements
              </Typography>

              {!selected ? (
                <Typography color="text.secondary">Select an account to view its groups.</Typography>
              ) : loadingGroups ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={26} />
                </Box>
              ) : (
                <>
                  <Stack direction="row" spacing={1} mb={2}>
                    <TextField
                      select
                      label="Add entitlement"
                      value={toAssign}
                      onChange={(e) => setToAssign(e.target.value)}
                      size="small"
                      sx={{ minWidth: 260 }}
                      disabled={availableGroups.length === 0}
                    >
                      {availableGroups.length === 0 ? (
                        <MenuItem value="">All groups already assigned</MenuItem>
                      ) : (
                        availableGroups.map((g) => (
                          <MenuItem key={g.id} value={g.id}>
                            {g.id} · {g.displayName || g.name}
                          </MenuItem>
                        ))
                      )}
                    </TextField>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAssign}
                      disabled={!toAssign || busy}
                    >
                      Assign
                    </Button>
                  </Stack>

                  <Divider />

                  {assigned.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 2 }}>
                      No entitlements assigned.
                    </Typography>
                  ) : (
                    <List>
                      {assigned.map((g) => (
                        <ListItem
                          key={g.id}
                          secondaryAction={
                            <Tooltip title="Remove">
                              <IconButton
                                edge="end"
                                color="error"
                                onClick={() => setConfirm({ open: true, group: g })}
                                disabled={busy}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          }
                        >
                          <ListItemText
                            primary={`${g.id} · ${g.displayName || g.name}`}
                            secondary={g.description}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={confirm.open}
        title="Remove entitlement?"
        message={`Remove "${confirm.group?.id} · ${confirm.group?.name}" from ${selected?.displayName}?`}
        confirmLabel="Remove"
        loading={busy}
        onConfirm={handleRemove}
        onCancel={() => setConfirm({ open: false, group: null })}
      />
    </Box>
  );
}
