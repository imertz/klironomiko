import { v4 as uuidv4 } from "uuid";

type Relatives = {
  spouse: Spouse;
  parents?: number;
  descendants: Descendant[];
  siblings?: Descendant[];
  uuid?: string;
};

type Descendant = {
  fname: string;
  relation: Relation;
  descendants?: Descendant[];
  share?: number;
  uuid?: string;
};

type Relation =
  | "child"
  | "grand-child"
  | "great-grand-child"
  | "sibling"
  | "nephew"
  | "grand-nephew";

type RelativesWithUuid = {
  spouse: Spouse;
  parents?: number;
  descendants: DescendantWithUuid[];
  uuid: string;
  share?: number;
  fraction?: string;
};
type DescendantWithUuid = {
  fname: string;
  relation: Relation;
  descendants?: DescendantWithUuid[];
  share?: number;
  fraction?: string;
  uuid: string;
};

type Spouse = {
  alive: boolean;
  apodochi: boolean;
  share?: number;
  fraction?: string;
};

export function calculateHeirPercentage(relatives: Relatives) {
  // Add a random uuid without dashes to each leaf node of the relatives object
  // This is to ensure that each node is unique
  const relativesWithUuid: RelativesWithUuid = JSON.parse(
    JSON.stringify(relatives)
  ); // Deep copy
  const addUuid = (relative: Relatives | Descendant) => {
    // If uuid is already present, return
    if (relative.uuid) {
      return;
    }

    relative.uuid = uuidv4().replace(/-/g, "");

    if (relative.descendants) {
      relative.descendants.forEach((descendant) => {
        addUuid(descendant);
      });
    }
  };
  addUuid(relativesWithUuid);

  const percentages: { [key: string]: number } = {};
  if (relativesWithUuid.spouse.alive && relativesWithUuid.spouse.apodochi) {
    relativesWithUuid.spouse = {
      ...relativesWithUuid.spouse,
      share: 0.25,
      fraction: "1/4",
    };
  }
  const descendantPercentage =
    relativesWithUuid.spouse.alive && relativesWithUuid.spouse.apodochi
      ? 0.75
      : 1;

  const children: DescendantWithUuid[] = relativesWithUuid.descendants.filter(
    (relative: DescendantWithUuid) => relative.relation === "child"
  );
  const childrenCount = children.length;
  console.log(childrenCount);

  if (childrenCount > 0) {
    const childrenPercentage =
      childrenCount > 0 ? descendantPercentage / childrenCount : 0;
    children.forEach((child) => {
      percentages[child.uuid] = childrenPercentage;
      const grandChildren = child.descendants?.filter(
        (relative) => relative.relation === "grand-child"
      );
      const grandChildrenCount = grandChildren?.length
        ? grandChildren.length
        : 0;
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
      relativesWithUuid.spouse = {
        ...relativesWithUuid.spouse,
        share: 1,
        fraction: "1/1",
      };
    }
    // If there are no children and no spouse, the entire estate goes to the parents
    if (
      childrenCount === 0 &&
      (relativesWithUuid.spouse.alive || !relativesWithUuid.spouse.apodochi)
    ) {
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
        if (relative.share) {
          relative.fraction = toFraction(relative.share);
        }
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

  if (childrenCount === 0 && relativesWithUuid.parents === 0) {
    relativesWithUuid.spouse = {
      ...relativesWithUuid.spouse,
      share: 1,
      fraction: "1/1",
    };
    return relativesWithUuid;
  }
  if (
    childrenCount === 0 &&
    (!relativesWithUuid.spouse.alive || !relativesWithUuid.spouse.apodochi)
  ) {
    percentages["parents"] = 1;
    return relativesWithUuid;
  }
  if (
    childrenCount === 0 &&
    relativesWithUuid.spouse.alive &&
    relativesWithUuid.spouse.apodochi &&
    relativesWithUuid.parents !== 0
  ) {
    relativesWithUuid.spouse = {
      ...relativesWithUuid.spouse,
      share: 1,
      fraction: "1/1",
    };
    return relativesWithUuid;
  }
}

// // Testing my package
// const heirPercentage = calculateHeirPercentage({
//   spouse: {
//     alive: true,
//     apodochi: true,
//   },
//   parents: 2,
//   descendants: [],
// });

// // Pretty print the heir percentage
// console.log(JSON.stringify(heirPercentage, null, 2));

function toFraction(decimal: number) {
  const tolerance = 1.0e-10; // set a tolerance for floating-point comparison
  let numerator = 1;
  let denominator = 1;
  let error = decimal - numerator / denominator;

  while (Math.abs(error) > tolerance) {
    if (error > 0) {
      numerator++;
    } else {
      denominator++;
    }
    error = decimal - numerator / denominator;
  }

  return numerator + "/" + denominator;
}
