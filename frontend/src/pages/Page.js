import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '../components/layout/AppLayout';
import { Spinner, Card, Button } from '../components/ui/DesignSystem';
import { getPageBySlug } from '../lib/api';
import { marked } from 'marked';

export default function Page() {
  const { slug } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['page', slug],
    queryFn: () => getPageBySlug(slug),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>
      </AppLayout>
    );
  }

  if (isError || !data?.title) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-display font-bold mb-4">Page not found</h1>
          <p className="text-gray-400 mb-6">We couldn&apos;t find the page you were looking for.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400">Go Home</Link>
        </div>
      </AppLayout>
    );
  }

  const html = data.contentType === 'markdown' ? marked.parse(data.content || '') : data.content || '';

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-display font-bold mb-4">{data.title}</h1>
          <div className="text-sm text-gray-400 mb-6">Last updated: {new Date(data.updatedAt).toLocaleDateString()}</div>
          <Card className="prose prose-invert max-w-none p-8" style={{ maxWidth: '100%' }}>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
