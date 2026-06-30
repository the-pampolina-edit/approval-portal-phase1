import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pampolina Edit | Content Approval Portal',
  description: 'Review and approve social media content',
  openGraph: {
    title: 'Pampolina Edit | Content Approval Portal',
    description: 'Review and approve social media content',
    image: '/og-image.svg',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pampolina Edit | Content Approval Portal',
    description: 'Review and approve social media content',
    images: ['/og-image.svg'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
