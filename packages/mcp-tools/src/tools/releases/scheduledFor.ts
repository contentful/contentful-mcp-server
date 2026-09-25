/**
 * Extracts the UTC offset (in minutes) encoded in an ISO 8601 datetime string,
 * e.g. '2027-01-15T10:00:00Z' -> 0, '2027-01-15T10:00:00-06:00' -> -360.
 */
function getEncodedOffsetMinutes(datetime: string): number {
  const match = datetime.match(/(Z|[+-]\d{2}:\d{2})$/);
  if (!match) {
    throw new Error(`Unable to parse UTC offset from datetime '${datetime}'`);
  }
  if (match[1] === 'Z') {
    return 0;
  }
  const sign = match[1][0] === '-' ? -1 : 1;
  const [hours, minutes] = match[1].slice(1).split(':').map(Number);
  return sign * (hours * 60 + minutes);
}

/**
 * Computes the actual UTC offset (in minutes) for an IANA timezone at the
 * instant described by `datetime`, accounting for DST.
 */
function getActualOffsetMinutes(datetime: string, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  }).formatToParts(new Date(datetime));

  const offsetPart = parts.find((part) => part.type === 'timeZoneName');
  const match = offsetPart?.value.match(/^GMT([+-]\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Unable to resolve UTC offset for timezone '${timezone}'`);
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return (hours < 0 ? -1 : 1) * (Math.abs(hours) * 60 + minutes);
}

/**
 * Validates that a `datetime` with an explicit UTC offset and an optional
 * `timezone` agree on the same instant. Passing a conflicting pair (e.g.
 * datetime in 'Z' with timezone 'America/New_York') would otherwise be sent
 * to the API as-is, producing a scheduled action with ambiguous, inconsistent
 * `scheduledFor` fields.
 */
export function assertDatetimeMatchesTimezone(
  datetime: string,
  timezone: string | undefined,
): void {
  if (!timezone) {
    return;
  }

  const encodedOffset = getEncodedOffsetMinutes(datetime);
  const actualOffset = getActualOffsetMinutes(datetime, timezone);

  if (encodedOffset !== actualOffset) {
    throw new Error(
      `datetime '${datetime}' has a UTC offset that does not match timezone '${timezone}' at that instant. ` +
        `Either omit timezone, or provide a datetime whose offset agrees with it.`,
    );
  }
}
