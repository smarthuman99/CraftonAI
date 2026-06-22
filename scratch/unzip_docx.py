import zipfile
import os
import shutil

docx_path = r"E:\Chao的资料\AI 方案\new idea\网站架构V1.1-20251004.docx"
dest_dir = r"e:\CraftonAI\extracted_docx_contents"

if os.path.exists(dest_dir):
    shutil.rmtree(dest_dir)
os.makedirs(dest_dir, exist_ok=True)

print(f"Unzipping {docx_path} to {dest_dir}...")
with zipfile.ZipFile(docx_path, 'r') as zip_ref:
    zip_ref.extractall(dest_dir)

print("Files in extracted word document:")
# Let's see if there is a word/media folder
media_dir = os.path.join(dest_dir, 'word', 'media')
if os.path.exists(media_dir):
    print("Media files found:")
    for f in os.listdir(media_dir):
        print(f"  - {f} (size: {os.path.getsize(os.path.join(media_dir, f))} bytes)")
        # Copy to e:\CraftonAI\src\media if needed
        dest_media_dir = r"e:\CraftonAI\src\media"
        os.makedirs(dest_media_dir, exist_ok=True)
        shutil.copy(os.path.join(media_dir, f), os.path.join(dest_media_dir, f))
    print(f"Copied all media files to {dest_media_dir}")
else:
    print("No word/media directory found in the DOCX archive.")
