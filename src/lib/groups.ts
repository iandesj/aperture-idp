import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export interface Group {
  apiVersion: "backstage.io/v1alpha1";
  kind: "Group";
  metadata: {
    name: string;
    description?: string;
    tags?: string[];
    links?: {
      url: string;
      title?: string;
      icon?: string;
    }[];
    namespace?: string; // Backstage default is "default" when omitted
  };
  spec?: {
    type?: string; // team, squad, etc.
    profile?: {
      displayName?: string;
      email?: string;
      picture?: string;
    };
    children?: string[]; // entity refs
    parent?: string; // entity ref
    members?: string[]; // entity refs
  };
}

const catalogDataDir = path.join(process.cwd(), "catalog-data");

export function normalizeGroupRef(refOrName: string): string {
  // Accept formats:
  // - "team-platform" => group:default/team-platform
  // - "group:team-platform" => group:default/team-platform
  // - "group:default/team-platform" => as-is normalized casing
  const trimmed = refOrName.trim();

  if (trimmed.startsWith("group:")) {
    const withoutPrefix = trimmed.slice("group:".length);
    if (withoutPrefix.includes("/")) {
      const [namespace, name] = withoutPrefix.split("/");
      return `group:${(namespace || "default").toLowerCase()}/${name.toLowerCase()}`;
    }
    return `group:default/${withoutPrefix.toLowerCase()}`;
  }

  // plain name
  return `group:default/${trimmed.toLowerCase()}`;
}

export function parseYamlDocuments(fileContent: string): unknown[] {
  const docs: unknown[] = [];
  yaml.loadAll(fileContent, (doc) => {
    if (doc) docs.push(doc);
  });
  return docs;
}

export function getLocalGroups(): Group[] {
  if (!fs.existsSync(catalogDataDir)) return [];
  const fileNames = fs.readdirSync(catalogDataDir);
  const groups: Group[] = [];

  fileNames.forEach((fileName) => {
    const fullPath = path.join(catalogDataDir, fileName);
    if (!fs.statSync(fullPath).isFile()) return;
    if (!/(\.ya?ml)$/i.test(fullPath)) return;
    const content = fs.readFileSync(fullPath, "utf8");
    const docs = parseYamlDocuments(content);
    docs.forEach((doc) => {
      const entity = doc as { kind?: string; apiVersion?: string; metadata?: { name?: string } };
      if (entity && entity.kind === "Group" && entity.apiVersion?.startsWith("backstage.io/")) {
        const group = entity as Group;
        groups.push(group);
      }
    });
  });

  return groups;
}

export function getAllGroups(): Group[] {
  // For now only local groups; future: merge with imported groups
  return getLocalGroups();
}

export function getGroupByRef(refOrName: string): Group | undefined {
  const normalized = normalizeGroupRef(refOrName);
  const [_, namespaceAndName] = normalized.split(":");
  const [namespace, name] = namespaceAndName.split("/");
  const lowerNs = (namespace || "default").toLowerCase();
  const lowerName = name.toLowerCase();

  return getAllGroups().find((g) => {
    const gNs = (g.metadata.namespace || "default").toLowerCase();
    const gName = g.metadata.name.toLowerCase();
    return gNs === lowerNs && gName === lowerName;
  });
}


