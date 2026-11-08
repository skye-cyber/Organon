import pdfplumber


def pdf_to_text_pdfplumber(pdf_path, txt_path,
                           y_tol=3.0,
                           para_gap_factor=1.35,
                           verbose=True):
    """
    Extract prose from PDF while:
      - preserving paragraph breaks (blank lines in output)
      - NOT inserting line breaks where the PDF simply wrapped a line
    """
    with pdfplumber.open(pdf_path) as pdf, \
            open(txt_path, "w", encoding="utf-8") as out:

        total = len(pdf.pages)

        for i, page in enumerate(pdf.pages, start=1):
            if verbose:
                print(f"Page: {i}/{total}", end="\r", flush=True)

            words = page.extract_words(
                keep_blank_chars=False,
                use_text_flow=False,
                y_tolerance=y_tol,
            )

            lines = _group_lines(words, y_tol=y_tol)
            text = _lines_to_paragraphs(lines, para_gap_factor=para_gap_factor)

            text = text.replace("Downloaded from https://www.holybooks.com", "")
            text = text.strip()

            out.write(f"\n--- Page {i} ---\n")
            out.write(text)
            out.write("\n")

            page.close()

    if verbose:
        print()


def _group_lines(words, y_tol=3.0):
    """
    Group words into visual lines by y-coordinate.
    Returns list of {"top": float, "bottom": float, "text": str}
    sorted top-to-bottom.
    """
    if not words:
        return []

    # Cluster by rounded 'top' value so tiny baseline jitter doesn't split lines
    words = sorted(words, key=lambda w: (w["top"], w["x0"]))

    lines = []
    cur_top = None
    cur_bottom = None
    cur_words = []

    for w in words:
        if cur_top is None or abs(w["top"] - cur_top) <= y_tol:
            cur_words.append(w)
            cur_top = w["top"] if cur_top is None else cur_top
            cur_bottom = w["bottom"] if cur_bottom is None else max(cur_bottom, w["bottom"])
        else:
            lines.append({
                "top": cur_top,
                "bottom": cur_bottom,
                "text": _join_words(cur_words),
            })
            cur_words = [w]
            cur_top = w["top"]
            cur_bottom = w["bottom"]

    if cur_words:
        lines.append({
            "top": cur_top,
            "bottom": cur_bottom,
            "text": _join_words(cur_words),
        })

    return lines


def _join_words(ws):
    ws = sorted(ws, key=lambda w: w["x0"])
    return " ".join(w["text"] for w in ws)


def _lines_to_paragraphs(lines, para_gap_factor=1.35):
    """
    Join wrapped lines with spaces; insert \\n\\n only at real paragraph gaps.

    The normal line gap is estimated as the *mode/median* of consecutive
    gaps. A gap is a paragraph break if it exceeds para_gap_factor * normal.
    """
    if not lines:
        return ""

    if len(lines) == 1:
        return lines[0]["text"]

    # Consecutive top-to-top gaps
    gaps = []
    for a, b in zip(lines, lines[1:]):
        g = b["top"] - a["top"]
        if g > 0:
            gaps.append(g)

    if not gaps:
        return " ".join(ln["text"] for ln in lines)

    gaps_sorted = sorted(gaps)
    normal_gap = gaps_sorted[len(gaps_sorted) // 2]  # median
    threshold = normal_gap * para_gap_factor

    out = [lines[0]["text"]]
    for prev, cur in zip(lines, lines[1:]):
        gap = cur["top"] - prev["top"]
        if gap > threshold:
            out.append("")               # blank line -> paragraph break
        # else: wrapped line -> just a space, no newline
        out.append(cur["text"])

    # Join: "" entries become blank lines (\n\n); other lines joined with space
    result = ""
    for part in out:
        if part == "":
            result += "\n\n"
        else:
            if result and not result.endswith("\n\n"):
                result += " " if result.endswith(tuple(".,;:!?\"')")) else " "
                # simpler: always a single space between wrapped lines
            result += part
    return result.strip()


if __name__ == "__main__":
    pdf_to_text_pdfplumber(
        pdf_path="data/Organon.pdf",
        txt_path="data/Organon.txt",
    )
