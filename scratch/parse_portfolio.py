import re
import os

filepath = r"C:\Users\huawei\.gemini\antigravity\brain\00efd457-699e-4577-800f-e7b993a16f1b\.system_generated\steps\2524\content.md"

with open(filepath, 'r', encoding='utf-8') as f:
    html_content = f.read()

# Let's search for image urls
img_urls = re.findall(r'https://fosseyarora\.com/wp-content/uploads/[^"\']+\.(?:jpg|jpeg|png)', html_content)
print(f"Found {len(img_urls)} image URLs. First 20:")
for url in list(set(img_urls))[:20]:
    print(url)

# Let's look for headings like <h2> or <h3> or classes that might represent project names
headings = re.findall(r'<h[1-6][^>]*>(.*?)</h[1-6]>', html_content, re.DOTALL)
print(f"\nFound {len(headings)} headings. First 30:")
for h in headings[:30]:
    h_clean = re.sub(r'<[^>]+>', '', h).strip()
    if h_clean:
        print(f"- {h_clean}")

# Let's see some text near portfolio sections
# We can search for classes like 'portfolio', 'gallery', 'project', etc.
project_blocks = re.findall(r'<div[^>]+class="[^"]*(?:portfolio|project|gallery)[^"]*"[^>]*>.*?</div>', html_content, re.DOTALL)
print(f"\nFound {len(project_blocks)} custom divs.")
