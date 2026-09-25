import { describe, it, expect } from 'vitest';
import { assertDatetimeMatchesTimezone } from './scheduledFor.js';

describe('assertDatetimeMatchesTimezone', () => {
  it('does not throw when timezone is omitted', () => {
    expect(() =>
      assertDatetimeMatchesTimezone('2027-01-15T10:00:00Z', undefined),
    ).not.toThrow();
  });

  it('does not throw when the offset agrees with the timezone', () => {
    expect(() =>
      assertDatetimeMatchesTimezone(
        '2027-03-01T10:00:00-07:00',
        'America/Denver',
      ),
    ).not.toThrow();
  });

  it('does not throw across a DST boundary when the offset is correct for that instant', () => {
    expect(() =>
      assertDatetimeMatchesTimezone(
        '2028-10-05T15:00:00-06:00',
        'America/Denver',
      ),
    ).not.toThrow();
  });

  it('does not throw for UTC', () => {
    expect(() =>
      assertDatetimeMatchesTimezone('2027-01-15T10:00:00Z', 'UTC'),
    ).not.toThrow();
  });

  it('does not throw for non-integer-hour offsets', () => {
    expect(() =>
      assertDatetimeMatchesTimezone(
        '2027-01-15T10:00:00+05:30',
        'Asia/Kolkata',
      ),
    ).not.toThrow();
  });

  it('throws when a UTC datetime is paired with a non-UTC timezone', () => {
    expect(() =>
      assertDatetimeMatchesTimezone(
        '2027-01-15T10:00:00Z',
        'America/New_York',
      ),
    ).toThrow(/does not match timezone/);
  });

  it('throws when the encoded offset does not match the timezone at that instant', () => {
    expect(() =>
      assertDatetimeMatchesTimezone(
        '2027-03-01T10:00:00-06:00',
        'America/Denver',
      ),
    ).toThrow(/does not match timezone/);
  });
});
