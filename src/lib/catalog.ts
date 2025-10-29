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
