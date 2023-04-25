import { randomUUID as uuid } from "crypto";

type Relatives = {
  spouse: boolean;
  parents: number;
  descendants: Descendant[];
  uuid?: string;
};

type Descendant = {
  fname: string;
  relation: string;
  descendants?: Descendant[];
  share?: number;
  uuid?: string;
};

type RelativesWithUuid = {
  spouse: boolean;
  parents: number;
  descendants: DescendantWithUuid[];
  uuid: string;
  share?: number;
};
type DescendantWithUuid = {
  fname: string;
  relation: string;
  descendants?: DescendantWithUuid[];
  share?: number;
  uuid: string;
};
export function calculateHeirPercentage(relatives: Relatives) {
  // Add a random uuid without dashes to each leaf node of the relatives object
  // This is to ensure that each node is unique
  const relativesWithUuid: RelativesWithUuid = JSON.parse(
    JSON.stringify(relatives)
  ); // Deep copy
  const addUuid = (relative: Relatives | Descendant) => {
    relative.uuid = uuid().replace(/-/g, "");

    if (relative.descendants) {
      relative.descendants.forEach((descendant) => {
        addUuid(descendant);
      });
    }
  };
  addUuid(relativesWithUuid);

  const percentages: { [key: string]: number } = {};
  if (relativesWithUuid.spouse) {
    percentages["spouse"] = 0.25;
  }
  const descendantPercentage = relativesWithUuid.spouse ? 0.75 : 1;
  const children: DescendantWithUuid[] = relativesWithUuid.descendants.filter(
    (relative: DescendantWithUuid) => relative.relation === "child"
  );
  const childrenCount = children.length;
  const childrenPercentage =
    childrenCount > 0 ? descendantPercentage / childrenCount : 0;
  children.forEach((child) => {
    percentages[child.uuid] = childrenPercentage;
    const grandChildren = child.descendants?.filter(
      (relative) => relative.relation === "grand-child"
    );
    const grandChildrenCount = grandChildren?.length ? grandChildren.length : 0;
    const grandChildrenPercentage =
      grandChildrenCount > 0 ? childrenPercentage / grandChildrenCount : 0;

    grandChildren &&
      grandChildren?.forEach((grandChild) => {
        percentages[grandChild.uuid] = grandChildrenPercentage;
        const greatGrandChildren = grandChild?.descendants?.filter(
          (relative) => relative.relation === "great-grand-child"
        );
        const greatGrandChildrenCount = greatGrandChildren?.length
          ? greatGrandChildren.length
          : 0;
        const greatGrandChildrenPercentage =
          greatGrandChildrenCount > 0
            ? grandChildrenPercentage / greatGrandChildrenCount
            : 0;
        greatGrandChildren?.forEach((greatGrandChild) => {
          percentages[greatGrandChild.uuid] = greatGrandChildrenPercentage;
        });
      });
  });
  // If there are no children, the entire estate goes to the spouse
  if (childrenCount === 0 && relativesWithUuid.parents === 0) {
    percentages["spouse"] = 1;
  }
  // If there are no children and no spouse, the entire estate goes to the parents
  if (childrenCount === 0 && !relativesWithUuid.spouse) {
    percentages["parents"] = 1;
  }
  // If a relative has a descendant, remove the relative from the percentages object
  Object.keys(percentages).forEach((key) => {
    if (
      relativesWithUuid.descendants.find(
        (relative) =>
          relative.uuid === key &&
          relative.descendants?.length &&
          relative.descendants.length > 0
      )
    ) {
      delete percentages[key];
    }
  });
  // If a descendant has a descendant, remove the descendant from the percentages object
  Object.keys(percentages).forEach((key) => {
    if (
      relativesWithUuid.descendants.find((relative) =>
        relative.descendants?.find(
          (descendant) =>
            descendant.uuid === key &&
            descendant.descendants?.length &&
            descendant.descendants.length > 0
        )
      )
    ) {
      delete percentages[key];
    }
  });

  // Add the share of the estate to each relative in the relatives object
  const addShare = (relative: RelativesWithUuid | DescendantWithUuid) => {
    if (percentages[relative.uuid]) {
      relative.share = percentages[relative.uuid];
    }
    if (relative.descendants) {
      relative.descendants.forEach((descendant) => {
        addShare(descendant);
      });
    }
  };
  addShare(relativesWithUuid);

  // Return the relatives object
  return relativesWithUuid;
}

// Testing my package
