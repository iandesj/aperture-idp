import { AperturePlugin } from "@/lib/plugins";
import { TeamsPageWrapper } from "./components/TeamsPageWrapper";

export const teamsPlugin: AperturePlugin = {
  id: "teams",
  name: "Teams",
  component: TeamsPageWrapper,
};


