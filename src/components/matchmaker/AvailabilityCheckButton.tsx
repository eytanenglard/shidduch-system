// components/matchmaker/AvailabilityCheckButton.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Client } from "@/app/types/matchmaker";

interface Props {
  client: Client;
  onCheckAvailability: (clientId: string) => Promise<void>;
}

export default function AvailabilityCheckButton({ client, onCheckAvailability }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheck = async () => {
    try {
      setIsLoading(true);
      setError("");
      await onCheckAvailability(client.id);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check availability");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="w-full"
        disabled={isLoading}
      >
        <AlertCircle className="ml-2 h-4 w-4" />
        בדוק זמינות
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>בדיקת זמינות</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p>
              האם לשלוח בדיקת זמינות ל{client.firstName} {client.lastName}?
            </p>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleCheck} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                "שלח בדיקה"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}