import { v4 as uuidv4 } from "uuid";

type Relatives = {
  spouse: Spouse;
  dad: Parent;
  mum: Parent;
  descendants: Descendant[];
  siblings: Descendant[];
  uuid?: string;
  dadsGrandpa: Parent;
  dadsGrandma: Parent;
  mumsGrandpa: Parent;
  mumsGrandma: Parent;
  dadsRoot: Descendant[];
  mumsRoot: Descendant[];
  greatGrandParents?: { no: number; share?: number; fraction?: string };
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
  | "grand-nephew"
  | "uncle"
  | "first-cousin"
  | "dads-uncle"
  | "dads-first-cousin"
  | "mums-uncle"
  | "mums-first-cousin";

type RelativesWithUuid = {
  spouse: Spouse;
  dad: Parent;
  mum: Parent;
  descendants: DescendantWithUuid[];
  siblings: DescendantWithUuid[];
  uuid: string;
  share?: number;
  fraction?: string;
  dadsGrandpa: Parent;
  dadsGrandma: Parent;
  mumsGrandpa: Parent;
  mumsGrandma: Parent;
  dadsRoot: DescendantWithUuid[];
  mumsRoot: DescendantWithUuid[];
  greatGrandParents?: { no: number; share?: number; fraction?: string };
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
  aliveAndApodochi?: boolean;
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
    if (rel.dadsRoot) {
      rel.dadsRoot.forEach((root) => {
        addUuid(root);
      });
    }
    if (rel.mumsRoot) {
      rel.mumsRoot.forEach((root) => {
        addUuid(root);
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
    parentsAndSiblingsCount === 0 &&
    (relativesWithUuid.dadsGrandpa.aliveAndApodochi ||
      relativesWithUuid.mumsGrandpa.aliveAndApodochi ||
      relativesWithUuid.dadsGrandma.aliveAndApodochi ||
      relativesWithUuid.mumsGrandma.aliveAndApodochi ||
      relativesWithUuid.dadsRoot.length > 0 ||
      relativesWithUuid.mumsRoot.length > 0)
  ) {
    if (relativesWithUuid.dadsRoot.length > 0) {
      relativesWithUuid.dadsGrandpa.aliveAndApodochi = false;
      relativesWithUuid.dadsGrandma.aliveAndApodochi = false;
    }
    if (relativesWithUuid.mumsRoot.length > 0) {
      relativesWithUuid.mumsGrandpa.aliveAndApodochi = false;
      relativesWithUuid.mumsGrandma.aliveAndApodochi = false;
    }
    if (relativesWithUuid.spouse.alive && relativesWithUuid.spouse.apodochi) {
      relativesWithUuid.spouse = {
        ...relativesWithUuid.spouse,
        share: 0.5,
        fraction: "1/2",
      };
    }
    if (!relativesWithUuid.spouse.alive || !relativesWithUuid.spouse.apodochi) {
      relativesWithUuid.spouse = {
        ...relativesWithUuid.spouse,
        share: undefined,
        fraction: undefined,
      };
    }
    const grandParentsPercentage = relativesWithUuid.spouse.share ? 0.5 : 1;
    let dadsRootPercentage =
      relativesWithUuid.dadsGrandpa.aliveAndApodochi ||
      relativesWithUuid.dadsGrandma.aliveAndApodochi ||
      relativesWithUuid.dadsRoot.length > 0
        ? grandParentsPercentage / 2
        : 0;

    let mumsRootPercentage =
      relativesWithUuid.mumsGrandpa.aliveAndApodochi ||
      relativesWithUuid.mumsGrandma.aliveAndApodochi ||
      relativesWithUuid.mumsRoot.length > 0
        ? grandParentsPercentage / 2
        : 0;

    // if dadsRootPercentage is 0 and mumsRootPercentage is 0.25, then set mumsRootPercentage to 0.5
    if (dadsRootPercentage === 0 && mumsRootPercentage !== 0) {
      mumsRootPercentage = grandParentsPercentage;
    }
    // if mumsRootPercentage is 0 and dadsRootPercentage is 0.25, then set dadsRootPercentage to 0.5
    if (mumsRootPercentage === 0 && dadsRootPercentage !== 0) {
      dadsRootPercentage = grandParentsPercentage;
    }

    if (
      relativesWithUuid.dadsGrandpa.aliveAndApodochi &&
      !relativesWithUuid.dadsGrandma.aliveAndApodochi
    ) {
      relativesWithUuid.dadsGrandpa.share = dadsRootPercentage;
      relativesWithUuid.dadsGrandpa.fraction = toFraction(dadsRootPercentage);
    }
    if (
      relativesWithUuid.dadsGrandma.aliveAndApodochi &&
      !relativesWithUuid.dadsGrandpa.aliveAndApodochi
    ) {
      relativesWithUuid.dadsGrandma.share = dadsRootPercentage;
      relativesWithUuid.dadsGrandma.fraction = toFraction(dadsRootPercentage);
    }
    if (
      relativesWithUuid.mumsGrandpa.aliveAndApodochi &&
      !relativesWithUuid.mumsGrandma.aliveAndApodochi
    ) {
      relativesWithUuid.mumsGrandpa.share = mumsRootPercentage;
      relativesWithUuid.mumsGrandpa.fraction = toFraction(mumsRootPercentage);
    }
    if (
      relativesWithUuid.mumsGrandma.aliveAndApodochi &&
      !relativesWithUuid.mumsGrandpa.aliveAndApodochi
    ) {
      relativesWithUuid.mumsGrandma.share = mumsRootPercentage;
      relativesWithUuid.mumsGrandma.fraction = toFraction(mumsRootPercentage);
    }
    if (
      relativesWithUuid.dadsGrandpa.aliveAndApodochi &&
      relativesWithUuid.dadsGrandma.aliveAndApodochi
    ) {
      relativesWithUuid.dadsGrandpa.share = dadsRootPercentage / 2;
      relativesWithUuid.dadsGrandma.share = dadsRootPercentage / 2;
      relativesWithUuid.dadsGrandpa.fraction = toFraction(
        dadsRootPercentage / 2
      );
      relativesWithUuid.dadsGrandma.fraction = toFraction(
        dadsRootPercentage / 2
      );
    }
    if (
      relativesWithUuid.mumsGrandpa.aliveAndApodochi &&
      relativesWithUuid.mumsGrandma.aliveAndApodochi
    ) {
      relativesWithUuid.mumsGrandpa.share = mumsRootPercentage / 2;
      relativesWithUuid.mumsGrandma.share = mumsRootPercentage / 2;
      relativesWithUuid.mumsGrandpa.fraction = toFraction(
        mumsRootPercentage / 2
      );
      relativesWithUuid.mumsGrandma.fraction = toFraction(
        mumsRootPercentage / 2
      );
    }

    if (
      !relativesWithUuid.dadsGrandpa.aliveAndApodochi &&
      !relativesWithUuid.dadsGrandma.aliveAndApodochi &&
      relativesWithUuid.dadsRoot.length > 0
    ) {
      relativesWithUuid.dadsGrandpa.share = undefined;
      relativesWithUuid.dadsGrandma.share = undefined;
      relativesWithUuid.dadsGrandpa.fraction = undefined;
      relativesWithUuid.dadsGrandma.fraction = undefined;
      relativesWithUuid.dadsRoot.forEach((dadsUncle) => {
        percentages[dadsUncle.uuid] =
          dadsRootPercentage / relativesWithUuid.dadsRoot.length;

        const firstCousins = dadsUncle.descendants.filter((dadsRootRelative) =>
          dadsRootRelative.relation.includes("first-cousin")
        );
        const firstCousinsPercentage =
          dadsRootPercentage /
          relativesWithUuid.dadsRoot.length /
          firstCousins.length;
        firstCousins.forEach((firstCousin) => {
          percentages[firstCousin.uuid] = firstCousinsPercentage;
        });
      });
    }
    if (
      !relativesWithUuid.mumsGrandpa.aliveAndApodochi &&
      !relativesWithUuid.mumsGrandma.aliveAndApodochi &&
      relativesWithUuid.mumsRoot.length > 0
    ) {
      relativesWithUuid.mumsGrandpa.share = undefined;
      relativesWithUuid.mumsGrandma.share = undefined;
      relativesWithUuid.mumsGrandpa.fraction = undefined;
      relativesWithUuid.mumsGrandma.fraction = undefined;
      relativesWithUuid.mumsRoot.forEach((mumsUncle) => {
        percentages[mumsUncle.uuid] =
          mumsRootPercentage / relativesWithUuid.mumsRoot.length;
        const firstCousins = mumsUncle.descendants.filter((mumsRootRelative) =>
          mumsRootRelative.relation.includes("first-cousin")
        );
        const firstCousinsPercentage =
          mumsRootPercentage /
          relativesWithUuid.mumsRoot.length /
          firstCousins.length;
        firstCousins.forEach((firstCousin) => {
          percentages[firstCousin.uuid] = firstCousinsPercentage;
          console.log(firstCousin.uuid, firstCousinsPercentage);
        });
      });
    }
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
      if (rel.dadsRoot) {
        rel.dadsRoot.forEach((dadsUncle) => {
          addShare(dadsUncle);
        });
      }
      if (rel.mumsRoot) {
        rel.mumsRoot.forEach((mumsUncle) => {
          addShare(mumsUncle);
        });
      }
    };
    Object.keys(percentages).forEach((key) => {
      if (
        relativesWithUuid.dadsRoot.find(
          (relative) =>
            relative.uuid === key &&
            relative.descendants?.length &&
            relative.descendants.length > 0
        )
      ) {
        delete percentages[key];
      }
      if (
        relativesWithUuid.mumsRoot.find(
          (relative) =>
            relative.uuid === key &&
            relative.descendants?.length &&
            relative.descendants.length > 0
        )
      ) {
        delete percentages[key];
      }
    });
    addShare(relativesWithUuid);

    return relativesWithUuid;
  }
  if (
    childrenCount === 0 &&
    parentsAndSiblingsCount === 0 &&
    !relativesWithUuid.dadsGrandpa.aliveAndApodochi &&
    !relativesWithUuid.mumsGrandpa.aliveAndApodochi &&
    !relativesWithUuid.dadsGrandma.aliveAndApodochi &&
    !relativesWithUuid.mumsGrandma.aliveAndApodochi &&
    relativesWithUuid.dadsRoot.length === 0 &&
    relativesWithUuid.mumsRoot.length === 0 &&
    relativesWithUuid.greatGrandParents &&
    relativesWithUuid.greatGrandParents.no > 0
  ) {
    if (relativesWithUuid.spouse.alive && relativesWithUuid.spouse.apodochi) {
      relativesWithUuid.spouse = {
        ...relativesWithUuid.spouse,
        share: 0.5,
        fraction: "1/2",
      };
    }
    if (!relativesWithUuid.spouse.alive || !relativesWithUuid.spouse.apodochi) {
      relativesWithUuid.spouse = {
        ...relativesWithUuid.spouse,
        share: undefined,
        fraction: undefined,
      };
    }
    const greatGrandParentsPercentage = relativesWithUuid.spouse.share
      ? 0.5
      : 1;
    relativesWithUuid.greatGrandParents.share =
      greatGrandParentsPercentage / relativesWithUuid.greatGrandParents.no;
    relativesWithUuid.greatGrandParents.fraction = toFraction(
      relativesWithUuid.greatGrandParents.share
    );
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
  dadsGrandpa: {},
  dadsGrandma: {},
  mumsGrandpa: {},
  mumsGrandma: {},
  dadsRoot: [],
  mumsRoot: [],
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
  dadsGrandpa: {},
  dadsGrandma: {},
  mumsGrandpa: {},
  mumsGrandma: {},
  dadsRoot: [],
  mumsRoot: [],
};
const familyTree2 = {
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
  descendants: [],
  siblings: [],
  dadsGrandpa: {
    aliveAndApodochi: false,
  },
  dadsGrandma: {
    aliveAndApodochi: false,
  },
  mumsGrandpa: { aliveAndApodochi: false },
  mumsGrandma: {},
  dadsRoot: [],
  mumsRoot: [],
  greatGrandParents: { no: 0 },
};

const heirPercentage2 = calculateHeirPercentage(familyTree2);

// Pretty print the heir percentage
console.log(JSON.stringify(heirPercentage2, null, 2));

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
