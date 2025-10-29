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
