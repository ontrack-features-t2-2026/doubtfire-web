import {describe, expect, it} from 'vitest';
import {MarkedPipe} from './marked.pipe';

describe('MarkedPipe', () => {
  it('create an instance', () => {
    const pipe = new MarkedPipe();
    expect(pipe).toBeTruthy();
  });

  // The pipe used to replace every newline with <br /> before marked.parse ran, so
  // the parser only ever saw a single line and block markdown (code fences, lists)
  // was destroyed. These assert the block structures now survive.
  it('renders a fenced code block as <pre>', () => {
    const html = new MarkedPipe().transform('```\ncode line\n```');
    expect(html).toContain('<pre>');
    expect(html).toContain('code line');
  });

  it('renders a dash list as a <ul> with two <li>', () => {
    const html = new MarkedPipe().transform('- a\n- b');
    expect(html).toContain('<ul>');
    expect((html.match(/<li>/g) || []).length).toBe(2);
  });

  it('still renders a soft newline as a single <br>', () => {
    const html = new MarkedPipe().transform('line1\nline2');
    expect((html.match(/<br\s*\/?>/g) || []).length).toBe(1);
    expect(html).toContain('line1');
    expect(html).toContain('line2');
  });
});
