"use client";
import { Card, CardContent, Box, Typography, Chip } from '@mui/material';
import { CheckCircleOutline, ErrorOutline, InfoOutlined } from '@mui/icons-material';

interface StatusCardProps {
  title: string;
  ok: boolean | null; // null for unknown/loading
  description?: string;
  details?: React.ReactNode;
}

export default function StatusCard({ title, ok, description, details }: StatusCardProps) {
  const color = ok === null ? 'default' : ok ? 'success' : 'error';
  const Icon = ok === null ? InfoOutlined : ok ? CheckCircleOutline : ErrorOutline;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Icon color={color as any} sx={{ mr: 1 }} />
          <Typography variant="h6">{title}</Typography>
        </Box>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: details ? 1 : 0 }}>
            {description}
          </Typography>
        )}
        {details}
        <Box sx={{ mt: 1 }}>
          <Chip size="small" label={ok === null ? 'Unknown' : ok ? 'OK' : 'Issue'} color={color as any} />
        </Box>
      </CardContent>
    </Card>
  );
}
