import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Stack,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
  CircularProgress,
  Alert,
  Popover,
  FormGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import {
  listAccounts,
  createAccount,
  updateAccount,
  deleteAccount
} from '../api/accounts';
import { listGroups } from '../api/groups';
import { errorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import AccountFormDialog from '../components/AccountFormDialog';
import ConfirmDialog from '../components/ConfirmDialog';

const ALL_COLUMNS = [
  { id: 'accountId', label: 'Account ID', sortable: true },
  { id: 'employeeNumber', label: 'Employee #', sortable: true },
  { id: 'displayName', label: 'Name', sortable: true },
  { id: 'givenName', label: 'First Name', sortable: true },
  { id: 'familyName', label: 'Last Name', sortable: true },
  { id: 'username', label: 'Username', sortable: true },
  { id: 'email', label: 'Email', sortable: true },
  { id: 'secondaryEmail', label: 'Secondary Email', sortable: false },
  { id: 'phoneNumber', label: 'Phone', sortable: false },
  { id: 'secondaryPhoneNumber', label: 'Secondary Phone', sortable: false },
  { id: 'manager', label: 'Manager', sortable: true },
  { id: 'department', label: 'Department', sortable: true },
  { id: 'region', label: 'Region', sortable: true },
  { id: 'accountType', label: 'Type', sortable: true },
  { id: 'status', label: 'Status', sortable: true },
  { id: 'groups', label: 'Groups', sortable: false },
  { id: 'actions', label: 'Actions', sortable: false, alwaysVisible: true },
];

const DEFAULT_VISIBLE = new Set([
  'accountId', 'displayName', 'username', 'email', 'department', 'accountType', 'status', 'groups', 'actions'
]);

const DEPARTMENTS = ['IT', 'Finance', 'HR', 'Sales', 'Operations', 'Manufacturing', 'Procurement'];

/** Accounts page: searchable, filterable, sortable, paginated table + CRUD. */
export default function Accounts() {
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // query state
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('displayName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(0); // zero-based for MUI
  const [limit, setLimit] = useState(10);

  // dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, account: null });
  const [deleting, setDeleting] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE);
  const [colAnchor, setColAnchor] = useState(null);

  const query = useMemo(
    () => ({
      search: search || undefined,
      department: department || undefined,
      status: status || undefined,
      sortBy,
      sortOrder,
      page: page + 1,
      limit
    }),
    [search, department, status, sortBy, sortOrder, page, limit]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listAccounts(query);
      setRows(res.data);
      setTotal(res.pagination.total);
    } catch (err) {
      setError(errorMessage(err, 'Failed to load accounts'));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    listGroups().then(setGroups).catch(() => setGroups([]));
  }, []);

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
    setPage(0);
  };

  const openCreate = () => {
    setFormMode('create');
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (account) => {
    setFormMode('edit');
    setEditing(account);
    setFormOpen(true);
  };

  const handleSubmit = async (form) => {
    setSaving(true);
    try {
      if (formMode === 'create') {
        await createAccount(form);
        toast.success(`Account "${form.username}" created`);
      } else {
        await updateAccount(editing.id, form);
        toast.success(`Account "${editing.username}" updated`);
      }
      setFormOpen(false);
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
      await deleteAccount(confirm.account.id);
      toast.success(`Account "${confirm.account.username}" deleted`);
      setConfirm({ open: false, account: null });
      // if we deleted the last row on a page, step back a page
      if (rows.length === 1 && page > 0) setPage((p) => p - 1);
      else load();
    } catch (err) {
      toast.error(errorMessage(err, 'Delete failed'));
    } finally {
      setDeleting(false);
    }
  };

  const visibleCols = ALL_COLUMNS.filter((c) => c.alwaysVisible || visibleColumns.has(c.id));

  const renderCell = (col, a) => {
    switch (col.id) {
      case 'status':
        return (
          <>
            <Chip size="small" label={a.status} color={a.status === 'active' ? 'success' : 'default'} variant={a.status === 'active' ? 'filled' : 'outlined'} />
            {a.locked && <Chip size="small" label="locked" color="error" sx={{ ml: 0.5 }} />}
          </>
        );
      case 'groups':
        return (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {(a.groups || []).map((g) => <Chip key={g} size="small" label={g} variant="outlined" />)}
          </Stack>
        );
      case 'actions':
        return (
          <>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => openEdit(a)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => setConfirm({ open: true, account: a })}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        );
      default:
        return a[col.id] ?? '—';
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h4">Accounts</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          New Account
        </Button>
      </Stack>

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Search name, username, email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
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
          <TextField
            select
            label="Department"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(0);
            }}
            size="small"
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All</MenuItem>
            {DEPARTMENTS.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
            size="small"
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
          <Tooltip title="Refresh">
            <IconButton onClick={load}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Toggle columns">
            <IconButton onClick={(e) => setColAnchor(e.currentTarget)}>
              <ViewColumnIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Card>

      <Popover
        open={Boolean(colAnchor)}
        anchorEl={colAnchor}
        onClose={() => setColAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, minWidth: 210 }}>
          <Typography variant="subtitle2" mb={1}>Visible Columns</Typography>
          <FormGroup>
            {ALL_COLUMNS.filter((c) => !c.alwaysVisible).map((col) => (
              <FormControlLabel
                key={col.id}
                control={
                  <Checkbox
                    size="small"
                    checked={visibleColumns.has(col.id)}
                    onChange={(e) => {
                      setVisibleColumns((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(col.id);
                        else next.delete(col.id);
                        return next;
                      });
                    }}
                  />
                }
                label={col.label}
              />
            ))}
          </FormGroup>
        </Box>
      </Popover>

      <Card>
        {error && <Alert severity="error">{error}</Alert>}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {visibleCols.map((col) => (
                  <TableCell key={col.id} sortDirection={sortBy === col.id ? sortOrder : false}>
                    {col.sortable ? (
                      <TableSortLabel
                        active={sortBy === col.id}
                        direction={sortBy === col.id ? sortOrder : 'asc'}
                        onClick={() => handleSort(col.id)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={visibleCols.length} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleCols.length} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No accounts found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((a) => (
                  <TableRow key={a.id} hover>
                    {visibleCols.map((col) => (
                      <TableCell key={col.id}>{renderCell(col, a)}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_e, p) => setPage(p)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => {
            setLimit(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      <AccountFormDialog
        open={formOpen}
        mode={formMode}
        initial={editing}
        groups={groups}
        loading={saving}
        onSubmit={handleSubmit}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={confirm.open}
        title="Delete account?"
        message={`This will permanently remove "${confirm.account?.displayName}" (${confirm.account?.username}). This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, account: null })}
      />
    </Box>
  );
}
