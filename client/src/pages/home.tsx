import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Layout } from "@/components/layout";
import { useDatasets, useUploadDataset } from "@/hooks/use-datasets";
import { Link, useLocation } from "wouter";
import { UploadCloud, FileSpreadsheet, Loader2, ArrowRight, Activity, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Home() {
  const [_, setLocation] = useLocation();
  const { data: datasets, isLoading } = useDatasets();
  const uploadMutation = useUploadDataset();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadMutation.mutate(acceptedFiles[0], {
        onSuccess: (data) => {
          setLocation(`/datasets/${data.id}`);
        }
      });
    }
  }, [uploadMutation, setLocation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    multiple: false
  });

  const recentDatasets = datasets?.slice(0, 3) || [];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground">Welcome to Doctor</h1>
          <p className="text-muted-foreground mt-2 text-lg">Upload a dataset to diagnose, clean, and model your data.</p>
        </div>

        {/* Upload Zone */}
        <div 
          {...getRootProps()} 
          className={`
            border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
            ${isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-card/50"}
            ${uploadMutation.isPending ? "opacity-50 pointer-events-none" : ""}
            glass-card
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              {uploadMutation.isPending ? (
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              ) : (
                <UploadCloud className="w-10 h-10 text-primary" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold">
                {uploadMutation.isPending ? "Uploading..." : "Click or drag CSV to upload"}
              </h3>
              <p className="text-muted-foreground mt-1">Maximum file size 50MB</p>
            </div>
          </div>
        </div>

        {/* Recent Datasets */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-semibold">Recent Datasets</h2>
            <Link href="/datasets" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : recentDatasets.length === 0 ? (
            <div className="text-center p-12 bg-card rounded-2xl border border-border/50 shadow-sm">
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-foreground">No datasets yet</h3>
              <p className="text-muted-foreground text-sm mt-1">Upload your first CSV above to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentDatasets.map((dataset) => (
                <Link key={dataset.id} href={`/datasets/${dataset.id}`} className="block group">
                  <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-blue-500/10 rounded-xl">
                        <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                      </div>
                      <StatusBadge status={dataset.status} />
                    </div>
                    <h3 className="font-semibold text-foreground truncate" title={dataset.originalName}>
                      {dataset.originalName}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(dataset.createdAt!), { addSuffix: true })}
                    </p>
                    {dataset.rowCount && (
                      <div className="mt-4 pt-4 border-t border-border/50 flex gap-4 text-sm text-muted-foreground font-medium">
                        <div><span className="text-foreground">{dataset.rowCount}</span> rows</div>
                        <div><span className="text-foreground">{dataset.colCount}</span> cols</div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ready') return <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3.5 h-3.5"/> Ready</span>;
  if (status === 'analyzing') return <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full"><Activity className="w-3.5 h-3.5 animate-pulse"/> Analyzing</span>;
  return <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full capitalize">{status}</span>;
}
