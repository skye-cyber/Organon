import { OrganonParagraph, SearchResultItem } from '../types';

let pipelinePromise: Promise<unknown> | null = null;
let embedder: ((text: string, options?: unknown) => Promise<unknown>) | null = null;
let isModelLoading = false;
let modelLoadFailed = false;

// Compute cosine similarity between two numeric vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  const len = Math.min(a.length, b.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Initialize Xenova/all-MiniLM-L6-v2 pipeline safely
export async function initSemanticModel(): Promise<boolean> {
  if (embedder) return true;
  if (modelLoadFailed) return false;
  if (isModelLoading && pipelinePromise) {
    await pipelinePromise;
    return !!embedder;
  }

  isModelLoading = true;
  pipelinePromise = (async () => {
    try {
      const { pipeline, env } = await import('@xenova/transformers');
      // Configure local caching and webassembly optimizations
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true,
      });
      embedder = extractor as unknown as (text: string, options?: unknown) => Promise<unknown>;
      isModelLoading = false;
      return true;
    } catch (err) {
      console.warn('[SemanticSearch] Could not load @xenova/transformers model, using fallback:', err);
      modelLoadFailed = true;
      isModelLoading = false;
      return false;
    }
  })();

  await pipelinePromise;
  return !!embedder;
}

// Generate an embedding for the search query
export async function embedQuery(query: string): Promise<number[] | null> {
  const ready = await initSemanticModel();
  if (!ready || !embedder) return null;

  try {
    const output = (await embedder(query, { pooling: 'mean', normalize: true })) as {
      data: Float32Array | number[];
    };
    if (output && output.data) {
      return Array.from(output.data);
    }
  } catch (err) {
    console.warn('[SemanticSearch] Embed query failed:', err);
  }
  return null;
}

// Fallback semantic token matcher using TF-IDF style term frequency vectors
function tokenSemanticScore(query: string, text: string): number {
  const qTokens = query.toLowerCase().match(/\b\w{3,}\b/g) || [];
  const tTokens = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
  if (qTokens.length === 0 || tTokens.length === 0) return 0;

  let matches = 0;
  const tokenFreq = new Map<string, number>();
  for (const t of tTokens) {
    tokenFreq.set(t, (tokenFreq.get(t) || 0) + 1);
  }

  for (const q of qTokens) {
    if (tokenFreq.has(q)) {
      matches += Math.log(1 + (tokenFreq.get(q) || 0));
    }
  }

  return matches / Math.sqrt(qTokens.length * tTokens.length);
}

export interface ParagraphSearchContext {
  paragraph: OrganonParagraph;
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
}

export async function performSemanticSearch(
  query: string,
  allParagraphs: ParagraphSearchContext[],
  topK = 15
): Promise<SearchResultItem[]> {
  const q = query.trim();
  if (!q) return [];

  // Attempt real neural embedding via Xenova
  const queryVec = await embedQuery(q);

  const scored: Array<{ ctx: ParagraphSearchContext; score: number }> = [];

  for (const item of allParagraphs) {
    let score = 0;
    const parVec = item.paragraph.embedding;

    if (queryVec && parVec && parVec.length > 0) {
      // Calculate cosine similarity
      score = cosineSimilarity(queryVec, parVec);
    } else {
      // Fallback term-frequency vector similarity
      score = tokenSemanticScore(q, `${item.paragraph.bekker || ''} ${item.paragraph.summary || ''} ${item.paragraph.text}`);
    }

    if (score > 0.05) {
      scored.push({ ctx: item, score });
    }
  }

  // Sort descending by similarity score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map(({ ctx, score }) => {
    const text = ctx.paragraph.text;
    const snippet = ctx.paragraph.summary
      ? `[${ctx.paragraph.bekker || 'Text'}] ${ctx.paragraph.summary} — ${text.slice(0, 140)}...`
      : `${text.slice(0, 180)}...`;

    return {
      paragraphId: ctx.paragraph.id,
      bookId: ctx.bookId,
      bookTitle: ctx.bookTitle,
      chapterId: ctx.chapterId,
      chapterTitle: ctx.chapterTitle,
      bekker: ctx.paragraph.bekker,
      snippet,
      fullText: text,
      similarityScore: Math.round(score * 100) / 100,
      isSemantic: true,
    };
  });
}
