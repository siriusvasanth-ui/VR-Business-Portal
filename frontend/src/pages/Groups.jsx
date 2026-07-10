import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Stack,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { listGroups, createGroup, updateGroup, deleteGroup } from '../api/groups';
import { errorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';

const EMPTY = { id: '', name: '', displayName: '', description: '' };

/** Groups (entitlements) page: search + CRUD table. */
export default function Groups() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [dialog, setDialog] = useState({ open: false, mode: 'create', form: EMPTY });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, group: null });
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await listGroups({ search: search || undefined }));
    } catch (err) {
      setError(errorMessage(err, 'Failed to load groups'));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  const openCreate = () => setDialog({ open: true, mode: 'create', form: EMPTY });
  const openEdit = (g) =>
    setDialog({
      open: true,
      mode: 'edit',
      form: { id: g.id, name: g.name, displayName: g.displayName || '', description: g.description || '' }
    });

  const setField = (field) => (e) =>
    setDialog((d) => ({ ...d, form: { ...d.form, [field]: e.target.value } }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { form, mode } = dialog;
      if (mode === 'create') {
        await createGroup(form);
        toast.success(`Group "${form.id}" created`);
      } else {
        await updateGroup(form.id, { name: form.name, displayName: form.displayName, description: form.description });
        toast.success(`Group "${form.id}" updated`);
      }
      setDialog((d) => ({ ...d, open: false }));
      load();
    } catch (err) {
      toast.error(errorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteGroup(confirm.group.id);
      toast.success(`Group "${confirm.group.id}" deleted`);
      setConfirm({ open: false, group: null });
      load();
    } catch (err) {
      toast.error(errorMessage(err, 'Delete failed'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h4">Groups &amp; Entitlements</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          New Group
        </Button>
      </Stack>

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search groups…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          <Tooltip title="Refresh">
            <IconButton onClick={load}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Card>

      <Card>
        {error && <Alert severity="error">{error}</Alert>}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Display Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No groups found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((g) => (
                  <TableRow key={g.id} hover>
                    <TableCell>{g.id}</TableCell>
                    <TableCell>{g.name}</TableCell>
                    <TableCell>{g.displayName}</TableCell>
                    <TableCell>{g.description}</TableCell>
                    <TableCell>{g.created ? new Date(g.created).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(g)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setConfirm({ open: true, group: g })}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog((d) => ({ ...d, open: false }))} maxWidth="sm" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle>{dialog.mode === 'edit' ? `Edit Group — ${dialog.form.id}` : 'Create Group'}</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <TextField
                  label="Group ID"
                  value={dialog.form.id}
                  onChange={setField('id')}
                  fullWidth
                  required
                  disabled={dialog.mode === 'edit'}
                  helperText="e.g. WS-ENT600"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Name" value={dialog.form.name} onChange={setField('name')} fullWidth required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Display Name"
                  value={dialog.form.displayName}
                  onChange={setField('displayName')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={dialog.form.description}
                  onChange={setField('description')}
                  fullWidth
                  multiline
                  minRows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDialog((d) => ({ ...d, open: false }))} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={saving && <CircularProgress size={16} color="inherit" />}
            >
              {dialog.mode === 'edit' ? 'Save Changes' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={confirm.open}
        title="Delete group?"
        message={`This will remove "${confirm.group?.id} · ${confirm.group?.name}". Groups still assigned to accounts cannot be deleted.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, group: null })}
      />
    </Box>
  );
}
