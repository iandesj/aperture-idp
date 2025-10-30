import { TeamsPage } from "./TeamsPage";
import { getAllGroups } from "@/lib/groups";
import { getAllGroupRefs, getGroupAverageScore, getGroupStats } from "@/lib/catalog";

export function TeamsPageWrapper() {
  const groups = getAllGroups();
  const ownerRefs = new Set(getAllGroupRefs());

  const items = groups
    .filter((g) => ownerRefs.has(`group:${(g.metadata.namespace || 'default').toLowerCase()}/${g.metadata.name.toLowerCase()}`))
    .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name))
    .map((group) => {
      const ns = (group.metadata.namespace || 'default').toLowerCase();
      const ref = `group:${ns}/${group.metadata.name.toLowerCase()}`;
      return {
        name: group.metadata.name,
        description: group.metadata.description || "",
        ref,
        stats: getGroupStats(ref),
        averageScore: getGroupAverageScore(ref),
        href: `/teams/${group.metadata.name}`,
      };
    });

  return <TeamsPage items={items} />;
}


