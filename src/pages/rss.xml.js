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

  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  function escapeXml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  const allEntries = [
    ...posts.map(p => ({ ...p, type: 'post' })),
    ...links.map(l => ({ ...l, type: 'link' })),
  ].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const updated = allEntries.length > 0
    ? allEntries[0].data.date.toISOString()
    : new Date().toISOString();

  const items = await Promise.all(allEntries.map(async (entry) => {
    const permalink = permalinkUrl(entry);
    const content = await renderContent(entry);
    const dateStr = entry.data.date.toISOString();
    const title = escapeXml(entry.data.title);

    if (entry.type === 'link') {
      const year = entry.data.date.getFullYear();
      const slug = entry.id.replace(/\.md$/, '');
      const tagId = `tag:aaronnichol.com,${year}:${slug}`;
      return `
  <entry>
    <title>${title}</title>
    <link href="${escapeAttr(permalink)}" rel="alternate" type="text/html"/>
    <link href="${escapeAttr(entry.data.url)}" rel="related" type="text/html"/>
    <id>${escapeXml(tagId)}</id>
    <published>${dateStr}</published>
    <updated>${dateStr}</updated>
    <content type="html"><![CDATA[${content}]]></content>
  </entry>`;
    }

    return `
  <entry>
    <title>${title}</title>
    <link href="${escapeAttr(permalink)}" rel="alternate" type="text/html"/>
    <id>${escapeXml(permalink)}</id>
    <published>${dateStr}</published>
    <updated>${dateStr}</updated>
    <content type="html"><![CDATA[${content}]]></content>
  </entry>`;
  }));

  const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Aaron Nichol</title>
  <subtitle>Writing about agentic AI, enterprise technology, and building things.</subtitle>
  <link href="${escapeAttr(new URL('rss.xml', context.site).toString())}" rel="self" type="application/atom+xml"/>
  <link href="${escapeAttr(context.site.toString())}" rel="alternate" type="text/html"/>
  <id>${escapeXml(context.site.toString())}</id>
  <updated>${updated}</updated>
  <author>
    <name>Aaron Nichol</name>
  </author>
  <language>en-au</language>${items.join('')}
</feed>`;

  return new Response(feed, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
    },
  });
}
