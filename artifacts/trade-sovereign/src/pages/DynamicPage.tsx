import { useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, Badge, Skeleton } from "@/components/ui/design-system";
import { useGetPage } from "@workspace/api-client-react";
import { marked } from "marked";
import { FileText, Clock } from "lucide-react";
import { useMemo } from "react";

marked.setOptions({ gfm: true, breaks: true });

export default function DynamicPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { data: page, isLoading, isError } = useGetPage({ slug });

  const htmlContent = useMemo(() => {
    if (!page) return "";
    if (page.contentType === "html") return page.content;
    return marked(page.content) as string;
  }, [page]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-4 w-32 mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (isError || !page) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-30" />
          <h1 className="text-3xl font-display font-bold mb-4">Page Not Found</h1>
          <p className="text-muted-foreground">The page you're looking for doesn't exist or has been removed.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="uppercase text-xs tracking-widest border-primary/30 text-primary">Page</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gradient mb-4">{page.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Last updated {new Date(page.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
        </div>

        <Card className="p-8">
          {page.contentType === "html" ? (
            <div
              className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:text-white prose-a:text-primary prose-strong:text-white prose-code:text-primary prose-pre:bg-black/40"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          ) : (
            <div
              className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:text-white prose-a:text-primary prose-strong:text-white prose-code:text-primary prose-pre:bg-black/40"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
