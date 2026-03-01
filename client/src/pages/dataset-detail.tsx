import { useState } from "react";
import { useParams } from "wouter";
import { Layout } from "@/components/layout";
import { useDataset, useAnalyzeDataset, useSuggestDataset, useCleanDataset, useAutoMLDataset } from "@/hooks/use-datasets";
import { Loader2, Activity, Database, Sparkles, Wand2, Settings2, Download, Table2, AlertCircle, BarChart3 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DatasetDetail() {
  const { id } = useParams<{ id: string }>();
  const datasetId = parseInt(id);
  const { data: dataset, isLoading } = useDataset(datasetId);
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!dataset) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-foreground">Dataset not found</h2>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Database className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">{dataset.originalName}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="capitalize px-2 py-0.5 rounded-md bg-muted text-foreground font-medium">{dataset.status}</span>
                {dataset.rowCount && <span>{dataset.rowCount.toLocaleString()} rows</span>}
                {dataset.colCount && <span>{dataset.colCount} columns</span>}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {dataset.status === 'uploaded' && (
              <AnalyzeButton datasetId={dataset.id} />
            )}
            {dataset.cleanedFilename && (
              <a 
                href={`/uploads/${dataset.cleanedFilename}`} 
                download
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl font-medium hover:bg-green-100 transition-colors"
              >
                <Download className="w-4 h-4" /> Download Cleaned CSV
              </a>
            )}
          </div>
        </div>

        {/* Needs Analysis Warning */}
        {dataset.status === 'uploaded' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-amber-500" />
            <div>
              <h3 className="text-lg font-semibold text-amber-800">Analysis Required</h3>
              <p className="text-amber-700/80 mt-1 max-w-md">We need to analyze this dataset before providing suggestions, cleaning, or running ML tasks.</p>
            </div>
            <AnalyzeButton datasetId={dataset.id} size="lg" />
          </div>
        )}

        {/* Main Tabs */}
        {dataset.status !== 'uploaded' && (
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex overflow-x-auto border-b border-border/50 scrollbar-hide">
              <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={BarChart3} label="Overview & Stats" />
              <TabButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={Sparkles} label="AI Doctor" />
              <TabButton active={activeTab === 'clean'} onClick={() => setActiveTab('clean')} icon={Wand2} label="Data Cleaning" />
              <TabButton active={activeTab === 'automl'} onClick={() => setActiveTab('automl')} icon={Settings2} label="Auto ML" />
            </div>

            <div className="p-6 min-h-[500px]">
              {activeTab === 'overview' && <OverviewTab dataset={dataset} />}
              {activeTab === 'ai' && <AITab datasetId={dataset.id} />}
              {activeTab === 'clean' && <CleaningTab datasetId={dataset.id} />}
              {activeTab === 'automl' && <AutoMLTab datasetId={dataset.id} columns={dataset.summary?.columns || []} />}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// --- Sub Components ---

function AnalyzeButton({ datasetId, size = "default" }: { datasetId: number, size?: "default" | "lg" }) {
  const mutation = useAnalyzeDataset();
  
  return (
    <button
      onClick={() => mutation.mutate(datasetId)}
      disabled={mutation.isPending}
      className={`
        bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2
        hover:bg-primary/90 transition-all shadow-md shadow-primary/20
        disabled:opacity-50 disabled:cursor-not-allowed
        ${size === 'lg' ? 'px-8 py-3 text-lg' : 'px-4 py-2 text-sm'}
      `}
    >
      {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
      {mutation.isPending ? "Analyzing..." : "Analyze Dataset"}
    </button>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors relative
        ${active ? "text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}
      `}
    >
      <Icon className={`w-4 h-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
      {label}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
      )}
    </button>
  );
}

function OverviewTab({ dataset }: { dataset: any }) {
  const summary = dataset.summary || {};
  const missingValues = summary.missingValues || {};
  
  // Format data for chart
  const missingChartData = Object.entries(missingValues)
    .filter(([_, count]) => (count as number) > 0)
    .map(([name, count]) => ({ name, count }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Rows" value={dataset.rowCount?.toLocaleString()} icon={Table2} />
        <StatCard title="Total Columns" value={dataset.colCount} icon={Database} />
        <StatCard title="Duplicate Rows" value={summary.duplicateRows ?? 0} icon={AlertCircle} color="amber" />
        <StatCard 
          title="Total Missing" 
          value={Object.values(missingValues).reduce((a: any, b: any) => a + b, 0)} 
          icon={Activity} 
          color="destructive"
        />
      </div>

      {missingChartData.length > 0 && (
        <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
          <h3 className="text-lg font-display font-semibold mb-6">Missing Values by Column</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={missingChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} angle={-45} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {missingChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill="hsl(var(--primary))" fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color = "primary" }: any) {
  const colorMap: any = {
    primary: "text-primary bg-primary/10",
    amber: "text-amber-600 bg-amber-100",
    destructive: "text-destructive bg-destructive/10"
  };

  return (
    <div className="bg-background rounded-2xl p-5 border border-border/50 shadow-sm flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colorMap[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-display font-bold text-foreground mt-1">{value ?? '-'}</p>
      </div>
    </div>
  );
}

function AITab({ datasetId }: { datasetId: number }) {
  const mutation = useSuggestDataset();
  const [result, setResult] = useState<string | null>(null);

  const handleSuggest = () => {
    mutation.mutate(datasetId, {
      onSuccess: (data) => setResult(data.suggestions)
    });
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-2xl p-8 border border-primary/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-accent/20 blur-3xl rounded-full"></div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">AI Data Doctor</h2>
        <p className="text-muted-foreground mb-6">Let our AI analyze your data profile and suggest the best preprocessing and modeling strategies.</p>
        
        <button
          onClick={handleSuggest}
          disabled={mutation.isPending}
          className="bg-accent text-accent-foreground px-6 py-3 rounded-xl font-semibold shadow-lg shadow-accent/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
        >
          {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {mutation.isPending ? "Generating Insights..." : "Generate AI Suggestions"}
        </button>
      </div>

      {result && (
        <div className="prose prose-slate max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary bg-background rounded-2xl p-8 border border-border/50 shadow-sm">
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function CleaningTab({ datasetId }: { datasetId: number }) {
  const mutation = useCleanDataset();
  
  const [formData, setFormData] = useState<CleanDataRequest>({
    handleMissing: 'mean',
    removeDuplicates: true,
    encodeCategorical: true,
    normalize: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ id: datasetId, ...formData });
  };

  return (
    <div className="max-w-2xl animate-in fade-in duration-500">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6 bg-background rounded-2xl p-6 border border-border/50">
          
          {/* Missing Values */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">Missing Values Strategy</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['drop', 'mean', 'median', 'mode', 'none'].map((val) => (
                <label key={val} className={`
                  border rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all
                  ${formData.handleMissing === val ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:bg-muted'}
                `}>
                  <input 
                    type="radio" 
                    name="handleMissing" 
                    value={val} 
                    checked={formData.handleMissing === val}
                    onChange={(e) => setFormData({...formData, handleMissing: e.target.value as any})}
                    className="text-primary focus:ring-primary w-4 h-4"
                  />
                  <span className="text-sm font-medium capitalize">{val}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <ToggleRow 
              label="Remove Duplicate Rows" 
              desc="Drops exact row matches across all columns."
              checked={formData.removeDuplicates} 
              onChange={(v) => setFormData({...formData, removeDuplicates: v})} 
            />
            <ToggleRow 
              label="Encode Categorical Data" 
              desc="Applies One-Hot or Label encoding to text columns."
              checked={formData.encodeCategorical} 
              onChange={(v) => setFormData({...formData, encodeCategorical: v})} 
            />
            <ToggleRow 
              label="Normalize Numeric Data" 
              desc="Scales numeric features to standard range (0-1)."
              checked={formData.normalize} 
              onChange={(v) => setFormData({...formData, normalize: v})} 
            />
          </div>

        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-primary text-primary-foreground px-6 py-4 rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex justify-center items-center gap-2 disabled:opacity-50 disabled:transform-none"
        >
          {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
          {mutation.isPending ? "Cleaning Dataset..." : "Execute Cleaning Pipeline"}
        </button>
      </form>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }: any) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="font-medium text-foreground text-sm">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer ml-4">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className="w-11 h-6 bg-muted border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
  );
}

function AutoMLTab({ datasetId, columns = [] }: { datasetId: number, columns: string[] }) {
  const mutation = useAutoMLDataset();
  const [target, setTarget] = useState("");
  const [taskType, setTaskType] = useState<'classification' | 'regression'>("classification");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    mutation.mutate({ id: datasetId, targetColumn: target, taskType });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <div>
        <form onSubmit={handleSubmit} className="bg-background rounded-2xl p-6 border border-border/50 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-display font-semibold">Quick Train Model</h2>
            <p className="text-sm text-muted-foreground">Train a baseline model to get feature importance and an initial accuracy score.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Target Column (y)</label>
              <select 
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm appearance-none"
                required
              >
                <option value="" disabled>Select column to predict...</option>
                {columns.map(col => <option key={col} value={col}>{col}</option>)}
                {/* Fallback if columns not provided in summary yet */}
                {columns.length === 0 && <option value="target">Please analyze data first</option>}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Task Type</label>
              <div className="grid grid-cols-2 gap-3">
                {['classification', 'regression'].map((val) => (
                  <label key={val} className={`
                    border rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-all text-sm font-medium capitalize
                    ${taskType === val ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/20' : 'border-border hover:bg-muted text-muted-foreground'}
                  `}>
                    <input 
                      type="radio" 
                      name="taskType" 
                      className="hidden"
                      checked={taskType === val}
                      onChange={() => setTaskType(val as any)}
                    />
                    {val}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || !target}
            className="w-full bg-foreground text-background px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex justify-center items-center gap-2 disabled:opacity-50 disabled:transform-none"
          >
            {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Settings2 className="w-5 h-5" />}
            {mutation.isPending ? "Training Model..." : "Start Training"}
          </button>
        </form>
      </div>

      <div>
        {mutation.data ? (
          <div className="bg-background rounded-2xl p-6 border border-border/50 h-full">
            <h3 className="text-xl font-display font-semibold mb-6">Results</h3>
            <div className="p-6 bg-green-50 rounded-xl border border-green-200 mb-6 text-center">
              <p className="text-green-800 font-medium text-sm">Model Score (Accuracy/R2)</p>
              <p className="text-4xl font-display font-bold text-green-600 mt-2">
                {(mutation.data.results?.score * 100).toFixed(1)}%
              </p>
            </div>
            
            {mutation.data.results?.featureImportance && (
              <div>
                <h4 className="font-semibold text-sm mb-3">Top Features</h4>
                <div className="space-y-3">
                  {Object.entries(mutation.data.results.featureImportance)
                    .slice(0, 5)
                    .map(([name, imp]: any) => (
                      <div key={name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">{name}</span>
                          <span className="text-muted-foreground">{(imp * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${imp * 100}%` }}></div>
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground/50 p-8 text-center min-h-[300px]">
            <Settings2 className="w-12 h-12 mb-3 opacity-50" />
            <p>Training results will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
