# klironomiko

Klironomiko is an open source project that calculates the shares of the heirs of a deceased person without a will, according to Greek Law. It helps in dividing the estate among the eligible relatives, taking into consideration their relations, alive status, and other factors.

## Features

- Calculate the shares of the heirs based on Greek Law
- Handles various relations like spouse, children, grandchildren, siblings, etc.
- Takes into account the alive status and apodochi (acceptance) of the relatives
- Returns the shares as both percentages and fractions

## Installation

You can install klironomiko using npm:

\```bash
npm install klironomiko
\```

## Usage

First, import the `calculateHeirPercentage` function from the package:

\```javascript
import { calculateHeirPercentage } from "klironomiko";
\```

Next, create an object representing the relatives of the deceased person:

\```javascript
const relatives = {
  spouse: { alive: true, apodochi: true },
  dad: { aliveAndApodochi: true },
  mum: { aliveAndApodochi: true },
  descendants: [
    {
      fname: "John",
      relation: "child",
      alive: true,
      apodochi: true,
      descendants: [],
    },
    {
      fname: "Jane",
      relation: "child",
      alive: true,
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
};
\```

Finally, call the `calculateHeirPercentage` function with the relatives object:

\```javascript
const result = calculateHeirPercentage(relatives);
console.log(result);
\```

The result will contain the shares of the eligible relatives in the estate.

## Contributing

We welcome contributions from the community. If you'd like to contribute, please:

1. Fork the repository
2. Create a new branch for your feature or bugfix
3. Commit your changes
4. Create a pull request and provide a clear description of your changes

## License

Klironomiko is released under the [MIT License](LICENSE).
