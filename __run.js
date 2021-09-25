import { addImport, findImport, getConfigExpression, getPreprocessArray } from "../../ast-tools.js";

/**
 * @param {import("../../ast-io.js").RecastAST} mdsvexConfigAst
 * @param {boolean} cjs
 * @returns {import("../../ast-io.js").RecastAST}
 */
const updateMdsvexConfig = (mdsvexConfigAst, cjs) => {
	const mdsvexConfigObject = getConfigExpression({ cjs, typeScriptEstree: mdsvexConfigAst });
	if (mdsvexConfigObject.type !== "ObjectExpression") throw new Error("Svelte config must be an object");

	/** @type {import("estree").ArrayExpression} */
	const extensions = {
		type: "ArrayExpression",
		elements: [
			{
				type: "Literal",
				value: ".svelte.md",
			},
			{
				type: "Literal",
				value: ".md",
			},
			{
				type: "Literal",
				value: ".svx",
			},
		],
	};

	/** @type {import("estree").ObjectExpression} */
	const smartypants = {
		type: "ObjectExpression",
		properties: [
			{
				type: "Property",
				computed: false,
				key: {
					type: "Literal",
					value: "dashes",
				},
				kind: "init",
				method: false,
				shorthand: false,
				value: {
					type: "Literal",
					value: "oldschool",
				},
			},
		],
	};

	/** @type {import("estree").ArrayExpression} */
	const remarkPlugins = {
		type: "ArrayExpression",
		elements: [],
	};

	/** @type {import("estree").ArrayExpression} */
	const rehypePlugins = {
		type: "ArrayExpression",
		elements: [],
	};

	const config = { extensions, smartypants, remarkPlugins, rehypePlugins };

	/** @type {Record<string, import("estree").Property>} */
	const properties = {};

	for (const property of mdsvexConfigObject.properties) {
		if (property.type !== "Property") continue;
		if (property.key.type !== "Literal") continue;
		if (typeof property.key.value !== "string") continue;

		properties[property.key.value] = property;
	}

	for (const [key, value] of Object.entries(config)) {
		if (key in properties) continue;

		mdsvexConfigObject.properties.push({
			type: "Property",
			key: {
				type: "Literal",
				value: key,
			},
			computed: false,
			kind: "init",
			method: false,
			shorthand: false,
			value,
		});
	}

	return mdsvexConfigAst;
};

/**
 * @param {import("../../ast-io.js").RecastAST} svelteConfigAst
 * @param {boolean} cjs
 * @returns {import("../../ast-io.js").RecastAST}
 */
const updateSvelteConfig = (svelteConfigAst, cjs) => {
	let mdsvexConfigImportedAs = findImport({ cjs, package: "./mdsvex.config.js", typeScriptEstree: svelteConfigAst }).default;
	// Add an mdsvex config import if it's not there
	if (!mdsvexConfigImportedAs) {
		mdsvexConfigImportedAs = "mdsvexConfig";
		if (!cjs) {
			addImport({ cjs: false, default: mdsvexConfigImportedAs, package: "./mdsvex.config.js", typeScriptEstree: svelteConfigAst });
		}
	}

	let mdsvexImportedAs = findImport({ cjs, package: "mdsvex", typeScriptEstree: svelteConfigAst }).named["mdsvex"];
	// Add an mdsvex import if it's not there
	if (!mdsvexImportedAs) {
		mdsvexImportedAs = "mdsvex";
		addImport({ cjs, named: { mdsvex: mdsvexImportedAs }, package: "mdsvex", typeScriptEstree: svelteConfigAst });
	}

	const svelteConfigObject = getConfigExpression({ cjs, typeScriptEstree: svelteConfigAst });
	if (svelteConfigObject.type !== "ObjectExpression") throw new Error("Svelte config must be an object");

	/** @type {import("estree").Property | undefined} */
	let extensionsProperty;
	for (const property of svelteConfigObject.properties) {
		if (property.type !== "Property") continue;
		if (property.key.type !== "Literal") continue;
		if (property.key.value === "extensions") extensionsProperty = property;
	}
	if (!extensionsProperty) {
		extensionsProperty = {
			type: "Property",
			computed: false,
			key: {
				type: "Literal",
				value: "extensions",
			},
			kind: "init",
			method: false,
			shorthand: false,
			value: {
				type: "ArrayExpression",
				elements: [],
			},
		};
		svelteConfigObject.properties.unshift(extensionsProperty);
	}
	if (extensionsProperty.value.type !== "ArrayExpression") throw new TypeError("expected array of strings for extensions in Svelte config");

	extensionsProperty.value.elements.unshift({
		type: "Literal",
		value: ".svelte",
	});
	extensionsProperty.value.elements.push({
		type: "SpreadElement",
		argument: {
			type: "MemberExpression",
			object: {
				type: "Identifier",
				name: mdsvexConfigImportedAs,
			},
			computed: false,
			optional: false,
			property: {
				type: "Identifier",
				name: "extensions",
			},
		},
	});

	const preprocessArray = getPreprocessArray({ configObject: svelteConfigObject });

	/** @type {import("estree").CallExpression | undefined} */
	let mdsvexFunctionCall;
	for (const element of preprocessArray.elements) {
		if (!element) continue;
		if (element.type !== "CallExpression") continue;
		if (element.callee.type !== "Identifier") continue;
		if (element.callee.name !== mdsvexImportedAs) continue;
		mdsvexFunctionCall = element;
	}

	// Add an mdsvex(mdsvexConfig) call to the config if missing
	if (!mdsvexFunctionCall) {
		mdsvexFunctionCall = {
			type: "CallExpression",
			// @ts-ignore - I am not sure why this is typed wrongly (?)
			arguments: [
				{
					type: "Identifier",
					name: mdsvexConfigImportedAs,
				},
			],
			callee: {
				type: "Identifier",
				name: mdsvexImportedAs,
			},
			optional: false,
		};

		preprocessArray.elements.push(mdsvexFunctionCall);
	}

	return svelteConfigAst;
};

/** @type {import("../..").AdderRun<import("./__metadata.js").Options>} */
export const run = async ({ folderInfo, install, updateJavaScript }) => {
	const cjs = folderInfo.packageType !== "module";

	await updateJavaScript({
		path: cjs ? "/mdsvex.config.cjs" : "/mdsvex.config.js",
		async script({ typeScriptEstree }) {
			return {
				typeScriptEstree: updateMdsvexConfig(typeScriptEstree, cjs),
			};
		},
	});

	await updateJavaScript({
		path: cjs ? "/svelte.config.cjs" : "/svelte.config.js",
		async script({ typeScriptEstree }) {
			return {
				typeScriptEstree: updateSvelteConfig(typeScriptEstree, cjs),
			};
		},
	});

	await install({ package: "mdsvex" });
};
