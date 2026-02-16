// NOTE: This file is stable and usually should not be modified.
// It is important that all functionality in this file is preserved, and should only be modified if explicitly requested.

import React, { useState, useEffect } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLoginActions } from '@/hooks/useLoginActions';
import { DialogTitle } from '@radix-ui/react-dialog';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

const validateNpub = (npub: string) => {
  return /^npub1[a-zA-Z0-9]{58}$/.test(npub);
};

const validateBunkerUri = (uri: string) => {
  return uri.startsWith('bunker://');
};

const LoginDialog: React.FC<LoginDialogProps> = ({ isOpen, onClose, onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [npub, setNpub] = useState('');
  const [bunkerUri, setBunkerUri] = useState('');
  const [errors, setErrors] = useState<{
    npub?: string;
    bunker?: string;
    extension?: string;
  }>({});
  const login = useLoginActions();

  // Reset all state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(false);
      setNpub('');
      setBunkerUri('');
      setErrors({});
    }
  }, [isOpen]);

  const handleExtensionLogin = async () => {
    setIsLoading(true);
    setErrors(prev => ({ ...prev, extension: undefined }));

    try {
      if (!('nostr' in window)) {
        throw new Error('Nostr extension not found. Please install a NIP-07 extension.');
      }
      await login.extension();
      onLogin();
      onClose();
    } catch (e: unknown) {
      const error = e as Error;
      console.error('Extension login failed:', error);
      setErrors(prev => ({
        ...prev,
        extension: error instanceof Error ? error.message : 'Extension login failed'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNpubLogin = () => {
    if (!npub.trim()) {
      setErrors(prev => ({ ...prev, npub: 'Please enter your npub' }));
      return;
    }

    if (!validateNpub(npub)) {
      setErrors(prev => ({ ...prev, npub: 'Invalid npub format. Must start with npub1.' }));
      return;
    }

    setIsLoading(true);
    setErrors({});

    setTimeout(() => {
      try {
        login.npub(npub);
        onLogin();
        onClose();
      } catch (error) {
        setErrors({ npub: "Failed to login with this npub. Please check that it's correct." });
        setIsLoading(false);
      }
    }, 50);
  };

  const handleBunkerLogin = async () => {
    if (!bunkerUri.trim()) {
      setErrors(prev => ({ ...prev, bunker: 'Please enter a bunker URI' }));
      return;
    }

    if (!validateBunkerUri(bunkerUri)) {
      setErrors(prev => ({ ...prev, bunker: 'Invalid bunker URI format. Must start with bunker://' }));
      return;
    }

    setIsLoading(true);
    setErrors(prev => ({ ...prev, bunker: undefined }));

    try {
      await login.bunker(bunkerUri);
      onLogin();
      onClose();
      setBunkerUri('');
    } catch {
      setErrors(prev => ({
        ...prev,
        bunker: 'Failed to connect to bunker. Please check the URI.'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const hasExtension = 'nostr' in window;
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);

  const renderTabs = () => (
    <Tabs defaultValue="npub" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-muted/80 rounded-lg mb-4">
        <TabsTrigger value="npub" className="flex items-center gap-2">
          <span>Public Key (Read-Only)</span>
        </TabsTrigger>
        <TabsTrigger value="bunker" className="flex items-center gap-2">
          <span>Remote Signer</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value='npub' className='space-y-4'>
        <div className='p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4'>
          <p className='text-xs text-blue-900 dark:text-blue-300'>
            Read-only mode: You can view your feed and follows, but cannot post or react to content.
          </p>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleNpubLogin();
        }} className='space-y-4'>
          <div className='space-y-2'>
            <Input
              id='npub'
              type="text"
              value={npub}
              onChange={(e) => {
                setNpub(e.target.value);
                if (errors.npub) setErrors(prev => ({ ...prev, npub: undefined }));
              }}
              className={`rounded-lg ${
                errors.npub ? 'border-red-500 focus-visible:ring-red-500' : ''
              }`}
              placeholder='npub1...'
              autoComplete="off"
            />
            {errors.npub && (
              <p className="text-sm text-red-500">{errors.npub}</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isLoading || !npub.trim()}
            className="w-full"
          >
            {isLoading ? 'Verifying...' : 'View as Read-Only'}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value='bunker' className='space-y-4'>
        <div className='p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 mb-4'>
          <p className='text-xs text-green-900 dark:text-green-300'>
            Full access: You can post, react, and interact with content using your remote signer.
          </p>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleBunkerLogin();
        }} className='space-y-4'>
          <div className='space-y-2'>
            <Input
              id='bunkerUri'
              value={bunkerUri}
              onChange={(e) => {
                setBunkerUri(e.target.value);
                if (errors.bunker) setErrors(prev => ({ ...prev, bunker: undefined }));
              }}
              className={`rounded-lg border-gray-300 dark:border-gray-700 focus-visible:ring-primary ${
                errors.bunker ? 'border-red-500' : ''
              }`}
              placeholder='bunker://'
              autoComplete="off"
            />
            {errors.bunker && (
              <p className="text-sm text-red-500">{errors.bunker}</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className='w-full'
            disabled={isLoading || !bunkerUri.trim()}
          >
            {isLoading ? 'Connecting...' : 'Connect Signer'}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-sm max-h-[90dvh] p-0 gap-6 overflow-hidden rounded-2xl overflow-y-auto">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-lg font-semibold leading-none tracking-tight text-center">
            Log in
          </DialogTitle>
        </DialogHeader>

        <div className="flex size-40 text-8xl bg-primary/10 rounded-full items-center justify-center justify-self-center">
          🔑
        </div>

        <div className='px-6 pb-6 space-y-4 overflow-y-auto'>
          {/* Extension Login Button - shown if extension is available */}
          {hasExtension && (
            <div className="space-y-4">
              <div className='p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800'>
                <p className='text-xs text-green-900 dark:text-green-300'>
                  Full access: You can post, react, and interact with content using your browser extension.
                </p>
              </div>
              {errors.extension && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{errors.extension}</AlertDescription>
                </Alert>
              )}
              <Button
                className="w-full h-12 px-9"
                onClick={handleExtensionLogin}
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Log in with Extension'}
              </Button>
            </div>
          )}

          {/* Tabs - wrapped in collapsible if extension is available, otherwise shown directly */}
          {hasExtension ? (
            <Collapsible className="space-y-4" open={isMoreOptionsOpen} onOpenChange={setIsMoreOptionsOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <span>More Options</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isMoreOptionsOpen ? 'rotate-180' : ''}`} />
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                {renderTabs()}
              </CollapsibleContent>
            </Collapsible>
          ) : (
            renderTabs()
          )}
        </div>
      </DialogContent>
    </Dialog>
    );
  };

export default LoginDialog;
