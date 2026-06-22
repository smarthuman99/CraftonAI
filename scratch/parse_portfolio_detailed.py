import re
import os

filepath = r"C:\Users\huawei\.gemini\antigravity\brain\00efd457-699e-4577-800f-e7b993a16f1b\.system_generated\steps\2524\content.md"

with open(filepath, 'r', encoding='utf-8') as f:
    html_content = f.read()

# Let's save the parsed output to portfolio_parsed.txt in utf-8
output_file = r"e:\CraftonAI\scratch\portfolio_parsed.txt"

with open(output_file, 'w', encoding='utf-8') as out:
    out.write("=== PORTFOLIO EXTRACTED DATA ===\n\n")
    
    # Find all images
    img_urls = re.findall(r'https://fosseyarora\.com/wp-content/uploads/[^"\']+\.(?:jpg|jpeg|png)', html_content)
    img_urls = sorted(list(set(img_urls)))
    out.write(f"FOUND {len(img_urls)} UNIQUE IMAGES:\n")
    for img in img_urls:
        out.write(f"  - {img}\n")
    out.write("\n" + "="*50 + "\n\n")

    # Let's look for titles, grid-items, or portfolio items
    # In WordPress or Elementor, portfolio items are often in certain classes or contain elements.
    # Let's search for typical project structures.
    # We can write out chunks of html that look like they belong to portfolio items or links.
    out.write("ELEMENTOR / WORDPRESS CONTAINER EXTRACIONS:\n")
    
    # Find links to portfolio details or projects
    # Let's search for lines containing href to check if there are sub-portfolio pages
    hrefs = re.findall(r'href="([^"]+)"', html_content)
    unique_hrefs = sorted(list(set(hrefs)))
    out.write(f"FOUND {len(unique_hrefs)} UNIQUE HREF LINKS:\n")
    for href in unique_hrefs:
        if "portfolio" in href or "project" in href or "case" in href:
            out.write(f"  - {href}\n")
    out.write("\n" + "="*50 + "\n\n")

    # Let's find any text paragraphs or spans inside grid galleries
    # Let's print sections of HTML that mention specific keywords like "Villa", "Cottage", "Heath", "Gardens", "Square"
    # we saw images like cadogan-sq, Glebe-Cottage, The-Robinson, Chastje, Villa-Ginestre, eastheath, canada_gardens
    keywords = ["cadogan", "Glebe", "Robinson", "Chastje", "Ginestre", "eastheath", "canada_gardens", "lancelot"]
    for kw in keywords:
        out.write(f"SEARCH FOR KEYWORD: {kw}\n")
        # Find 1000 characters around the keyword
        for match in re.finditer(kw, html_content, re.IGNORECASE):
            start = max(0, match.start() - 300)
            end = min(len(html_content), match.end() + 1500)
            snippet = html_content[start:end]
            out.write(f"--- MATCH SNIPPET ---\n{snippet}\n---------------------\n\n")
            
print("Extraction script written.")
