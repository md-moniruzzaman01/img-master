// Lookup helpers over the registry. Owned by the lead.
import { toolContent } from '@/content/pages';
import type {
  Crumb,
  ToolCardData,
  ToolCategory,
  ToolContent,
  ToolDefinition,
  ToolNavGroup,
} from '../types';
import { categoryLabels, categoryOrder, tools } from './registry';

export { categoryLabels, categoryOrder, tools } from './registry';

export function getTool(slug: string): ToolDefinition | undefined {
  return tools.find((t) => t.slug === slug);
}

export function getLiveTools(): ToolDefinition[] {
  return tools.filter((t) => t.status === 'live');
}

/** Live tools in one category, in registry order (hub first). */
export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return getLiveTools().filter((t) => t.category === category);
}

/** Categories that have at least one live tool, in display order. */
export function getLiveCategories(): ToolCategory[] {
  return categoryOrder.filter((c) => getToolsByCategory(c).length > 0);
}

/** The hub page of a category, if it is live. */
export function getCategoryHub(category: ToolCategory): ToolDefinition | undefined {
  return getToolsByCategory(category).find((t) => t.hub);
}

export function getToolContent(slug: string): ToolContent | undefined {
  return toolContent[slug];
}

/** Card data for a live tool with content (undefined otherwise). */
export function getToolCard(slug: string): ToolCardData | undefined {
  const tool = getTool(slug);
  const content = getToolContent(slug);
  if (!tool || tool.status !== 'live' || !content) return undefined;
  return {
    slug,
    href: `/${slug}`,
    kind: tool.kind,
    category: tool.category,
    shortName: content.shortName,
    description: content.cardDescription,
  };
}

/** Card data for a list of slugs, skipping any that aren't live. */
export function getToolCards(slugs: readonly string[]): ToolCardData[] {
  return slugs.map(getToolCard).filter((c): c is ToolCardData => !!c);
}

/** Live tools grouped by category, for menus, footer, home grid and 404. */
export function getNavGroups(): ToolNavGroup[] {
  return getLiveCategories().map((category) => ({
    category,
    label: categoryLabels[category],
    hubHref: getCategoryHub(category) ? `/${getCategoryHub(category)!.slug}` : undefined,
    tools: getToolCards(getToolsByCategory(category).map((t) => t.slug)),
  }));
}

/** Home "Compress to a size" row: live compress-to-size pages, smallest first. */
export function getSizeLinks(): { label: string; href: string; targetKB: number }[] {
  return getLiveTools()
    .filter((t) => t.kind === 'compress-to-size' && t.preset.targetKB)
    .map((t) => {
      const kb = t.preset.targetKB!;
      return { label: kb >= 1000 ? `${kb / 1000}MB` : `${kb}KB`, href: `/${t.slug}`, targetKB: kb };
    })
    .sort((a, b) => a.targetKB - b.targetKB);
}

/**
 * Breadcrumb trail for a tool page: Home › {Category hub} › {shortName}.
 * A hub page is Home › {shortName}. Used by the Breadcrumbs component AND the
 * BreadcrumbList JSON-LD, so both always match.
 */
export function getBreadcrumbs(slug: string): Crumb[] {
  const tool = getTool(slug);
  const content = getToolContent(slug);
  if (!tool || !content) return [{ label: 'Home', href: '/' }];
  const crumbs: Crumb[] = [{ label: 'Home', href: '/' }];
  const hub = getCategoryHub(tool.category);
  if (hub && hub.slug !== slug) {
    crumbs.push({ label: categoryLabels[tool.category], href: `/${hub.slug}` });
  }
  crumbs.push({ label: content.shortName });
  return crumbs;
}

/** A live tool together with its content. Throws if content is missing. */
export function getLiveToolPage(slug: string): { tool: ToolDefinition; content: ToolContent } {
  const tool = getTool(slug);
  if (!tool || tool.status !== 'live') throw new Error(`No live tool with slug "${slug}"`);
  const content = getToolContent(slug);
  if (!content) throw new Error(`Live tool "${slug}" has no content in content/pages/`);
  return { tool, content };
}

/**
 * Build-time check: every live tool has a content file, and every `related`
 * slug points to a live tool. Called from generateStaticParams, so a missing
 * file fails `npm run build`.
 */
export function assertLiveToolsHaveContent(): void {
  const problems: string[] = [];
  const live = new Set(getLiveTools().map((t) => t.slug));
  const slugs = new Set(tools.map((t) => t.slug));
  if (slugs.size !== tools.length) problems.push('Duplicate slugs in lib/tools/registry.ts');

  for (const slug of live) {
    const content = toolContent[slug];
    if (!content) {
      problems.push(`Live tool "${slug}" has no content (add content/pages/${slug}.ts)`);
      continue;
    }
    for (const rel of content.related) {
      if (!live.has(rel)) problems.push(`"${slug}" links to "${rel}", which is not a live tool`);
    }
  }
  if (problems.length) {
    throw new Error(`Content check failed:\n- ${problems.join('\n- ')}`);
  }
}
