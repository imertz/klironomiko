import { v4 as uuidv4 } from "uuid";

type Relatives = {
  spouse: Spouse;
  dad: Parent;
  mum: Parent;
  descendants: Descendant[];
  siblings: Descendant[];
  uuid?: string;
};

type Descendant = {
  fname: string;
  relation: Relation | string;
  descendants: Descendant[];
  share?: number;
  uuid?: string;
  alive?: boolean;
  apodochi?: boolean;
  half?: boolean;
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
  dad: Parent;
  mum: Parent;
  descendants: DescendantWithUuid[];
  siblings: DescendantWithUuid[];
  uuid: string;
  share?: number;
  fraction?: string;
};
type DescendantWithUuid = {
  fname: string;
  relation: Relation;
  descendants: DescendantWithUuid[];
  share?: number;
  fraction?: string;
  uuid: string;
  alive: boolean;
  apodochi: boolean;
  half?: boolean;
};

type Spouse = {
  alive: boolean;
  apodochi: boolean;
  share?: number;
  fraction?: string;
};
type Parent = {
  aliveAndApodochi: boolean;
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
    const rel = relative as Relatives;
    if (rel.siblings) {
      rel.siblings.forEach((sibling) => {
        addUuid(sibling);
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
  let descendantPercentage =
    relativesWithUuid.spouse.alive && relativesWithUuid.spouse.apodochi
      ? 0.75
      : 1;

  const children: DescendantWithUuid[] = relativesWithUuid.descendants.filter(
    (relative: DescendantWithUuid) =>
      relative.relation === "child" &&
      ((relative.alive && relative.apodochi) || relative.descendants.length > 0)
  );
  const childrenCount = children.length;
  const siblingsCount = relativesWithUuid.siblings.length;
  const halfSiblingCount = relativesWithUuid.siblings.filter(
    (sibling) => sibling.half
  ).length;
  let parentsCount = 0;
  // if both parents are alive and apodochi, the estate is divided equally between the parents
  relatives.dad.aliveAndApodochi && parentsCount++;
  relatives.mum.aliveAndApodochi && parentsCount++;

  const parentsAndSiblingsCount = parentsCount + siblingsCount;

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
    // If there are no children, parents and siblings, the entire estate goes to the spouse
    if (
      childrenCount === 0 &&
      !relativesWithUuid.dad.aliveAndApodochi &&
      !relativesWithUuid.mum.aliveAndApodochi
    ) {
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

  if (childrenCount === 0 && parentsAndSiblingsCount > 0) {
    relativesWithUuid.spouse = {
      ...relativesWithUuid.spouse,
      share: 0.5,
      fraction: "1/2",
    };

    descendantPercentage = 0.5;
    if (!relativesWithUuid.spouse.alive || !relativesWithUuid.spouse.apodochi) {
      relativesWithUuid.spouse = {
        ...relativesWithUuid.spouse,
        share: undefined,
        fraction: undefined,
      };
      descendantPercentage = 1;
    }
    const parentsAndSiblingsPercentage =
      parentsAndSiblingsCount > 0
        ? descendantPercentage / parentsAndSiblingsCount
        : 0;

    const fullPercentage =
      parentsAndSiblingsPercentage +
      ((parentsAndSiblingsPercentage / 2) * halfSiblingCount) /
        (parentsAndSiblingsCount - halfSiblingCount);
    if (relativesWithUuid.dad.aliveAndApodochi) {
      relativesWithUuid.dad = {
        ...relativesWithUuid.dad,
        share: fullPercentage,
        fraction: toFraction(fullPercentage),
      };
    }
    if (relativesWithUuid.mum.aliveAndApodochi) {
      relativesWithUuid.mum = {
        ...relativesWithUuid.mum,
        share: fullPercentage,
        fraction: toFraction(fullPercentage),
      };
    }
    if (relativesWithUuid.siblings.length > 0) {
      relativesWithUuid.siblings.forEach((sibling) => {
        if (sibling.half) {
          percentages[sibling.uuid] = parentsAndSiblingsPercentage / 2;
        }
        if (!sibling.half) {
          percentages[sibling.uuid] = fullPercentage;
        }
        const nephews = sibling.descendants?.filter(
          (relative) => relative.relation === "nephew"
        );
        const nephewsCount = nephews?.length ? nephews.length : 0;
        if (sibling.half) {
          const nephewsPercentage =
            nephewsCount > 0
              ? parentsAndSiblingsPercentage / (2 * nephewsCount)
              : 0;
          nephews?.forEach((nephew) => {
            percentages[nephew.uuid] = nephewsPercentage;
            const greatNephews = nephew?.descendants?.filter(
              (relative) => relative.relation === "grand-nephew"
            );
            const greatNephewsCount = greatNephews?.length
              ? greatNephews.length
              : 0;
            const greatNephewsPercentage =
              greatNephewsCount > 0 ? nephewsPercentage / greatNephewsCount : 0;
            greatNephews?.forEach((greatNephew) => {
              percentages[greatNephew.uuid] = greatNephewsPercentage;
            });
          });
        }
        if (!sibling.half) {
          const nephewsPercentage =
            nephewsCount > 0 ? fullPercentage / nephewsCount : 0;
          nephews?.forEach((nephew) => {
            percentages[nephew.uuid] = nephewsPercentage;
            const greatNephews = nephew?.descendants?.filter(
              (relative) => relative.relation === "grand-nephew"
            );
            const greatNephewsCount = greatNephews?.length
              ? greatNephews.length
              : 0;
            const greatNephewsPercentage =
              greatNephewsCount > 0 ? nephewsPercentage / greatNephewsCount : 0;
            greatNephews?.forEach((greatNephew) => {
              percentages[greatNephew.uuid] = greatNephewsPercentage;
            });
          });
        }
      });
    }
    Object.keys(percentages).forEach((key) => {
      if (
        relativesWithUuid.siblings.find(
          (relative) =>
            relative.uuid === key &&
            relative.descendants?.length &&
            relative.descendants.length > 0
        )
      ) {
        delete percentages[key];
      }
    });
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
        relativesWithUuid.siblings.find((relative) =>
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
      const rel = relative as RelativesWithUuid;
      if (rel.siblings) {
        rel.siblings.forEach((sibling) => {
          addShare(sibling);
        });
      }
    };
    addShare(relativesWithUuid);

    // Return the relatives object
    return relativesWithUuid;
  }

  if (
    childrenCount === 0 &&
    !relativesWithUuid.dad.aliveAndApodochi &&
    !relativesWithUuid.mum.aliveAndApodochi
  ) {
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
    !relativesWithUuid.dad.aliveAndApodochi &&
    !relativesWithUuid.mum.aliveAndApodochi
  ) {
    relativesWithUuid.spouse = {
      ...relativesWithUuid.spouse,
      share: 1,
      fraction: "1/1",
    };
    return relativesWithUuid;
  }
}

// Testing my package
const heirPercentage = calculateHeirPercentage({
  spouse: {
    alive: true,
    apodochi: true,
  },
  dad: {
    aliveAndApodochi: false,
  },
  mum: {
    aliveAndApodochi: false,
  },
  descendants: [
    {
      fname: "R",
      relation: "child",
      alive: false,
      apodochi: true,
      descendants: [
        {
          fname: "C",
          relation: "grand-child",
          alive: true,
          apodochi: false,
          descendants: [
            {
              fname: "A",
              relation: "great-grand-child",
              alive: true,
              apodochi: true,
              descendants: [],
            },
            {
              fname: "B",
              relation: "great-grand-child",
              alive: true,
              apodochi: true,
              descendants: [],
            },
          ],
        },
        {
          fname: "D",
          relation: "grand-child",
          alive: true,
          apodochi: true,
          descendants: [],
        },
      ],
    },
    {
      fname: "S",
      relation: "child",
      alive: true,
      apodochi: false,
      descendants: [],
    },
    {
      fname: "W",
      relation: "child",
      alive: false,
      apodochi: true,
      descendants: [],
    },
  ],
  siblings: [],
});

const familyTree = {
  spouse: {
    alive: false,
    apodochi: true,
  },
  dad: {
    aliveAndApodochi: true,
  },
  mum: {
    aliveAndApodochi: false,
  },
  descendants: [],
  siblings: [
    {
      fname: "S",
      relation: "sibling",

      descendants: [
        {
          fname: "S",
          relation: "nephew",

          descendants: [
            {
              fname: "S",
              relation: "grand-nephew",

              descendants: [],
            },
            {
              fname: "S",
              relation: "grand-nephew",

              descendants: [] as DescendantWithUuid[],
            },
          ],
        },
        {
          fname: "S",
          relation: "nephew",

          descendants: [] as DescendantWithUuid[],
        },
      ] as DescendantWithUuid[],
      half: true,
    },
    {
      fname: "S",
      relation: "sibling",

      descendants: [] as DescendantWithUuid[],
      half: true,
    },

    {
      fname: "S",
      relation: "sibling",

      descendants: [
        {
          fname: "S",
          relation: "nephew",

          descendants: [] as DescendantWithUuid[],
        },
        {
          fname: "S",
          relation: "nephew",

          descendants: [] as DescendantWithUuid[],
        },
      ] as DescendantWithUuid[],
      half: false,
    },
    {
      fname: "S",
      relation: "sibling",

      descendants: [] as DescendantWithUuid[],
      half: false,
    },
    {
      fname: "S",
      relation: "sibling",

      descendants: [] as DescendantWithUuid[],
      half: false,
    },
    {
      fname: "S",
      relation: "sibling",

      descendants: [] as DescendantWithUuid[],
      half: false,
    },
    {
      fname: "S",
      relation: "sibling",

      descendants: [] as DescendantWithUuid[],
      half: false,
    },
    {
      fname: "S",
      relation: "sibling",

      descendants: [] as DescendantWithUuid[],
      half: false,
    },
    {
      fname: "S",
      relation: "sibling",

      descendants: [] as DescendantWithUuid[],
      half: false,
    },
  ],
};

const heirPercentage2 = calculateHeirPercentage(familyTree);

// Pretty print the heir percentage
// console.log(JSON.stringify(heirPercentage2, null, 2));

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
