import { Preset } from "apply";

const newPreprocessor = `mdsvex(mdsvexConfig)`

const addPreprocessor = (otherPreprocessors) => `preprocess: [
		${newPreprocessor},
		${otherPreprocessors}]`;


Preset.setName("svelte-add/mdsvex");

Preset.extract("mdsvex.config.cjs").withTitle("Adding mdsvex config file");

Preset.editJson("package.json").merge({
	devDependencies: {
		"mdsvex": "^0.8.9",
	},
}).withTitle("Adding needed dependencies");

Preset.edit(["svelte.config.cjs"]).update((content) => {
	let result = content;

	const matchSveltePreprocess = /(sveltePreprocess\(.*\))/m;
	result = result.replace(matchSveltePreprocess, (_match, oldPreprocessor) => `[${oldPreprocessor}]`);

	const matchPreprocessors = /preprocess:[\s\r\n]\[[\s\r\n]*((?:.|\r|\n)+)[\s\r\n]*\]/m;
	result = result.replace(matchPreprocessors, (_match, otherPreprocessors) => {
		return addPreprocessor(otherPreprocessors);
	});

	result = `const mdsvexConfig = require("./mdsvex.config.cjs");\n${result}`;
	result = `const { mdsvex } = require("mdsvex");\n${result}`;

	result = result.replace("module.exports = {", `module.exports = {\n\textensions: [".svelte", ...mdsvexConfig.extensions],`);
	if (!result.includes("mdsvex(")) result = result.replace("module.exports = {", `module.exports = {\n\t${addPreprocessor("")},`);

	return result;
}).withTitle("Setting up the mdsvex preprocessor");

Preset.extract("src/components/Example.svx").withTitle("Adding an example mdsvex component");

Preset.group((preset) => {
	preset.extract("src/routes/example-markdown.md");

	preset.edit(["src/routes/index.svelte"]).update((contents) => {
		const closingMain = `</main>`;
		return contents.replace(closingMain, `\t<p>Visit <a href="/example-markdown">the /example-markdown page</a> to see some markdown rendered by mdsvex.</p>\n${closingMain}`);
	})
}).withTitle("Adding a markdown page as an example and linking to it from the homepage");
	
Preset.installDependencies().ifUserApproves();
