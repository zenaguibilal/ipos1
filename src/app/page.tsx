import { redirect } from 'next/navigation';

export default function RootPage() {
  // توجيه مباشر إلى لوحة التحكم كون التطبيق محلي بالكامل ولا يتطلب تسجيل دخول
  redirect('/dashboard');
}
