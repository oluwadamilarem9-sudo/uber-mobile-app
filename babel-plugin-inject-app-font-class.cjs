/**
 * Ensures every `Text` / `TextInput` gets `font-sans` so loaded Inter applies on native + web.
 * NativeWind does not cascade font-family from parent Views.
 */
module.exports = function injectAppFontClass({ types: t }) {
  const PREFIX = 'font-sans ';

  return {
    name: 'inject-app-font-class',
    visitor: {
      JSXOpeningElement(path) {
        const el = path.node.name;
        if (el.type !== 'JSXIdentifier') return;
        if (el.name !== 'Text' && el.name !== 'TextInput') return;

        const classAttr = path.node.attributes.find(
          (a) =>
            a.type === 'JSXAttribute' &&
            a.name.type === 'JSXIdentifier' &&
            a.name.name === 'className',
        );

        if (!classAttr) {
          path.node.attributes.push(
            t.jsxAttribute(t.jsxIdentifier('className'), t.stringLiteral('font-sans')),
          );
          return;
        }

        const v = classAttr.value;
        if (!v) return;

        if (v.type === 'StringLiteral') {
          if (v.value.includes('font-sans')) return;
          v.value = PREFIX + v.value;
          return;
        }

        if (v.type === 'JSXExpressionContainer') {
          const expr = v.expression;
          if (expr.type === 'TemplateLiteral' && expr.quasis.length > 0) {
            const first = expr.quasis[0];
            const raw = first.value.raw;
            if (raw.includes('font-sans')) return;
            first.value.raw = PREFIX + raw;
            first.value.cooked = PREFIX + (first.value.cooked ?? raw);
          }
        }
      },
    },
  };
};
