import { useSeoMeta } from '@unhead/react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Server, Zap, Shield, Gauge } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  useSeoMeta({
    title: 'Lightning Node Setup Guides - Bitcoin & Lightning Network',
    description: 'Comprehensive guides for setting up Bitcoin and Lightning Network nodes with LND or phoenixd on Debian and Ubuntu LTS.',
  });

  const guides = [
    {
      title: 'LND on Debian',
      description: 'Complete guide for setting up LND (Lightning Network Daemon) on Debian LTS with ThunderHub, LNDG, and Balance of Satoshis.',
      href: '/lnd/debian',
      icon: Server,
    },
    {
      title: 'LND on Ubuntu',
      description: 'Complete guide for setting up LND (Lightning Network Daemon) on Ubuntu LTS with ThunderHub, LNDG, and Balance of Satoshis.',
      href: '/lnd/ubuntu',
      icon: Server,
    },
    {
      title: 'phoenixd on Debian',
      description: 'Minimal setup guide for phoenixd Lightning daemon on Debian LTS with phoenixd-dashboard for web management.',
      href: '/phoenixd/debian',
      icon: Zap,
    },
    {
      title: 'phoenixd on Ubuntu',
      description: 'Minimal setup guide for phoenixd Lightning daemon on Ubuntu LTS with phoenixd-dashboard for web management.',
      href: '/phoenixd/ubuntu',
      icon: Zap,
    },
  ];

  const features = [
    {
      icon: Gauge,
      title: 'Minimal Overhead',
      description: 'Optimized for VPS deployment with pruned Bitcoin backend and minimal resource usage.',
    },
    {
      icon: Shield,
      title: 'Security First',
      description: 'Hardware key-based SSH authentication, Tor hidden services, and SSL/TLS encryption.',
    },
    {
      icon: Zap,
      title: 'Production Ready',
      description: 'Complete setup including monitoring tools, web dashboards, and best practices.',
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container px-4 py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-2 text-sm">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-medium">Lightning Network Node Setup</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-6">
              Bitcoin & Lightning Node{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Setup Guides
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Comprehensive, minimal-overhead guides for setting up Bitcoin and Lightning Network nodes 
              on Debian and Ubuntu LTS. Optimized for VPS deployment with pruned backends.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="group">
                <Link to="/lnd/debian">
                  Get Started with LND
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/phoenixd/debian">
                  Try phoenixd
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why These Guides?</h2>
            <p className="text-muted-foreground">
              Built for real-world VPS deployments with minimal resources and maximum security.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title} className="border-2">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Guides Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Setup</h2>
            <p className="text-muted-foreground">
              Select the Lightning implementation and operating system that fits your needs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {guides.map((guide) => (
              <Card key={guide.href} className="group hover:shadow-lg transition-all hover:border-primary/50">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
                    <guide.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{guide.title}</CardTitle>
                  <CardDescription className="text-base">{guide.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="ghost" className="group/btn w-full justify-between">
                    <Link to={guide.href}>
                      View Guide
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold mb-8 text-center">What's Included</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Core Services</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Bitcoin Core (bitcoind) with pruned backend</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>LND or phoenixd Lightning daemon</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>ThunderHub & LNDG web dashboards (LND)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>phoenixd-dashboard (phoenixd)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Balance of Satoshis CLI tools (LND)</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Infrastructure</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Tor for hidden service access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Nginx with SSL/TLS for remote access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Docker Engine & Docker Compose</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>ZSH shell configuration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Hardware key SSH authentication</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
