export const metadata = {
  title: 'NeshamaTech',
  description: 'Redirecting...',
};

export default function ReferralRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
