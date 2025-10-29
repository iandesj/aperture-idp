import { AperturePlugin } from "@/lib/plugins";
import { SystemsPageWrapper } from "./components/SystemsPageWrapper";

export const systemsPlugin: AperturePlugin = {
  id: "systems",
  name: "Systems",
  component: SystemsPageWrapper,
};

