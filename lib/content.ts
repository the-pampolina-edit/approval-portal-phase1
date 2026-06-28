export interface ContentBatch {
  client: {
    name: string;
    honeybook_url: string;
  };
  month: string;
  year: number;
  token: string;
  expires_at: string; // ISO date string
  posts: Post[];
}

export interface Post {
  id: string;
  type: 'image' | 'video'; // image or video URL
  asset_url: string;
  caption: string;
  scheduled_date: string; // YYYY-MM-DD
  platform?: string; // Instagram, Facebook, etc.
}

export async function loadContent(token: string): Promise<ContentBatch | null> {
  try {
    const response = await fetch(`/content/${token}.json`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data as ContentBatch;
  } catch (error) {
    console.error('Failed to load content:', error);
    return null;
  }
}

export function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMonth(month: string, year: number): string {
  const monthDate = new Date(`${month} 1, ${year}`);
  return monthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
