import { Suspense } from "react";
import JoinClient from "./JoinClient";

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-lab-wash text-lab-muted">
          Loading…
        </div>
      }
    >
      <JoinClient />
    </Suspense>
  );
}
