/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */

import chalkTemplate from "chalk-template";

import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const environment = {
  WEB_VERSION: require(path.resolve(__dirname, "../../package.json")).version,
  //   REACT_NATIVE_VERSION: require(path.resolve(
  //     __dirname,
  //     "../../packages/@marble-sdk/react-native/package.json"
  //   )).version,
};

export function printEnvironment() {
  // eslint-disable-next-line no-console
  console.log(
    Object.entries(environment)
      .map(
        ([key, value]) =>
          chalkTemplate`{rgb(0,255,255) ${key}}{gray :} ${value}`
      )
      .reduce((prev, next, i) => {
        if (i === 0) return chalkTemplate`${prev}    {gray -} ${next}`;
        return chalkTemplate`${prev}\n    {gray -} ${next}`;
      }, "")
  );
}
