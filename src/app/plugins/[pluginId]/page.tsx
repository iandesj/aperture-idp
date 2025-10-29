import { getPlugin } from "@/lib/plugins";
import { notFound } from "next/navigation";

export default function PluginPage({ params }: { params: { pluginId: string } }) {
  const plugin = getPlugin(params.pluginId);

  if (!plugin) {
    notFound();
  }

  const PluginComponent = plugin.component;

  return <PluginComponent />;
}
