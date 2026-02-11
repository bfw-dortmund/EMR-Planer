function dateOfEaster(tpd) {
    const year = tpd.year;

    const a = year % 19,
        b = Math.floor(year / 100),
        c = year % 100,
        d = Math.floor(b / 4),
        e = b % 4,
        f = Math.floor((b + 8) / 25),
        g = Math.floor((b - f + 1) / 3),
        h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4),
        k = c % 4,
        l = (32 + 2 * e + 2 * i - h - k) % 7,
        m = Math.floor((a + 11 * h + 22 * l) / 451),
        month = Math.floor((h + l - 7 * m + 114) / 31),
        day = (h + l - 7 * m + 114) % 31;

    return Temporal.PlainDate.from({ year: year, month: month, day: day + 1 });
}

// get day of week (MO = 0)
const getd = (int) => Math.trunc(int / 1440);

// get hours
const geth = (int) => Math.trunc(int % 1440 / 60);

// get minutes
const getm = (int) => int % 60;

// parse string to integer of minutes
const getn = (str) => {
    console.assert(str.length === 8);

    str = str.toUpperCase();

    if (/^(MO|DI|MI|DO|FR) ([01][0-9]|[2][0-3]):([0-5][0-9])$/.test(str)) {

        return ['MO', 'DI', 'MI', 'DO', 'FR']
            .indexOf(str.substring(0, 2)) * 1440
            + parseInt(str.substring(3, 5)) * 60
            + parseInt(str.substring(6, 8));
    }
    return null;
}

// convert integer to text representation
const gett = (int) => {
    console.assert(0 <= int && int < 7200);

    return ['MO', 'DI', 'MI', 'DO', 'FR'][getd(int)].concat(
        ' ', '00'.concat(geth(int)).slice(-2),
        ':', '00'.concat(getm(int)).slice(-2)
    );
}

// padding like 02d
const pad2 = (num) => `0${num}`.slice(-2);

// Test
if (0) {
    const s = 'FR 03:59';
    const a = getn(s);
    console.assert(gett(a) === s.toUpperCase());
}
