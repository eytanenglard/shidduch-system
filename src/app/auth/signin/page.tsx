// src/app/auth/signin/page.tsx

import SignInForm from "@/app/components/auth/SignInForm";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SignInForm />
    </Suspense>
  );
}