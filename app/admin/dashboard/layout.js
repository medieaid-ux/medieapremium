import AdminSidebar from '@/components/AdminSidebar';

export const metadata = {
  title: 'Admin Dashboard — Mediea Premium',
};

export default function AdminDashboardLayout({ children }) {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-content">{children}</main>
    </div>
  );
}
