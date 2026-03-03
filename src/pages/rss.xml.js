import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const links = await getCollection('links', ({ data }) => !data.draft);

  function entryUrl(entry) {
    const date = entry.data.date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const slug = entry.id.replace(/\.md$/, '');
    return `/${year}/${month}/${slug}/`;
  }

  const allItems = [
    ...posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description || '',
      link: entryUrl(post),
    })),
    ...links.map((link) => ({
      title: `↗ ${link.data.title}`,
      pubDate: link.data.date,
      description: `Link: ${link.data.url}`,
      link: entryUrl(link),
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'Your Name', // Change this
    description: 'Writing about agentic AI, enterprise technology, and building things.', // Change this
    site: context.site,
    items: allItems,
  });
}
