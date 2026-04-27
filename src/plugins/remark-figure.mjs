/**
 * Remark plugin that transforms standalone images into <figure> elements.
 *
 * In markdown:   ![Caption text](https://images.aaronnichol.com/2026/04/slug/photo.webp)
 * Rendered HTML: <figure><img src="..." alt="Caption text" /><figcaption>Caption text</figcaption></figure>
 *
 * Only transforms images that are the sole content of a paragraph (i.e. on
 * their own line, not inline with text). Images without alt text still get
 * wrapped in <figure> for consistent styling, but skip the <figcaption>.
 */

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function remarkFigure() {
  return (tree) => {
    for (let i = 0; i < tree.children.length; i++) {
      const node = tree.children[i];

      if (
        node.type === 'paragraph' &&
        node.children.length === 1 &&
        node.children[0].type === 'image'
      ) {
        const { url, alt, title } = node.children[0];
        const src = escapeHtml(url);
        const escapedAlt = alt ? escapeHtml(alt) : '';

        let html = '<figure>';
        html += `<img src="${src}" alt="${escapedAlt}"`;
        if (title) html += ` title="${escapeHtml(title)}"`;
        html += ' />';
        if (alt) {
          html += `<figcaption>${escapedAlt}</figcaption>`;
        }
        html += '</figure>';

        tree.children[i] = { type: 'html', value: html };
      }
    }
  };
}
