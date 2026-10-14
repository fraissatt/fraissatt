// Shared helpers for SVG tests.

// Minimal tag-balance check: every opening tag is self-closed or has a matching closing tag.
export function isBalanced(svg) {
  const stack = [];
  for (const [, closing, name, , selfClosing] of svg.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g)) {
    if (selfClosing) continue;
    if (!closing) stack.push(name);
    else if (stack.pop() !== name) return false;
  }
  return stack.length === 0;
}

export const count = (text, needle) => text.split(needle).length - 1;

export const HAS_SCRIPT_OR_EXTERNAL = /<script|<foreignObject|(?:href|src)="https?:/i;
