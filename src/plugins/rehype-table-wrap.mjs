export function rehypeTableWrap() {
  function walk(node) {
    if (!node.children) return;
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (child.type === 'element' && child.tagName === 'table') {
        node.children[i] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-wrapper'] },
          children: [child],
        };
      } else {
        walk(child);
      }
    }
  }
  return (tree) => walk(tree);
}
