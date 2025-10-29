import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { Component } from "@/plugins/catalog/types";

const catalogDataDir = path.join(process.cwd(), "catalog-data");

export function getAllComponents(): Component[] {
  const fileNames = fs.readdirSync(catalogDataDir);
  const allComponentsData = fileNames.map((fileName) => {
    const fullPath = path.join(catalogDataDir, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const component = yaml.load(fileContents) as Component;
    return component;
  });
  return allComponentsData;
}

export function getCatalogStats() {
  const components = getAllComponents();
  
  const stats = {
    total: components.length,
    byType: {} as Record<string, number>,
    byLifecycle: {} as Record<string, number>,
  };
  
  components.forEach((component) => {
    const type = component.spec.type;
    const lifecycle = component.spec.lifecycle;
    
    stats.byType[type] = (stats.byType[type] || 0) + 1;
    stats.byLifecycle[lifecycle] = (stats.byLifecycle[lifecycle] || 0) + 1;
  });
  
  return stats;
}

export function getRecentComponents(limit: number = 6): Component[] {
  const components = getAllComponents();
  return components.slice(0, limit);
}

export function getComponentByName(name: string): Component | null {
  const components = getAllComponents();
  return components.find((c) => c.metadata.name === name) || null;
}

export function getAllSystems(): string[] {
  const components = getAllComponents();
  const systems = new Set<string>();
  
  components.forEach((component) => {
    if (component.spec.system) {
      systems.add(component.spec.system);
    }
  });
  
  return Array.from(systems).sort();
}

export function getSystemStats() {
  const components = getAllComponents();
  const stats: Record<string, { count: number; types: Record<string, number> }> = {};
  
  components.forEach((component) => {
    const system = component.spec.system || 'uncategorized';
    
    if (!stats[system]) {
      stats[system] = { count: 0, types: {} };
    }
    
    stats[system].count++;
    stats[system].types[component.spec.type] = (stats[system].types[component.spec.type] || 0) + 1;
  });
  
  return stats;
}

export function getComponentsBySystem(systemName: string): Component[] {
  const components = getAllComponents();
  return components.filter((c) => c.spec.system === systemName);
}

export function getComponentDependencies(componentName: string): Component[] {
  const component = getComponentByName(componentName);
  if (!component || !component.spec.dependsOn) {
    return [];
  }
  
  const allComponents = getAllComponents();
  return component.spec.dependsOn
    .map((depName) => allComponents.find((c) => c.metadata.name === depName))
    .filter((c): c is Component => c !== undefined);
}

export function getComponentDependents(componentName: string): Component[] {
  const allComponents = getAllComponents();
  return allComponents.filter(
    (c) => c.spec.dependsOn?.includes(componentName)
  );
}

export function getDependencyGraph(componentName: string, depth: number = 1): {
  component: Component;
  dependencies: Component[];
  dependents: Component[];
  indirectDependencies: Component[];
  indirectDependents: Component[];
} {
  const component = getComponentByName(componentName);
  if (!component) {
    return {
      component: {} as Component,
      dependencies: [],
      dependents: [],
      indirectDependencies: [],
      indirectDependents: [],
    };
  }

  const dependencies = getComponentDependencies(componentName);
  const dependents = getComponentDependents(componentName);
  
  console.log(`getDependencyGraph for ${componentName}:`, {
    dependencies: dependencies.map(d => d.metadata.name),
    dependents: dependents.map(d => d.metadata.name),
  });
  
  let indirectDependencies: Component[] = [];
  let indirectDependents: Component[] = [];

  if (depth > 0) {
    const directDepNames = new Set(dependencies.map((d) => d.metadata.name));
    dependencies.forEach((dep) => {
      const depDeps = getComponentDependencies(dep.metadata.name);
      depDeps.forEach((dd) => {
        if (
          dd.metadata.name !== componentName &&
          !directDepNames.has(dd.metadata.name) &&
          !indirectDependencies.some((id) => id.metadata.name === dd.metadata.name)
        ) {
          indirectDependencies.push(dd);
        }
      });
    });

    const directDepentNames = new Set(dependents.map((d) => d.metadata.name));
    dependents.forEach((dependent) => {
      const depDeps = getComponentDependents(dependent.metadata.name);
      depDeps.forEach((dd) => {
        if (
          dd.metadata.name !== componentName &&
          !directDepentNames.has(dd.metadata.name) &&
          !indirectDependents.some((id) => id.metadata.name === dd.metadata.name)
        ) {
          indirectDependents.push(dd);
        }
      });
    });
  }

  return {
    component,
    dependencies,
    dependents,
    indirectDependencies,
    indirectDependents,
  };
}
