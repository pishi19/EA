import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Ora System UI</h1>
      <Link href="/task-executor" className="text-xl text-blue-500 hover:underline">
        Go to Task Executor
      </Link>
    </main>
  );
} 