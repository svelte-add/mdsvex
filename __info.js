export const name = "mdsvex";

export const emoji = "🐧";

export const usageMarkdown = ["You can write Svelte in markdown syntax in `.md`, `.svelte.md`, and `.svx` files and import them as Svelte components.", "You can [configure mdsvex](https://mdsvex.com/docs#options) in the `mdsvex.config.js` file."];

/** @type {import("../..").Gatekeep} */
export const gatekeep = async () => {
	return { able: true };
};

/** @typedef {{}} Options */

/** @type {import("../..").AdderOptions<Options>} */
export const options = {};

/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`mdsvex` is installed",
		async detector({ folderInfo }) {
			return "mdsvex" in folderInfo.allDependencies;
		},
	},
	{
		description: "`mdsvex` is set up as a preprocessor in `svelte.config.js`",
		async detector({ readFile }) {
			const js = await readFile({ path: "/svelte.config.js" });
			const cjs = await readFile({ path: "/svelte.config.cjs" });

			/** @param {string} text */
			const preprocessIsProbablySetup = (text) => {
				if (!text.includes("mdsvex")) return false;
				if (!text.includes("preprocess")) return false;
				if (!text.includes("mdsvex(mdsvexConfig)")) return false;

				return true;
			};

			if (js.exists) {
				return preprocessIsProbablySetup(js.text);
			} else if (cjs.exists) {
				return preprocessIsProbablySetup(cjs.text);
			}

			return false;
		},
	},
	{
		description: "`mdsvex.config.js` exists and `mdsvex.config.cjs` does not exist",
		async detector({ readFile }) {
			const js = await readFile({ path: "/mdsvex.config.js" });
			const cjs = await readFile({ path: "/mdsvex.config.cjs" });

			return js.exists && !cjs.exists;
		},
	},
];
