/**
 * Dev.to (Forem) articles API helpers.
 *
 * Extracted so both the action and the manual script share ONE code path for
 * lookup + create/update. A logger is injected so the same logic can emit via
 * `@actions/core` (action) or `console` (script) without depending on either.
 */

export interface DevToArticle {
  title: string;
  published: boolean;
  body_markdown: string;
  tags?: string[];
  series?: string;
  canonical_url?: string;
  description?: string;
  main_image?: string;
}

/** Minimal shape of an article as returned by `/articles/me/all`. */
export interface DevToExisting {
  id: number;
  title: string;
  canonical_url: string | null;
}

export interface Logger {
  info: (msg: string) => void;
  warning: (msg: string) => void;
}

export interface PublishResult {
  url: string;
  id: number;
  action: 'created' | 'updated';
}

const API_BASE = 'https://dev.to/api';
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * fetch wrapper that retries on HTTP 429 (Forem rate-limits article writes),
 * honouring `Retry-After` when present and otherwise backing off exponentially.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  log: Logger,
): Promise<Response> {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response = await fetch(url, init);
    if (response.status !== 429 || attempt >= MAX_RETRIES) {
      return response;
    }
    attempt++;
    const retryAfter = Number(response.headers.get('retry-after'));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : 2 ** attempt * 1000;
    log.warning(
      `Rate limited by Dev.to (429). Retry ${attempt}/${MAX_RETRIES} in ${Math.round(waitMs / 1000)}s…`,
    );
    await sleep(waitMs);
  }
}

/**
 * Fetch ALL of the authenticated user's articles (published AND drafts),
 * paginating until a short page is returned.
 */
export async function fetchMyArticles(apiKey: string, log: Logger): Promise<DevToExisting[]> {
  const perPage = 1000;
  const all: DevToExisting[] = [];
  let page = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const url = `${API_BASE}/articles/me/all?per_page=${perPage}&page=${page}`;
    const response = await fetchWithRetry(
      url,
      { method: 'GET', headers: { 'api-key': apiKey } },
      log,
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to list existing articles (page ${page}): ${response.status} ${body}`);
    }

    const batch = (await response.json()) as Array<{
      id: number;
      title: string;
      canonical_url: string | null;
    }>;

    for (const a of batch) {
      all.push({ id: a.id, title: a.title, canonical_url: a.canonical_url ?? null });
    }

    if (batch.length < perPage) {
      break;
    }
    page++;
  }

  return all;
}

/**
 * Find an existing article to update.
 *
 * Primary key is an exact `canonical_url` match (guarding against `null` on
 * older articles). Falls back to an exact `title` match and logs loudly when
 * it does, because a title-only match is weaker.
 */
export function matchArticle(
  existing: DevToExisting[],
  canonicalUrl: string | undefined,
  title: string,
  log: Logger,
): DevToExisting | undefined {
  if (canonicalUrl) {
    const byCanonical = existing.find(
      (a) => a.canonical_url != null && a.canonical_url === canonicalUrl,
    );
    if (byCanonical) {
      return byCanonical;
    }
  }

  const byTitle = existing.find((a) => a.title === title);
  if (byTitle) {
    log.warning(
      `No canonical_url match; falling back to an exact TITLE match for "${title}" ` +
        `(article ${byTitle.id}). Verify this is correct — title matches are weaker than canonical matches.`,
    );
    return byTitle;
  }

  return undefined;
}

/**
 * Create (POST) or update (PUT) an article. When `existingId` is provided the
 * article is updated in place; otherwise a new one is created.
 */
export async function publishArticle(
  apiKey: string,
  article: DevToArticle,
  existingId: number | undefined,
  log: Logger,
): Promise<PublishResult> {
  const isUpdate = existingId !== undefined;
  const url = isUpdate ? `${API_BASE}/articles/${existingId}` : `${API_BASE}/articles`;
  const method = isUpdate ? 'PUT' : 'POST';

  const response = await fetchWithRetry(
    url,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({ article }),
    },
    log,
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to ${isUpdate ? 'update' : 'create'} article: ${response.status} ${error}`);
  }

  const result = (await response.json()) as { url: string; id: number };
  return { url: result.url, id: result.id, action: isUpdate ? 'updated' : 'created' };
}
