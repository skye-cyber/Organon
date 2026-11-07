import { DictionaryResult, DictionaryDefinition } from '../types';

// Classical philosophical lexicon for instant offline lookup and Aristotelian precision
const ARISTOTELIAN_LEXICON: Record<string, Partial<DictionaryResult>> = {
  homonym: {
    word: 'Homonym (Equivocal)',
    phonetic: '/ˈhɒmənɪm/',
    meanings: [
      {
        partOfSpeech: 'noun (Aristotelian logic)',
        definition:
          'Things that share the same name, but have different essential definitions (such as a real man and a painted portrait of a man, both called "animal").',
        example: 'Categories 1a1: "Things are said to be named equivocally when the name alone is common..."',
      },
    ],
    origin: 'From Greek ὁμώνυμος (homōnymos, "having the same name").',
    wikipediaExcerpt:
      'In Aristotle\'s Categories, homonyms are things having a name in common, while the statement of essence corresponding to the name is different.',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Categories_(Aristotle)',
  },
  synonym: {
    word: 'Synonym (Univocal)',
    phonetic: '/ˈsɪnənɪm/',
    meanings: [
      {
        partOfSpeech: 'noun (Aristotelian logic)',
        definition:
          'Things that have both the name and the definition of the essence signified by that name in common (e.g., both a man and an ox are "animal").',
        example: 'Categories 1a16: "Things are called unequivocally whose name is common and the definition of essence is the same."',
      },
    ],
    origin: 'From Greek συνώνυμος (synōnymos, "having the same name or meaning").',
    wikipediaExcerpt:
      'In Aristotelian logic, synonyms (or univocals) are entities that share both an appellation and an identical essential definition.',
  },
  paronym: {
    word: 'Paronym (Derivative)',
    phonetic: '/ˈpærənɪm/',
    meanings: [
      {
        partOfSpeech: 'noun (Aristotelian logic)',
        definition:
          'Things that derive their name from something else with a difference in grammatical termination or inflection (e.g., "grammarian" from "grammar", "brave" from "bravery").',
      },
    ],
    origin: 'From Greek παρώνυμος (parōnymos, "formed by a slight change of word").',
  },
  category: {
    word: 'Category (Predicament)',
    phonetic: '/ˈkætəɡəri/',
    meanings: [
      {
        partOfSpeech: 'noun (Philosophy)',
        definition:
          'One of the ten highest genera or classifications of all existing entities and modes of predication: Substance, Quantity, Quality, Relation, Place, Time, Position, State, Action, Passion.',
      },
    ],
    origin: 'From Greek κατηγορία (katēgoria, "accusation, assertion, predicate").',
    wikipediaExcerpt:
      'Aristotle\'s Categories is a text from the Organon that enumerates all the possible kinds of things that can be the subject or the predicate of a proposition.',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Categories_(Aristotle)',
  },
  substance: {
    word: 'Substance (Ousia)',
    phonetic: '/ˈsʌbstəns/',
    meanings: [
      {
        partOfSpeech: 'noun (Ontology)',
        definition:
          'Primary substance (ousia) is that which is neither said of a subject nor in a subject (an individual entity, like a particular human or horse). Secondary substance refers to the species and genera.',
      },
    ],
    origin: 'Latin substantia translating Greek οὐσία (ousia, "being, essence").',
    wikipediaExcerpt:
      'Ousia is the ancient Greek noun formed on the feminine present participle of the verb "to be", denoting true being or substantial reality.',
  },
  syllogism: {
    word: 'Syllogism',
    phonetic: '/ˈsɪlədʒɪzəm/',
    meanings: [
      {
        partOfSpeech: 'noun (Logic)',
        definition:
          'A discourse in which, certain premises being laid down, something different from what was stated necessarily follows because these things are so.',
        example: 'Prior Analytics 24b18: A discourse where premises necessitate the conclusion without external terms.',
      },
    ],
    origin: 'From Greek συλλογισμός (syllogismos, "computation, deduction, inference").',
    wikipediaExcerpt:
      'Aristotelian syllogistic is the deductive formal system introduced in the Prior Analytics, universally considered the origin of formal logic.',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Syllogism',
  },
  endoxa: {
    word: 'Endoxa',
    phonetic: '/ɛnˈdɒksə/',
    meanings: [
      {
        partOfSpeech: 'noun (Epistemology)',
        definition:
          'Reputable or probable opinions held by all people, or by the majority, or by the wise and renowned; the foundation of dialectical argumentation in the Topics.',
      },
    ],
    origin: 'Ancient Greek ἔνδοξα (éndoxa), from ἐν (en, "in") + δόξα (dóxa, "opinion").',
  },
  nous: {
    word: 'Nous (Intellect / Intuition)',
    phonetic: '/naʊs/',
    meanings: [
      {
        partOfSpeech: 'noun (Philosophy)',
        definition:
          'The intuitive intellect capable of apprehending first, indemonstrable principles directly without propositional deduction.',
        example: 'Posterior Analytics 100b12: "It is Nous that grasps the primary principles."',
      },
    ],
    origin: 'From Ancient Greek νοῦς (noûs, "mind, intellect, intuition").',
    wikipediaExcerpt:
      'In classical philosophy, nous is the faculty of the human mind necessary for understanding what is true or real.',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Nous',
  },
  episteme: {
    word: 'Episteme (Scientific Demonstration)',
    phonetic: '/ˌɛpɪˈstiːmiː/',
    meanings: [
      {
        partOfSpeech: 'noun (Epistemology)',
        definition:
          'True scientific, demonstrative knowledge derived from necessary, primary, and causal premises.',
      },
    ],
    origin: 'From Ancient Greek ἐπιστήμη (epistēmē, "knowledge, science").',
    wikipediaExcerpt:
      'Episteme is the ancient Greek word most often translated as knowledge or science.',
  },
  predicable: {
    word: 'Predicable',
    phonetic: '/ˈprɛdɪkəbl/',
    meanings: [
      {
        partOfSpeech: 'noun (Logic)',
        definition:
          'One of the four relations that a predicate can bear to its subject: Definition (horos), Property (idion), Genus (genos), or Accident (symbebekos).',
      },
    ],
    origin: 'From Latin praedicabilis, from praedicare ("to declare, assert").',
  },
  enunciation: {
    word: 'Enunciation (Apophansis)',
    phonetic: '/ɪˌnʌnsiˈeɪʃən/',
    meanings: [
      {
        partOfSpeech: 'noun (Logic)',
        definition:
          'A statement or proposition that is capable of being either true or false, as opposed to prayers, wishes, or commands.',
      },
    ],
    origin: 'From Latin enuntiatio, translating Greek ἀπόφανσις (apophansis).',
  },
};

export async function lookupDefinition(rawWord: string): Promise<DictionaryResult> {
  const clean = rawWord
    .trim()
    .replace(/[^\w\s-]/g, '')
    .toLowerCase();

  // 1. Check Aristotelian classical lexicon first
  if (ARISTOTELIAN_LEXICON[clean]) {
    const entry = ARISTOTELIAN_LEXICON[clean];
    return {
      word: entry.word || clean,
      phonetic: entry.phonetic,
      meanings: entry.meanings || [],
      origin: entry.origin,
      wikipediaExcerpt: entry.wikipediaExcerpt,
      wikipediaUrl: entry.wikipediaUrl,
    };
  }

  // Check singular/stem variant
  const singular = clean.endsWith('s') ? clean.slice(0, -1) : clean;
  if (ARISTOTELIAN_LEXICON[singular]) {
    const entry = ARISTOTELIAN_LEXICON[singular];
    return {
      word: entry.word || clean,
      phonetic: entry.phonetic,
      meanings: entry.meanings || [],
      origin: entry.origin,
      wikipediaExcerpt: entry.wikipediaExcerpt,
      wikipediaUrl: entry.wikipediaUrl,
    };
  }

  // 2. Fetch from Free Dictionary API
  const meanings: DictionaryDefinition[] = [];
  let phonetic: string | undefined;
  let origin: string | undefined;

  try {
    const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`);
    if (dictRes.ok) {
      const data = await dictRes.json();
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        phonetic = first.phonetic || (first.phonetics && first.phonetics[0]?.text);
        origin = first.origin;

        if (Array.isArray(first.meanings)) {
          for (const m of first.meanings) {
            const pos = m.partOfSpeech || 'noun';
            if (Array.isArray(m.definitions)) {
              for (const def of m.definitions.slice(0, 2)) {
                meanings.push({
                  partOfSpeech: pos,
                  definition: def.definition,
                  example: def.example,
                });
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Dictionary] Free Dictionary API failed:', err);
  }

  // 3. Fetch Wikipedia summary
  let wikipediaExcerpt: string | undefined;
  let wikipediaUrl: string | undefined;

  try {
    const wikiRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean)}`
    );
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      if (wikiData.extract) {
        wikipediaExcerpt = wikiData.extract;
        wikipediaUrl = wikiData.content_urls?.desktop?.page;
      }
    }
  } catch (err) {
    console.warn('[Dictionary] Wikipedia API failed:', err);
  }

  // If no external results succeeded, supply default placeholder
  if (meanings.length === 0) {
    meanings.push({
      partOfSpeech: 'term',
      definition: `Term appearing in Aristotle's logical treatises: "${clean}".`,
    });
  }

  return {
    word: clean.charAt(0).toUpperCase() + clean.slice(1),
    phonetic,
    meanings,
    origin,
    wikipediaExcerpt,
    wikipediaUrl,
  };
}
