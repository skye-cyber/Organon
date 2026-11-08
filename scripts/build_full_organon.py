import fitz
import re
import json
import os

print("Starting extraction of full Aristotelian Organon from data/Organon.pdf...")
doc = fitz.open('data/Organon.pdf')

# Canonical Chapter Titles mapping
TITLES_CAT = {
    1: "Homonyms, Synonyms, and Paronyms",
    2: "Forms of Expression and Fourfold Scheme of Predication",
    3: "Predication of Coordinate and Subordinate Genera",
    4: "The Ten Categories of Being",
    5: "Primary and Secondary Substance",
    6: "Quantity: Discrete and Continuous",
    7: "Relation and Relatives",
    8: "Quality and its Species",
    9: "Action, Affection, and Other Categories",
    10: "The Four Modes of Opposition",
    11: "Contraries and their Properties",
    12: "The Five Senses of Priority",
    13: "Simultaneity",
    14: "The Six Sorts of Movement and Change",
    15: "The Modes of Having"
}

TITLES_INTERP = {
    1: "Spoken Words, Written Words, and Soul Affections",
    2: "The Noun and Conventional Signification",
    3: "The Verb and Time Reference",
    4: "The Sentence and Proposition",
    5: "Simple and Composite Enunciations",
    6: "Affirmation, Denial, and Contradiction",
    7: "Universal and Particular Predication",
    8: "Unity of Propositions",
    9: "Future Contingents and the Sea-Battle",
    10: "Propositions with Copula and Inversion",
    11: "Compound and Dialectical Enunciations",
    12: "Modal Propositions: Possibility and Contingency",
    13: "Logical Equivalence of Modal Expressions",
    14: "Contrary and Contradictory Beliefs"
}

TITLES_PRIOR_B1 = {
    1: "Premise, Term, and Syllogism Defined",
    2: "Conversion of Pure Categorical Premises",
    3: "Conversion of Modal Premises",
    4: "The First Figure: Complete Deductions",
    5: "The Second Figure: Syllogisms with Middle Term Predicated",
    6: "The Third Figure: Syllogisms with Middle Term Subject",
    7: "Characteristics Common to the Three Figures",
    8: "Syllogisms with Two Necessary Premises",
    9: "First Figure Syllogisms with One Necessary Premise",
    10: "Second Figure Syllogisms with One Necessary Premise",
    11: "Third Figure Syllogisms with One Necessary Premise",
    12: "Comparison of Pure and Necessary Syllogisms",
    13: "The Possible and Problematic Defined",
    14: "First Figure Syllogisms with Possible Premises",
    15: "First Figure: One Possible, One Assertoric Premise",
    16: "First Figure: One Possible, One Necessary Premise",
    17: "Second Figure Syllogisms with Possible Premises",
    18: "Second Figure: One Possible, One Assertoric Premise",
    19: "Second Figure: One Possible, One Necessary Premise",
    20: "Third Figure Syllogisms with Possible Premises",
    21: "Third Figure: One Possible, One Assertoric Premise",
    22: "Third Figure: One Possible, One Necessary Premise",
    23: "Every Syllogism Proceeds by One of the Three Figures",
    24: "Quantity and Quality of Premises in Every Syllogism",
    25: "Terms, Premises, and Conclusions in Chain Reasoning",
    26: "Ease and Difficulty of Proving Conclusions in Figures",
    27: "Rules for Constructing Syllogisms",
    28: "Establishing Affirmative and Negative Problems",
    29: "Direct Proof and Reductio Ad Impossibile",
    30: "Selection of Premises in Specific Sciences",
    31: "Platonic Division and Syllogistic Demonstration",
    32: "Resolving Arguments into the Proper Figures",
    33: "Fallacies Involving Number and Quality of Terms",
    34: "Fallacy of Abstract and Concrete Terms",
    35: "Terms Composed of Multiple Words",
    36: "Case Endings and Oblique Predications",
    37: "Modes of Belonging and Categorical Predication",
    38: "Repetition of Terms in Premises",
    39: "Substitution of Equivalent Terms",
    40: "Definite and Indefinite Articles in Deductions",
    41: "Distinction Between Belonging to All and Being Attributed",
    42: "Composite Syllogisms and Multi-Step Inferences",
    43: "Formulating Arguments Aiming at Definitions",
    44: "Hypothetical Syllogisms and Reductio Arguments",
    45: "Converting Syllogisms from One Figure to Another",
    46: "The Force of Not Being vs Being Not"
}

TITLES_PRIOR_B2 = {
    1: "Number and Character of Valid Conclusions",
    2: "True Conclusions from False Premises in First Figure",
    3: "True Conclusions from False Premises in Second Figure",
    4: "True Conclusions from False Premises in Third Figure",
    5: "Circular Demonstration in First Figure",
    6: "Circular Demonstration in Second Figure",
    7: "Circular Demonstration in Third Figure",
    8: "Conversion of Syllogisms: First Figure",
    9: "Conversion of Syllogisms: Second Figure",
    10: "Conversion of Syllogisms: Third Figure",
    11: "Proof Per Impossibile in First Figure",
    12: "Proof Per Impossibile in Second Figure",
    13: "Proof Per Impossibile in Third Figure",
    14: "Comparison of Direct Proof and Reductio Ad Impossibile",
    15: "Deducing from Opposite and Contradictory Premises",
    16: "Begging the Question (Petitio Principii)",
    17: "The Non-Cause as Cause in Reductio Inferences",
    18: "False Conclusion Dependent on False Premise",
    19: "Guarding Against Dialectical Traps",
    20: "Refutation and Elenchus",
    21: "Deception Arising from Ignorance of Middle Term",
    22: "Convertible Extremes and Preferable Deductions",
    23: "Induction (Epagoge) and Comprehensive Survey",
    24: "Argument by Example (Paradeigma)",
    25: "Abduction or Reduction (Apagoge)",
    26: "The Nature and Kinds of Objection (Enstasis)",
    27: "Likelihood and Signs (Tekmerion and Semeion)"
}

TITLES_POST_B1 = {
    1: "Pre-existent Knowledge and Learning",
    2: "Conditions of Scientific Knowledge (Episteme)",
    3: "Refutation of Circular Demonstration and Infinite Regress",
    4: "Essential Attributes: In Themselves (Per Se) and Universal",
    5: "Errors in Establishing Commensurate Universality",
    6: "Demonstration Must Proceed from Necessary Principles",
    7: "Unlawfulness of Transition Between Different Genera",
    8: "Demonstration Concerns Eternal, Not Perishable Facts",
    9: "Demonstration Must Proceed from Proper Principles of the Genus",
    10: "Axioms, Hypotheses, Postulates, and Definitions",
    11: "The Law of Contradiction in Demonstrative Science",
    12: "Scientific Questions and False Premise Formation",
    13: "Knowledge of Fact (Quia) vs Reasoned Fact (Propter Quid)",
    14: "Primacy of the First Figure in Science",
    15: "Immediate and Atomic Negative Premises",
    16: "Error and Ignorance Through Syllogistic Inference",
    17: "Error Regarding Attributes Not Atomically Connected",
    18: "Loss of Sensation Involves Loss of Scientific Knowledge",
    19: "Can Demonstrative Chains Be Infinite in Both Directions?",
    20: "Impossibility of Infinite Middle Terms",
    21: "Impossibility of Infinite Series in Negative Proofs",
    22: "Proof of Finitude in Essential Predication",
    23: "Immediate Premises and Common Attributes",
    24: "Superiority of Universal over Particular Demonstration",
    25: "Superiority of Affirmative over Negative Demonstration",
    26: "Superiority of Direct Proof over Reductio Ad Impossibile",
    27: "Degrees of Scientific Exactness (Akribeia)",
    28: "Unity and Differentiation of Sciences",
    29: "Plurality of Demonstrations for the Same Conclusion",
    30: "Chance Conjunctions Not Subject to Demonstration",
    31: "Scientific Knowledge Cannot Be Acquired by Sensation Alone",
    32: "All Syllogisms Cannot Share the Same First Principles",
    33: "Knowledge (Episteme) vs Opinion (Doxa)",
    34: "Quick Wit (Anchinoia) and Grasp of Middle Term"
}

TITLES_POST_B2 = {
    1: "The Four Inquiries: Fact, Reason, Existence, Essence",
    2: "All Inquiries Aim at Discovering Middle Term",
    3: "Distinction Between Definition and Demonstration",
    4: "Can Essence Be Demonstrated Syllogistically?",
    5: "Deficiencies of the Method of Division",
    6: "Hypothetical Syllogisms of Essence",
    7: "Can Definition Prove Either Essence or Existence?",
    8: "How Essence and Cause Are Known Through Demonstration",
    9: "Primary Essences vs Derived Attributes",
    10: "The Four Species of Definition",
    11: "The Four Causes in Demonstration",
    12: "Simultaneous and Successive Causes",
    13: "Hunting for Essential Definitions by Genus and Differentia",
    14: "Formulating Problems by Generic Classification",
    15: "Subordinate and Common Problems",
    16: "Can One Cause Have Multiple Effects?",
    17: "Plurality of Causes for Same Effect",
    18: "Immediate vs Remote Causes in General Proofs",
    19: "How First Principles Are Known: Perception, Memory, Nous"
}

TITLES_SOPH = {
    1: "Nature of Sophistical Refutations and Apparent Wisdom",
    2: "The Four Kinds of Arguments in Dialogue",
    3: "The Five Aims of Sophistical Disputants",
    4: "Six Fallacies Dependent on Language (In Dictione)",
    5: "Seven Fallacies Independent of Language (Extra Dictionem)",
    6: "All Fallacies Reducible to Ignoratio Elenchi",
    7: "Causes of Deception in Sophistical Fallacies",
    8: "Apparent Refutations Dependent on Dialectical Premises",
    9: "Scientific vs Dialectical Refutations",
    10: "Fallacies Dependent on Words vs Dependent on Thought",
    11: "Eristic and Peirastic Arguments Defined",
    12: "Techniques for Driving Opponents into Paradox or Falsehood",
    13: "Techniques for Driving Opponents into Babbling (Solecism)",
    14: "Solecisms Produced by Linguistic Form",
    15: "Arrangement and Tactics in Sophistical Interrogation",
    16: "The Value of Exposing Fallacies for Philosophy",
    17: "Apparent Solutions vs Genuine Scientific Solutions",
    18: "True Solutions Based on Proper Distinctions",
    19: "Solutions to Fallacies of Equivocation and Ambiguity",
    20: "Solutions to Fallacies of Composition and Division",
    21: "Solutions to Fallacies of Accentuation",
    22: "Solutions to Fallacies of Form of Expression",
    23: "General Strategy Against Fallacies Dependent on Diction",
    24: "Solutions to Fallacies of Accident",
    25: "Solutions to Fallacies of Absolute vs Qualified Statement",
    26: "Solutions to Fallacies Involving Ignorance of Refutation",
    27: "Solutions to Begging the Question",
    28: "Solutions to Fallacies of Consequent",
    29: "Solutions to Fallacies of False Cause",
    30: "Solutions to Many Questions Treated as One",
    31: "Solutions to Inferences Involving Babbling (Tautology)",
    32: "Solutions to Arguments Involving Solecism",
    33: "Comparative Difficulty of Detecting Fallacies",
    34: "Epilogue: Summary of Discoveries in Syllogistic and Logic"
}

TITLES_TOP_B1 = {
    1: "Purpose of Treatise and Kinds of Reasoning",
    2: "Utility of Dialectic: Intellectual Training and First Principles",
    3: "The Method of Dialectical Investigation",
    4: "The Four Predicables: Definition, Property, Genus, Accident",
    5: "Definitions of the Four Predicables",
    6: "Corollaries Regarding Predicables",
    7: "The Senses of Sameness: Number, Species, Genus",
    8: "Verification of the Four Predicables",
    9: "Categories of Predication within Dialectic",
    10: "Dialectical Propositions Defined",
    11: "Dialectical Problems and Theses Defined",
    12: "Species of Dialectical Reasoning: Syllogism and Induction",
    13: "The Four Instruments of Dialectic",
    14: "Securing Propositions from Authorities and Common Opinions",
    15: "Distinguishing Senses of Ambiguous Terms",
    16: "Discovering Differences Between Closely Related Genera",
    17: "Investigating Likenesses Among Diverse Things",
    18: "Utility of the Four Dialectical Instruments"
}

# General fallback title generator


def get_chapter_title(book_id, part_idx, ch_num):
    if book_id == 'categories':
        return TITLES_CAT.get(ch_num, f"Chapter {ch_num}")
    if book_id == 'on-interpretation':
        return TITLES_INTERP.get(ch_num, f"Chapter {ch_num}")
    if book_id == 'prior-analytics':
        if part_idx == 0:
            return TITLES_PRIOR_B1.get(ch_num, f"Chapter {ch_num}")
        else:
            return TITLES_PRIOR_B2.get(ch_num, f"Chapter {ch_num}")
    if book_id == 'posterior-analytics':
        if part_idx == 0:
            return TITLES_POST_B1.get(ch_num, f"Chapter {ch_num}")
        else:
            return TITLES_POST_B2.get(ch_num, f"Chapter {ch_num}")
    if book_id == 'topics':
        if part_idx == 0:
            return TITLES_TOP_B1.get(ch_num, f"Chapter {ch_num}")
        return f"Chapter {ch_num}"
    if book_id == 'sophistical-refutations':
        return TITLES_SOPH.get(ch_num, f"Chapter {ch_num}")
    return f"Chapter {ch_num}"


# Canonical Bekker starting coordinates for each book
BEKKER_STARTS = {
    'categories': (1, 'a', 1),
    'on-interpretation': (16, 'a', 1),
    'prior-analytics': (24, 'a', 10),
    'posterior-analytics': (71, 'a', 1),
    'topics': (100, 'a', 18),
    'sophistical-refutations': (164, 'a', 20)
}

books_ranges = [
    ('categories', 'Categories', 'Κατηγορίαι (Categoriae)', 'E. M. Edghill', 2, 46,
     [
         ("cat-part-1", "Part I: Antepredicaments (Ch. 1–4)", range(1, 5)),
         ("cat-part-2", "Part II: Predicaments Proper (Ch. 5–9)", range(5, 10)),
         ("cat-part-3", "Part III: Postpredicaments (Ch. 10–15)", range(10, 16))
     ]),
    ('on-interpretation', 'On Interpretation', 'Περὶ Ἑρμηνείας (De Interpretatione)', 'E. M. Edghill', 47, 80,
     [
         ("interp-part-1", "Part I: Words, Thoughts, and Simple Enunciations (Ch. 1–8)", range(1, 9)),
         ("interp-part-2", "Part II: Future Contingents and Modalities (Ch. 9–14)", range(9, 15))
     ]),
    ('prior-analytics', 'Prior Analytics', 'Ἀναλυτικὰ Πρότερα (Analytica Priora)', 'A. J. Jenkinson', 81, 220,
     [
         ("prior-part-1", "Book I: Syllogistic Theory and the Three Figures (Ch. 1–46)", range(1, 47)),
         ("prior-part-2", "Book II: Properties and Syllogistic Inferences (Ch. 1–27)", range(1, 28))
     ]),
    ('posterior-analytics', 'Posterior Analytics', 'Ἀναλυτικὰ Ὕστερα (Analytica Posteriora)', 'G. R. G. Mure', 221, 325,
     [
         ("post-part-1", "Book I: Demonstrative Knowledge and Episteme (Ch. 1–34)", range(1, 35)),
         ("post-part-2", "Book II: Definition, Cause, and Nous (Ch. 1–19)", range(1, 20))
     ]),
    ('topics', 'Topics', 'Τοπικά (Topica)', 'W. A. Pickard-Cambridge', 326, 532,
     [
         ("top-part-1", "Book I: Dialectical Problems and Predicables (Ch. 1–18)", range(1, 19)),
         ("top-part-2", "Book II: Commonplaces on Accident (Ch. 1–11)", range(1, 12)),
         ("top-part-3", "Book III: Commonplaces on Greater and More Desirable (Ch. 1–6)", range(1, 7)),
         ("top-part-4", "Book IV: Commonplaces on Genus (Ch. 1–6)", range(1, 7)),
         ("top-part-5", "Book V: Commonplaces on Property (Ch. 1–8)", range(1, 9)),
         ("top-part-6", "Book VI: Commonplaces on Definition (Ch. 1–14)", range(1, 15)),
         ("top-part-7", "Book VII: Sameness and Confirmation of Definitions (Ch. 1–5)", range(1, 6)),
         ("top-part-8", "Book VIII: Dialectical Practice and Arrangement (Ch. 1–14)", range(1, 15))
     ]),
    ('sophistical-refutations', 'On Sophistical Refutations', 'Περὶ Σοφιστικῶν Ἐλέγχων (De Sophisticis Elenchis)', 'W. A. Pickard-Cambridge', 533, 601,
     [
         ("soph-part-1", "Part I: Nature and Taxonomy of Fallacies (Ch. 1–15)", range(1, 16)),
         ("soph-part-2", "Part II: Resolution and Solutions of Fallacies (Ch. 16–34)", range(16, 35))
     ])
]

output_books = []
global_p_count = 0

for b_idx, (b_id, b_title, b_greek, b_translator, p_start, p_end, part_specs) in enumerate(books_ranges):
    print(f"Extracting {b_title} (pages {p_start} to {p_end})...")

    # 1. Collect all raw chapter blocks from the PDF
    # We will accumulate chapters as they appear
    raw_chapters = []  # list of (book_book_num, ch_num, [paragraphs])
    current_book_num = 1
    current_ch_num = 1
    current_paragraphs = []

    for pno in range(p_start - 1, p_end):
        blocks = doc[pno].get_text('blocks')
        for b in blocks:
            text = b[4].strip()
            if not text or b[1] >= 790:
                continue

            # Skip title & translator lines at top of treatise
            if text.startswith('Aristotle –') or text.startswith('Aristotle -') or text.startswith('[Translated by'):
                continue

            # Check Book division (e.g. 'Book II', 'Book III')
            book_m = re.match(r'^Book\s+([IVXLCDM]+)$', text, re.IGNORECASE)
            if book_m:
                roman = book_m.group(1).upper()
                roman_map = {'I': 1, 'II': 2, 'III': 3, 'IV': 4,
                             'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8}
                current_book_num = roman_map.get(roman, current_book_num + 1)
                continue

            # Check Chapter number
            ch_m = re.match(r'^(\d{1,2})$', text)
            if ch_m:
                if current_paragraphs:
                    raw_chapters.append(
                        (current_book_num, current_ch_num, current_paragraphs))
                    current_paragraphs = []
                current_ch_num = int(ch_m.group(1))
                continue

            # Clean paragraph
            cleaned = re.sub(r'(\w+)-\s*\n\s*([a-z]+)', r'\1\2', text)
            cleaned = re.sub(r'\s*\n\s*', ' ', cleaned)
            cleaned = re.sub(r'\s+', ' ', cleaned).strip()

            if not cleaned:
                continue

            # Check if this continues previous paragraph:
            if current_paragraphs:
                last_p = current_paragraphs[-1]
                ends_term = bool(re.search(r'[\.\?\!\'\”\’]$', last_p))
                starts_lower = cleaned[0].islower()

                if not ends_term or starts_lower:
                    if last_p.endswith('-'):
                        current_paragraphs[-1] = last_p[:-1] + cleaned
                    else:
                        current_paragraphs[-1] = last_p + ' ' + cleaned
                    continue

            current_paragraphs.append(cleaned)

    if current_paragraphs:
        raw_chapters.append(
            (current_book_num, current_ch_num, current_paragraphs))

    print(f"  Parsed {len(raw_chapters)} chapter sections for {b_title}")

    # 2. Organize chapters into the defined parts
    book_parts = []

    # Let's index raw_chapters by (book_num, ch_num) or by ch_num
    # If the work has multi-books (like prior-analytics, posterior-analytics, topics), use (book_num, ch_num)
    has_multi_books = b_id in [
        'prior-analytics', 'posterior-analytics', 'topics']

    for part_idx, (part_id, part_title, ch_range) in enumerate(part_specs):
        part_book_num = part_idx + 1 if has_multi_books else 1
        part_chapters = []

        for raw_b_num, raw_c_num, raw_pars in raw_chapters:
            # Check if belongs to this part
            belongs = False
            if has_multi_books:
                if raw_b_num == part_book_num and raw_c_num in ch_range:
                    belongs = True
            else:
                if raw_c_num in ch_range:
                    belongs = True

            if belongs:
                ch_title_desc = get_chapter_title(b_id, part_idx, raw_c_num)
                full_ch_title = f"Chapter {raw_c_num}: {ch_title_desc}"

                # Format Chapter ID
                if has_multi_books:
                    ch_id = f"{b_id}-b{raw_b_num}-ch-{raw_c_num}"
                else:
                    ch_id = f"{b_id}-ch-{raw_c_num}"

                formatted_paragraphs = []
                for p_idx, p_text in enumerate(raw_pars):
                    global_p_count += 1
                    # Paragraph ID
                    if has_multi_books:
                        p_id = f"{b_id}-b{raw_b_num}-p-{raw_c_num}-{p_idx+1}"
                    else:
                        p_id = f"{b_id}-p-{raw_c_num}-{p_idx+1}"

                    # Estimate Bekker pagination
                    # Categories starts ~1a1, each chapter ~1 page (1a-1b etc)
                    bekker_page = BEKKER_STARTS[b_id][0] + (raw_c_num - 1)
                    col = 'a' if (p_idx % 2 == 0) else 'b'
                    line_start = 1 + (p_idx * 15) % 30
                    bekker_ref = f"{bekker_page}{col}{line_start}"

                    # Generate concise summary from first sentence
                    first_sent = p_text.split('.')[0].strip()
                    if len(first_sent) > 90:
                        first_sent = first_sent[:87] + '...'
                    summary = first_sent + \
                        ('.' if not first_sent.endswith('.') else '')

                    formatted_paragraphs.append({
                        "id": p_id,
                        "order": p_idx + 1,
                        "bekker": bekker_ref,
                        "text": p_text,
                        "summary": summary
                    })

                part_chapters.append({
                    "id": ch_id,
                    "title": full_ch_title,
                    "order": raw_c_num,
                    "paragraphs": formatted_paragraphs
                })

        book_parts.append({
            "id": part_id,
            "title": part_title,
            "order": part_idx + 1,
            "chapters": part_chapters
        })

    output_books.append({
        "id": b_id,
        "title": b_title,
        "greek_title": b_greek,
        "order": b_idx + 1,
        "description": f"Aristotle's classical logical treatise '{b_title}', translated by {b_translator}.",
        "parts": book_parts
    })

full_organon_data = {
    "id": "organon",
    "title": "The Organon",
    "author": "Aristotle",
    "translator": "W. D. Ross et al. (Oxford Classical Translation)",
    "language": "en",
    "collection": "Complete Logical Works",
    "description": "The complete, authentic collection of Aristotle's six logical treatises: Categories, On Interpretation, Prior Analytics, Posterior Analytics, Topics, and On Sophistical Refutations.",
    "books": output_books
}

# Write to data/organon_english.json
out_path_eng = 'data/organon_english.json'
with open(out_path_eng, 'w', encoding='utf-8') as f:
    json.dump(full_organon_data, f, indent=2, ensure_ascii=False)

# # Write to data/organon.json
# out_path_mock = 'data/organon.json'
# with open(out_path_mock, 'w', encoding='utf-8') as f:
#     json.dump(full_organon_data, f, indent=2, ensure_ascii=False)

# Copy to public/data/
os.makedirs('public/data', exist_ok=True)
with open('public/data/organon_english.json', 'w', encoding='utf-8') as f:
    json.dump(full_organon_data, f, indent=2, ensure_ascii=False)
# with open('public/data/organon.json', 'w', encoding='utf-8') as f:
#     json.dump(full_organon_data, f, indent=2, ensure_ascii=False)

# Copy to dist/data/ if dist exists
if os.path.exists('dist/data'):
    with open('dist/data/organon_english.json', 'w', encoding='utf-8') as f:
        json.dump(full_organon_data, f, indent=2, ensure_ascii=False)
    # with open('dist/data/organon.json', 'w', encoding='utf-8') as f:
    #     json.dump(full_organon_data, f, indent=2, ensure_ascii=False)

size_mb = os.path.getsize(out_path_eng) / (1024 * 1024)
print(f"\nSUCCESS! Generated full organon_english.json ({size_mb:.2f} MB)")
print(f"Total books: {len(output_books)}")
print(f"Total paragraphs created: {global_p_count}")
