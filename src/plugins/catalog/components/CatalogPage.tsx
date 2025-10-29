import { getAllComponents } from "@/lib/catalog";

export function CatalogPage() {
  const components = getAllComponents();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Software Catalog</h1>
      <ul>
        {components.map((component) => (
          <li key={component.metadata.name} className="border-b py-2">
            <h2 className="text-xl font-semibold">{component.metadata.name}</h2>
            <p>{component.metadata.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
