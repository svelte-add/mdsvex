import { Preset, color } from "apply";

const newPreprocessor = `mdsvex(mdsvexConfig)`;
const addPreprocessor = (otherPreprocessors) => {
  if (otherPreprocessors) {
    // otherPreprocessors includes captured whitespace at the end.
    // So, this will match the existing formatting, putting the closing ]
    // bracket on a new line only if it already was
    return `preprocess: [\n\t\t${newPreprocessor},\n\t\t${otherPreprocessors}]`;
  } else {
    return `preprocess: [\n\t\t${newPreprocessor},\n\t]`;
  }
};

const exampleRemark = `remarkPlugins: [
		[require("remark-github"), {
			// Use your own repository
			repository: "https://github.com/svelte-add/mdsvex.git",
		}],
		require("remark-abbr"),
	]`;

const exampleRehype = `rehypePlugins: [
		require("rehype-slug"),
		[require("rehype-autolink-headings"), {
			behavior: "wrap",
		}],
	]`;

Preset.setName("svelte-add/mdsvex");

const ROLLUP = "rollup"; // Not currently supported or inferred
const ROLLUP_SAPPER = "rollup-sapper"; // Not currently supported or inferred
const SNOWPACK = "snowpack"; // Not tested
const SNOWPACK_SVELTEKIT = "snowpack-sveltekit";
const WEBPACK = "webpack"; // Not currently supported or inferred
const WEBPACK_SAPPER = "webpack-sapper"; // Not currently supported or inferred
const VITE = "vite";
const VITE_SVELTEKIT = "vite-sveltekit";
const UNKNOWN_SETUP = "unknown";
const SETUP = "setup";

const EXCLUDE_EXAMPLES = "excludeExamples";
Preset.option(EXCLUDE_EXAMPLES, false);

Preset.hook((preset) => {
  preset.context[SETUP] = UNKNOWN_SETUP;
}).withoutTitle();
Preset.edit("package.json")
  .update((content, preset) => {
    const pkg = JSON.parse(content);

    const dependencies = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };

    if (dependencies["@sveltejs/kit"]) {
      if (dependencies["vite"]) preset.context[SETUP] = VITE_SVELTEKIT;
      else if (dependencies["snowpack"])
        preset.context[SETUP] = SNOWPACK_SVELTEKIT;
    } else if (dependencies["vite"]) {
      preset.context[SETUP] = VITE;
    } else if (dependencies["snowpack"]) {
      preset.context[SETUP] = SNOWPACK;
    }

    return content;
  })
  .withoutTitle();

Preset.extract("mdsvex.config.cjs").withTitle("Adding mdsvex config file");
Preset.extract("mdsvex.config.js").withTitle(
  "Adding mdsvex config file (ESM compatible)"
);

Preset.edit("mdsvex.config.cjs")
  .update((content) => {
    let result = content;
    result = result.replace("remarkPlugins: []", exampleRemark);
    result = result.replace("rehypePlugins: []", exampleRehype);
    return result;
  })
  .withTitle("Showing example remark and rehype plugin usage")
  .ifNotOption(EXCLUDE_EXAMPLES);

Preset.editJson("package.json")
  .merge({
    devDependencies: {
      mdsvex: "^0.9.0",
    },
  })
  .withTitle("Adding needed dependencies");

Preset.editJson("package.json")
  .merge({
    devDependencies: {
      "rehype-autolink-headings": "^5.0.1",
      "rehype-slug": "^4.0.1",
      "remark-abbr": "^1.4.1",
      "remark-github": "^10.0.1",
    },
  })
  .withTitle("Adding example dependencies (remark and rehype plugins)")
  .ifNotOption(EXCLUDE_EXAMPLES);

Preset.group((preset) => {
  preset
    .extract("svelte.config.js")
    .whenConflict("skip")
    .withTitle("Adding `svelte.config.js`")
    .if((preset) => [VITE].includes(preset.context[SETUP]));

  preset
    .edit("svelte.config.cjs")
    .update((content) => {
      let result = content;

      const matchPreprocess = /(preprocess\(.*\))/m;
      result = result.replace(
        matchPreprocess,
        (_match, oldPreprocessor) => `[${oldPreprocessor}]`
      );

      const matchPreprocessors = /preprocess:[\s\r\n]\[[\s\r\n]*((?:.|\r|\n)+)[\s\r\n]*\]/m;
      result = result.replace(
        matchPreprocessors,
        (_match, otherPreprocessors) => {
          return addPreprocessor(otherPreprocessors);
        }
      );
      result = result.replace(
        "module.exports = {",
        `module.exports = {\n\textensions: [".svelte", ...mdsvexConfig.extensions],`
      );
      if (!result.includes("mdsvex("))
        result = result.replace(
          "module.exports = {",
          `module.exports = {\n\t${addPreprocessor("")},`
        );

      result = `const mdsvexConfig = require("./mdsvex.config.cjs");\n${result}`;
      result = `const { mdsvex } = require("mdsvex");\n${result}`;

      return result;
    })
    .withTitle("Configuring it in svelte.config.cjs (if it exists)");

  preset
    .edit("svelte.config.js")
    .update((content) => {
      let result = content;

      const matchPreprocess = /(preprocess\(.*\))/m;
      result = result.replace(
        matchPreprocess,
        (_match, oldPreprocessor) => `[${oldPreprocessor}]`
      );

      const matchPreprocessors = /preprocess:[\s\r\n]\[[\s\r\n]*((?:.|\r|\n)+)[\s\r\n]*\]/m;
      result = result.replace(
        matchPreprocessors,
        (_match, otherPreprocessors) => {
          return addPreprocessor(otherPreprocessors);
        }
      );
      if (!result.includes("mdsvex("))
        result = result.replace(
          "const config = {",
          `const config = {\n\t${addPreprocessor("")},`
        );

      result = `import { mdsvex } from "mdsvex";\nimport { mdsvexConfig } from "./mdsvex.config.js";\n${result}`;

      result = result.replace(
        "const config = {",
        `const config = {\n\textensions: [".svelte", ...mdsvexConfig.extensions],`
      );

      return result;
    })
    .withTitle("Configuring it in svelte.config.js (if it exists)");
}).withTitle("Setting up the mdsvex preprocessor");

Preset.extract("src/lib/Example.svelte.md")
  .withTitle("Adding an example mdsvex component")
  .ifNotOption(EXCLUDE_EXAMPLES);

Preset.group((preset) => {
  preset.extract("src/routes/example-markdown.md");

  preset.edit("src/routes/index.svelte").update((contents) => {
    const closingMain = `</main>`;
    return contents.replace(
      closingMain,
      `\t<p>Visit <a href="/example-markdown">the /example-markdown page</a> to see some markdown rendered by mdsvex.</p>\n${closingMain}`
    );
  });
})
  .withTitle(
    "Adding a markdown page as an example and linking to it from the homepage"
  )
  .ifNotOption(EXCLUDE_EXAMPLES)
  .if((preset) =>
    [SNOWPACK_SVELTEKIT, VITE_SVELTEKIT].includes(preset.context[SETUP])
  );

Preset.instruct(
  `Run ${color.magenta("npm install")}, ${color.magenta(
    "pnpm install"
  )}, or ${color.magenta("yarn")} to install dependencies`
);
