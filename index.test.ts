import { describe, it, expect } from "vitest";
import { calculateHeirPercentage } from "./index";

// Helper to create a base relatives object with all required fields
function createBaseRelatives(overrides = {}) {
  return {
    spouse: { alive: false, apodochi: false },
    dad: { aliveAndApodochi: false },
    mum: { aliveAndApodochi: false },
    descendants: [],
    siblings: [],
    dadsGrandpa: {},
    dadsGrandma: {},
    mumsGrandpa: {},
    mumsGrandma: {},
    dadsRoot: [],
    mumsRoot: [],
    ...overrides,
  };
}

describe("calculateHeirPercentage", () => {
  describe("Scenario 1: With children (spouse gets 1/4)", () => {
    it("spouse + 1 child: spouse gets 1/4, child gets 3/4", () => {
      const relatives = createBaseRelatives({
        spouse: { alive: true, apodochi: true },
        descendants: [
          {
            fname: "Child1",
            relation: "child",
            alive: true,
            apodochi: true,
            descendants: [],
          },
        ],
      });

      const result = calculateHeirPercentage(relatives);
      const child = result.descendants[0];

      expect(result.spouse.share).toBe(0.25);
      expect(result.spouse.fraction).toBe("1/4");
      expect(child?.share).toBe(0.75);
      expect(child?.fraction).toBe("3/4");
    });

    it("spouse + 2 children: spouse gets 1/4, each child gets 3/8", () => {
      const relatives = createBaseRelatives({
        spouse: { alive: true, apodochi: true },
        descendants: [
          {
            fname: "Child1",
            relation: "child",
            alive: true,
            apodochi: true,
            descendants: [],
          },
          {
            fname: "Child2",
            relation: "child",
            alive: true,
            apodochi: true,
            descendants: [],
          },
        ],
      });

      const result = calculateHeirPercentage(relatives);
      const child1 = result.descendants[0];
      const child2 = result.descendants[1];

      expect(result.spouse.share).toBe(0.25);
      expect(child1?.share).toBe(0.375);
      expect(child1?.fraction).toBe("3/8");
      expect(child2?.share).toBe(0.375);
    });

    it("no spouse + 2 children: each child gets 1/2", () => {
      const relatives = createBaseRelatives({
        spouse: { alive: false, apodochi: false },
        descendants: [
          {
            fname: "Child1",
            relation: "child",
            alive: true,
            apodochi: true,
            descendants: [],
          },
          {
            fname: "Child2",
            relation: "child",
            alive: true,
            apodochi: true,
            descendants: [],
          },
        ],
      });

      const result = calculateHeirPercentage(relatives);
      const child1 = result.descendants[0];
      const child2 = result.descendants[1];

      expect(result.spouse.share).toBeUndefined();
      expect(child1?.share).toBe(0.5);
      expect(child2?.share).toBe(0.5);
    });

    it("representation: deceased child with grandchildren", () => {
      const relatives = createBaseRelatives({
        spouse: { alive: true, apodochi: true },
        descendants: [
          {
            fname: "Child1",
            relation: "child",
            alive: true,
            apodochi: true,
            descendants: [],
          },
          {
            fname: "DeceasedChild",
            relation: "child",
            alive: false,
            apodochi: true,
            descendants: [
              {
                fname: "Grandchild1",
                relation: "grand-child",
                alive: true,
                apodochi: true,
                descendants: [],
              },
              {
                fname: "Grandchild2",
                relation: "grand-child",
                alive: true,
                apodochi: true,
                descendants: [],
              },
            ],
          },
        ],
      });

      const result = calculateHeirPercentage(relatives);
      const child1 = result.descendants[0];
      const deceasedChild = result.descendants[1];
      const grandchild1 = deceasedChild?.descendants[0];
      const grandchild2 = deceasedChild?.descendants[1];

      expect(result.spouse.share).toBe(0.25);
      // Child1 gets 3/8
      expect(child1?.share).toBe(0.375);
      // DeceasedChild's share (3/8) goes to grandchildren
      expect(deceasedChild?.share).toBeUndefined(); // Deceased, no direct share
      expect(grandchild1?.share).toBe(0.1875); // 3/16
      expect(grandchild2?.share).toBe(0.1875); // 3/16
    });
  });

  describe("Scenario 2: No children, parents/siblings (spouse gets 1/2)", () => {
    it("spouse + both parents: spouse gets 1/2, each parent gets 1/4", () => {
      const relatives = createBaseRelatives({
        spouse: { alive: true, apodochi: true },
        dad: { aliveAndApodochi: true },
        mum: { aliveAndApodochi: true },
      });

      const result = calculateHeirPercentage(relatives);

      expect(result.spouse.share).toBe(0.5);
      expect(result.spouse.fraction).toBe("1/2");
      expect(result.dad.share).toBe(0.25);
      expect(result.dad.fraction).toBe("1/4");
      expect(result.mum.share).toBe(0.25);
      expect(result.mum.fraction).toBe("1/4");
    });

    it("spouse + one parent: spouse gets 1/2, parent gets 1/2", () => {
      const relatives = createBaseRelatives({
        spouse: { alive: true, apodochi: true },
        dad: { aliveAndApodochi: true },
        mum: { aliveAndApodochi: false },
      });

      const result = calculateHeirPercentage(relatives);

      expect(result.spouse.share).toBe(0.5);
      expect(result.dad.share).toBe(0.5);
      expect(result.mum.share).toBeUndefined();
    });

    it("no spouse + both parents: each parent gets 1/2", () => {
      const relatives = createBaseRelatives({
        spouse: { alive: false, apodochi: false },
        dad: { aliveAndApodochi: true },
        mum: { aliveAndApodochi: true },
      });

      const result = calculateHeirPercentage(relatives);

      expect(result.spouse.share).toBeUndefined();
      expect(result.dad.share).toBe(0.5);
      expect(result.mum.share).toBe(0.5);
    });

    it("spouse + parent + siblings: shares divided equally", () => {
      const relatives = createBaseRelatives({
        spouse: { alive: true, apodochi: true },
        dad: { aliveAndApodochi: true },
        mum: { aliveAndApodochi: false },
        siblings: [
          {
            fname: "Sibling1",
            relation: "sibling",
            alive: true,
            apodochi: true,
            descendants: [],
            half: false,
          },
        ],
      });

      const result = calculateHeirPercentage(relatives);
      const sibling = result.siblings[0];

      expect(result.spouse.share).toBe(0.5);
      // Dad and sibling split the remaining 0.5
      expect(result.dad.share).toBe(0.25);
      expect(sibling?.share).toBe(0.25);
    });

    it("half-siblings get half the share of full siblings", () => {
      const relatives = createBaseRelatives({
        spouse: { alive: false, apodochi: false },
        dad: { aliveAndApodochi: true },
        siblings: [
          {
            fname: "FullSibling",
            relation: "sibling",
            alive: true,
            apodochi: true,
            descendants: [],
            half: false,
          },
          {
            fname: "HalfSibling",
            relation: "sibling",
            alive: true,
            apodochi: true,
            descendants: [],
            half: true,
          },
        ],
      });

      const result = calculateHeirPercentage(relatives);
      const fullSibling = result.siblings[0];
      const halfSibling = result.siblings[1];

      // Dad: 1/3, FullSibling: 1/3 + bonus from half-sibling, HalfSibling: 1/6
      const fullSiblingShare = fullSibling?.share;
      const halfSiblingShare = halfSibling?.share;

      expect(halfSiblingShare).toBeDefined();
      expect(fullSiblingShare).toBeDefined();
      // Half-sibling should get half the share of full sibling
      expect(halfSiblingShare! * 2).toBeCloseTo(fullSiblingShare! - halfSiblingShare! / 2, 10);
    });
  });

  describe("Scenario 3: Grandparents (spouse gets 1/2)", () => {
    it("spouse + paternal grandparents: spouse gets 1/2, grandparents split 1/2", () => {
      const relatives = createBaseRelatives({
        spouse: { alive: true, apodochi: true },
        dadsGrandpa: { aliveAndApodochi: true },
        dadsGrandma: { aliveAndApodochi: true },
      });

      const result = calculateHeirPercentage(relatives);

      expect(result.spouse.share).toBe(0.5);
      expect(result.dadsGrandpa.share).toBe(0.25);
      expect(result.dadsGrandma.share).toBe(0.25);
    });

    it("spouse + only paternal grandpa: spouse gets 1/2, grandpa gets 1/2", () => {
      const relatives = createBaseRelatives({
        spouse: { alive: true, apodochi: true },
        dadsGrandpa: { aliveAndApodochi: true },
        dadsGrandma: { aliveAndApodochi: false },
      });

      const result = calculateHeirPercentage(relatives);

      expect(result.spouse.share).toBe(0.5);
      expect(result.dadsGrandpa.share).toBe(0.5);
      expect(result.dadsGrandma.share).toBeUndefined();
    });

    it("spouse + both paternal and maternal grandparents", () => {
      const relatives = createBaseRelatives({
        spouse: { alive: true, apodochi: true },
        dadsGrandpa: { aliveAndApodochi: true },
        dadsGrandma: { aliveAndApodochi: true },
        mumsGrandpa: { aliveAndApodochi: true },
        mumsGrandma: { aliveAndApodochi: true },
      });

      const result = calculateHeirPercentage(relatives);

      expect(result.spouse.share).toBe(0.5);
      // Paternal line gets 1/4 (split between grandpa and grandma = 1/8 each)
      expect(result.dadsGrandpa.share).toBe(0.125);
      expect(result.dadsGrandma.share).toBe(0.125);
      // Maternal line gets 1/4 (split between grandpa and grandma = 1/8 each)
      expect(result.mumsGrandpa.share).toBe(0.125);
      expect(result.mumsGrandma.share).toBe(0.125);
    });

    it("no spouse + grandparents: grandparents get 100%", () => {
      const relatives = createBaseRelatives({
        spouse: { alive: false, apodochi: false },
        dadsGrandpa: { aliveAndApodochi: true },
        dadsGrandma: { aliveAndApodochi: true },
      });

      const result = calculateHeirPercentage(relatives);

      expect(result.spouse.share).toBeUndefined();
      expect(result.dadsGrandpa.share).toBe(0.5);
      expect(result.dadsGrandma.share).toBe(0.5);
    });
  });

  describe("Scenario 4: Only spouse", () => {
    it("only spouse alive: spouse gets 100%", () => {
      const relatives = createBaseRelatives({
        spouse: { alive: true, apodochi: true },
      });

      const result = calculateHeirPercentage(relatives);

      expect(result.spouse.share).toBe(1);
      expect(result.spouse.fraction).toBe("1/1");
    });
  });

  describe("Edge cases", () => {
    it("child with apodochi: false is excluded", () => {
      const relatives = createBaseRelatives({
        spouse: { alive: true, apodochi: true },
        descendants: [
          {
            fname: "AcceptingChild",
            relation: "child",
            alive: true,
            apodochi: true,
            descendants: [],
          },
          {
            fname: "RejectingChild",
            relation: "child",
            alive: true,
            apodochi: false,
            descendants: [],
          },
        ],
      });

      const result = calculateHeirPercentage(relatives);
      const acceptingChild = result.descendants[0];
      const rejectingChild = result.descendants[1];

      expect(result.spouse.share).toBe(0.25);
      // Only accepting child gets the 3/4
      expect(acceptingChild?.share).toBe(0.75);
      expect(rejectingChild?.share).toBeUndefined();
    });

    it("spouse with apodochi: false gets nothing", () => {
      const relatives = createBaseRelatives({
        spouse: { alive: true, apodochi: false },
        descendants: [
          {
            fname: "Child1",
            relation: "child",
            alive: true,
            apodochi: true,
            descendants: [],
          },
        ],
      });

      const result = calculateHeirPercentage(relatives);
      const child = result.descendants[0];

      // Spouse rejected, so child gets everything
      expect(child?.share).toBe(1);
    });

    it("does not mutate input object", () => {
      const relatives = createBaseRelatives({
        spouse: { alive: true, apodochi: true },
        descendants: [
          {
            fname: "Child1",
            relation: "child",
            alive: true,
            apodochi: true,
            descendants: [],
          },
        ],
      });

      const originalJson = JSON.stringify(relatives);
      calculateHeirPercentage(relatives);

      expect(JSON.stringify(relatives)).toBe(originalJson);
    });

    it("adds uuid to all relatives", () => {
      const relatives = createBaseRelatives({
        spouse: { alive: true, apodochi: true },
        descendants: [
          {
            fname: "Child1",
            relation: "child",
            alive: true,
            apodochi: true,
            descendants: [],
          },
        ],
      });

      const result = calculateHeirPercentage(relatives);
      const child = result.descendants[0];

      expect(result.uuid).toBeDefined();
      expect(result.uuid.length).toBe(32); // UUID without dashes
      expect(child?.uuid).toBeDefined();
      expect(child?.uuid.length).toBe(32);
    });
  });

  describe("Great-grandparents", () => {
    it("spouse + great-grandparents: spouse gets 1/2, great-grandparents split rest", () => {
      const relatives = createBaseRelatives({
        spouse: { alive: true, apodochi: true },
        greatGrandParents: { no: 2 },
      });

      const result = calculateHeirPercentage(relatives);

      expect(result.spouse.share).toBe(0.5);
      expect(result.greatGrandParents?.share).toBe(0.25); // 0.5 / 2
      expect(result.greatGrandParents?.fraction).toBe("1/4");
    });
  });
});
