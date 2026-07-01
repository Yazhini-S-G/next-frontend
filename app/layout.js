import "./globals.css";

export const metadata = {
  title: "RBAC Blog Management",
  description: "Enterprise RBAC and blog management frontend",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
