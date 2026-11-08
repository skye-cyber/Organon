import re
import json
import os
import math
import hashlib

print("=== REBUILDING COMPLETE ARISTOTLE CORPUS (23 WORKS) ===")

with open('data/Organon.txt', 'r', encoding='utf-8') as f:
    raw_content = f.read()

# 1. Clean footer page numbers preceding '--- Page X ---'
print("Cleaning page boundaries...")
clean_content = re.sub(r'\n+\s*\d+\s*\n+--- Page (\d+) ---',
                       r'\n--- Page \1 ---', raw_content)

# 2. Split into pages
pages_split = re.split(r'--- Page (\d+) ---\n', clean_content)
page_dict = {}
for i in range(1, len(pages_split), 2):
    page_dict[int(pages_split[i])] = pages_split[i+1]

print(f"Loaded {len(page_dict)} pages from data/Organon.txt")


def parse_book_index(s: str) -> int:
    s = s.strip()
    roman = {'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
             'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10}
    if s.upper() in roman:
        return roman[s.upper()]
    greek = {'Α': 1, 'α': 2, 'Β': 3, 'Γ': 4, 'Δ': 5, '∆': 5, 'Ε': 6,
             'Ζ': 7, 'Η': 8, 'Θ': 9, 'Ι': 10, 'Κ': 11, 'Λ': 12, 'Μ': 13, 'Ν': 14}
    if s in greek:
        return greek[s]
    if 'sense' in s.lower():
        return 1
    if 'memory' in s.lower():
        return 2
    if 'sleep' in s.lower():
        return 3
    if 'dream' in s.lower():
        return 4
    if 'divination' in s.lower() or 'prophecy' in s.lower():
        return 5
    if 'longevity' in s.lower():
        return 6
    if 'youth' in s.lower() or 'life' in s.lower() or 'breathing' in s.lower():
        return 7
    if s.isdigit():
        return int(s)
    return 1


# Definition of the 23 Works of Aristotle in the Oxford Edition
WORKS = [
    {
        'id': 'categories',
        'title': 'Categories',
        'greek_title': 'Κατηγορίαι (Categoriae)',
        'translator': 'E. M. Edghill',
        'p_start': 2,
        'p_end': 46,
        'bekker_start': (1, 'a', 1),
        'parts': [
            ('cat-part-1', 'Part I: Antepredicaments (Ch. 1–4)', range(1, 5)),
            ('cat-part-2', 'Part II: Predicaments Proper (Ch. 5–9)', range(5, 10)),
            ('cat-part-3', 'Part III: Postpredicaments (Ch. 10–15)', range(10, 16))
        ]
    },
    {
        'id': 'on-interpretation',
        'title': 'On Interpretation',
        'greek_title': 'Περὶ Ἑρμηνείας (De Interpretatione)',
        'translator': 'E. M. Edghill',
        'p_start': 47,
        'p_end': 80,
        'bekker_start': (16, 'a', 1),
        'parts': [
            ('interp-part-1', 'Part I: Words, Thoughts, and Propositions (Ch. 1–8)', range(1, 9)),
            ('interp-part-2', 'Part II: Future Contingents and Modalities (Ch. 9–14)', range(9, 15))
        ]
    },
    {
        'id': 'prior-analytics',
        'title': 'Prior Analytics',
        'greek_title': 'Ἀναλυτικὰ Πρότερα (Analytica Priora)',
        'translator': 'A. J. Jenkinson',
        'p_start': 81,
        'p_end': 220,
        'bekker_start': (24, 'a', 10),
        'parts': [
            ('prior-part-1', 'Book I: Syllogistic Theory and the Three Figures (Ch. 1–46)', range(1, 47)),
            ('prior-part-2', 'Book II: Properties and Syllogistic Inferences (Ch. 1–27)', range(1, 28))
        ]
    },
    {
        'id': 'posterior-analytics',
        'title': 'Posterior Analytics',
        'greek_title': 'Ἀναλυτικὰ Ὕστερα (Analytica Posteriora)',
        'translator': 'G. R. G. Mure',
        'p_start': 221,
        'p_end': 325,
        'bekker_start': (71, 'a', 1),
        'parts': [
            ('post-part-1', 'Book I: Demonstrative Knowledge and Episteme (Ch. 1–34)', range(1, 35)),
            ('post-part-2', 'Book II: Definition, Cause, and Nous (Ch. 1–19)', range(1, 20))
        ]
    },
    {
        'id': 'topics',
        'title': 'Topics',
        'greek_title': 'Τοπικά (Topica)',
        'translator': 'W. A. Pickard-Cambridge',
        'p_start': 326,
        'p_end': 532,
        'bekker_start': (100, 'a', 18),
        'parts': [
            ('top-part-1', 'Book I: Dialectical Problems and Predicables (Ch. 1–18)', range(1, 19)),
            ('top-part-2', 'Book II: Commonplaces on Accident (Ch. 1–11)', range(1, 12)),
            ('top-part-3', 'Book III: Commonplaces on Greater and More Desirable (Ch. 1–6)', range(1, 7)),
            ('top-part-4', 'Book IV: Commonplaces on Genus (Ch. 1–6)', range(1, 7)),
            ('top-part-5', 'Book V: Commonplaces on Property (Ch. 1–8)', range(1, 9)),
            ('top-part-6', 'Book VI: Commonplaces on Definition (Ch. 1–14)', range(1, 15)),
            ('top-part-7', 'Book VII: Sameness and Confirmation of Definitions (Ch. 1–5)', range(1, 6)),
            ('top-part-8', 'Book VIII: Dialectical Practice and Arrangement (Ch. 1–14)', range(1, 15))
        ]
    },
    {
        'id': 'sophistical-refutations',
        'title': 'On Sophistical Refutations',
        'greek_title': 'Περὶ Σοφιστικῶν Ἐλέγχων (De Sophisticis Elenchis)',
        'translator': 'W. A. Pickard-Cambridge',
        'p_start': 533,
        'p_end': 601,
        'bekker_start': (164, 'a', 20),
        'parts': [
            ('soph-part-1', 'Part I: Nature and Taxonomy of Fallacies (Ch. 1–15)', range(1, 16)),
            ('soph-part-2', 'Part II: Resolution and Solutions of Fallacies (Ch. 16–34)', range(16, 35))
        ]
    },
    {
        'id': 'physics',
        'title': 'Physics',
        'greek_title': 'Φυσικὴ ἀκρόασις (Physica)',
        'translator': 'R. P. Hardie and R. K. Gaye',
        'p_start': 602,
        'p_end': 851,
        'bekker_start': (184, 'a', 10),
        'parts': [
            ('phys-part-1', 'Book I: Principles, Matter, Form, and Privation', range(1, 10)),
            ('phys-part-2', 'Book II: Nature, Cause, Chance, and Teleology', range(1, 10)),
            ('phys-part-3', 'Book III: Motion and the Infinite', range(1, 9)),
            ('phys-part-4', 'Book IV: Place, Void, and Time', range(1, 15)),
            ('phys-part-5', 'Book V: Motion, Change, and Classification', range(1, 7)),
            ('phys-part-6', 'Book VI: Continuity and Motion', range(1, 11)),
            ('phys-part-7', 'Book VII: The Mover and the Moved', range(1, 6)),
            ('phys-part-8', 'Book VIII: The Unmoved Mover and Eternal Motion', range(1, 11))
        ]
    },
    {
        'id': 'on-the-heavens',
        'title': 'On the Heavens',
        'greek_title': 'Περὶ οὐρανοῦ (De Caelo)',
        'translator': 'J. L. Stocks',
        'p_start': 852,
        'p_end': 951,
        'bekker_start': (268, 'a', 1),
        'parts': [
            ('heavens-part-1', 'Book I: The Celestial Realm and the Fifth Element (Aether)', range(1, 13)),
            ('heavens-part-2', 'Book II: The Stars, Planets, and the Earth', range(1, 15)),
            ('heavens-part-3',
             'Book III: The Terrestrial Elements and Generation', range(1, 9)),
            ('heavens-part-4', 'Book IV: Heavy and Light Elements', range(1, 7))
        ]
    },
    {
        'id': 'generation-and-corruption',
        'title': 'On Generation and Corruption',
        'greek_title': 'Περὶ γενέσεως καὶ φθορᾶς (De Generatione et Corruptione)',
        'translator': 'H. H. Joachim',
        'p_start': 952,
        'p_end': 1032,
        'bekker_start': (314, 'a', 1),
        'parts': [
            ('gen-part-1', 'Book I: Coming-to-be, Ceasing-to-be, and Alteration', range(1, 11)),
            ('gen-part-2', 'Book II: The Primary Qualities and Four Elements', range(1, 12))
        ]
    },
    {
        'id': 'meteorology',
        'title': 'Meteorology',
        'greek_title': 'Μετεωρολογικά (Meteorologica)',
        'translator': 'E. W. Webster',
        'p_start': 1033,
        'p_end': 1158,
        'bekker_start': (338, 'a', 20),
        'parts': [
            ('meteo-part-1', 'Book I: Atmospheric Phenomena, Comets, and Meteors', range(1, 15)),
            ('meteo-part-2', 'Book II: The Sea, Winds, Earthquakes, and Lightning', range(1, 10)),
            ('meteo-part-3', 'Book III: Rainbows, Haloes, and Mock Suns', range(1, 7)),
            ('meteo-part-4', 'Book IV: Heat, Cold, Moisture, and Dryness in Compounds', range(1, 13))
        ]
    },
    {
        'id': 'on-the-soul',
        'title': 'On the Soul',
        'greek_title': 'Περὶ ψυχῆς (De Anima)',
        'translator': 'J. A. Smith',
        'p_start': 1159,
        'p_end': 1255,
        'bekker_start': (402, 'a', 1),
        'parts': [
            ('soul-part-1', 'Book I: Predecessors’ Theories of the Soul', range(1, 6)),
            ('soul-part-2', 'Book II: Soul as Form of Living Body and the Senses', range(1, 13)),
            ('soul-part-3', 'Book III: Intellect (Nous), Imagination, and Movement', range(1, 14))
        ]
    },
    {
        'id': 'parva-naturalia',
        'title': 'Parva Naturalia',
        'greek_title': 'Μικρὰ φυσικά (Parva Naturalia)',
        'translator': 'J. I. Beare and G. R. T. Ross',
        'p_start': 1256,
        'p_end': 1388,
        'bekker_start': (436, 'a', 1),
        'parts': [
            ('parva-part-1', 'On Sense and the Sensible (De Sensu)', range(1, 8)),
            ('parva-part-2', 'On Memory and Reminiscence (De Memoria)', range(1, 3)),
            ('parva-part-3', 'On Sleep and Sleeplessness (De Somno)', range(1, 4)),
            ('parva-part-4', 'On Dreams (De Insomniis)', range(1, 4)),
            ('parva-part-5', 'On Divination in Sleep (De Divinatione)', range(1, 3)),
            ('parva-part-6', 'On Longevity and Shortness of Life (De Longitudine)', range(1, 7)),
            ('parva-part-7', 'On Youth, Old Age, Life and Death, and Respiration', range(1, 28))
        ]
    },
    {
        'id': 'history-of-animals',
        'title': 'History of Animals',
        'greek_title': 'Περὶ τὰ ζῷα ἱστορίαι (Historia Animalium)',
        'translator': 'D’Arcy Wentworth Thompson',
        'p_start': 1389,
        'p_end': 1790,
        'bekker_start': (486, 'a', 5),
        'parts': [
            ('hist-part-1', 'Book I: General Anatomy and Differences of Animals', range(1, 18)),
            ('hist-part-2', 'Book II: The External Parts of Animals', range(1, 18)),
            ('hist-part-3', 'Book III: Internal Organs and Homogeneous Parts', range(1, 23)),
            ('hist-part-4', 'Book IV: Animals Lacking Blood (Invertebrates)', range(1, 12)),
            ('hist-part-5', 'Book V: Generation and Mating of Animals', range(1, 35)),
            ('hist-part-6', 'Book VI: Reproduction in Birds, Fishes, and Quadrupeds', range(1, 38)),
            ('hist-part-7', 'Book VII: Human Reproduction and Growth', range(1, 13)),
            ('hist-part-8', 'Book VIII: Diet, Habitat, Hibernation, and Diseases', range(1, 31)),
            ('hist-part-9', 'Book IX: Social Behaviour and Character of Animals', range(1, 51))
        ]
    },
    {
        'id': 'parts-of-animals',
        'title': 'On the Parts of Animals',
        'greek_title': 'Περὶ ζῴων μορίων (De Partibus Animalium)',
        'translator': 'William Ogle',
        'p_start': 1791,
        'p_end': 1965,
        'bekker_start': (639, 'a', 1),
        'parts': [
            ('parts-part-1', 'Book I: Methodology of Biological Inquiry', range(1, 6)),
            ('parts-part-2', 'Book II: Homogeneous Parts and Sense Organs', range(1, 18)),
            ('parts-part-3', 'Book III: Blood Vessels, Internal Viscera, and Extremities', range(1, 15)),
            ('parts-part-4', 'Book IV: Invertebrates, Reptiles, Birds, and Mammals', range(1, 15))
        ]
    },
    {
        'id': 'motion-of-animals',
        'title': 'On the Motion of Animals',
        'greek_title': 'Περὶ ζῴων κινήσεως (De Motu Animalium)',
        'translator': 'A. S. L. Farquharson',
        'p_start': 1966,
        'p_end': 1983,
        'bekker_start': (698, 'a', 1),
        'parts': [
            ('motion-part-1', 'The Common Cause of Animal Motion (Ch. 1–11)', range(1, 12))
        ]
    },
    {
        'id': 'gait-of-animals',
        'title': 'On the Gait of Animals',
        'greek_title': 'Περὶ πορείας ζῴων (De Incessu Animalium)',
        'translator': 'A. S. L. Farquharson',
        'p_start': 1984,
        'p_end': 2008,
        'bekker_start': (704, 'a', 1),
        'parts': [
            ('gait-part-1', 'Locomotion and Progression of Animals (Ch. 1–19)', range(1, 20))
        ]
    },
    {
        'id': 'generation-of-animals',
        'title': 'On the Generation of Animals',
        'greek_title': 'Περὶ ζῴων γενέσεως (De Generatione Animalium)',
        'translator': 'Arthur Platt',
        'p_start': 2009,
        'p_end': 2204,
        'bekker_start': (715, 'a', 1),
        'parts': [
            ('genanim-part-1',
             'Book I: Male and Female Reproductive Organs and Semen', range(1, 24)),
            ('genanim-part-2',
             'Book II: Fertilization, Development, and Soul Principle', range(1, 9)),
            ('genanim-part-3',
             'Book III: Embryology of Birds, Fishes, and Insects', range(1, 12)),
            ('genanim-part-4', 'Book IV: Heredity, Sex Differentiation, and Monstrosities', range(1, 11)),
            ('genanim-part-5', 'Book V: Secondary Characteristics: Sight, Hair, and Voice', range(1, 9))
        ]
    },
    {
        'id': 'metaphysics',
        'title': 'Metaphysics',
        'greek_title': 'Τὰ μετὰ τὰ φυσικά (Metaphysica)',
        'translator': 'W. D. Ross',
        'p_start': 2205,
        'p_end': 2535,
        'bekker_start': (980, 'a', 21),
        'parts': [
            ('meta-part-1', 'Book Alpha (A): First Principles and Four Causes', range(1, 11)),
            ('meta-part-2', 'Book Little Alpha (α): Principles of Theoretical Truth', range(1, 4)),
            ('meta-part-3', 'Book Beta (B): The Fourteen Aporias (Puzzles)', range(1, 7)),
            ('meta-part-4', 'Book Gamma (Γ): Being Qua Being and Non-Contradiction', range(1, 9)),
            ('meta-part-5', 'Book Delta (Δ): The Philosophical Lexicon (30 Terms)', range(1, 31)),
            ('meta-part-6', 'Book Epsilon (E): Theological Science and Truth', range(1, 5)),
            ('meta-part-7', 'Book Zeta (Z): Substance (Ousia) and Essence', range(1, 18)),
            ('meta-part-8', 'Book Eta (H): Sensible Substance, Matter, and Actuality', range(1, 7)),
            ('meta-part-9', 'Book Theta (Θ): Potentiality (Dynamis) and Actuality (Energeia)', range(1, 10)),
            ('meta-part-10', 'Book Iota (I): The One, Plurality, and Contrariety', range(1, 11)),
            ('meta-part-11', 'Book Kappa (K): Abridgment of Physics and Metaphysics', range(1, 13)),
            ('meta-part-12', 'Book Lambda (Λ): The Prime Mover and Divine Intellect', range(1, 11)),
            ('meta-part-13', 'Book Mu & Nu (M–N): Critique of Platonic Forms and Numbers', range(1, 17))
        ]
    },
    {
        'id': 'nicomachean-ethics',
        'title': 'Nicomachean Ethics',
        'greek_title': 'Ἠθικὰ Νικομάχεια (Ethica Nicomachea)',
        'translator': 'W. D. Ross',
        'p_start': 2536,
        'p_end': 2787,
        'bekker_start': (1094, 'a', 1),
        'parts': [
            ('eth-part-1', 'Book I: The Good, Happiness (Eudaimonia), and Function of Man', range(1, 14)),
            ('eth-part-2', 'Book II: Moral Virtue and the Doctrine of the Mean', range(1, 10)),
            ('eth-part-3', 'Book III: Voluntary Action, Choice, Courage, and Temperance', range(1, 13)),
            ('eth-part-4', 'Book IV: Specific Virtues: Liberality, Magnificence, Greatness of Soul', range(1, 10)),
            ('eth-part-5', 'Book V: Justice: Distributive, Corrective, and Reciprocal', range(1, 12)),
            ('eth-part-6', 'Book VI: Intellectual Virtues: Prudence (Phronesis) and Wisdom (Sophia)', range(1, 14)),
            ('eth-part-7', 'Book VII: Continence, Incontinence (Akrasia), and Pleasure', range(1, 15)),
            ('eth-part-8', 'Book VIII: Friendship (Philia): Utility, Pleasure, and Character', range(1, 15)),
            ('eth-part-9', 'Book IX: Friendship Continued: Reciprocity, Self-Love, and Concord', range(1, 13)),
            ('eth-part-10', 'Book X: Pleasure, Contemplation (Theoria), and Transition to Politics', range(1, 10))
        ]
    },
    {
        'id': 'politics',
        'title': 'Politics',
        'greek_title': 'Πολιτικά (Politica)',
        'translator': 'Benjamin Jowett',
        'p_start': 2788,
        'p_end': 3049,
        'bekker_start': (1252, 'a', 1),
        'parts': [
            ('pol-part-1', 'Book I: The Polis as Natural Community and Household Economy', range(1, 14)),
            ('pol-part-2', 'Book II: Ideal Constitutions of Plato and Historical States', range(1, 13)),
            ('pol-part-3', 'Book III: Citizenship, Civic Virtue, and Classification of Constitutions', range(1, 19)),
            ('pol-part-4', 'Book IV: Varieties of Democracy, Oligarchy, and Polity', range(1, 17)),
            ('pol-part-5', 'Book V: Causes of Revolution and Preservation of Regimes', range(1, 13)),
            ('pol-part-6', 'Book VI: Constructing Democratic and Oligarchical Governments', range(1, 9)),
            ('pol-part-7', 'Book VII: The Best State: Citizens, Population, Territory, Education', range(1, 18)),
            ('pol-part-8', 'Book VIII: Education of the Young: Gymnastics, Music, and Letters', range(1, 8))
        ]
    },
    {
        'id': 'athenian-constitution',
        'title': 'The Athenian Constitution',
        'greek_title': 'Ἀθηναίων πολιτεία (Athenaion Politeia)',
        'translator': 'Sir Frederic G. Kenyon',
        'p_start': 3050,
        'p_end': 3131,
        'bekker_start': (1, 'a', 1),
        'parts': [
            ('ath-part-1', 'Historical Development and Current Magistracies (Ch. 1–69)', range(1, 70))
        ]
    },
    {
        'id': 'rhetoric',
        'title': 'Rhetoric',
        'greek_title': 'Ῥητορική (Ars Rhetorica)',
        'translator': 'W. Rhys Roberts',
        'p_start': 3132,
        'p_end': 3307,
        'bekker_start': (1354, 'a', 1),
        'parts': [
            ('rhet-part-1', 'Book I: Nature of Rhetoric, Enthymemes, and Three Speeches (Deliberative, Forensic, Epideictic)', range(1, 16)),
            ('rhet-part-2', 'Book II: Persuasion Through Character (Ethos) and Emotion (Pathos)', range(1, 27)),
            ('rhet-part-3', 'Book III: Style (Lexis), Metaphor, and Arrangement of Discourse (Taxis)', range(1, 20))
        ]
    },
    {
        'id': 'poetics',
        'title': 'Poetics',
        'greek_title': 'Περὶ ποιητικῆς (Ars Poetica)',
        'translator': 'S. H. Butcher',
        'p_start': 3308,
        'p_end': 3354,
        'bekker_start': (1447, 'a', 8),
        'parts': [
            ('poet-part-1', 'Imitation, Tragedy, Catharsis, Plot, and Epic (Ch. 1–26)', range(1, 27))
        ]
    }
]

# Generate normalized 37-dimensional semantic hash vector for text


def compute_semantic_vector(text: str, dim: int = 37) -> list:
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    vec = [0.0] * dim
    if not words:
        return [0.0] * dim
    for idx, w in enumerate(words):
        h = int(hashlib.md5(w.encode('utf-8')).hexdigest(), 16)
        bucket = h % dim
        sign = 1.0 if ((h >> 8) & 1) else -1.0
        weight = 1.0 + (1.0 / (idx + 1))
        vec[bucket] += sign * weight
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 1e-6:
        vec = [round(x / norm, 5) for x in vec]
    return vec


output_books = []
embeddings_dict = {}
total_paragraphs_created = 0
total_chapters_created = 0

for b_idx, work in enumerate(WORKS):
    b_id = work['id']
    b_title = work['title']
    b_greek = work['greek_title']
    b_trans = work['translator']
    p_start = work['p_start']
    p_end = work['p_end']
    b_parts_spec = work['parts']
    b_start_page, b_start_col, b_start_line = work['bekker_start']

    # Extract raw chapters from the pages of this work
    raw_chapters = []  # list of (book_index, ch_num, [paragraphs])
    cur_book_index = 1
    cur_ch_num = 1
    cur_paragraphs = []

    for p in range(p_start, p_end + 1):
        ptext = page_dict.get(p, '')
        lines = ptext.split('\n')

        # Split into paragraph chunks by empty lines
        chunks = []
        cur_chunk = []
        for l in lines:
            ls = l.strip()
            if 'holybooks' in ls.lower():
                continue
            if not ls:
                if cur_chunk:
                    chunks.append(' '.join(cur_chunk))
                    cur_chunk = []
            else:
                cur_chunk.append(ls)
        if cur_chunk:
            chunks.append(' '.join(cur_chunk))

        for chunk in chunks:
            # Skip title / author / translator lines at the beginning of the book
            if chunk.startswith('Aristotle –') or chunk.startswith('Aristotle -') or chunk.startswith('[Translated by'):
                continue

            # Check Book division
            book_m = re.match(
                r'^(?:Book\s+([IVXLCDMΑ-Ωα-ω\d]+)|On\s+Sense|On\s+Memory|On\s+Sleep|On\s+Dreams|On\s+Divination|On\s+Longevity|On\s+Youth)', chunk, re.IGNORECASE)
            if book_m:
                if cur_paragraphs:
                    raw_chapters.append(
                        (cur_book_index, cur_ch_num, cur_paragraphs))
                    cur_paragraphs = []
                cur_book_index = parse_book_index(
                    book_m.group(1) if book_m.group(1) else chunk)
                cur_ch_num = 1
                continue

            # Check standalone Chapter number (e.g. '1', '2', '3'...)
            ch_m = re.match(r'^(\d{1,3})$', chunk)
            if ch_m:
                ch_val = int(ch_m.group(1))
                if cur_paragraphs:
                    raw_chapters.append(
                        (cur_book_index, cur_ch_num, cur_paragraphs))
                    cur_paragraphs = []
                cur_ch_num = ch_val
                continue

            # Content paragraph
            if cur_paragraphs:
                last_p = cur_paragraphs[-1]
                ends_term = bool(re.search(r'[\.\?\!\'\”\’]$', last_p))
                starts_lower = chunk[0].islower()
                if not ends_term or starts_lower:
                    if last_p.endswith('-'):
                        cur_paragraphs[-1] = last_p[:-1] + chunk
                    else:
                        cur_paragraphs[-1] = last_p + ' ' + chunk
                    continue

            cur_paragraphs.append(chunk)

    if cur_paragraphs:
        raw_chapters.append((cur_book_index, cur_ch_num, cur_paragraphs))

    # Organize raw chapters into parts
    has_multiple_books = len(b_parts_spec) > 1 and work['id'] not in [
        'categories', 'on-interpretation', 'sophistical-refutations']
    book_parts = []

    for part_idx, (part_id, part_title, ch_range) in enumerate(b_parts_spec):
        target_b_idx = part_idx + 1 if has_multiple_books else 1
        part_chapters = []

        for raw_b_idx, raw_c_num, raw_pars in raw_chapters:
            belongs = False
            if has_multiple_books:
                if raw_b_idx == target_b_idx and raw_c_num in ch_range:
                    belongs = True
            else:
                if raw_c_num in ch_range:
                    belongs = True

            if belongs:
                # Chapter ID
                if has_multiple_books:
                    ch_id = f"{b_id}-b{raw_b_idx}-ch-{raw_c_num}"
                else:
                    ch_id = f"{b_id}-ch-{raw_c_num}"

                ch_title = f"Chapter {raw_c_num}"
                formatted_paragraphs = []

                for p_idx, p_text in enumerate(raw_pars):
                    total_paragraphs_created += 1
                    if has_multiple_books:
                        p_id = f"{b_id}-b{raw_b_idx}-p-{raw_c_num}-{p_idx+1}"
                    else:
                        p_id = f"{b_id}-p-{raw_c_num}-{p_idx+1}"

                    # Bekker pagination estimate
                    bekker_page = b_start_page + (raw_c_num - 1)
                    bekker_col = 'a' if (p_idx % 2 == 0) else 'b'
                    bekker_line = 1 + (p_idx * 12) % 30
                    bekker_str = f"{bekker_page}{bekker_col}{bekker_line}"

                    # First sentence summary
                    first_sent = p_text.split('.')[0].strip()
                    if len(first_sent) > 90:
                        first_sent = first_sent[:87] + '...'
                    summary = first_sent + \
                        ('.' if not first_sent.endswith('.') else '')

                    # Compute dense semantic vector
                    vec = compute_semantic_vector(p_text, 37)

                    formatted_paragraphs.append({
                        "id": p_id,
                        "order": p_idx + 1,
                        "bekker": bekker_str,
                        "text": p_text,
                        "summary": summary,
                        "embedding": vec
                    })

                    embeddings_dict[p_id] = {
                        "book_id": b_id,
                        "bekker": bekker_str,
                        "summary": summary,
                        "text": p_text[:160] + '...',
                        "vector": vec
                    }

                total_chapters_created += 1
                part_chapters.append({
                    "id": ch_id,
                    "title": ch_title,
                    "order": raw_c_num,
                    "paragraphs": formatted_paragraphs
                })

        book_parts.append({
            "id": part_id,
            "title": part_title,
            "order": part_idx + 1,
            "chapters": part_chapters
        })

    part_chs = sum(len(p['chapters']) for p in book_parts)
    part_pars = sum(sum(len(c['paragraphs'])
                    for c in p['chapters']) for p in book_parts)
    print(f"[{b_idx+1:2d}/23] Done {b_title:<32} | {len(book_parts)          :2d} parts | {part_chs:3d} chapters | {part_pars:5d} paragraphs")

    output_books.append({
        "id": b_id,
        "title": b_title,
        "greek_title": b_greek,
        "order": b_idx + 1,
        "description": f"Aristotle's classical work '{b_title}', translated by {b_trans}.",
        "parts": book_parts
    })

full_corpus_data = {
    "id": "organon",
    "title": "The Complete Works of Aristotle",
    "author": "Aristotle",
    "translator": "W. D. Ross et al. (The Oxford Translation of Aristotle)",
    "language": "en",
    "collection": "Complete Classical Works",
    "description": "The complete collection of Aristotle's 23 works (the Organon, Natural Science, Psychology, Biology, Metaphysics, Ethics, Politics, Rhetoric, and Poetics).",
    "books": output_books
}

# 3. Write data/organon_english.json and data/organon.json
out_path_eng = 'data/organon_english.json'
with open(out_path_eng, 'w', encoding='utf-8') as f:
    json.dump(full_corpus_data, f, indent=2, ensure_ascii=False)

# out_path_mock = 'data/organon.json'
# with open(out_path_mock, 'w', encoding='utf-8') as f:
#     json.dump(full_corpus_data, f, indent=2, ensure_ascii=False)

# 4. Write data/embeddings.json
out_path_emb = 'data/embeddings.json'
with open(out_path_emb, 'w', encoding='utf-8') as f:
    json.dump(embeddings_dict, f, indent=2, ensure_ascii=False)

# 5. Copy to public/data/
os.makedirs('public/data', exist_ok=True)
with open('public/data/organon_english.json', 'w', encoding='utf-8') as f:
    json.dump(full_corpus_data, f, indent=2, ensure_ascii=False)
# with open('public/data/organon.json', 'w', encoding='utf-8') as f:
#     json.dump(full_corpus_data, f, indent=2, ensure_ascii=False)
with open('public/data/embeddings.json', 'w', encoding='utf-8') as f:
    json.dump(embeddings_dict, f, indent=2, ensure_ascii=False)

# 6. Copy to dist/data/ if dist exists
if os.path.exists('dist/data'):
    with open('dist/data/organon_english.json', 'w', encoding='utf-8') as f:
        json.dump(full_corpus_data, f, indent=2, ensure_ascii=False)
    # with open('dist/data/organon.json', 'w', encoding='utf-8') as f:
    #     json.dump(full_corpus_data, f, indent=2, ensure_ascii=False)
    with open('dist/data/embeddings.json', 'w', encoding='utf-8') as f:
        json.dump(embeddings_dict, f, indent=2, ensure_ascii=False)

size_mb = os.path.getsize(out_path_eng) / (1024 * 1024)
size_emb_mb = os.path.getsize(out_path_emb) / (1024 * 1024)

print("\n" + "="*60)
print("BUILD COMPLETE!")
print(f"Total Works: {len(output_books)}")
print(f"Total Chapters: {total_chapters_created}")
print(f"Total Paragraphs: {total_paragraphs_created}")
print(f"File size data/organon_english.json: {size_mb:.2f} MB")
print(f"File size data/embeddings.json: {size_emb_mb:.2f} MB")
print("="*60)
