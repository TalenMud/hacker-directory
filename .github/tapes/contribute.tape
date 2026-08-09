# VHS tape: walks through the contributor setup flow.
#
# Render with:
#   vhs .github/tapes/contribute.tape
# (requires vhs + ttyd + ffmpeg locally)
#
# The rendered GIF is intended to be embedded in README.md under a
# "Getting started" section. It's not committed — keep the repo small
# and re-render only when the steps change.

Output assets/contribute.gif

Set Shell bash
Set FontSize 14
Set Width 800
Set Height 450
Set Padding 20

# Start in a clean directory
Type "mkdir -p /tmp/hacker-demo && cd /tmp/hacker-demo"
Enter
Sleep 1s

Type "git clone https://github.com/TalenMud/hacker-directory.git"
Enter
Sleep 4s

Type "cd hacker-directory"
Enter
Sleep 500ms

Type "cp -r contributors/talen contributors/your-username"
Enter
Sleep 500ms

Type "code contributors/your-username/card.json"
Sleep 2s

# Edit the card.json fields. Each Type/Enter lands one keystroke.
Type "i"
Sleep 200ms
Type@500ms `"name": "Your Name",`
Enter
Type `"github": "your-username",`
Enter
Type `"bio": "What you're building right now.",`
Enter
Type `"tags": ["Python", "Web"],`
Enter
Type `"links": []`
Escape
Type ":wq"
Enter
Sleep 1s

Type "git checkout -b add-your-username"
Enter
Sleep 500ms

Type "git add contributors/your-username"
Enter
Sleep 500ms

Type "git commit -m \"Add your-username card\""
Enter
Sleep 2s

Type "git push origin add-your-username"
Enter
Sleep 2s

# End on the push output so the GIF closes on the "open a PR" prompt.
Type "echo \"Open a PR at: https://github.com/TalenMud/hacker-directory/compare/main...your-username:add-your-username\""
Enter
Sleep 2s
