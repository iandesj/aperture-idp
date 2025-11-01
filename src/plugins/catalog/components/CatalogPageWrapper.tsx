import { getAllComponents, getComponentSource } from "@/lib/catalog";
import { featuresStore } from "@/lib/features/store";
import { CatalogPage } from "./CatalogPage";

export function CatalogPageWrapper() {
  const components = getAllComponents();
  
  // Add source information to each component for client display
  const componentsWithSource = components.map((component) => ({
    ...component,
    _source: getComponentSource(component.metadata.name) || undefined,
  }));
  
  const scoringEnabled = featuresStore.isFeatureEnabled('scoringEnabled');
  
  return <CatalogPage components={componentsWithSource} scoringEnabled={scoringEnabled} />;
}

