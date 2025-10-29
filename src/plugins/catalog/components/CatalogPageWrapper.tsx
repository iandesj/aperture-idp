import { getAllComponents } from "@/lib/catalog";
import { CatalogPage } from "./CatalogPage";

export function CatalogPageWrapper() {
  const components = getAllComponents();
  return <CatalogPage components={components} />;
}

