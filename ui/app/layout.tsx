export const metadata = {
  title: "Adyen Sandbox UI",
  description: "Payouts admin UI",
};

import ClientLayout from "./layout-client";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
