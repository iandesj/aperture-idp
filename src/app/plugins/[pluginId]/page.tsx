import { getPlugin, getPlugins } from "@/lib/plugins";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const plugins = getPlugins();
 
  return plugins.map((plugin) => ({
    pluginId: plugin.id,
  }));
}

export default async function PluginPage({ params }: { params: Promise<{ pluginId: string }> }) {
  const { pluginId } = await params;
  const plugin = getPlugin(pluginId);

  if (!plugin) {
    notFound();
  }

  const PluginComponent = plugin.component;

  return <PluginComponent />;
}
