import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Ora System UI</h1>
      <div className="flex flex-col items-center space-y-4">
        <p className="text-lg text-muted-foreground text-center mb-6">
          Canonical Three-Page Workflow
        </p>
        <Link href="/planning" className="text-xl text-blue-500 hover:underline">
          Go to Planning
        </Link>
        <Link href="/workstream-filter-demo" className="text-lg text-green-600 hover:underline">
          Go to Workstream
        </Link>
        <Link href="/semantic-chat-classic" className="text-lg text-purple-600 hover:underline">
          Go to Contextual Chat
        </Link>
      </div>
    </main>
  );
} 