{
  spouse: {
    alive: true,
      apodochi: true,
  },
  parents: 2,
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
}