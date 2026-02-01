import { Layout } from './Layout';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertTriangle, Info, Terminal, FileCode } from 'lucide-react';
import { ReactNode } from 'react';

interface GuideLayoutProps {
  title: string;
  description: string;
  os: 'Debian' | 'Ubuntu';
  daemon: 'LND' | 'phoenixd';
  children: ReactNode;
}

export function GuideLayout({ title, description, os, daemon, children }: GuideLayoutProps) {
  return (
    <Layout>
      <div className="container px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline">{os} LTS</Badge>
            <Badge variant="outline">{daemon}</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">{title}</h1>
          <p className="text-lg text-muted-foreground">{description}</p>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {children}
        </div>
      </div>
    </Layout>
  );
}

// Reusable components for guide content
export function GuideSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-4 pb-2 border-b">{title}</h2>
      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}

export function CodeBlock({ children, language = 'bash' }: { children: string; language?: string }) {
  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Badge variant="secondary" className="text-xs">{language}</Badge>
      </div>
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto border">
        <code className="text-sm font-mono">{children}</code>
      </pre>
    </div>
  );
}

export function ConfigFile({ filename, children }: { filename: string; children: string }) {
  return (
    <div className="my-4">
      <div className="flex items-center gap-2 mb-2">
        <FileCode className="h-4 w-4 text-muted-foreground" />
        <code className="text-sm font-semibold">{filename}</code>
      </div>
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto border text-sm">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function InfoBox({ children }: { children: ReactNode }) {
  return (
    <Alert className="my-4 border-blue-500/50 bg-blue-500/5">
      <Info className="h-4 w-4 text-blue-500" />
      <AlertDescription className="text-sm">
        {children}
      </AlertDescription>
    </Alert>
  );
}

export function WarningBox({ children }: { children: ReactNode }) {
  return (
    <Alert className="my-4 border-yellow-500/50 bg-yellow-500/5">
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
      <AlertDescription className="text-sm">
        {children}
      </AlertDescription>
    </Alert>
  );
}

export function CommandBox({ children }: { children: string }) {
  return (
    <div className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg border my-3">
      <Terminal className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
      <code className="text-sm font-mono flex-1">{children}</code>
    </div>
  );
}

export function RequirementsTable({ requirements }: { requirements: { component: string; minimum: string; recommended: string }[] }) {
  return (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-semibold">Component</th>
            <th className="text-left p-3 font-semibold">Minimum</th>
            <th className="text-left p-3 font-semibold">Recommended</th>
          </tr>
        </thead>
        <tbody>
          {requirements.map((req, idx) => (
            <tr key={idx} className="border-b">
              <td className="p-3">{req.component}</td>
              <td className="p-3 text-muted-foreground">{req.minimum}</td>
              <td className="p-3 text-primary font-medium">{req.recommended}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
