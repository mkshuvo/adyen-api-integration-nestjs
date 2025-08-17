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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Grid,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Add, Visibility, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import AuthGuard from '../../components/auth-guard';
import RoleGuard from '../../components/role-guard';
import { apiGet, apiPost } from '../../lib/api';

interface Payout {
  paymentId: string;
  userId: number;
  userEmail?: string;
  amount: number;
  status: string;
  paidMethod?: string;
  paidTrackingId?: string;
  paidSentTo?: string;
  paidNotes?: string;
  createdAt: string;
  updatedAt: string;
  auditTrail?: PayoutAudit[];
}

interface PayoutAudit {
  id: number;
  status: string;
  message?: string;
  adyenPspReference?: string;
  createdAt: string;
}

interface PayoutForm {
  paymentId: string;
  userId: number;
  amount: number;
  paidNotes?: string;
}

interface User {
  id: number;
  email: string;
  role: string;
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PayoutForm>();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load users and payments from real API
      const [usersResponse, paymentsResponse] = await Promise.all([
        apiGet<User[]>('/users'),
        apiGet<any[]>('/payments/recent?limit=50')
      ]);

      setUsers(usersResponse);

      // Transform payments data to match payout interface
      const transformedPayouts = paymentsResponse.map((payment: any) => ({
        paymentId: payment.paymentId,
        userId: payment.userId || 0,
        userEmail: payment.userEmail || 'Unknown',
        amount: payment.amount,
        status: payment.status,
        paidMethod: payment.status === 'PAID' ? 'adyen_payout' : undefined,
        paidTrackingId: payment.status === 'PAID' ? `TRK${payment.paymentId}` : undefined,
        paidSentTo: payment.status === 'PAID' ? '{"method":"adyen_payout"}' : undefined,
        paidNotes: payment.status === 'PAID' ? 'Processed via Adyen' : undefined,
        createdAt: payment.createdAt,
        updatedAt: payment.createdAt,
        auditTrail: [
          {
            id: 1,
            status: 'initiated',
            message: 'Payment created',
            createdAt: payment.createdAt,
          },
        ],
      }));

      setPayouts(transformedPayouts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    reset({
      paymentId: '',
      userId: 0,
      amount: 0,
      paidNotes: '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
  };

  const onSubmit = async (data: PayoutForm) => {
    try {
      setSubmitting(true);
      // Call API to submit payout
      await apiPost('/payouts/submit', { payment_id: data.paymentId });
      await loadData();
      handleCloseDialog();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit payout');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRowExpansion = (paymentId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(paymentId)) {
      newExpanded.delete(paymentId);
    } else {
      newExpanded.add(paymentId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'success';
      case 'pending':
      case 'initiated':
      case 'submitted':
        return 'warning';
      case 'failed':
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatBankDetails = (paidSentTo?: string) => {
    if (!paidSentTo) return 'N/A';
    try {
      const details = JSON.parse(paidSentTo);
      if (details.iban) {
        return `IBAN: ${details.iban}`;
      } else if (details.accountNumber && details.routingCode) {
        return `Account: ${details.accountNumber}, Routing: ${details.routingCode}`;
      }
      return 'Bank account details';
    } catch {
      return paidSentTo;
    }
  };

  return (
    <AuthGuard requiredRoles={['admin', 'accountant']}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <div>
            <Typography variant="h4" gutterBottom>
              Payouts
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create and manage payout transactions with audit trails
            </Typography>
          </div>
          <RoleGuard allowedRoles={['admin', 'accountant']}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenDialog}
            >
              Create Payout
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
                    <TableCell width="50px"></TableCell>
                    <TableCell>Payment ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Bank Details</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payouts.map((payout) => (
                    <>
                      <TableRow key={payout.paymentId}>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => toggleRowExpansion(payout.paymentId)}
                          >
                            {expandedRows.has(payout.paymentId) ? (
                              <ExpandLess />
                            ) : (
                              <ExpandMore />
                            )}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {payout.paymentId}
                          </Typography>
                        </TableCell>
                        <TableCell>{payout.userEmail}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(payout.amount)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payout.status}
                            color={getStatusColor(payout.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatBankDetails(payout.paidSentTo)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(payout.createdAt)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={7} sx={{ py: 0 }}>
                          <Collapse in={expandedRows.has(payout.paymentId)}>
                            <Box sx={{ p: 2 }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="h6" gutterBottom>
                                    Payout Details
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Tracking ID:</strong> {payout.paidTrackingId || 'N/A'}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Method:</strong> {payout.paidMethod || 'N/A'}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Notes:</strong> {payout.paidNotes || 'No notes'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="h6" gutterBottom>
                                    Audit Trail
                                  </Typography>
                                  <List dense>
                                    {payout.auditTrail?.map((audit) => (
                                      <ListItem key={audit.id} sx={{ px: 0 }}>
                                        <ListItemText
                                          primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <Chip
                                                label={audit.status}
                                                color={getStatusColor(audit.status) as any}
                                                size="small"
                                              />
                                              <Typography variant="body2">
                                                {formatDate(audit.createdAt)}
                                              </Typography>
                                            </Box>
                                          }
                                          secondary={
                                            <div>
                                              <Typography variant="body2">
                                                {audit.message}
                                              </Typography>
                                              {audit.adyenPspReference && (
                                                <Typography variant="caption" fontFamily="monospace">
                                                  PSP: {audit.adyenPspReference}
                                                </Typography>
                                              )}
                                            </div>
                                          }
                                        />
                                      </ListItem>
                                    )) || (
                                      <ListItem sx={{ px: 0 }}>
                                        <ListItemText secondary="No audit trail available" />
                                      </ListItem>
                                    )}
                                  </List>
                                </Grid>
                              </Grid>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </>
                  ))}
                  {payouts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary">
                          No payouts found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Create Payout Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Create Payout</DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    {...register('paymentId', {
                      required: 'Payment ID is required',
                      pattern: {
                        value: /^\d+$/,
                        message: 'Payment ID must be numeric',
                      },
                    })}
                    label="Payment ID"
                    placeholder="1000000001"
                    fullWidth
                    error={!!errors.paymentId}
                    helperText={errors.paymentId?.message || 'Must match existing payment record'}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    {...register('paidNotes')}
                    label="Notes (Optional)"
                    placeholder="Payment description or notes"
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> The payment must already exist in the system with a valid user and bank account.
                  This will initiate the Adyen payout process.
                </Typography>
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Payout'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </AuthGuard>
  );
}
