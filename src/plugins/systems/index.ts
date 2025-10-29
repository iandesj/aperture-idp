import { Plugin } from "../catalog/types";
import { SystemsPageWrapper } from "./components/SystemsPageWrapper";

export const systemsPlugin: Plugin = {
  id: "systems",
  name: "Systems",
  component: SystemsPageWrapper,
};

