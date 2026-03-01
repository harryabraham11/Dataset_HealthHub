import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Database, UploadCloud, FileBarChart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/datasets", label: "My Datasets", icon: Database },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border/50 flex-shrink-0 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight text-foreground">AI Dataset Doctor</h1>
            <p className="text-xs text-muted-foreground font-medium">Smart Data Prep</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 mt-4 px-2">Menu</div>
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"}
                  `}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 mt-auto">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <FileBarChart className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold">Pro Tip</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Run AI Suggestions before cleaning your data to get the best preprocessing strategy.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur flex items-center px-8 flex-shrink-0 z-10">
          <h2 className="font-display font-semibold text-foreground/80 capitalize">
            {location === "/" ? "Overview" : location.split("/")[1].replace("-", " ")}
          </h2>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-6xl mx-auto"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
