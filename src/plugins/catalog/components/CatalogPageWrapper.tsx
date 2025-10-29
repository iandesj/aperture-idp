import { getAllComponents, getComponentSource } from "@/lib/catalog";
import { CatalogPage } from "./CatalogPage";

export function CatalogPageWrapper() {
  const components = getAllComponents();
  
  // Add source information to each component for client display
  const componentsWithSource = components.map((component) => ({
    ...component,
    _source: getComponentSource(component.metadata.name) || undefined,
  }));
  
  return <CatalogPage components={componentsWithSource} />;
}

