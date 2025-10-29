import Link from "next/link";

export function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-4">
      <Link href="/" className="text-2xl font-bold">
        Aperture
      </Link>
      <nav className="mt-8">
        <ul>
          {/* Plugin links will go here */}
        </ul>
      </nav>
    </aside>
  );
}
