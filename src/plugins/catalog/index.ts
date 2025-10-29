import { AperturePlugin } from "@/lib/plugins";
import { CatalogPage } from "./components/CatalogPage";

export const catalogPlugin: AperturePlugin = {
  id: "catalog",
  name: "Software Catalog",
  component: CatalogPage,
};
