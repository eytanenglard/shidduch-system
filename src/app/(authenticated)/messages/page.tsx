"use client";

import MessagesPage from "@/app/components/messages/MessagesPage";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

export default function Messages() {
  return (
    <Suspense
      fallback={
        <Card className="m-4">
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </Card>
      }
    >
      <MessagesPage />
    </Suspense>
  );
}
