import Link from "next/link";
import { Suspense } from 'react';
import ProjectList from '../components/features/projects/ProjectList';

export default function Home() {
  return (
    <main className="min-h-screen p-24">
      <h1 className="text-4xl font-bold mb-8">Task Assistant</h1>
      
      <Suspense fallback={<div>Loading projects...</div>}>
        <ProjectList />
      </Suspense>
    </main>
  );
}
