import { AperturePlugin } from "@/lib/plugins";
// In the future, we will dynamically load plugins
// For now, we manually import them
// import { catalogPlugin } from "@/plugins/catalog";

export interface AperturePlugin {
  id: string;
  name: string;
  component: () => JSX.Element;
}

const plugins: AperturePlugin[] = [
  // catalogPlugin
];

export function getPlugins(): AperturePlugin[] {
  return plugins;
}

export function getPlugin(id: string): AperturePlugin | undefined {
  return plugins.find((p) => p.id === id);
}
