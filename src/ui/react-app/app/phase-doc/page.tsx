import { Suspense } from 'react';
import PhaseDocView from "@/components/PhaseDocView";

export default function PhaseDocPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4">Loading phase document...</div>}>
      <PhaseDocView />
    </Suspense>
  );
} 