import json
import os
import re
import numpy as np

def build_dataset():
    print("Building comprehensive Aristotle's Organon dataset...")
    
    books = [
        {
            "id": "categories",
            "title": "Categories",
            "greek_title": "Κατηγορίαι (Categoriae)",
            "order": 1,
            "description": "An inquiry into terms, predication, and the ten fundamental classifications of all existing things.",
            "parts": [
                {
                    "id": "cat-part-1",
                    "title": "Part I: Antepredicaments",
                    "order": 1,
                    "chapters": [
                        {
                            "id": "cat-ch-1",
                            "title": "Chapter 1: Homonyms, Synonyms, and Paronyms",
                            "order": 1,
                            "paragraphs": [
                                {
                                    "id": "cat-p-1",
                                    "order": 1,
                                    "bekker": "1a1-1a15",
                                    "text": "Things are said to be named equivocally (homonyms) when the name alone is common to both, but the definition of essence corresponding to the name is different. Thus, a real man and a painted likeness are both termed 'animal'; for here the name is common, but should anyone define what being an animal is in each case, he will assign an account peculiar to each.",
                                    "summary": "Definition of equivocal terms (homonyms)."
                                },
                                {
                                    "id": "cat-p-2",
                                    "order": 2,
                                    "bekker": "1a16-1a20",
                                    "text": "Things are called unequivocally (synonyms) whose name is common, and the definition of the essence signified by the name is the same. For instance, a man and an ox are both 'animal'; for each is called by the common name 'animal', and the definition of essence is identical in both.",
                                    "summary": "Definition of univocal terms (synonyms)."
                                },
                                {
                                    "id": "cat-p-3",
                                    "order": 3,
                                    "bekker": "1a21-1b9",
                                    "text": "Things are termed derivatively (paronyms) which differ in grammatical inflection from some root name, while deriving their appellation from it. Thus, the grammarian is named from grammar, and the brave man is named from bravery.",
                                    "summary": "Definition of derivative terms (paronyms)."
                                }
                            ]
                        },
                        {
                            "id": "cat-ch-2",
                            "title": "Chapter 2: Forms of Expression and the Fourfold Scheme of Predication",
                            "order": 2,
                            "paragraphs": [
                                {
                                    "id": "cat-p-4",
                                    "order": 1,
                                    "bekker": "1b10-1b15",
                                    "text": "Of things spoken, some are articulated in complex combinations, while others are expressed without combination. Those spoken with combination are such as 'a man runs', 'a man conquers'; but those without combination are such as 'man', 'ox', 'runs', 'conquers'.",
                                    "summary": "Simple versus complex linguistic expressions."
                                },
                                {
                                    "id": "cat-p-5",
                                    "order": 2,
                                    "bekker": "1b16-2a4",
                                    "text": "Of beings, some are said of a subject, but are in no subject: for example, 'man' is said of individual man as subject, but is in no subject. Others are in a subject, but are said of no subject: for example, a certain point of grammatical knowledge is in the soul as a subject, but is said of no subject; and a certain whiteness is in a body as subject, but is said of no subject.",
                                    "summary": "The ontology of inherent vs predicated entities."
                                },
                                {
                                    "id": "cat-p-6",
                                    "order": 3,
                                    "bekker": "2a5-2a10",
                                    "text": "Some things are both said of a subject and are in a subject: for example, scientific knowledge is in the soul as a subject, and is also predicated of grammatical knowledge as a subject. Other things are neither in a subject nor predicated of a subject: such as an individual man or an individual horse; for nothing of this kind is in a subject or said of a subject.",
                                    "summary": "Universal accidents and primary substances."
                                }
                            ]
                        },
                        {
                            "id": "cat-ch-4",
                            "title": "Chapter 4: The Ten Categories of Being",
                            "order": 3,
                            "paragraphs": [
                                {
                                    "id": "cat-p-7",
                                    "order": 1,
                                    "bekker": "1b25-2a4",
                                    "text": "Each expression without combination signifies either: Substance, Quantity, Quality, Relation, Place, Time, Position, State (or Having), Action, or Passion (or Being Affected). Substance is such as 'man', 'horse'; Quantity such as 'two cubits', 'three cubits'; Quality such as 'white', 'grammatical'; Relation such as 'double', 'half', 'greater'; Place such as 'in the Lyceum', 'in the market'; Time such as 'yesterday', 'last year'; Position such as 'he lies', 'he sits'; State such as 'he is shod', 'he is armed'; Action such as 'he cuts', 'he burns'; Passion such as 'he is cut', 'he is burned'.",
                                    "summary": "The Ten Aristotelian Categories."
                                },
                                {
                                    "id": "cat-p-8",
                                    "order": 2,
                                    "bekker": "2a5-2a10",
                                    "text": "None of these terms mentioned above by itself constitutes an affirmation or a negation; but it is only through their mutual combination that affirmation or negation arises. For every affirmation and negation appears to be either true or false, whereas things spoken without combination, such as 'man', 'white', 'runs', 'conquers', are neither true nor false.",
                                    "summary": "Truth requires proposition and combination."
                                }
                            ]
                        }
                    ]
                },
                {
                    "id": "cat-part-2",
                    "title": "Part II: The Predicaments Proper",
                    "order": 2,
                    "chapters": [
                        {
                            "id": "cat-ch-5",
                            "title": "Chapter 5: Primary and Secondary Substance",
                            "order": 1,
                            "paragraphs": [
                                {
                                    "id": "cat-p-9",
                                    "order": 1,
                                    "bekker": "2a11-2a34",
                                    "text": "Substance, in its most proper, primary, and paramount sense, is that which is neither predicated of a subject nor inherent in a subject: for example, this particular individual man or this horse. But those are called Secondary Substances to which species, as to subjects, the primary substances belong, both these species and their genera: thus individual man belongs to the species 'man', and the genus of the species is 'animal'.",
                                    "summary": "Primary substance versus secondary substance."
                                },
                                {
                                    "id": "cat-p-10",
                                    "order": 2,
                                    "bekker": "2b1-2b22",
                                    "text": "All other things are either said of primary substances as subjects, or are inherent in them as in subjects. Thus, if primary substances did not exist, it would be impossible for any of the other things to exist. For all colors are in bodies, and if no individual body existed, neither could color exist.",
                                    "summary": "Primacy of primary substance as ontological foundation."
                                },
                                {
                                    "id": "cat-p-11",
                                    "order": 3,
                                    "bekker": "4a10-4b19",
                                    "text": "The most distinctive characteristic of substance seems to be that, while remaining numerically one and the same, it is capable of admitting contrary qualities. In no other entity do we observe this: thus the same individual man becomes at one time pale and at another dark, warm and cold, virtuous and vicious.",
                                    "summary": "Capacity to admit contraries through change."
                                }
                            ]
                        },
                        {
                            "id": "cat-ch-6",
                            "title": "Chapter 6: Quantity: Discrete and Continuous",
                            "order": 2,
                            "paragraphs": [
                                {
                                    "id": "cat-p-12",
                                    "order": 1,
                                    "bekker": "4b20-5a37",
                                    "text": "Of quantity, one kind is discrete, and another continuous; and one kind consists of parts having position with reference to one another within the whole, while another consists of parts which have no such position. Discrete quantity is exemplified by number and speech; continuous quantity by line, surface, solid, time, and space.",
                                    "summary": "Division of quantity into discrete and continuous."
                                }
                            ]
                        },
                        {
                            "id": "cat-ch-8",
                            "title": "Chapter 8: Quality and its Species",
                            "order": 3,
                            "paragraphs": [
                                {
                                    "id": "cat-p-13",
                                    "order": 1,
                                    "bekker": "8b25-9a13",
                                    "text": "By Quality I mean that in virtue of which things are said to be such and such. Quality is spoken of in many ways. One species of quality is habit and disposition. Habit differs from disposition in being more lasting and firmly established: such are the virtues and sciences.",
                                    "summary": "Definition of quality and habits versus dispositions."
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "id": "on-interpretation",
            "title": "On Interpretation",
            "greek_title": "Περὶ Ἑρμηνείας (De Interpretatione)",
            "order": 2,
            "description": "On linguistic signification, truth, nouns, verbs, affirmations, negations, and future contingents.",
            "parts": [
                {
                    "id": "interp-part-1",
                    "title": "Part I: Words, Thoughts, and Simple Enunciations",
                    "order": 1,
                    "chapters": [
                        {
                            "id": "interp-ch-1",
                            "title": "Chapter 1: Spoken Words as Symbols of Soul's Affections",
                            "order": 1,
                            "paragraphs": [
                                {
                                    "id": "interp-p-1",
                                    "order": 1,
                                    "bekker": "16a1-16a18",
                                    "text": "Spoken words are symbols of affections in the soul, and written marks are symbols of spoken words. And just as written characters are not the same for all men, so neither are spoken sounds the same; but the affections of the soul itself, of which these are primarily signs, are identical for all, and the things of which our mental affections are likenesses are likewise identical.",
                                    "summary": "Spoken words, mental affections, and objective reality."
                                },
                                {
                                    "id": "interp-p-2",
                                    "order": 2,
                                    "bekker": "16a19-16b5",
                                    "text": "As in the soul there is sometimes a thought without truth or falsehood, and sometimes one to which one of these must belong, so it is in speech; for combination and separation are essential to truth and falsity. Nouns and verbs alone resemble a thought without combination and separation: such as 'man' or 'white', when nothing further is added, for as yet they are neither true nor false.",
                                    "summary": "Truth and falsehood depend upon synthesis and separation."
                                }
                            ]
                        },
                        {
                            "id": "interp-ch-2",
                            "title": "Chapter 2: The Noun and Conventional Signification",
                            "order": 2,
                            "paragraphs": [
                                {
                                    "id": "interp-p-3",
                                    "order": 1,
                                    "bekker": "16a19-16b5",
                                    "text": "A noun is a spoken sound significant by convention, without time, no part of which is significant in separation. For in 'whiteling' the 'ling' signifies nothing in itself, as it does in the phrase 'white horse'. We say 'by convention' because no name exists by nature, but only when it becomes a symbol.",
                                    "summary": "The definition of the noun."
                                }
                            ]
                        },
                        {
                            "id": "interp-ch-3",
                            "title": "Chapter 3: The Verb and Time Reference",
                            "order": 3,
                            "paragraphs": [
                                {
                                    "id": "interp-p-4",
                                    "order": 1,
                                    "bekker": "16b6-16b25",
                                    "text": "A verb is that which, in addition to its proper meaning, cosignifies time; no part of it has any meaning by itself, and it is always a sign of things said of something else. It cosignifies time: thus 'health' is a noun, but 'he is healthy' is a verb, for it cosignifies the present presence of health.",
                                    "summary": "The definition of the verb and cosignification of time."
                                }
                            ]
                        },
                        {
                            "id": "interp-ch-4",
                            "title": "Chapter 4: The Sentence and Enunciation",
                            "order": 4,
                            "paragraphs": [
                                {
                                    "id": "interp-p-5",
                                    "order": 1,
                                    "bekker": "16b26-17a7",
                                    "text": "A sentence is a significant sound, some of whose parts are significant in separation as expressions, not as affirmations. Every sentence is significant, not indeed as an instrument of nature, but by convention. Yet not every sentence is an enunciation, but only that in which truth or falsity is present. Thus a prayer is a sentence, but neither true nor false; enunciation alone belongs to logic.",
                                    "summary": "The enunciation as the sole truth-bearing sentence."
                                }
                            ]
                        }
                    ]
                },
                {
                    "id": "interp-part-2",
                    "title": "Part II: Contradiction and Future Contingents",
                    "order": 2,
                    "chapters": [
                        {
                            "id": "interp-ch-9",
                            "title": "Chapter 9: The Sea Battle and Future Contingents",
                            "order": 1,
                            "paragraphs": [
                                {
                                    "id": "interp-p-6",
                                    "order": 1,
                                    "bekker": "18a28-19b4",
                                    "text": "In the case of that which is and that which has been, the affirmation or negation must necessarily be true or false. But in the case of future singulars this is not so. If every affirmation or negation is true or false, then everything necessarily is or is not. But we see that there is a beginning of future things from deliberation and action, and that in things that are not always actual there is a possibility of being and of not being.",
                                    "summary": "Future singulars and the open texture of human deliberation."
                                },
                                {
                                    "id": "interp-p-7",
                                    "order": 2,
                                    "bekker": "19a32-19b4",
                                    "text": "That what is, necessarily is when it is; and that what is not, necessarily is not when it is not: this is necessary. Yet it is not necessary that everything that is should be, nor that everything that is not should not be. A sea-fight must either take place tomorrow or not take place tomorrow; yet it is not necessary that it should take place tomorrow, nor that it should not take place.",
                                    "summary": "The classical Sea-Battle argument and modal necessity."
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "id": "prior-analytics",
            "title": "Prior Analytics",
            "greek_title": "Ἀναλυτικὰ Πρότερα (Analytica Priora)",
            "order": 3,
            "description": "The invention and foundation of formal deductive logic: syllogisms, terms, and the three figures.",
            "parts": [
                {
                    "id": "prior-part-1",
                    "title": "Book I: Syllogistic Theory and the Three Figures",
                    "order": 1,
                    "chapters": [
                        {
                            "id": "prior-ch-1",
                            "title": "Chapter 1: Premise, Term, and the Syllogism",
                            "order": 1,
                            "paragraphs": [
                                {
                                    "id": "prior-p-1",
                                    "order": 1,
                                    "bekker": "24a10-24b17",
                                    "text": "We must first state the subject of our inquiry and what it concerns: its subject is demonstration, and it concerns demonstrative science. Next we must define what a premise is, what a term is, and what a syllogism is; what kind of syllogism is perfect, and what imperfect.",
                                    "summary": "Scope of analytics and definitions of basic logical components."
                                },
                                {
                                    "id": "prior-p-2",
                                    "order": 2,
                                    "bekker": "24b18-25a1",
                                    "text": "A syllogism is a discourse in which, certain things being posited, something different from what is posited results of necessity because these things are so. By 'because these things are so' I mean that it results on account of them; and by this, that no further term is required from without to make the consequence necessary.",
                                    "summary": "The fundamental definition of deductive consequence and syllogism."
                                },
                                {
                                    "id": "prior-p-3",
                                    "order": 3,
                                    "bekker": "25a2-25a26",
                                    "text": "I call that syllogism perfect which requires nothing beyond what is taken in the premises to make the necessity evident. I call that imperfect which requires one or more things that are indeed necessary through the terms laid down, yet have not been stated as premises.",
                                    "summary": "Perfect versus imperfect syllogisms."
                                }
                            ]
                        },
                        {
                            "id": "prior-ch-4",
                            "title": "Chapter 4: The First Figure: Complete Deductions",
                            "order": 2,
                            "paragraphs": [
                                {
                                    "id": "prior-p-4",
                                    "order": 1,
                                    "bekker": "25b32-26a16",
                                    "text": "Whenever three terms are so related to one another that the last is contained in the middle as in a whole, and the middle is either contained in, or excluded from, the first as in or from a whole, the extremes must be related by a perfect syllogism. I call that the middle term which is itself contained in another and has another contained in it, which also becomes middle by position.",
                                    "summary": "The First Figure and the function of the middle term."
                                },
                                {
                                    "id": "prior-p-5",
                                    "order": 2,
                                    "bekker": "26a17-26b25",
                                    "text": "If A is predicated of all B, and B of all C, A must necessarily be predicated of all C. Similarly, if A belongs to no B, and B to all C, A will belong to no C. These are the moods Barbara and Celarent, through which universal affirmative and universal negative conclusions are demonstratively proved.",
                                    "summary": "Universal moods of the First Figure (Barbara and Celarent)."
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "id": "posterior-analytics",
            "title": "Posterior Analytics",
            "greek_title": "Ἀναλυτικὰ Ὕστερα (Analytica Posteriora)",
            "order": 4,
            "description": "Scientific demonstration, epistemology, causal necessity, definitions, and the intuitive grasp of first principles.",
            "parts": [
                {
                    "id": "post-part-1",
                    "title": "Book I: Demonstrative Knowledge and Episteme",
                    "order": 1,
                    "chapters": [
                        {
                            "id": "post-ch-1",
                            "title": "Chapter 1: Pre-existent Knowledge and Learning",
                            "order": 1,
                            "paragraphs": [
                                {
                                    "id": "post-p-1",
                                    "order": 1,
                                    "bekker": "71a1-71a29",
                                    "text": "All teaching and all intellectual learning proceed from pre-existing knowledge. This becomes evident if we consider all the sciences; for the mathematical sciences and every other art are acquired in this way. The same applies to dialectical arguments, whether they proceed by syllogism or by induction.",
                                    "summary": "The necessity of pre-existing knowledge in all learning."
                                }
                            ]
                        },
                        {
                            "id": "post-ch-2",
                            "title": "Chapter 2: The Conditions of Scientific Demonstration",
                            "order": 2,
                            "paragraphs": [
                                {
                                    "id": "post-p-2",
                                    "order": 1,
                                    "bekker": "71b9-72a5",
                                    "text": "We think we have scientific knowledge of a thing without qualification, and not in the accidental sophistic manner, when we think we know the cause on account of which the thing is, that it is the cause of it, and that it is impossible for the fact to be other than it is. Demonstrative science must proceed from premises that are true, primary, immediate, better known than, prior to, and causes of the conclusion.",
                                    "summary": "The rigorous definition of episteme and demonstrative premises."
                                },
                                {
                                    "id": "post-p-3",
                                    "order": 2,
                                    "bekker": "72a6-72b4",
                                    "text": "Premises must be causes, better known, and prior: causes because we only possess scientific knowledge when we know the cause; prior because they are causes; and known beforehand, not merely in the sense that their meaning is understood, but that we know the fact that they are true.",
                                    "summary": "Why demonstrative premises must be causal and prior."
                                }
                            ]
                        }
                    ]
                },
                {
                    "id": "post-part-2",
                    "title": "Book II: Scientific Inquiry and Nous",
                    "order": 2,
                    "chapters": [
                        {
                            "id": "post-ch-19",
                            "title": "Chapter 19: Sense-Perception, Memory, and Nous",
                            "order": 1,
                            "paragraphs": [
                                {
                                    "id": "post-p-4",
                                    "order": 1,
                                    "bekker": "99b15-100b17",
                                    "text": "We possess an innate discriminating capacity, which is called sense-perception. From perception there arises memory, and from repeated memory of the same thing develops a single experience (empeiria). From experience, or from the whole universal that has come to rest in the soul, arises the principle of art and science. Hence the first principles become known to us by induction; and it is Intuitive Reason (Nous) that grasps the first principles.",
                                    "summary": "The genesis of universal principles from sense-perception to Nous."
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "id": "topics",
            "title": "Topics",
            "greek_title": "Τοπικά (Topica)",
            "order": 5,
            "description": "Dialectical reasoning from reputable opinions (endoxa), debate methodology, and commonplaces (topoi).",
            "parts": [
                {
                    "id": "top-part-1",
                    "title": "Book I: The Four Predicables and the Nature of Dialectic",
                    "order": 1,
                    "chapters": [
                        {
                            "id": "top-ch-1",
                            "title": "Chapter 1: Purpose of the Treatise and Kinds of Syllogism",
                            "order": 1,
                            "paragraphs": [
                                {
                                    "id": "top-p-1",
                                    "order": 1,
                                    "bekker": "100a18-100b23",
                                    "text": "The purpose of this treatise is to discover a method by which we shall be able to syllogize concerning every proposed problem from probable opinions (endoxa), and when sustaining an argument ourselves, to avoid stating anything contradictory. A demonstration is when a syllogism consists of things true and primary; but a dialectical syllogism is that which reasons from probable opinions.",
                                    "summary": "The goal of dialectic and types of syllogisms."
                                },
                                {
                                    "id": "top-p-2",
                                    "order": 2,
                                    "bekker": "100b21-101a4",
                                    "text": "Probable opinions (endoxa) are those which are accepted by all, or by the majority, or by the wise; and among the wise, either by all, or by most, or by the most distinguished and renowned. Eristic or contentious reasoning is that which starts from opinions that appear probable but are not really so.",
                                    "summary": "Definition of endoxa and contentious reasoning."
                                },
                                {
                                    "id": "top-p-3",
                                    "order": 3,
                                    "bekker": "101a25-101b4",
                                    "text": "This treatise is useful for three purposes: intellectual training, casual conversational encounters, and philosophical sciences. For philosophical sciences it is useful because, being able to raise perplexities on both sides, we shall more easily detect the true and the false in each matter; furthermore, dialectic has a path toward the first principles of all inquiries.",
                                    "summary": "The threefold utility of dialectic for training, conversation, and philosophy."
                                }
                            ]
                        },
                        {
                            "id": "top-ch-4",
                            "title": "Chapter 4: The Four Predicables",
                            "order": 2,
                            "paragraphs": [
                                {
                                    "id": "top-p-4",
                                    "order": 1,
                                    "bekker": "101b11-101b37",
                                    "text": "Every proposition and every problem signifies either a Property, a Definition, a Genus, or an Accident. For difference, being generic in nature, should be placed together with genus. What signifies the very essence of a thing is called Definition; what reciprocates without signifying essence is Property; Genus is predicated of many things differing in species in answer to 'what is it'; and Accident is what belongs to a thing without being any of these.",
                                    "summary": "The Four Predicables: Definition, Property, Genus, and Accident."
                                }
                            ]
                        },
                        {
                            "id": "top-ch-5",
                            "title": "Chapter 5: Definition, Genus, Property, and Accident Defined",
                            "order": 3,
                            "paragraphs": [
                                {
                                    "id": "top-p-5",
                                    "order": 1,
                                    "bekker": "101b38-102a30",
                                    "text": "A Definition is a phrase signifying a thing's essence. A Property is that which does not show what the thing is to be, but belongs to it alone and is predicated convertibly of it: as it is a property of man to be capable of learning grammar. A Genus is what is predicated in the category of essence of several things that differ in species: as animal is the genus of man and ox. An Accident is that which can belong and not belong to one and the same thing: as to be seated or to be white.",
                                    "summary": "Precise Aristotelian definitions of the four predicables."
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "id": "sophistical-refutations",
            "title": "On Sophistical Refutations",
            "greek_title": "Περὶ Σοφιστικῶν Ἐλέγχων (De Sophisticis Elenchis)",
            "order": 6,
            "description": "Exposition of deceptive reasoning, fallacies in language and thought, and dialectical defense strategies.",
            "parts": [
                {
                    "id": "soph-part-1",
                    "title": "Part I: Nature and Taxonomy of Fallacies",
                    "order": 1,
                    "chapters": [
                        {
                            "id": "soph-ch-1",
                            "title": "Chapter 1: Sophistical Reasoning and Apparent Wisdom",
                            "order": 1,
                            "paragraphs": [
                                {
                                    "id": "soph-p-1",
                                    "order": 1,
                                    "bekker": "164a20-165a18",
                                    "text": "Let us now discuss Sophistical Refutations, that is, arguments which appear to be refutations but are really paralogisms and not refutations. For that some syllogisms are genuine while others seem to be so without being so, is obvious. The sophist is one who gains money from apparent wisdom that is not real.",
                                    "summary": "Definition of sophistical refutations and the counterfeit nature of sophistry."
                                },
                                {
                                    "id": "soph-p-2",
                                    "order": 2,
                                    "bekker": "165a19-165b22",
                                    "text": "The goals of disputants in contentious debate are five: Refutation, Falsity, Paradox, Solecism, and Fifthly, reducing the opponent to babbling (that is, forcing him repeatedly to say the same thing).",
                                    "summary": "The five objectives of contentious and sophistical disputants."
                                }
                            ]
                        },
                        {
                            "id": "soph-ch-4",
                            "title": "Chapter 4: The Thirteen Fallacies: In Dictione and Extra Dictionem",
                            "order": 2,
                            "paragraphs": [
                                {
                                    "id": "soph-p-3",
                                    "order": 1,
                                    "bekker": "165b23-166b27",
                                    "text": "The modes of producing an apparent refutation dependent on language are six in number: Equivocation, Amphiboly, Composition, Division, Accent, and Figure of Speech. Those independent of language are seven: Accident, Applying an expression without qualification, Ignorance of refutation, Begging the original point, False cause, Consequent, and Treating multiple questions as one.",
                                    "summary": "The canonical division of 13 fallacies into linguistic and material classes."
                                },
                                {
                                    "id": "soph-p-4",
                                    "order": 2,
                                    "bekker": "166b28-167a20",
                                    "text": "Examples of verbal fallacies include Equivocation, when words have different meanings, and Amphiboly, when grammatical construction is ambiguous. Fallacies independent of language include Begging the Question (petitio principii), which occurs when an arguer assumes what was originally to be proved.",
                                    "summary": "Detailed breakdown of Equivocation, Amphiboly, and Petitio Principii."
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]

    dataset = {
        "id": "organon",
        "title": "The Organon",
        "author": "Aristotle",
        "translator": "Octavius Freire Owen (1853)",
        "language": "English",
        "collection": "Organon",
        "description": "The complete collection of Aristotle's six foundational treatises on logic and dialectic.",
        "books": books
    }

    # Generate semantic embeddings for every paragraph
    print("Generating dense semantic embeddings...")
    paragraphs = []
    for b in books:
        for p in b["parts"]:
            for c in p["chapters"]:
                for par in c["paragraphs"]:
                    paragraphs.append(par)
    
    print(f"Total paragraphs to embed: {len(paragraphs)}")

    # Create semantic vectors
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.decomposition import TruncatedSVD

    corpus = [f"{p['bekker']} {p.get('summary', '')} {p['text']}" for p in paragraphs]
    
    # 64-dimensional dense semantic vectors
    n_dim = min(64, len(corpus) - 1)
    tfidf = TfidfVectorizer(max_features=500, stop_words='english', ngram_range=(1, 2))
    X = tfidf.fit_transform(corpus)
    
    svd = TruncatedSVD(n_components=n_dim, random_state=42)
    embeddings_matrix = svd.fit_transform(X)
    
    # Normalize vectors to unit length for cosine similarity
    norms = np.linalg.norm(embeddings_matrix, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    normalized_embeddings = (embeddings_matrix / norms).tolist()

    embeddings_dict = {}
    for i, par in enumerate(paragraphs):
        # Round to 5 decimal places for compactness
        vec = [round(float(v), 5) for v in normalized_embeddings[i]]
        par["embedding"] = vec
        embeddings_dict[par["id"]] = {
            "book_id": [b["id"] for b in books if any(par["id"] == p["id"] for p in [p for part in b["parts"] for ch in part["chapters"] for p in ch["paragraphs"]])][0],
            "bekker": par.get("bekker", ""),
            "summary": par.get("summary", ""),
            "text": par["text"][:120] + "...",
            "vector": vec
        }

    # Write out data/organon.json (the canonical sample mock showing the expected schema)
    with open("data/organon.json", "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)
    print("Successfully written data/organon.json")

    # Also write out data/organon_english.json with the exact same rich structure
    with open("data/organon_english.json", "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)
    print("Successfully written data/organon_english.json")

    # Write out data/embeddings.json for pre-computed fast semantic search
    with open("data/embeddings.json", "w", encoding="utf-8") as f:
        json.dump(embeddings_dict, f, indent=2, ensure_ascii=False)
    print(f"Successfully written data/embeddings.json ({len(embeddings_dict)} vectors)")

if __name__ == "__main__":
    build_dataset()
