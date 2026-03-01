import { Layout } from "@/components/layout";
import { useDatasets } from "@/hooks/use-datasets";
import { Link } from "wouter";
import { FileSpreadsheet, Search, Filter, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function Datasets() {
  const { data: datasets, isLoading } = useDatasets();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">My Datasets</h1>
            <p className="text-muted-foreground mt-1">Manage and access all your uploaded files.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search datasets..." 
                className="pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-full sm:w-64"
              />
            </div>
            <button className="p-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors">
              <Filter className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground font-medium">Loading your datasets...</p>
          </div>
        ) : !datasets || datasets.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border/50">
            <FileSpreadsheet className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground">No datasets found</h3>
            <p className="text-muted-foreground mt-2 mb-6">Upload a CSV file to get started.</p>
            <Link href="/">
              <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                Go to Upload
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">File Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shape</th>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Uploaded</th>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {datasets.map((dataset) => (
                    <tr key={dataset.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FileSpreadsheet className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{dataset.originalName}</div>
                            <div className="text-xs text-muted-foreground">{dataset.filename}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                          ${dataset.status === 'ready' ? 'bg-green-100 text-green-700' : 
                            dataset.status === 'analyzing' ? 'bg-amber-100 text-amber-700' : 
                            'bg-blue-100 text-blue-700'}
                        `}>
                          {dataset.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {dataset.rowCount ? `${dataset.rowCount} × ${dataset.colCount}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {format(new Date(dataset.createdAt!), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/datasets/${dataset.id}`}>
                          <button className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
