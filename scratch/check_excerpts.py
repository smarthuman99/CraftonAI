import re

filepath = r"C:\Users\huawei\.gemini\antigravity\brain\00efd457-699e-4577-800f-e7b993a16f1b\.system_generated\steps\2524\content.md"

with open(filepath, 'r', encoding='utf-8') as f:
    html_content = f.read()

# Let's search if there are any paragraphs <p> or divs that look like project excerpts or descriptions
# near the mdp-imager-box-title
# For example, let's look for text between the title and the next div closing
print("Searching for project details/descriptions in the main HTML...")

# Let's look for text that could be an excerpt
# Usually portfolio grid might only show the title, and when you hover or click, it goes to the project page.
# Let's check if there are descriptions in the HTML.
# We'll search for common words or long texts near "mdp-imager-box"
matches = re.finditer(r'class="mdp-imager-box-overlay">', html_content)
for idx, match in enumerate(matches):
    start = match.start()
    end = start + 500
    print(f"\nOverlay block {idx+1}:")
    print(html_content[start:end])
    if idx >= 5:
        break
