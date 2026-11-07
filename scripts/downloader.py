import json
import urllib.request
import re
import os

# Internet Archive item identifier for Owen's 1853 translation
# Full text (OCR) download URL pattern:
# https://archive.org/download/{identifier}/{identifier}_djvu.txt
IA_IDENTIFIER = "organonorlogica04porpgoog"
IA_TEXT_URL = f"https://archive.org/download/{
    IA_IDENTIFIER}/{IA_IDENTIFIER}_djvu.txt"


def fetch_text(url):
    print(f"Fetching: {url}")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as response:
        return response.read().decode('utf-8', errors='ignore')


def clean_ocr_text(raw):
    # Remove common OCR artifacts
    text = re.sub(r'\r\n', '\n', raw)
    # Remove excessive blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def split_by_treatise(text):
    """
    Attempt to split the single OCR text into the six Organon treatises.
    The Owen translation includes: Categories, On Interpretation,
    Prior Analytics, Posterior Analytics, Topics, Sophistical Refutations.
    """
    # Look for headings typical in this translation
    patterns = [
        (r'(?i)\bCATEGORIES\b', 'Categories'),
        (r'(?i)\bON INTERPRETATION\b', 'On Interpretation'),
        (r'(?i)\bPRIOR ANALYTICS\b', 'Prior Analytics'),
        (r'(?i)\bPOSTERIOR ANALYTICS\b', 'Posterior Analytics'),
        (r'(?i)\bTOPICS\b', 'Topics'),
        (r'(?i)\bSOPHISTICAL REFUTATIONS\b', 'On Sophistical Refutations'),
    ]

    # Find positions of each heading
    positions = []
    for pattern, name in patterns:
        for m in re.finditer(pattern, text):
            positions.append((m.start(), name))

    positions.sort(key=lambda x: x[0])

    # Deduplicate (keep first occurrence of each name)
    seen = set()
    filtered = []
    for pos, name in positions:
        if name not in seen:
            seen.add(name)
            filtered.append((pos, name))

    if not filtered:
        return [{"chapter_id": 1, "title": "Full Text", "content": text}]

    chapters = []
    for i, (start, name) in enumerate(filtered):
        end = filtered[i+1][0] if i+1 < len(filtered) else len(text)
        content = text[start:end].strip()
        chapters.append({
            "chapter_id": i + 1,
            "title": name,
            "content": content
        })

    # Prepend any introduction before the first heading
    if filtered[0][0] > 0:
        intro = text[:filtered[0][0]].strip()
        if intro:
            chapters.insert(0, {
                "chapter_id": 0,
                "title": "Introduction / Front Matter",
                "content": intro
            })

    return chapters


def main():
    print("Initializing Organon data compilation (English translation)...")

    try:
        raw_text = fetch_text(IA_TEXT_URL)
    except Exception as e:
        print(f"Failed to download: {e}")
        return

    print(f"Downloaded {len(raw_text)} characters.")
    cleaned = clean_ocr_text(raw_text)
    chapters = split_by_treatise(cleaned)

    organon_data = {
        "collection": "Organon",
        "author": "Aristotle",
        "translator": "Octavius Freire Owen (1853)",
        "source": IA_TEXT_URL,
        "language": "English",
        "books": {
            "Organon": {
                "title": "The Organon (Complete)",
                "source_url": IA_TEXT_URL,
                "chapters": chapters
            }
        }
    }

    output_filename = "data/organon_english.json"
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(organon_data, f, indent=2, ensure_ascii=False)

    print(f"\nSuccess! Written to: {output_filename}")
    print(f"Total chapters/treatises: {len(chapters)}")


if __name__ == "__main__":
    main()
