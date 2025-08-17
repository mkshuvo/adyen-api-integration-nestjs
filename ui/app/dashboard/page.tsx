"use client";
import { useState, useEffect } from 'react';
import { apiGet } from '../../lib/api';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  AccountBalance,
  Schedule,
  Error as ErrorIcon,
} from '@mui/icons-material';
import AuthGuard from '../../components/auth-guard';

// Helper function to safely extract error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

interface DashboardStats {
  totalPayouts: number;
  pendingPayouts: number;
  successfulPayouts: number;
  failedPayouts: number;
  totalAmount: number;
}

interface RecentPayout {
  paymentId: string;
  amount: number;
  status: string;
  createdAt: string;
  userEmail?: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPayouts: 0,
    pendingPayouts: 0,
    successfulPayouts: 0,
    failedPayouts: 0,
    totalAmount: 0,
  });
  const [recentPayouts, setRecentPayouts] = useState<RecentPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load real dashboard statistics and recent payments from API
      const [statsResponse, recentPayoutsResponse] = await Promise.all([
        apiGet<DashboardStats>('/payments/dashboard/stats'),
        apiGet<RecentPayout[]>('/payments/recent')
      ]);

      setStats(statsResponse);
      setRecentPayouts(recentPayoutsResponse);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'success';
      case 'pending':
      case 'initiated':
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

  return (
    <AuthGuard>
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Overview of payout activities and key metrics
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUp color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Payouts</Typography>
                </Box>
                <Typography variant="h4">{stats.totalPayouts}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(stats.totalAmount)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccountBalance color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Successful</Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {stats.successfulPayouts}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.totalPayouts > 0 
                    ? `${Math.round((stats.successfulPayouts / stats.totalPayouts) * 100)}% success rate`
                    : 'No data'
                  }
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Schedule color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">Pending</Typography>
                </Box>
                <Typography variant="h4" color="warning.main">
                  {stats.pendingPayouts}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Awaiting processing
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6">Failed</Typography>
                </Box>
                <Typography variant="h4" color="error.main">
                  {stats.failedPayouts}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Require attention
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Payouts Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Payouts
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Payment ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentPayouts.map((payout) => (
                    <TableRow key={payout.paymentId}>
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
                          {formatDate(payout.createdAt)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentPayouts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="text.secondary">
                          No recent payouts found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </AuthGuard>
  );
}
