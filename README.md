# yawn 😴

tired of switching between package managers?

```
npm i -g yawnpm
```

supported package managers: **npm**, **yarn**, **pnpm**, **bun**, **deno**

supported commands: **install**, **update**, **remove**, **run**, **dlx**

---

### `yawn remove`

shows an interactive list of installed dependencies to pick from:

```
❯ Select dependencies to remove:
◼ svelte (5.43.3)
◻ @svelte/kit
◻ runed
…
```

---

### `yawn run`

lists available scripts:

```
❯ Select script to run:
● build (nuxt build)
○ dev
○ lint
```

---

### example

```
yawn install axios
yawn remove
yawn run
```

### inspiration/similar projects

- https://github.com/unjs/nypm
- https://github.com/antfu-collective/ni for the interactive `remove` command 

### roadmap

- interactive update command
- ...
