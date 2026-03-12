import rss from '@astrojs/rss';
import { getCollection, render } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

export async function GET(context) {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const links = await getCollection('links', ({ data }) => !data.draft);

  const container = await AstroContainer.create();

  function permalinkUrl(entry) {
    const date = entry.data.date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const slug = entry.id.replace(/\.md$/, '');
    return new URL(`/${year}/${month}/${slug}/`, context.site).toString();
  }

  async function renderContent(entry) {
    const { Content } = await render(entry);
    return await container.renderToString(Content);
  }

  const postItems = await Promise.all(posts.map(async (post) => ({
    title: post.data.title,
    pubDate: post.data.date,
    description: post.data.description || '',
    link: permalinkUrl(post),
    content: await renderContent(post),
  })));

  const linkItems = await Promise.all(links.map(async (link) => ({
    title: link.data.title,
    pubDate: link.data.date,
    link: link.data.url,
    content: await renderContent(link),
  })));

  const allItems = [...postItems, ...linkItems]
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'Aaron Nichol',
    description: 'Writing about agentic AI, enterprise technology, and building things.',
    site: context.site,
    items: allItems,
    customData: `<language>en-au</language>`,
  });
}
