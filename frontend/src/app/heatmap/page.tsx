import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import Heatmap from '@/components/Heatmap';
import { authOptions } from '../api/auth/[...nextauth]/options';

export default async function HeatmapPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto p-4">
      <Heatmap />
    </div>
  );
}
