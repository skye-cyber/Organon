import re

with open('data/Organon.txt') as f:
    content = f.read()

pages_raw = re.split(r'--- Page (\d+) ---\n', content)
page_dict = {}
for i in range(1, len(pages_raw), 2):
    page_dict[int(pages_raw[i])] = pages_raw[i+1]

works = [
    ('categories', 'Categories', 'Κατηγορίαι (Categoriae)', 'E. M. Edghill', 2, 46),
    ('on-interpretation', 'On Interpretation',
     'Περὶ Ἑρμηνείας (De Interpretatione)', 'E. M. Edghill', 47, 80),
    ('prior-analytics', 'Prior Analytics',
     'Ἀναλυτικὰ Πρότερα (Analytica Priora)', 'A. J. Jenkinson', 81, 220),
    ('posterior-analytics', 'Posterior Analytics',
     'Ἀναλυτικὰ Ὕστερα (Analytica Posteriora)', 'G. R. G. Mure', 221, 325),
    ('topics', 'Topics', 'Τοπικά (Topica)', 'W. A. Pickard-Cambridge', 326, 532),
    ('sophistical-refutations', 'On Sophistical Refutations',
     'Περὶ Σοφιστικῶν Ἐλέγχων (De Sophisticis Elenchis)', 'W. A. Pickard-Cambridge', 533, 601),
    ('physics', 'Physics', 'Φυσικὴ ἀκρόασις (Physica)',
     'R. P. Hardie and R. K. Gaye', 602, 851),
    ('on-the-heavens', 'On the Heavens',
     'Περὶ οὐρανοῦ (De Caelo)', 'J. L. Stocks', 852, 951),
    ('generation-and-corruption', 'On Generation and Corruption',
     'Περὶ γενέσεως καὶ φθορᾶς (De Generatione et Corruptione)', 'H. H. Joachim', 952, 1032),
    ('meteorology', 'Meteorology',
     'Μετεωρολογικά (Meteorologica)', 'E. W. Webster', 1033, 1158),
    ('on-the-soul', 'On the Soul', 'Περὶ ψυχῆς (De Anima)', 'J. A. Smith', 1159, 1255),
    ('parva-naturalia', 'Parva Naturalia', 'Μικρὰ φυσικά (Parva Naturalia)',
     'J. I. Beare and G. R. T. Ross', 1256, 1388),
    ('history-of-animals', 'History of Animals',
     'Περὶ τὰ ζῷα ἱστορίαι (Historia Animalium)', 'D’Arcy Wentworth Thompson', 1389, 1790),
    ('parts-of-animals', 'On the Parts of Animals',
     'Περὶ ζῴων μορίων (De Partibus Animalium)', 'William Ogle', 1791, 1965),
    ('motion-of-animals', 'On the Motion of Animals',
     'Περὶ ζῴων κινήσεως (De Motu Animalium)', 'A. S. L. Farquharson', 1966, 1983),
    ('gait-of-animals', 'On the Gait of Animals',
     'Περὶ πορείας ζῴων (De Incessu Animalium)', 'A. S. L. Farquharson', 1984, 2008),
    ('generation-of-animals', 'On the Generation of Animals',
     'Περὶ ζῴων γενέσεως (De Generatione Animalium)', 'Arthur Platt', 2009, 2204),
    ('metaphysics', 'Metaphysics',
     'Τὰ μετὰ τὰ φυσικά (Metaphysica)', 'W. D. Ross', 2205, 2535),
    ('nicomachean-ethics', 'Nicomachean Ethics',
     'Ἠθικὰ Νικομάχεια (Ethica Nicomachea)', 'W. D. Ross', 2536, 2787),
    ('politics', 'Politics', 'Πολιτικά (Politica)', 'Benjamin Jowett', 2788, 3049),
    ('athenian-constitution', 'The Athenian Constitution',
     'Ἀθηναίων πολιτεία (Athenaion Politeia)', 'Sir Frederic G. Kenyon', 3050, 3131),
    ('rhetoric', 'Rhetoric', 'Ῥητορική (Ars Rhetorica)', 'W. Rhys Roberts', 3132, 3307),
    ('poetics', 'Poetics', 'Περὶ ποιητικῆς (Ars Poetica)', 'S. H. Butcher', 3308, 3354)
]

total_paragraphs_all = 0
total_chapters_all = 0

for b_id, b_title, b_greek, b_trans, p_start, p_end in works:
    raw_parts = []
    current_part = {'title': 'Book I' if b_id not in ['categories', 'on-interpretation', 'sophistical-refutations',
                                                      'athenian-constitution', 'poetics', 'motion-of-animals', 'gait-of-animals'] else 'Treatise', 'chapters': []}
    raw_parts.append(current_part)
    current_ch = None

    for p in range(p_start, p_end + 1):
        ptext = page_dict.get(p, '')
        lines = ptext.split('\n')

        # Split into paragraph chunks by empty lines
        chunks = []
        cur_chunk = []
        for l in lines:
            ls = l.strip()
            # Skip page number lines
            if ls == str(p) or ls.isdigit() and int(ls) == p:
                continue
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
            # Skip title / author / translator lines at start of work
            if chunk.startswith('Aristotle –') or chunk.startswith('Aristotle -') or chunk.startswith('[Translated by'):
                continue

            # Check Book / Section division
            book_m = re.match(
                r'^(?:Book\s+([IVXLCDMΑ-Ωα-ω\d]+)|On\s+Sense|On\s+Memory|On\s+Sleep|On\s+Dreams|On\s+Divination|On\s+Longevity|On\s+Youth)', chunk, re.IGNORECASE)
            if book_m:
                part_title = chunk
                current_part = {'title': part_title, 'chapters': []}
                raw_parts.append(current_part)
                current_ch = None
                continue

            # Check Chapter number (e.g. standalone number 1, 2, 3...)
            ch_m = re.match(r'^(\d{1,3})$', chunk)
            if ch_m:
                ch_num = int(ch_m.group(1))
                current_ch = {'num': ch_num, 'paragraphs': []}
                current_part['chapters'].append(current_ch)
                continue

            # Content paragraph
            if current_ch is None:
                current_ch = {'num': 1, 'paragraphs': []}
                current_part['chapters'].append(current_ch)

            # Check if this continues previous paragraph across page boundary
            if current_ch['paragraphs']:
                last_p = current_ch['paragraphs'][-1]
                ends_term = bool(re.search(r'[\.\?\!\'\”\’]$', last_p))
                starts_lower = chunk[0].islower()
                if not ends_term or starts_lower:
                    if last_p.endswith('-'):
                        current_ch['paragraphs'][-1] = last_p[:-1] + chunk
                    else:
                        current_ch['paragraphs'][-1] = last_p + ' ' + chunk
                    continue

            current_ch['paragraphs'].append(chunk)

    # Filter empty parts/chapters
    valid_parts = []
    for pt in raw_parts:
        valid_chs = [c for c in pt['chapters'] if c['paragraphs']]
        if valid_chs:
            valid_parts.append({'title': pt['title'], 'chapters': valid_chs})

    ch_cnt = sum(len(pt['chapters']) for pt in valid_parts)
    p_cnt = sum(sum(len(c['paragraphs'])
                for c in pt['chapters']) for pt in valid_parts)
    total_chapters_all += ch_cnt
    total_paragraphs_all += p_cnt
    print(f'{b_title:<30} | {len(valid_parts):2d} parts | {
          ch_cnt:3d} chapters | {p_cnt:5d} paragraphs')

print(f'\nTOTAL: 23 works | {total_chapters_all} chapters | {
      total_paragraphs_all} paragraphs')
