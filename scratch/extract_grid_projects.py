import re
import html

filepath = r"C:\Users\huawei\.gemini\antigravity\brain\00efd457-699e-4577-800f-e7b993a16f1b\.system_generated\steps\2524\content.md"

with open(filepath, 'r', encoding='utf-8') as f:
    html_content = f.read()

# Let's find all project boxes in the portfolio grid
# The structure is:
# <div class="mdp-imager-wrap ...">
#   <a href="URL" ...>
#     <div class="mdp-imager-item ...">
#       <div class="mdp-imager-box-image ...">
#         <div style="background-image: url( IMAGE_URL );" ...></div>
#       </div>
#       ...
#       <div class="mdp-imager-box-title">TITLE</div>
#       ...

# We can find all chunks corresponding to `<div class="mdp-imager-wrap ..."> ... </div>` or `<a href=...`
# Let's use a regex that matches each mdp-imager-wrap block or simply a link containing a title and background image.
pattern = r'<div class="mdp-imager-wrap[^"]*">.*?<a href="([^"]+)".*?background-image: url\(\s*([^)]+)\s*\).*?<div class="mdp-imager-box-title">\s*(.*?)\s*</div>'
matches = re.findall(pattern, html_content, re.DOTALL | re.IGNORECASE)

print(f"Found {len(matches)} grid projects using regex 1:")
for idx, (url, img_url, title) in enumerate(matches):
    title_clean = re.sub(r'<[^>]+>', '', title).strip()
    title_clean = html.unescape(title_clean)
    img_url_clean = img_url.strip()
    print(f"{idx+1}. {title_clean}\n   Link: {url}\n   Image: {img_url_clean}\n")

# Let's write another regex just in case there are slight variations in the HTML structure
if not matches:
    # Try finding simple matches of <a> with href, background-image and title
    items = re.findall(r'<a href="([^"]+)"[^>]*>.*?background-image: url\(\s*([^)]+)\s*\).*?<div class="mdp-imager-box-title">\s*([^<]+)\s*</div>', html_content, re.DOTALL | re.IGNORECASE)
    print(f"Found {len(items)} grid projects using regex 2:")
    for idx, (url, img_url, title) in enumerate(items):
         print(f"{idx+1}. {title.strip()}\n   Link: {url}\n   Image: {img_url.strip()}\n")
