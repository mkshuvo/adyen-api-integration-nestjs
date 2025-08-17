"use client";
import { CssBaseline, AppBar, Toolbar, Typography, Container, Button, Box, Menu, MenuItem } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../lib/auth-store";
import RoleGuard from "../components/role-guard";
import theme from "../theme";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
    handleUserMenuClose();
  };

  // Don't show navigation on login page
  const showNavigation = isAuthenticated && pathname !== '/login';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {showNavigation && (
        <AppBar position="static" color="primary">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Adyen Sandbox Payouts
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Button color="inherit" component={Link} href="/dashboard">Dashboard</Button>
              <RoleGuard allowedRoles={['admin']}>
                <Button color="inherit" component={Link} href="/users">Users</Button>
              </RoleGuard>
              <RoleGuard allowedRoles={['admin', 'accountant']}>
                <Button color="inherit" component={Link} href="/bank-accounts">Bank Accounts</Button>
                <Button color="inherit" component={Link} href="/payouts">Payouts</Button>
              </RoleGuard>
              <Button color="inherit" onClick={handleUserMenuOpen}>
                {user?.email} ({user?.role})
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleUserMenuClose}
              >
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
      )}
      <Container sx={{ py: showNavigation ? 4 : 0 }}>{children}</Container>
    </ThemeProvider>
  );
}
