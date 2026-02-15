import { useSeoMeta } from '@unhead/react';
import { Settings as SettingsIcon, Radio, Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RelayListManager } from '@/components/RelayListManager';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAppContext } from '@/hooks/useAppContext';
import { LoginArea } from '@/components/auth/LoginArea';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  useSeoMeta({
    title: 'Settings - Nostr Market Pulse',
    description: 'Configure your relays, theme, and preferences for Nostr Market Pulse.',
  });

  const { user } = useCurrentUser();
  const { config, setConfig } = useAppContext();
  const navigate = useNavigate();

  const toggleTheme = () => {
    setConfig({ ...config, theme: config.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/')}>
                ← Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                  <SettingsIcon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Settings
                  </h1>
                  <p className="text-sm text-muted-foreground">Manage your preferences</p>
                </div>
              </div>
            </div>
            <LoginArea className="max-w-60" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Theme Settings */}
          <Card className="border-0 shadow-lg bg-card backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-2">
                {config.theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>Customize how Nostr Market Pulse looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Theme</div>
                  <div className="text-sm text-muted-foreground">
                    Current: {config.theme === 'dark' ? 'Dark' : 'Light'} mode
                  </div>
                </div>
                <Button onClick={toggleTheme} variant="outline">
                  {config.theme === 'dark' ? (
                    <>
                      <Sun className="h-4 w-4 mr-2" />
                      Switch to Light
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 mr-2" />
                      Switch to Dark
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Relay Configuration */}
          <Card className="border-0 shadow-lg bg-card backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                <CardTitle>Relay Configuration</CardTitle>
              </div>
              <CardDescription>
                {user 
                  ? 'Manage your Nostr relays to customize which servers you connect to'
                  : 'Login to manage your relay list'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <RelayListManager />
              ) : (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">
                    Please log in to configure your relay list
                  </p>
                  <LoginArea className="inline-flex max-w-60" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Relays Info */}
          <Card className="border-0 shadow-lg bg-card backdrop-blur">
            <CardHeader>
              <CardTitle>Active Relays</CardTitle>
              <CardDescription>Currently connected relays for reading market data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {config.relayMetadata.relays.map((relay) => (
                  <div
                    key={relay.url}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4 text-green-500" />
                      <span className="font-mono text-sm">{relay.url}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {relay.read && <span>Read</span>}
                      {relay.write && <span>Write</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
