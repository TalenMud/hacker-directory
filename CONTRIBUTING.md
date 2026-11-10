# Adding your card to the hacker directory

Hey! Welcome. This guide assumes you have **never made a GitHub pull
request before** — no assumed knowledge, no skipped steps. If you get
stuck anywhere, that's a bug in this guide, not you — open an issue and
let us know.

By the end of this you'll have your own page on the site, and your name
will be one of the very few lines of code that gets you into a real,
public, open-source project. That's it. That's the bar. Let's go.

---

## What you're actually doing

Every person in the directory is just a folder:

```
contributors/
  your-username/
    index.html    ← your personal page (customise this however you want)
    card.json     ← your info that shows up on the main grid
```

You're going to copy the `template/` folder, rename it to your GitHub
username, fill in a couple of details, and open a pull request (a "PR" —
just a request asking us to merge your changes into the project).

---

## Step 1 — Fork the repo

"Forking" makes your own personal copy of this project under your GitHub
account, which you're free to edit.

1. Make sure you're logged into GitHub (make a free account at
   [github.com](https://github.com) if you don't have one yet).
2. Go to the repository's page.
3. In the top-right corner, click the **Fork** button.
   *(It looks like a little branching icon with the word "Fork" next to
   a number.)*
4. GitHub will show you a "Create a new fork" page. You can leave
   everything as default — just click the green **Create fork** button.
5. After a few seconds you'll land on **your own copy** of the repo, at
   `github.com/your-username/hacker-directory`.

> 💡 Everything you do from here happens on *your* fork. Nothing touches
> the real site until you open a PR and someone merges it.

---

## Step 2 — Get the code onto your computer

You have two options. Pick whichever feels less scary.

### Option A: Edit directly on GitHub (no downloads needed)

You can do this whole guide entirely in the browser — see Step 3's
"the no-download way." If you pick this, skip to Step 3 now.

### Option B: Clone it to your computer (recommended if you want to preview your page)

1. On your fork's page, click the green **Code** button.
2. Copy the URL that appears (it'll look like
   `https://github.com/your-username/hacker-directory.git`).
3. Open a terminal and run:
   ```bash
   git clone https://github.com/your-username/hacker-directory.git
   cd hacker-directory
   ```

---

## Step 3 — Copy the template folder

Your new folder needs to be named **exactly** the same as your GitHub
username (all lowercase is safest). This matters — it's how the site
matches your PR to your profile automatically.

### The no-download way (all in the browser)

1. In your fork, open the `template` folder.
2. Open `card.json`, click the pencil (✏️) icon to edit it, and copy its
   contents.
3. Go back to `contributors/`, click **Add file → Create new file**.
4. In the filename box, type `your-username/card.json` (replace
   `your-username` with your actual GitHub username) — GitHub will
   automatically create the folder for you.
5. Paste in the template contents and edit them (see Step 4 below).
6. Repeat the same process for `index.html`
   (`contributors/your-username/index.html`), copying from
   `template/index.html`.

### The terminal way

```bash
cp -r template contributors/your-username
```

Replace `your-username` with your real GitHub username.

---

## Step 4 — Fill in your `card.json`

Open `contributors/your-username/card.json`. It looks like this:

```json
{
  "name": "Your Name",
  "role": "What you do — e.g. CS Student, Frontend Dev, Robotics Nerd",
  "university": "Your school or company (optional)",
  "github": "your-github-username",
  "bio": "One or two sentences about what you build, what you're learning, or what you're into.",
  "tags": ["Python", "JavaScript", "Your Tag Here"],
  "location": "",
  "links": {
    "website": "https://your-site.example.com"
  }
}
```

Edit every value on the right-hand side of the `:` to be about you.
A filled-in example:

```json
{
  "name": "Ada Lovelace",
  "role": "Maths Student",
  "university": "King's College London",
  "github": "ada-lovelace",
  "bio": "Writing the first algorithm intended for a machine. Into analytical engines and punch cards.",
  "tags": ["Maths", "Algorithms", "History of Computing"],
  "location": "London, UK",
  "links": {
    "website": "https://adalovelace.dev"
  }
}
```

**Required fields:** `name`, `github`, `bio`, `tags` — the site won't
build your card without these. Everything else is optional.

**About `location`:** same spirit as `bio` — completely optional, and
freeform text, not a real address lookup. Leave it as `""` (or delete the
line) if you'd rather not share where you are, and you just won't show up
on the [contributor map](map.html). If you do set it, keep it coarse —
city or country is the idea (`"Cardiff, UK"`, `"Kenya"`), not a street
address or exact coordinates. It gets turned into an approximate pin by a
workflow that runs after your PR merges, not by anything that runs in
another visitor's browser.

**A note on JSON:** every line except the last one inside `{ }` needs a
comma at the end. Text needs double quotes `"like this"`. If you're
unsure, just follow the pattern in the example closely — most first-PR
mistakes are a missing comma or quote, and our automated check (see
below) will tell you exactly what's wrong if so.

---

## Step 5 — Customise your `index.html`

This file is **your sandbox**. It's your page and nobody else's — do
whatever you want with it:

- Just fill in your name, bio, and links (totally fine, no pressure)
- Add a project list
- Embed a game, an art piece, a terminal-style intro
- Add a little interactive visualisation like the [MCMC demo on Talen's page](contributors/talen/index.html)

The template already links to the site's shared dark/light theme, so if
you keep the existing HTML structure and just edit the text, it'll
automatically look polished. If you want to rip it all out and start
from a blank page, that's allowed too — just make sure the file is
still called `index.html` and lives at `contributors/your-username/index.html`.

### Adding your own styles

Your folder also comes with a `styles.css` — that's the place for any
CSS that's specific to your page. It only ever affects your own
`index.html`; nothing you put there can change anyone else's page or
the main directory grid, so go wild.

If you want a live example of this, look at
[`contributors/talen/styles.css`](contributors/talen/styles.css) —
copy anything from it you like (fonts, layout tricks, the pill-coloring
pattern, whatever). Just note that CSS rules keyed to Talen's specific
tags or class names won't automatically apply to yours — you'll need to
swap in your own values.

### Previewing your page locally (optional)

If you cloned the repo (Option B above), you can preview your changes
before opening a PR. A couple of easy options:

**Using VS Code (recommended if that's your editor):**

1. Install the **Live Server** extension (search for it in the
   Extensions panel — the one by Ritwick Dey).
2. Right-click `index.html` in the file explorer and choose
   **Open with Live Server**.
3. It'll open in your browser automatically and reload every time you
   save a file.

**Using a terminal:**

```bash
# from the root of the repo
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

---

## Step 6 — Open a pull request

### The no-download way

If you edited files directly on GitHub, every time you clicked the
green **Commit changes** button, GitHub will have offered to open a PR
for you. Follow that prompt, or:

1. Go to your fork's page on GitHub.
2. You should see a banner saying "This branch is X commits ahead" with
   a **Contribute** button, or a **Compare & pull request** button.
3. Click it.

### The terminal way

```bash
git checkout -b add-your-username
git add contributors/your-username
git commit -m "Add your-username to the directory"
git push origin add-your-username
```

Then go to your fork on GitHub — you'll see a yellow banner with a
**Compare & pull request** button. Click it.

### Filling out the PR

1. Give it a title like `Add your-username to the directory`.
2. In the description, say a sentence about who you are (totally
   optional, but fun).
3. Click the green **Create pull request** button.

That's it! You've opened your first pull request. 🎉

---

## What happens next

- A GitHub Action automatically checks your PR — it validates that your
  `card.json` is valid JSON with the required fields, checks that you've
  only touched your own folder, and does a quick automated pass for
  anything that might need a closer look (flagged words, embedded images
  that aren't your GitHub avatar). It posts a summary comment either way.
- You don't need to touch `contributors/manifest.json` — the list the
  homepage reads is rebuilt from the contributor folders when your PR is
  merged.
- This project **doesn't auto-merge** — every PR gets read and merged by
  a real person. That's on purpose: with a small community, we'd rather
  actually see each new contributor than wave them through a bot. It
  might take a little while depending on when a maintainer is free, but
  you will hear from someone.
- Once it's merged, your card will show up on the live site within a
  couple of minutes.

---

## Troubleshooting

- **"My card.json check failed"** — read the comment the bot leaves on
  your PR, it'll point at the exact problem (usually a missing comma,
  missing quote, or a missing required field).
- **"My folder name doesn't match my PR check"** — make sure your folder
  is named exactly like your GitHub username, all lowercase.
- **"I don't know what to put in index.html"** — just keep the template
  as-is and fill in your name/bio/links. That's a completely valid,
  complete contribution.
- **Still stuck?** — open an issue on the repo and someone will help.

Welcome to the directory. Go build something weird with your page.
