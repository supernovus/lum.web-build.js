/**
 * Utilities for building web apps.
 * @module @lumjs/web-build/utils
 */

/**
 * Return a stringified number padded with 0s to be a certain length.
 * @param {number} num - The number to pad.
 * @param {number} [ps=2] Padding size (default: `2`).
 * @returns {string}
 */
export const pad = (num, ps = 2) => num.toString().padStart(ps, '0');

const vid = (...parts) => parts.join('.');

const idf = {
  dateCode(dt) {
    let month = dt.getMonth();
    let day = dt.getDate();
    if (month === 0) {
      return day.toString();
    }
    return month.toString() + pad(day);
  },

  timeCode(dt) {
    let hours = dt.getHours();
    let mins = dt.getMinutes();
    if (hours === 0) {
      return mins.toString();
    }
    return hours.toString() + pad(mins);
  },
}

const ids = {

  v3: {
    parse(year, date, time) {
      let month, day;

      switch (date.length) {
        case 1:
        case 2:
          month = 0;
          day = date;
          break;
        case 3:
        case 4:
          let lin = date.length - 2;
          month = date.substring(0,lin);
          day = date.substring(lin);
          break;
        default:
          throw new RangeError('Invalid Date code in DateId v3 string');
      }
      
      return ids.v4.parse(year, month, day, time);
    },

    stringify(dt) {
      return vid(
        dt.getFullYear(),
        idf.dateCode(dt),
        idf.timeCode(dt),
      );
    },
  },

  v4: {
    parse(year, month, day, time) {
      let hour, min;

      switch (time.length) {
        case 1:
        case 2: 
          hour = 0;
          min = time;
          break;
        case 3:
        case 4:
          let lin = time.length - 2;
          hour = time.substring(0,lin);
          min = time.substring(lin);
          break;
        default:
          throw new RangeError('Invalid Time code in DateId string');
      }

      return ids.v6.parse(year, 0+month+1, day, hour, min, '00');
    },

    stringify(dt) {
      return vid(
        dt.getFullYear(),
        dt.getMonth(),
        dt.getDate(),
        idf.timeCode(),
      );
    },
  },

  v6: {
    parse(year, month, day, hour, min, sec) {
      let date = [year, pad(month), pad(day)].join('-');
      let time = [pad(hour), pad(min), pad(sec)].join(':');
      return date+'T'+time+'Z';
    },

    stringify(dt) {
      return vid(
        dt.getFullYear(),
        dt.getMonth() + 1,
        dt.getDate(),
        dt.getHours(),
        dt.getMinutes(),
        dt.getSeconds(),
      );
    },
  },
}

/**
 * Parse a DateId string as produced by one of the
 * `id` properties in a WrappedDate object.
 * 
 * @param {string} id - A DateId string.
 * @returns {module:@lumjs/web-build/utils~WrappedDate}
 * @throws {TypeError} If id is not a string.
 * @throws {RangeError} If id cannot be parsed as a valid DateId string.
 */
export function parseDateId(id) {
  if (typeof id !== 'string') {
    throw new TypeError('Invalid DateId string');
  }

  let parts = id.split('.');
  let vf = 'v'+parts.length;

  if (!ids[vf]) {
    throw new RangeError('Invalid DateId string format');
  }

  let dtxt = ids[vf].parse(...parts);
  return wrapDate(dtxt);
}

/**
 * Create a wrapped Date object.
 * @param {(Date|string|number)} [dt] Date to wrap.
 * 
 * If this is not a Date object already, it will be used as the
 * constructor argument to create one. If you omit this argument,
 * the wrapped date will be for *now*.
 * 
 * @returns {module:@lumjs/web-build/utils~WrappedDate}
 */
export function wrapDate(dt) {
  if (typeof dt === 'string' || typeof dt === 'number') {
    dt = new Date(dt);
  }
  else if (!(dt instanceof Date)) {
    dt = new Date();
  }

  let id = {
    toJSON() {
      return this.v3;
    },

    toString() {
      return this.v3;
    },
  }

  for (let vf in ids) {
    Object.defineProperty(id, vf, {
      get() {
        return ids[vf].stringify(dt);
      }
    })
  }

  return {
    dateTime: dt,
    id,
    get year() { return dt.getFullYear(); },
    get month() { return pad(dt.getMonth() + 1); },
    get day() { return pad(dt.getDate()); },
    get hour() { return pad(dt.getHours()); },
    get minute() { return pad(dt.getMinutes()); },
    get second() { return pad(dt.getSeconds()); },
  };
}

/**
 * @typedef {object} module:@lumjs/web-build/utils~WrappedDate
 * @prop {Date} dateTime - The Date object being wrapped.
 * @prop {string} year - The full year.
 * @prop {string} month - The 2-digit month (`01..12`).
 * @prop {string} day - The 2-digit day of the month (`01..31`).
 * @prop {string} hour - The 2-digit hour (`00..23`).
 * @prop {string} minute - The 2-digit minute (`00..59`).
 * @prop {string} second - The 2-digit second (`00..59`).
 * @prop {module:@lumjs/web-build/utils~DateIds} id
 */

/**
 * Date-based strings that can be used for revision codes,
 * or other version-like strings based on the build date/time.
 * 
 * In all examples we're using `2026-02-09T11:08:21` as the build date.
 * 
 * @typedef {object} module:@lumjs/web-build/utils~DateIds
 * 
 * @prop {string} v3 - `year.dateCode.timeCode`
 * 
 * - year is 4 digits.
 * - dateCode will be 1 to 4 digits;
 *   - 1 or 2: dateCode is the unpadded day, month is `0` (January).
 *   - 3 or 4: last 2 digits are the day, first `len-2` are the month.
 *   - month is 0-indexed (i.e. `0..11`).
 * - timeCode will be 1 to 4 digits;
 *   - 1 or 2: timeCode is the unpadded minutes, hour is `0` (midnight).
 *   - 3 or 4: last 2 digits are the minutes, first `len-2` are the hour.
 * - NOTE: seconds are ignored, will be set to `0` when parsing.
 * 
 * Example: `2026.109.1108`
 * 
 * This is the default format used if `wrappedDate.id` is used in a string
 * context or passed to JSON.stringify(); it's just plain simple.
 * 
 * @prop {string} v4 - `year.month.day.timeCode`
 *
 * - year is 4 digits.
 * - month is unpadded, 0-indexed (i.e. `0..11`).
 * - day is unpadded.
 * - timeCode is identical to v3; see v3 note about seconds.
 * 
 * Example: `2026.1.9.1108`
 * 
 * @prop {string} v6 - `year.month.day.hour.minute.second`
 * 
 * - year is 4 digits.
 * - month is unpadded, 1-indexed (i.e. `1..12`).
 * - day, hour, minute, and second are all unpadded.
 * 
 * Example: `2026.2.9.11.8.21`
 * 
 * While this has the most dotted components, it's the simplest
 * to generate (no funky logic required) and to parse (for the same reason).
 * 
 */
