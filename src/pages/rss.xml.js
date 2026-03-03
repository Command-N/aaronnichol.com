import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const links = await getCollection('links', ({ data }) => !data.draft);

  const allItems = [
    ...posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description || '',
      link: `/posts/${post.id.replace(/\.md$/, '')}/`,
    })),
    ...links.map((link) => ({
      title: `↗ ${link.data.title}`,
      pubDate: link.data.date,
      description: `Link: ${link.data.url}`,
      link: `/links/${link.id.replace(/\.md$/, '')}/`,
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'Your Name', // Change this
    description: 'Writing about agentic AI, enterprise technology, and building things.', // Change this
    site: context.site,
    items: allItems,
  });
}
