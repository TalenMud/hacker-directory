# VHS tape: walks through the contributor setup flow.
#
# Render with:
#   vhs .github/tapes/contribute.tape
# (requires vhs + ttyd + ffmpeg locally)
#
# The rendered GIF is committed at assets/contribute.gif and embedded
# in README.md under "Getting started". Re-render only when the
# contributor steps change — overwrite the same path.

Output assets/contribute.gif

Set Shell bash
Set FontSize 14
Set Width 720
Set Height 420
Set Padding 20
Set LineHeight 1.2

# Start in a clean directory
Type "rm -rf /tmp/hacker-demo && mkdir -p /tmp/hacker-demo && cd /tmp/hacker-demo"
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

Type "cat contributors/your-username/card.json"
Enter
Sleep 1s

# Replace card.json with the contributor's own fields.
Type "cat > contributors/your-username/card.json << 'EOF'"
Enter
Type `{`
Enter
Type `  "name": "Your Name",`
Enter
Type `  "github": "your-username",`
Enter
Type `  "bio": "What you're building right now.",`
Enter
Type `  "tags": ["Python", "Web"],`
Enter
Type `  "links": []`
Enter
Type `}`
Enter
Type "EOF"
Enter
Sleep 1s

Type "git checkout -b add-your-username"
Enter
Sleep 500ms

Type "git add contributors/your-username"
Enter
Sleep 500ms

Type "git commit -m 'Add your-username card'"
Enter
Sleep 2s

Type "git push origin add-your-username"
Enter
Sleep 2s

# Close on a friendly "open a PR" prompt.
Type "echo Now open a PR on github"
Enter
Sleep 2s