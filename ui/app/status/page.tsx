"use client";
import { useEffect, useState, useCallback } from 'react';
import { apiGet } from '../../lib/api';
import AuthGuard from '../../components/auth-guard';
import StatusCard from '../../components/status-card';
import ConfigList from '../../components/config-list';
import {
  Box,
  Grid,
  Typography,
  Button,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

interface AdyenConnectivityStatus {
  environment: string;
  baseUrl: string;
  hasApiKey: boolean;
  hasBalanceAccountId: boolean;
  connectivity: {
    ok: boolean;
    httpStatus: number;
    sampleCount?: number;
    error?: string;
    durationMs?: number;
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  return 'An unknown error occurred';
}

export default function StatusPage() {
  const [status, setStatus] = useState<AdyenConnectivityStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiGet<AdyenConnectivityStatus>('/integrations/adyen/status');
      setStatus(data);
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    const id = setInterval(loadStatus, 30000);
    return () => clearInterval(id);
  }, [loadStatus]);

  const isSandbox = status?.environment === 'test';

  return (
    <AuthGuard requiredRoles={["admin", "accountant"]}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Connectivity Status
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Adyen Transfers API v4 sandbox connectivity and configuration
            </Typography>
          </Box>
          <Button variant="outlined" onClick={loadStatus} startIcon={<RefreshIcon />} disabled={loading}>
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!isSandbox && status && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Status check is intended for sandbox only. Current environment: {status.environment}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <StatusCard
              title="Backend Reachability"
              ok={error ? false : status ? true : (loading ? null : false)}
              description="UI can reach the backend status endpoint"
              details={
                status ? (
                  <Typography variant="body2" color="text.secondary">
                    Endpoint: /api/integrations/adyen/status
                  </Typography>
                ) : undefined
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <StatusCard
              title="Environment"
              ok={status ? isSandbox : loading ? null : false}
              description={status ? `Environment is ${status.environment}` : 'Checking environment...'}
              details={
                status ? (
                  <Box sx={{ mt: 1 }}>
                    <Chip size="small" label={status.environment} color={isSandbox ? 'success' : 'warning'} sx={{ mr: 1 }} />
                    <Chip size="small" label={status.baseUrl} variant="outlined" />
                  </Box>
                ) : undefined
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <StatusCard
              title="Configuration"
              ok={status ? (status.hasApiKey && status.hasBalanceAccountId) : loading ? null : false}
              details={
                <ConfigList
                  items={[
                    { key: 'ADYEN_API_KEY', present: Boolean(status?.hasApiKey), hint: 'Set in server environment' },
                    { key: 'ADYEN_BALANCE_ACCOUNT_ID', present: Boolean(status?.hasBalanceAccountId), hint: 'Set in server environment' },
                  ]}
                />
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <StatusCard
              title="Adyen Sandbox Connectivity"
              ok={status ? status.connectivity.ok : loading ? null : false}
              description={status ? `HTTP ${status.connectivity.httpStatus || 0}` : 'Probing Transfers API...'}
              details={
                status ? (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {status.connectivity.ok ? 'Connected' : (status.connectivity.error || 'Not connected')} • {status.connectivity.durationMs ?? 0}ms
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Sample transfers: {status.connectivity.sampleCount ?? 0}
                    </Typography>
                  </Box>
                ) : undefined
              }
            />
          </Grid>
        </Grid>
      </Box>
    </AuthGuard>
  );
}
