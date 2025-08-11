import Link from "next/link";
import { Box, Card, CardContent, Grid, Typography, Button } from "@mui/material";

export default function Page() {
  return (
    <main>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Adyen Sandbox Payouts
        </Typography>
        <Typography color="text.secondary">
          Use the navigation or quick links below to manage users, bank accounts, and payouts.
        </Typography>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Dashboard</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>Overview of key metrics.</Typography>
              <Button component={Link} href="/dashboard" variant="contained">Open</Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Users</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>Manage platform users.</Typography>
              <Button component={Link} href="/users" variant="contained">Open</Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Bank Accounts</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>Upsert and validate bank accounts.</Typography>
              <Button component={Link} href="/bank-accounts" variant="contained">Open</Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Payouts</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>Create and track payout intents.</Typography>
              <Button component={Link} href="/payouts" variant="contained">Open</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </main>
  );
}
