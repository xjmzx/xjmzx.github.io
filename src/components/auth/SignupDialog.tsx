// NOTE: This file is stable and usually should not be modified.
// It is important that all functionality in this file is preserved, and should only be modified if explicitly requested.

import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLoginActions } from '@/hooks/useLoginActions';

interface SignupDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignupDialog: React.FC<SignupDialogProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const login = useLoginActions();

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(false);
      setError('');
    }
  }, [isOpen]);

  const handleExtensionSignup = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (!('nostr' in window)) {
        throw new Error('Nostr extension not found. Please install a NIP-07 extension like Alby, nos2x, or Flamingo.');
      }
      await login.extension();
      onClose();
    } catch (e: unknown) {
      const error = e as Error;
      console.error('Extension signup failed:', error);
      setError(error instanceof Error ? error.message : 'Extension signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const hasExtension = 'nostr' in window;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90dvh] p-0 gap-6 overflow-hidden rounded-2xl overflow-y-auto">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-lg font-semibold leading-none tracking-tight text-center">
            Sign up
          </DialogTitle>
        </DialogHeader>

        <div className="flex size-40 text-8xl bg-primary/10 rounded-full items-center justify-center justify-self-center">
          🔑
        </div>

        <div className='px-6 pb-6 space-y-6 overflow-y-auto'>
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">Create Your Nostr Account</h3>
            <p className="text-sm text-muted-foreground">
              To get started with Nostr, you'll need to create an account using a browser extension or remote signer.
            </p>
          </div>

          {/* Extension Signup */}
          {hasExtension ? (
            <div className="space-y-4">
              <div className='p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800'>
                <div className='font-medium text-green-900 dark:text-green-300 mb-1'>
                  Browser Extension Detected
                </div>
                <p className='text-xs text-green-900 dark:text-green-300'>
                  Your Nostr extension will securely manage your keys. Click below to connect.
                </p>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                className="w-full h-12 px-9"
                onClick={handleExtensionSignup}
                disabled={isLoading}
              >
                {isLoading ? 'Connecting...' : 'Connect Extension'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className='p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800'>
                <div className='font-medium text-amber-900 dark:text-amber-300 mb-2'>
                  No Extension Detected
                </div>
                <p className='text-xs text-amber-900 dark:text-amber-300 mb-3'>
                  To create a Nostr account, please install a browser extension:
                </p>
                <ul className='text-xs text-amber-900 dark:text-amber-300 space-y-1 list-disc list-inside'>
                  <li><a href="https://getalby.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-700">Alby</a> - Bitcoin Lightning wallet + Nostr</li>
                  <li><a href="https://github.com/fiatjaf/nos2x" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-700">nos2x</a> - Simple Nostr extension</li>
                  <li><a href="https://www.getflamingo.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-700">Flamingo</a> - Full-featured Nostr extension</li>
                </ul>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                After installing an extension, refresh this page and try again.
              </p>
            </div>
          )}

          {/* Remote Signer Option */}
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <div className='p-3 bg-muted/50 rounded-lg border'>
              <div className='font-medium text-sm mb-1'>
                Have a Remote Signer?
              </div>
              <p className='text-xs text-muted-foreground mb-3'>
                Use a bunker:// URI to connect to your remote signing device (NIP-46).
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  // Switch to bunker tab in more options
                  setIsMoreOptionsOpen(true);
                }}
              >
                Use Remote Signer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignupDialog;
