"use client";
import { CssBaseline, AppBar, Toolbar, Typography, Container, Button, Box } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import Link from "next/link";
import theme from "../theme";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Adyen Sandbox Payouts
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button color="inherit" component={Link} href="/dashboard">Dashboard</Button>
            <Button color="inherit" component={Link} href="/users">Users</Button>
            <Button color="inherit" component={Link} href="/bank-accounts">Bank Accounts</Button>
            <Button color="inherit" component={Link} href="/payouts">Payouts</Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 4 }}>{children}</Container>
    </ThemeProvider>
  );
}
