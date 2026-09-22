import { AuthScreen } from '@/components/teacher/AuthScreen';
import { redirect } from 'next/navigation';
import { teacherSession } from '@/features/teacher/server';
export default async function Register() {
  if (await teacherSession()) redirect('/tanar');
  return <AuthScreen mode="signup" />;
}
