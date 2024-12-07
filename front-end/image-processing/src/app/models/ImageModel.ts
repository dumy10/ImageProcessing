export interface ImageModel {
  id: string;
  name: string;
  url: string;
  parentId: string | undefined;
  parentUrl: string | undefined;
  width: number;
  height: number;
  appliedFilters: string[] | undefined;
}
