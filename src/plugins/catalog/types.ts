// Based on https://github.com/backstage/backstage/blob/master/packages/catalog-model/src/schema/kinds/Component.v1alpha1.schema.json
export interface Component {
  apiVersion: "backstage.io/v1alpha1";
  kind: "Component";
  metadata: {
    name: string;
    description?: string;
    tags?: string[];
    links?: {
      url: string;
      title?: string;
      icon?: string;
    }[];
  };
  spec: {
    type: string;
    lifecycle: string;
    owner: string;
    system?: string;
  };
}
