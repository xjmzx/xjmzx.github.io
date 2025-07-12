
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Plus, Trash2 } from "lucide-react";

interface NostrConfigProps {
  relays: string[];
  onRelaysChange: (relays: string[]) => void;
  pubkey: string;
  onPubkeyChange: (pubkey: string) => void;
}

export const NostrConfig = ({ relays, onRelaysChange, pubkey, onPubkeyChange }: NostrConfigProps) => {
  const [newRelay, setNewRelay] = useState("");
  const [open, setOpen] = useState(false);

  const addRelay = () => {
    if (newRelay && !relays.includes(newRelay)) {
      onRelaysChange([...relays, newRelay]);
      setNewRelay("");
    }
  };

  const removeRelay = (relay: string) => {
    onRelaysChange(relays.filter(r => r !== relay));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configure
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nostr Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="pubkey">Your Public Key (npub or hex)</Label>
            <Input
              id="pubkey"
              value={pubkey}
              onChange={(e) => onPubkeyChange(e.target.value)}
              placeholder="npub1... or hex key"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>Relays</Label>
            <div className="space-y-2 mt-2">
              {relays.map((relay) => (
                <div key={relay} className="flex items-center justify-between">
                  <Badge variant="secondary" className="flex-1 justify-start">
                    {relay.replace('wss://', '')}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRelay(relay)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 mt-2">
              <Input
                value={newRelay}
                onChange={(e) => setNewRelay(e.target.value)}
                placeholder="wss://relay.example.com"
                onKeyPress={(e) => e.key === 'Enter' && addRelay()}
              />
              <Button onClick={addRelay} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
