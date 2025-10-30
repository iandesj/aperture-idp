// In the future, we will dynamically load plugins
// For now, we manually import them
import { ReactElement } from "react";
import { catalogPlugin } from "@/plugins/catalog";
import { systemsPlugin } from "@/plugins/systems";
import { teamsPlugin } from "@/plugins/teams";

export interface AperturePlugin {
  id: string;
  name: string;
  component: () => ReactElement;
}

const plugins: AperturePlugin[] = [
  catalogPlugin,
  systemsPlugin,
  teamsPlugin
];

export function getPlugins(): AperturePlugin[] {
  return plugins;
}

export function getPlugin(id: string): AperturePlugin | undefined {
  return plugins.find((p) => p.id === id);
}
