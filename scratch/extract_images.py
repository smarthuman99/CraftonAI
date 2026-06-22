import zipfile
import os

def extract_images_from_docx(docx_path, output_dir):
    print(f"Extracting images from {docx_path} to {output_dir}")
    os.makedirs(output_dir, exist_ok=True)
    with zipfile.ZipFile(docx_path) as z:
        for file in z.namelist():
            if file.startswith("word/media/"):
                base_name = os.path.basename(file)
                if not base_name:
                    continue
                dest_path = os.path.join(output_dir, base_name)
                data = z.read(file)
                with open(dest_path, "wb") as out_f:
                    out_f.write(data)
                print(f"Extracted: {base_name} ({len(data)} bytes)")

if __name__ == "__main__":
    docx_path = r"E:\Chao的资料\AI 方案\new idea\网站架构V1.2.docx"
    output_dir = r"e:\CraftonAI\scratch\v12_images"
    extract_images_from_docx(docx_path, output_dir)
