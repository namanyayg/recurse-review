import ProfileClient from '../components/ProfileClient';

export default function ProfilePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  return <ProfileClient slug={slug} />;
} 