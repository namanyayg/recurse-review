import ProfileClient from '../components/ProfileClient';

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProfileClient slug={slug} />;
} 