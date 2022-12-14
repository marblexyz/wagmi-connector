import {
  build as esbuild,
  BuildFailure,
  BuildResult,
  Platform,
  Plugin,
  Format,
} from "esbuild";
import path from "path";
import fse from "fs-extra";
import { gzipSize } from "gzip-size";
import prettyBytes from "pretty-bytes";
import chalk from "chalk";
import chalkTemplate from "chalk-template";
import { execa } from "execa";
import { environment } from "./environment";
import { existsAsync } from "./exists-async";

interface ESBuildOptions {
  watch?: boolean;
  target?: Platform;
  format?: Format;
  output?: string;
  sourcemap?: boolean;
  name?: string;
  globals?: Record<string, string>;
  externals?: string[];
  isRN?: boolean;
}

export async function build(options: ESBuildOptions) {
  if (options.output) {
    try {
      await esbuild({
        bundle: true,
        minify: true,
        watch: options.watch
          ? { onRebuild: onRebuildFactory(options) }
          : undefined,
        legalComments: "none",
        platform: options.target ?? "browser",
        format: options.format ?? "cjs",
        globalName: options.format === "iife" ? options.name : undefined,
        entryPoints: [await getEntrypoint(options.format, options.isRN)],
        sourcemap: options.sourcemap,
        outfile: options.output,
        // tsconfig: 'node_modules/.temp/tsconfig.build.json',
        external: options.externals,
        loader: { ".ts": "ts", ".tsx": "tsx" },
        define: Object.fromEntries(
          Object.entries(environment).map(([key, value]) => [
            `process.env.${key}`,
            JSON.stringify(value),
          ])
        ),
        plugins: [...globalsPlugin(options.globals || {})],

        // We need this footer because: https://github.com/evanw/esbuild/issues/1182
        footer:
          options.format === "iife"
            ? {
                // This snippet replaces `window.{name}` with
                // `window.{name}.default`, with any additional named exports
                // assigned. Finally, it removes `window.{name}.default`.
                js: `if (${options.name} && ${options.name}.default != null) { ${options.name} = Object.assign(${options.name}.default, ${options.name}); delete ${options.name}.default; }`,
              }
            : undefined,
      });

      await printOutputSizeInfo(options);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}

/**
 * Prints the size of the output file(s) produced by ESBuild.
 */
async function printOutputSizeInfo(options: ESBuildOptions) {
  if (options.output) {
    // Log the type and size of the output(s)...
    const outputPath = path.resolve(process.cwd(), options.output);
    const sizeInfo = await getSizeInfo(
      (await fse.readFile(outputPath)).toString(),
      outputPath
    );
    // eslint-disable-next-line no-console
    console.log(
      chalkTemplate`Built {rgb(0,255,255) ${
        options.format
      }} to {gray ${path.dirname(options.output)}}`
    );
    // eslint-disable-next-line no-console
    console.log(sizeInfo);
  }
}

/**
 * Returns a function that can be used to handle rebuild events from ESBuild.
 */
function onRebuildFactory(options: ESBuildOptions) {
  return async (error: BuildFailure | null, result: BuildResult | null) => {
    if (error) {
      console.error(error.message);
    } else {
      await printOutputSizeInfo(options);
    }
  };
}

/**
 * Emits TypeScript typings for the current package.
 */
export async function emitTypes(watch?: boolean) {
  try {
    if (watch) {
      await execa("tsc", ["-w", "-p", "./tsconfig.json"]);
    } else {
      await execa("tsc", ["-p", "./tsconfig.json"]);
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
}

/**
 * Resolves the entrypoint file for ESBuild,
 * based on the format and target platform.
 */
async function getEntrypoint(format?: Format, isRN?: boolean) {
  const findEntrypoint = async (indexTarget?: string) => {
    if (
      format &&
      (await existsAsync(
        path.resolve(process.cwd(), `./src/index.${indexTarget}.ts`)
      ))
    ) {
      return `src/index.${indexTarget}.ts`;
    }

    return "src/index.ts";
  };

  if (isRN) {
    return findEntrypoint("native");
  }

  switch (format) {
    case "iife":
      return findEntrypoint("cdn");

    case "esm":
      return findEntrypoint("es");

    case "cjs":
    default:
      return findEntrypoint(format);
  }
}

/**
 * Creates a list of plugins to replace
 * externalized packages with a global variable.
 */
function globalsPlugin(globals: Record<string, string>): Plugin[] {
  return Object.entries(globals).map(([packageName, globalVar]) => {
    const namespace = `globals-plugin:${packageName}`;
    return {
      name: namespace,
      setup(builder) {
        builder.onResolve(
          { filter: new RegExp(`^${packageName}$`) },
          (args) => ({
            path: args.path,
            namespace,
          })
        );

        builder.onLoad({ filter: /.*/, namespace }, () => {
          const contents = `module.exports = ${globalVar}`;
          return { contents };
        });
      },
    };
  });
}

/**
 * Returns the GZIP and BROTLI sizes of the generated bundle.
 *
 * TODO: Add brotli-size support.
 */
export async function getSizeInfo(code: string, filename: string) {
  const raw = code.length < 5000;

  const formatSize = (size: number, type: "gz" | "br") => {
    const pretty = raw ? `${size} B` : prettyBytes(size);
    // eslint-disable-next-line no-nested-ternary
    const color =
      size < 5000 ? chalk.green : size > 40000 ? chalk.red : chalk.yellow;
    return `${color(pretty)}: ${chalk.white(path.basename(filename))}.${type}`;
  };

  const [gzip] = await Promise.all([gzipSize(code).catch(() => null)]);

  const out = [formatSize(gzip!, "gz")].join("\n  ");
  return `  ${out}`;
}
