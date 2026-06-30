const postEntries = [
  {
    slug: 'the-superset-language',
    title: 'The Superset Language',
    publishedAt: '2026-06-30T15:01:00+10:00',
    graphType: null,
    excerpt:
      'Cross-language conversion should lift source code into a richer semantic interlingua, lower into targets with evidence, and record loss instead of hiding it.',
  },
  {
    slug: 'proof-shape-matters',
    title: 'Proof Shape Matters',
    publishedAt: '2026-06-29T22:10:00+10:00',
    graphType: null,
    excerpt:
      'A passed test is not enough. Runtime proof needs source binding, probe identity, telemetry, snapshots, and bounded claims.',
  },
  {
    slug: 'identity-is-the-merge-primitive',
    title: 'Identity Is The Merge Primitive',
    publishedAt: '2026-06-29T22:09:00+10:00',
    graphType: null,
    excerpt:
      'Semantic merge works when the system can prove stable identity across exports, bindings, React keys, selectors, class maps, ids, and tokens.',
  },
  {
    slug: 'the-denominator-problem',
    title: 'The Denominator Problem',
    publishedAt: '2026-06-29T22:08:00+10:00',
    graphType: null,
    excerpt:
      'A green matrix can lie unless it counts the real denominator: missing rows, fail-closed cases, skipped surfaces, and over-broad claims.',
  },
  {
    slug: 'static-shape-runtime-meaning',
    title: 'Static Shape, Runtime Meaning',
    publishedAt: '2026-06-29T22:07:00+10:00',
    graphType: null,
    excerpt:
      'UI code has source shape and runtime meaning. Semantic merge has to keep AST, DOM, cascade, layout, focus, events, and accessibility claims separate.',
  },
  {
    slug: 'fail-closed-then-learn',
    title: 'Fail Closed, Then Learn',
    publishedAt: '2026-06-29T22:06:00+10:00',
    graphType: null,
    excerpt:
      'A blocked merge should not be dead air. It should become a sharper row, fixture, gate, question, route, or admission rule.',
  },
  {
    slug: 'from-worker-finding-to-gate',
    title: 'From Worker Finding To Gate',
    publishedAt: '2026-06-29T22:05:00+10:00',
    graphType: null,
    excerpt:
      'A swarm finding becomes durable only when the coordinator turns it into a focused fixture, matrix expectation, gate, and admission rule.',
  },
  {
    slug: 'tournaments-are-feedback-loops',
    title: 'Tournaments Are Feedback Loops',
    publishedAt: '2026-06-29T13:58:00+10:00',
    graphType: null,
    excerpt:
      'Model choice should be routed by evidence: cost, latency, gate results, review effort, question quality, and accepted work.',
  },
  {
    slug: 'hotspots-are-feedback',
    title: 'Hotspots Are Feedback',
    publishedAt: '2026-06-29T13:57:00+10:00',
    graphType: null,
    excerpt:
      'Hotspots are where parallel work turns into coordination cost. Measurement should feed routing, leases, gates, task splitting, and refactoring.',
  },
  {
    slug: 'queue-is-a-contract',
    title: 'The Queue Is A Contract',
    publishedAt: '2026-06-29T11:59:00+10:00',
    graphType: null,
    excerpt:
      'A durable queue is part of the system truth: task identity, claims, retries, outcomes, dead letters, and no resurrection from stale manifests.',
  },
  {
    slug: 'distributed-agents-need-receipts',
    title: 'Distributed Agents Need Receipts',
    publishedAt: '2026-06-29T11:58:00+10:00',
    graphType: null,
    excerpt:
      'Remote workers should return receipts that bind head, region, patch, proof, and assumptions before the coordinator admits work.',
  },
  {
    slug: 'gates-are-interfaces',
    title: 'Gates Are Interfaces',
    publishedAt: '2026-06-29T11:57:00+10:00',
    graphType: null,
    excerpt:
      'A gate is not just a command. It is an interface that turns candidate work into comparable evidence objects.',
  },
  {
    slug: 'apply-step-is-a-review-engine',
    title: 'The Apply Step Is A Review Engine',
    publishedAt: '2026-06-29T11:56:00+10:00',
    graphType: null,
    excerpt:
      'Applying a patch means claiming authority, re-reading head, dry-applying, running gates, writing decisions, and only then mutating shared state.',
  },
  {
    slug: 'small-tasks-are-a-scaling-primitive',
    title: 'Small Tasks Are A Scaling Primitive',
    publishedAt: '2026-06-29T11:55:00+10:00',
    graphType: null,
    excerpt:
      'Parallelism comes from independent, reviewable tasks with bounded context, not from worker count alone.',
  },
  {
    slug: 'semantic-merge-is-conservative-by-design',
    title: 'Semantic Merge Is Conservative By Design',
    publishedAt: '2026-06-29T11:54:00+10:00',
    graphType: null,
    excerpt:
      'Semantic merge should automate more only when evidence is stronger, and fail closed when meaning is missing or ambiguous.',
  },
  {
    slug: 'runtime-proofs-for-interfaces',
    title: 'Runtime Proofs For Interfaces',
    publishedAt: '2026-06-29T11:53:00+10:00',
    graphType: null,
    excerpt:
      'UI and browser-facing changes need runtime proof for layout, focus, accessibility, hydration, and event behavior.',
  },
  {
    slug: 'human-is-a-high-cost-oracle',
    title: 'The Human Is A High-Cost Oracle',
    publishedAt: '2026-06-29T11:52:00+10:00',
    graphType: null,
    excerpt:
      'Human attention should be treated as scarce evidence: shaped questions, batched uncertainty, durable answers, and routed continuations.',
  },
  {
    slug: 'matrix-is-the-system',
    title: 'The Matrix Is The System',
    publishedAt: '2026-06-28T07:33:00+10:00',
    graphType: null,
    excerpt:
      'A semantic merge matrix is not a checklist. It is the routing table that turns surfaces, claims, proofs, and missing evidence into decisions.',
  },
  {
    slug: 'css-is-a-dependency-graph',
    title: 'CSS Is A Dependency Graph',
    publishedAt: '2026-06-28T07:32:00+10:00',
    graphType: null,
    excerpt:
      'CSS merging has to see selectors, cascade scopes, variables, fallbacks, assets, descriptors, and build edges as one dependency graph.',
  },
  {
    slug: 'four-versions-in-every-merge',
    title: 'The Four Versions In Every Merge',
    publishedAt: '2026-06-28T07:31:00+10:00',
    graphType: null,
    excerpt:
      'A merge proof has to bind base, worker, head, and output. Without all four, evidence can be correct and still unsafe.',
  },
  {
    slug: 'text-is-the-substrate',
    title: 'Text Is The Substrate',
    publishedAt: '2026-06-28T07:30:00+10:00',
    graphType: null,
    excerpt:
      'Semantic merge should stand on exact source text, hashes, spans, comments, and trivia rather than pretending text diffs are obsolete.',
  },
  {
    slug: 'agent-readable-capabilities',
    title: 'Agent-Readable Capabilities',
    publishedAt: '2026-06-26T14:06:00+10:00',
    graphType: null,
    excerpt:
      'Agent-readable software exposes state, actions, invariants, and feedback; capabilities turn those surfaces into enforceable authority.',
  },
  {
    slug: 'workspaces-before-mutation',
    title: 'Workspaces Before Mutation',
    publishedAt: '2026-06-26T14:05:00+10:00',
    graphType: null,
    excerpt:
      'Workspaces are possible worlds where agents can mutate, simulate, fail, and return evidence before shared state moves.',
  },
  {
    slug: 'evidence-oracles-and-admission',
    title: 'Evidence, Oracles, And Admission',
    publishedAt: '2026-06-26T14:04:00+10:00',
    graphType: null,
    excerpt:
      'Agents produce candidates, oracles produce trusted observations, and admission decides whether the evidence matches the boundary.',
  },
  {
    slug: 'layout-is-a-runtime',
    title: 'Layout Is A Runtime',
    publishedAt: '2026-06-26T13:47:00+10:00',
    graphType: null,
    excerpt:
      'HTML, CSS, and JSX are not only source shapes. The browser runs them into cascade, layout, focus, accessibility, and hydration state.',
  },
  {
    slug: 'interfaces-for-parallel-work',
    title: 'Interfaces For Parallel Work',
    publishedAt: '2026-06-25T11:04:00+10:00',
    graphType: null,
    excerpt:
      'Parallel work is not created by starting more workers. It is created by giving agents APIs, regions, tests, docs, and contracts they can safely rejoin through.',
  },
  {
    slug: 'merging-is-routing',
    title: 'Merging Is Routing',
    publishedAt: '2026-06-26T14:03:00+10:00',
    graphType: null,
    excerpt:
      'A merge is a review object first and a routing decision second: apply, review, rebase, rerun, split, ask, or block.',
  },
  {
    slug: 'coordinator-work',
    title: 'Coordinator Work',
    publishedAt: '2026-06-26T14:02:00+10:00',
    graphType: null,
    excerpt:
      'The coordinator turns many candidate futures into one reviewable decision without letting review bandwidth collapse.',
  },
  {
    slug: 'human-questions-are-control-flow',
    title: 'Human Questions Are Control Flow',
    publishedAt: '2026-06-24T22:42:00+10:00',
    graphType: null,
    excerpt:
      'A question should be a typed blocker in the run graph, not an interruption lost inside the transcript.',
  },
  {
    slug: 'semantic-regions',
    title: 'Semantic Regions',
    publishedAt: '2026-06-24T22:41:00+10:00',
    graphType: null,
    excerpt:
      'Semantic regions are the units agents can claim, compare, review, and merge: exports, routes, types, tests, and invariants.',
  },
  {
    slug: 'stale-work',
    title: 'Stale Work',
    publishedAt: '2026-06-24T22:40:00+10:00',
    graphType: null,
    excerpt:
      'Old work can still be useful, but it needs to carry the head, evidence, and assumptions it was built against.',
  },
  {
    slug: 'semantic-leases',
    title: 'Semantic Leases',
    publishedAt: '2026-06-24T22:25:00+10:00',
    graphType: null,
    excerpt:
      'A lease should protect a meaning: an export, invariant, route, contract, or region of behavior, not only the file that happens to contain it.',
  },
  {
    slug: 'runs-are-causal-graphs',
    title: 'Runs Are Causal Graphs',
    publishedAt: '2026-06-24T22:12:00+10:00',
    graphType: null,
    excerpt:
      'A run is not a transcript or a status row. It is a causal graph of attempts, evidence, questions, decisions, retries, and applied work.',
  },
  {
    slug: 'universal-semantic-merging',
    title: 'Universal Semantic Merging',
    publishedAt: '2026-06-24T16:45:00+10:00',
    graphType: null,
    excerpt:
      'Semantic merging treats edits as symbols, imports, types, and evidence gates before writing the final text back to disk.',
  },
  {
    slug: 'agent-loop-patterns',
    title: 'Agent Loop Patterns',
    publishedAt: '2026-06-21T12:00:00+10:00',
    graphType: null,
    excerpt:
      'A vocabulary for agent workflows: chain work, branch attempts, join results, reduce evidence, gate decisions, and loop until the system is ready.',
  },
];

const publishedAtTimestamp = (post) => {
  const timestamp = Date.parse(post.publishedAt);
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
};

export const comparePostsByMostRecent = (left, right) => {
  const byPublishedAt = publishedAtTimestamp(right) - publishedAtTimestamp(left);
  return byPublishedAt || left.slug.localeCompare(right.slug);
};

export const sortPostsByMostRecent = (items) => [...items].sort(comparePostsByMostRecent);

export const postsByMostRecent = sortPostsByMostRecent(postEntries);

export const homepagePosts = postsByMostRecent;

export const posts = postsByMostRecent;

export const getPostBySlug = (slug) =>
  posts.find((post) => post.slug === slug || post.aliases?.includes(slug)) || null;
