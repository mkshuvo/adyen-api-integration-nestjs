"use client";
import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import { Add, Edit, CheckCircle, Error } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import AuthGuard from '../../components/auth-guard';
import RoleGuard from '../../components/role-guard';
import { apiGet, apiPost } from '../../lib/api';

interface BankAccount {
  id: number;
  userId: number;
  userEmail?: string;
  country: string;
  currency: string;
  accountHolderName: string;
  iban?: string;
  accountNumber?: string;
  routingCode?: string;
  status: 'unvalidated' | 'valid' | 'invalid';
  createdAt: string;
  updatedAt: string;
}

interface BankAccountForm {
  userId: number;
  country: string;
  currency: string;
  accountHolderName: string;
  iban?: string;
  accountNumber?: string;
  routingCode?: string;
}

interface User {
  id: number;
  email: string;
  role: string;
}

// Helper function to safely extract error message
const getErrorMessage = (error: any): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
};

export default function BankAccountsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<BankAccountForm>();

  const selectedCountry = watch('country');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load users and bank accounts from real API
      const [usersResponse, bankAccountsResponse] = await Promise.all([
        apiGet<User[]>('/users'),
        apiGet<any[]>('/bank-accounts')
      ]);

      setUsers(usersResponse);
      
      // Transform bank account data to match frontend interface
      const transformedBankAccounts = bankAccountsResponse.map((ba: any) => ({
        id: ba.id,
        userId: ba.userId,
        userEmail: ba.user?.email || 'Unknown',
        country: ba.country,
        currency: ba.currency,
        accountHolderName: ba.accountHolderName,
        iban: ba.iban,
        accountNumber: ba.accountNumber,
        routingCode: ba.routingCode,
        status: ba.status,
        createdAt: ba.createdAt,
        updatedAt: ba.updatedAt,
      }));
      
      setBankAccounts(transformedBankAccounts);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (account?: BankAccount) => {
    setEditingAccount(account || null);
    if (account) {
      reset({
        userId: account.userId,
        country: account.country,
        currency: account.currency,
        accountHolderName: account.accountHolderName,
        iban: account.iban || '',
        accountNumber: account.accountNumber || '',
        routingCode: account.routingCode || '',
      });
    } else {
      reset({
        userId: 0,
        country: '',
        currency: '',
        accountHolderName: '',
        iban: '',
        accountNumber: '',
        routingCode: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
    reset();
  };

  const onSubmit = async (data: BankAccountForm) => {
    try {
      setSubmitting(true);
      // Call API to create/update bank account
      await apiPost('/bank-accounts', data);
      await loadData();
      handleCloseDialog();
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to save bank account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async (account: BankAccount) => {
    try {
      await apiPost('/bank-accounts/validate', {
        userId: account.userId,
        country: account.country,
        currency: account.currency,
        accountHolderName: account.accountHolderName,
        iban: account.iban,
        accountNumber: account.accountNumber,
        routingCode: account.routingCode,
      });
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to validate bank account');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'success';
      case 'invalid':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle fontSize="small" />;
      case 'invalid':
        return <Error fontSize="small" />;
      default:
        return null;
    }
  };

  const isSepaCountry = (country: string) => {
    const sepaCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH'];
    return sepaCountries.includes(country);
  };

  return (
    <AuthGuard requiredRoles={['admin', 'accountant']}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <div>
            <Typography variant="h4" gutterBottom>
              Bank Accounts
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and validate user bank accounts for payouts
            </Typography>
          </div>
          <RoleGuard allowedRoles={['admin', 'accountant']}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Add Bank Account
            </Button>
          </RoleGuard>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Account Holder</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Currency</TableCell>
                    <TableCell>Account Details</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bankAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>{account.userEmail}</TableCell>
                      <TableCell>{account.accountHolderName}</TableCell>
                      <TableCell>{account.country}</TableCell>
                      <TableCell>{account.currency}</TableCell>
                      <TableCell>
                        {account.iban ? (
                          <Typography variant="body2" fontFamily="monospace">
                            IBAN: {account.iban}
                          </Typography>
                        ) : (
                          <div>
                            <Typography variant="body2" fontFamily="monospace">
                              Account: {account.accountNumber}
                            </Typography>
                            <Typography variant="body2" fontFamily="monospace">
                              Routing: {account.routingCode}
                            </Typography>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={account.status}
                          color={getStatusColor(account.status) as any}
                          icon={getStatusIcon(account.status) || undefined}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(account)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          {account.status !== 'valid' && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleValidate(account)}
                            >
                              Validate
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {bankAccounts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary">
                          No bank accounts found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
          </DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Controller
                    name="userId"
                    control={control}
                    rules={{ required: 'User is required' }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.userId}>
                        <InputLabel>User</InputLabel>
                        <Select {...field} label="User">
                          {users.map((user) => (
                            <MenuItem key={user.id} value={user.id}>
                              {user.email} ({user.role})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={6}>
                  <Controller
                    name="country"
                    control={control}
                    rules={{ required: 'Country is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Country Code"
                        placeholder="US, NL, GB, etc."
                        fullWidth
                        error={!!errors.country}
                        helperText={errors.country?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={6}>
                  <Controller
                    name="currency"
                    control={control}
                    rules={{ required: 'Currency is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Currency"
                        placeholder="USD, EUR, GBP, etc."
                        fullWidth
                        error={!!errors.currency}
                        helperText={errors.currency?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="accountHolderName"
                    control={control}
                    rules={{ required: 'Account holder name is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Account Holder Name"
                        fullWidth
                        error={!!errors.accountHolderName}
                        helperText={errors.accountHolderName?.message}
                      />
                    )}
                  />
                </Grid>

                {isSepaCountry(selectedCountry) ? (
                  <Grid item xs={12}>
                    <Controller
                      name="iban"
                      control={control}
                      rules={{ required: 'IBAN is required for SEPA countries' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="IBAN"
                          placeholder="NL91ABNA0417164300"
                          fullWidth
                          error={!!errors.iban}
                          helperText={errors.iban?.message}
                        />
                      )}
                    />
                  </Grid>
                ) : (
                  <>
                    <Grid item xs={8}>
                      <Controller
                        name="accountNumber"
                        control={control}
                        rules={{ required: 'Account number is required' }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Account Number"
                            fullWidth
                            error={!!errors.accountNumber}
                            helperText={errors.accountNumber?.message}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Controller
                        name="routingCode"
                        control={control}
                        rules={{ required: 'Routing code is required' }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Routing Code"
                            fullWidth
                            error={!!errors.routingCode}
                            helperText={errors.routingCode?.message}
                          />
                        )}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </AuthGuard>
  );
}
