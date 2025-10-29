import { AperturePlugin } from "@/lib/plugins";
import { CatalogPageWrapper } from "./components/CatalogPageWrapper";

export const catalogPlugin: AperturePlugin = {
  id: "catalog",
  name: "Software Catalog",
  component: CatalogPageWrapper,
};
