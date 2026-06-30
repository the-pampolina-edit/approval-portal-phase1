import { Metadata } from 'next';

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Pampolina Edit | Content Approval Portal',
  description: 'Review and approve social media content',
  openGraph: {
    title: 'Pampolina Edit | Content Approval Portal',
    description: 'Review and approve social media content',
    image: `${baseUrl}/og-image.svg`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pampolina Edit | Content Approval Portal',
    description: 'Review and approve social media content',
    images: [`${baseUrl}/og-image.svg`],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
