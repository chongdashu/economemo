import ArticleTable from '@/components/ArticleTable';

export default function ArticlesPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Articles</h1>
        <ArticleTable />
    </div>
  );
}