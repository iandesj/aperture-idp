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
