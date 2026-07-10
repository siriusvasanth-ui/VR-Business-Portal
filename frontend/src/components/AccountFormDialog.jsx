import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Select,
  InputLabel,
  FormControl,
  OutlinedInput,
  Box,
  Chip,
  CircularProgress
} from '@mui/material';

const STATUS_OPTIONS = ['active', 'inactive'];
const TYPE_OPTIONS = ['Employee', 'Contractor', 'Manager', 'Privileged'];

const EMPTY = {
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  secondaryEmail: '',
  phoneNumber: '',
  manager: '',
  department: '',
  region: 'India',
  accountType: 'Employee',
  status: 'active',
  locked: false,
  groups: []
};

/**
 * Create/Edit dialog for an account.
 * @param groups  full list of group objects (for the entitlement multi-select)
 */
export default function AccountFormDialog({ open, mode, initial, groups = [], loading, onSubmit, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const isEdit = mode === 'edit';

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...EMPTY, ...initial, groups: initial.groups || [] } : EMPTY);
    }
  }, [open, initial]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? `Edit Account — ${initial?.displayName || ''}` : 'Create Account'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Username"
                value={form.username}
                onChange={set('username')}
                fullWidth
                required
                disabled={isEdit}
                helperText={isEdit ? 'Username cannot be changed' : 'Password will equal the username'}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField label="First Name" value={form.firstName} onChange={set('firstName')} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField label="Last Name" value={form.lastName} onChange={set('lastName')} fullWidth required />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="Email" type="email" value={form.email} onChange={set('email')} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Secondary Email"
                type="email"
                value={form.secondaryEmail}
                onChange={set('secondaryEmail')}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="Phone Number" value={form.phoneNumber} onChange={set('phoneNumber')} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Manager (username)" value={form.manager} onChange={set('manager')} fullWidth />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField label="Department" value={form.department} onChange={set('department')} fullWidth />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Region" value={form.region} onChange={set('region')} fullWidth />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select label="Account Type" value={form.accountType} onChange={set('accountType')} fullWidth>
                {TYPE_OPTIONS.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField select label="Status" value={form.status} onChange={set('status')} fullWidth>
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(form.locked)}
                    onChange={(e) => setForm((f) => ({ ...f, locked: e.target.checked }))}
                  />
                }
                label="Locked"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="groups-label">Groups (Entitlements)</InputLabel>
                <Select
                  labelId="groups-label"
                  multiple
                  value={form.groups}
                  onChange={(e) => setForm((f) => ({ ...f, groups: e.target.value }))}
                  input={<OutlinedInput label="Groups (Entitlements)" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => {
                        const g = groups.find((x) => x.id === id);
                        return <Chip key={id} label={g ? `${id} · ${g.displayName || g.name}` : id} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {groups.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.id} · {g.displayName || g.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={16} color="inherit" />}
          >
            {isEdit ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
