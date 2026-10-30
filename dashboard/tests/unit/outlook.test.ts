import { describe, expect, it } from 'vitest';
import { buildOutlookCompose, DEFAULT_COMPOSE_BASE, encodeComposeValue, wordCount } from '../../shared/outlook';

describe('Outlook compose link', () => {
  it('encodes to, subject and body', () => {
    const l = buildOutlookCompose({ to: 'a.b@nvidia.com', subject: 'PIM & ECC: 2027?', body: 'Hi Dr. Lee,\nThanks!' });
    expect(l.url.startsWith(`${DEFAULT_COMPOSE_BASE}?`)).toBe(true);
    const u = new URL(l.url);
    expect(u.searchParams.get('to')).toBe('a.b@nvidia.com');
    expect(u.searchParams.get('subject')).toBe('PIM & ECC: 2027?');
    expect(u.searchParams.get('body')).toBe('Hi Dr. Lee,\r\nThanks!');
    expect(l.bodyIncluded).toBe(true);
    expect(l.url).not.toMatch(/[ \n]/);
    expect(l.url).toContain('subject=PIM%20%26%20ECC%3A%202027%3F');
  });

  it('turns every kind of line break into CRLF', () => {
    expect(encodeComposeValue('a\nb\r\nc\rd')).toBe('a%0D%0Ab%0D%0Ac%0D%0Ad');
  });

  it('encodes unicode, plus signs and hashes', () => {
    const l = buildOutlookCompose({ to: 'x@y.org', subject: 'Résumé + Notes #1', body: 'naïve — ok' });
    const u = new URL(l.url);
    expect(u.searchParams.get('subject')).toBe('Résumé + Notes #1');
    expect(u.searchParams.get('body')).toBe('naïve — ok');
    expect(l.url).not.toContain('#');
  });

  it('leaves the body out when the link would be too long', () => {
    const body = 'word '.repeat(600);
    const l = buildOutlookCompose({ to: 'x@y.org', subject: 'Hello', body }, { maxLength: 2000 });
    expect(l.bodyIncluded).toBe(false);
    expect(l.url).not.toContain('body=');
    expect(new URL(l.url).searchParams.get('subject')).toBe('Hello');
    expect(l.length).toBe(l.url.length);
    expect(l.length).toBeLessThanOrEqual(2000);
    const fits = buildOutlookCompose({ to: 'x@y.org', subject: 'Hello', body }, { maxLength: 100000 });
    expect(fits.bodyIncluded).toBe(true);
  });

  it('uses a configured base URL and skips empty fields', () => {
    const l = buildOutlookCompose({ to: '', subject: 'S', body: '' }, { base: 'https://outlook.office365.com/mail/deeplink/compose' });
    expect(l.url).toBe('https://outlook.office365.com/mail/deeplink/compose?subject=S');
    expect(l.bodyIncluded).toBe(false);
  });

  it('counts words', () => {
    expect(wordCount('  Hello   Dr. Lee,\nthanks  ')).toBe(4);
    expect(wordCount('')).toBe(0);
  });
});
