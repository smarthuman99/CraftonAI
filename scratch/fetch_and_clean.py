import urllib.request
import re
from html.parser import HTMLParser
import sys

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.recording = False
        self.text_data = []
        self.in_style_or_script = False

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
        
        # Filter and clean lines
        lines = []
        for line in parser.text_data:
            if len(line) > 3:  # skip very short things like punctuation or numbers
                lines.append(line)
        return lines
    except Exception as e:
        return [f"Error: {e}"]

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "https://fosseyarora.com/villa-ginestre/"
    print(f"Fetching and parsing {url}...")
    lines = fetch_clean_text(url)
    print(f"Total extracted lines: {len(lines)}")
    for idx, l in enumerate(lines[:100]): # first 100 non-empty text lines
        print(f"[{idx+1}] {l}")
