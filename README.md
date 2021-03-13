<h1 align="center">🐧 Add mdsvex to Svelte</h1>

## ❓ What is this?
This is an **experimental** command to run to add [mdsvex](https://mdsvex.com/) to your SvelteKit project.

## 🛠 Usage
You must start with a fresh copy of the official SvelteKit template, which is currently created by running this command:
```sh
npm init svelte@next
# By the way, please listen to its warnings that SvelteKit is an alpha project
# https://svelte.dev/blog/whats-the-deal-with-sveltekit#When_can_I_start_using_it
```

Once that is set up, run this command in your project directory to set up mdsvex:
```sh
npx apply svelte-add/mdsvex # --no-ssh
```

After the preset runs,
* You can write Svelte in markdown syntax in `.svx` and `.md` files and import them as Svelte components.

* You can [configure mdsvex](https://mdsvex.com/docs#options) in the `mdsvex.config.cjs` file.

* You can apply *another* [Svelte Adder](https://github.com/svelte-add/svelte-adders) to your project for more functionality.

## 😵 Help! I have a question
[Create an issue](https://github.com/svelte-add/mdsvex/issues/new) and I'll try to help.

## 😡 Fix! There is something that needs improvement
[Create an issue](https://github.com/svelte-add/mdsvex/issues/new) or [pull request](https://github.com/svelte-add/mdsvex/pulls) and I'll try to fix.

These are new tools, so there are likely to be problems in this project. Thank you for bringing them to my attention or fixing them for me.

## 📄 License
MIT

---

*Repository preview image generated with [GitHub Social Preview](https://social-preview.pqt.dev/)*

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
