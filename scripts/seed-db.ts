import { createHash } from 'crypto';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { DrizzleD1Database, drizzle } from 'drizzle-orm/d1';

function getGravatarUrl(email: string): string {
  const hash = createHash('md5').update(email.toLowerCase().trim()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=400&d=retro`;
}

async function seed() {
  const { env } = getRequestContext();
  const db = drizzle(env.DB);

  const profilePictureUrl = getGravatarUrl('mail@namanyayg.com');

  try {
    await db.execute(`
      INSERT INTO recursers (
        id,
        name,
        username,
        profile_picture_url,
        batch,
        start_date,
        end_date,
        journey
      ) VALUES (
        'ng1',
        'Namanyay Goel',
        'namanyayg',
        '${profilePictureUrl}',
        'W2 2024',
        '2024-01-08',
        '2024-03-29',
        '{}'
      )
    `);
    console.log('Successfully seeded database');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seed(); 