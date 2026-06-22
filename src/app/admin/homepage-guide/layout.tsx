import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function AdminGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      redirect('/login');
    }
    
    const adminRoles = ['super_admin', 'content_admin', 'sales_manager', 'support_agent'];
    if (!adminRoles.includes(user.role)) {
      redirect('/');
    }
  } catch (error) {
    redirect('/login');
  }
  
  return children;
}
