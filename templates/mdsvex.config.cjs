module.exports = {
	extensions: [".svx", ".md"],
	smartypants: {
		dashes: "oldschool",
	},
	remarkPlugins: [
		// [require("remark-github"), {
		// 	repository: "https://github.com/svelte-add/mdsvex.git", // (use your own repository)
		// }],
		// require("remark-abbr"),
	],
	rehypePlugins: [
		// require("rehype-slug"),
		// [require("rehype-autolink-headings"), {
		// 	behavior: "wrap",
		// }],
	],
};
