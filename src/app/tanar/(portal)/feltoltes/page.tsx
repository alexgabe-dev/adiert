import { requireTeacher } from '@/features/teacher/server';
import { UploadFlow } from '@/components/teacher/UploadFlow';
export default async function UploadPage() {
  const { school } = await requireTeacher();
  return <UploadFlow school={school.name} />;
}
