import urllib.request
import re
import json
from html.parser import HTMLParser

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_style_or_script = False
        self.text_data = []

    def handle_starttag(self, tag, attrs):
        if tag in ['style', 'script', 'head', 'meta', 'link']:
            self.in_style_or_script = True
        else:
            self.in_style_or_script = False

    def handle_endtag(self, tag):
        if tag in ['style', 'script', 'head', 'meta', 'link']:
            self.in_style_or_script = False

    def handle_data(self, data):
        if not self.in_style_or_script:
            cleaned = data.strip()
            if cleaned:
                self.text_data.append(cleaned)

def fetch_clean_text(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            html_content = response.read().decode('utf-8', errors='ignore')
            
        parser = TextExtractor()
        parser.feed(html_content)
        return parser.text_data
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return []

projects = [
    {
        "id": "CASE-FA-01",
        "titleEn": "Villa Ginestre",
        "url": "https://fosseyarora.com/villa-ginestre/",
        "img": "https://fosseyarora.com/wp-content/uploads/2023/03/Villa-Ginestre-Header-Image-scaled.jpg",
        "tagEn": "Luxury Residence",
        "tagCn": "頂級私宅"
    },
    {
        "id": "CASE-FA-02",
        "titleEn": "Glebe Cottage",
        "url": "https://fosseyarora.com/glebe-cottage/",
        "img": "https://fosseyarora.com/wp-content/uploads/2023/03/Glebe-Cottage-Header-Image-1.jpg",
        "tagEn": "Historic Estate",
        "tagCn": "莊園別墅"
    },
    {
        "id": "CASE-FA-03",
        "titleEn": "Chastje",
        "url": "https://fosseyarora.com/projects/chastje/",
        "img": "https://fosseyarora.com/wp-content/uploads/2023/03/Chastje-Header-Image-2.jpg",
        "tagEn": "Modern Villa",
        "tagCn": "現代私宅"
    },
    {
        "id": "CASE-FA-04",
        "titleEn": "The Robinson",
        "url": "https://fosseyarora.com/projects/the-robinson/",
        "img": "https://fosseyarora.com/wp-content/uploads/2023/03/KILO-0358-0025-1-scaled.jpg",
        "tagEn": "BTR Lifestyle Suites",
        "tagCn": "高尚住宅套房"
    },
    {
        "id": "CASE-FA-05",
        "titleEn": "Cadogan Square",
        "url": "https://fosseyarora.com/projects/cadogan-square/",
        "img": "https://fosseyarora.com/wp-content/uploads/2022/10/cadogan-sq-15.png",
        "tagEn": "Luxury Penthouse",
        "tagCn": "高奢大平層"
    },
    {
        "id": "CASE-FA-06",
        "titleEn": "Lancelot Knightsbridge",
        "url": "https://fosseyarora.com/projects/lancelot-knightsbridge/",
        "img": "https://fosseyarora.com/wp-content/uploads/2021/06/lancelot-knightsbridge-4.jpeg",
        "tagEn": "Premium Residence",
        "tagCn": "騎士橋私享住宅"
    },
    {
        "id": "CASE-FA-07",
        "titleEn": "Ennismore",
        "url": "https://fosseyarora.com/projects/ennismore/",
        "img": "https://fosseyarora.com/wp-content/uploads/2022/10/ennismore_fetures.png",
        "tagEn": "Bespoke Townhouse",
        "tagCn": "定製聯排別墅"
    },
    {
        "id": "CASE-FA-08",
        "titleEn": "St Lukes Mews",
        "url": "https://fosseyarora.com/projects/st-lukes-mews/",
        "img": "https://fosseyarora.com/wp-content/uploads/2022/10/xLetC1cQ-2048x1365-1.jpeg",
        "tagEn": "Bespoke Mews House",
        "tagCn": "名流閣樓邸"
    }
]

for p in projects:
    print(f"Scraping {p['titleEn']} ({p['url']})...")
    lines = fetch_clean_text(p['url'])
    
    # We want to find the main text paragraph and project details (Location, Date, Client etc.)
    # Let's search for keywords or grab a block of text
    desc_parts = []
    details = {}
    
    # Simple extraction heuristic
    is_details_section = False
    last_key = None
    
    for idx, line in enumerate(lines):
        # Clean line
        line_clean = line.strip()
        if not line_clean:
            continue
            
        # Look for details
        if "Project Details" in line_clean:
            is_details_section = True
            continue
            
        if is_details_section:
            # Look for keys like Location:, Date:, Client:, Services:
            if line_clean.endswith(":") or line_clean in ["Location", "Date", "Client", "Services", "Year"]:
                last_key = line_clean.replace(":", "").strip()
            elif last_key:
                details[last_key] = line_clean
                last_key = None
                
            # If we hit footer or another big section, stop details
            if line_clean in ["About", "Portfolio", "Contact", "Share", "View Gallery"]:
                is_details_section = False
                
        # Look for the description paragraph
        # Usually it's a long paragraph that starts after the title (which is in lines)
        # and doesn't contain nav links. Let's capture paragraphs that are long (e.g. > 100 chars)
        if len(line_clean) > 80 and not is_details_section:
            # ignore known nav phrases
            if not any(nav in line_clean for nav in ["Skip to content", "We use cookies", "All rights reserved", "hello-elementor"]):
                desc_parts.append(line_clean)

    p["description_raw"] = " ".join(desc_parts)
    p["details"] = details
    print(f"  Extracted Details: {details}")
    print(f"  Extracted Desc Snippet: {p['description_raw'][:120]}...")

# Save to file
out_path = "e:/CraftonAI/scratch/projects_data.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(projects, f, ensure_ascii=False, indent=2)

print(f"\nSaved all scraped data to {out_path}!")
