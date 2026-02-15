const main = async (event) => {

    const durations = {
        checkup: 90,
        report: 90,
        test: 60
    }

    const berta = await dberta.open('emr-planer-db', {
        1: {
            strings: "@id",
            appointments: ", time, usernumber, field, staffnumber, task, active",
            settings: ", name"
        }
    });

    async function loadData() {
        const tx = await berta.read('strings', 'appointments', 'settings');

        tx.strings.getAll().then(arr => {
            arr.forEach(entry => {
                data.elements[entry.id].value = entry.value;
            });
        });

        const appointmentKeys = await tx.appointments.getAllKeys();

        appointmentKeys.forEach(id => {
            tx.appointments.get(id)
                .then(entry => data.elements[id].value = gett(entry.time));
        });

        const settingsKeys = await tx.settings.getAllKeys();

        settingsKeys.forEach(id => {
            tx.settings.get(id)
                .then(entry => {
                    const [kind, type, _] = id.split('-');

                    switch (type) {
                        case 'week':
                            data.elements[id].valueAsNumber = entry.valueAsNumber;
                            break;
                        case 'radio':
                        case 'checkbox':
                            data.elements[id].checked = entry.checked;
                            break;
                        default:
                            console.error('unknown type: ', type)
                    }
                });
        });
    }

    async function write(store, id, value) {
        const tx = await berta.write(store);

        if (value) {
            return tx[store].put(value, id);
        } else {
            return tx[store].delete(id);
        }
    }

    async function reset() {
        const tx = await berta.write('appointments');
        await tx.appointments.clear();
    }

    async function query() {
        const tx = await berta.read('appointments');
        const count = parseInt(data.elements.participant.value);
        const map = new Map();

        for (const n of [...Array(count).keys()].map(i => i + 1)) {
            const res = await tx.appointments.queryAnd('usernumber', n, 'active', 'true');

            map.set(n, res.sort((a, b) => a.time - b.time));

        }


        console.log(map)

    }

    async function render() {
        console.dir(data.elements.week.valueAsNumber)
        
        const instant = new Date(data.elements.week.valueAsNumber).toTemporalInstant();
        const zdt = instant.toZonedDateTimeISO("UTC");
        let date = zdt.toPlainDate();

        document.querySelectorAll('output.render-week-monday').forEach(output => {
            output.value = dateOrHoliday(date);
        })

        date = date.add({days: 1});

        document.querySelectorAll('output.render-week-tuesday').forEach(output => {
            output.value = dateOrHoliday(date);
        })
    }

    async function validate() {
        const tx = await berta.read('appointments');
        const keys = await tx.appointments.getAllKeys();

        const map = new Map();

        for (const key of keys) {
            map.set(key, await tx.appointments.get(key));
        }

        map.forEach((value1, key1) => {

            // reset validity
            data.elements[key1].setCustomValidity('');

            // disabled entries are skipped
            if (!value1.active) return;

            // compare each entry with each entry
            map.forEach((value2, key2) => {

                // disabled entries are skipped
                if (!value2.active) return;

                if ((key1 !== key2)                                         // do not compare it with itself
                    && ((value1.usernumber === value2.usernumber)           // only for the same usernumber OR
                        || (
                            (value1.field === value2.field)                 // only for the same field AND
                            && (value1.staffnumber === value2.staffnumber)  // only for the same staffnumber
                        )
                    )
                ) {
                    const
                        start1 = value1.time,
                        end1 = value1.time + durations[value1.task],
                        start2 = value2.time,
                        end2 = value2.time + durations[value2.task];

                    // https://stackoverflow.com/a/3269471
                    if ((start1 < end2) && (start2 < end1)) {
                        data.elements[key1].setCustomValidity('time');
                    }
                }
            });
        });
    }

    const tbody = document.querySelector("tbody");
    const placeholder = 'TT hh:mm';

    // empty oder pattern is valid
    const pattern = new RegExp('(?:(?i:MO|DI|MI|DO|FR) [01][0-9]:[0-5][0-9]){0,1}');

    for (let n = 1; n <= 10; n++) {

        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td><input id="username-user-${n}"></td>
                <td><input id="appointment-user-${n}-physician-1-checkup" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-physician-2-checkup" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-physician-3-checkup" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-psychologist-1-test" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-psychologist-1-report" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-psychologist-2-test" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-psychologist-2-report" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-psychologist-3-test" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-psychologist-3-report" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-psychologist-4-test" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-psychologist-4-report" pattern="${pattern.source}" placeholder="${placeholder}"></td>
            </tr>
            `);
    }

    const section = document.querySelector('section');

    for (let n = 1; n <= 10; n++) {

        section.insertAdjacentHTML('beforeend', `
            <article>
                <header>
                    <h2>Termine für <output id="output-username-${n}">${n}</output></h2>
                </header>
                <h3><output class="render-week-monday"></output></h3>
                <dl>
                    <dt>bla</dt>
                    <dd>blub</dd>
                    <dt>bla</dt>
                    <dd>blub</dd>
                </dl>
                <h3><output class="render-week-tuesday"></output></h3>
                <h3><output class="render-week-wednesday"></output></h3>
                <h3><output class="render-week-thursday"></output></h3>
                <h3><output class="render-week-friday"></output></h3>
            </article>
            `);
    }

    data.oninput = async (event) => {
        const [kind, data] = event.target.id.split('-');

        switch (kind) {
            case 'editable':
                write('strings', { id: event.target.id, value: event.target.value });
                break;

            case 'appointment':
                event.target.setCustomValidity(
                    pattern.test(event.target.value) ? "" : "time"
                )
                break;
        }
    }

    data.onchange = async (event) => {
        const [kind, ...data] = event.target.id.split('-');

        switch (kind) {
            case 'settings':
                const [type, field, staffnumber] = data;
                const value = {}

                switch (type) {
                    case 'week':
                        await write('settings',
                            event.target.id,
                            isNaN(event.target.valueAsNumber) ? null : {
                                valueAsNumber: event.target.valueAsNumber
                            });
                        return;

                    case 'radio':
                        const tx = await berta.write('settings', 'appointments');

                        tx.settings.deleteAnd('name', event.target.name)
                            .then(() => {
                                return tx.settings.put({
                                    name: event.target.name,
                                    checked: true
                                }, event.target.id)
                            })
                            .then(() => {
                                return tx.appointments.updateAnd('usernumber', dberta.le(parseInt(event.target.value)), {
                                    active: true
                                });
                            })
                            .then(() => {
                                return tx.appointments.updateAnd('usernumber', dberta.gt(parseInt(event.target.value)), {
                                    active: false
                                });
                            })
                            .then(() => validate());
                        return;

                    case 'checkbox':
                        value.checked = event.target.checked
                        break;
                    default:
                        console.error('unknown type: ', type)
                }

                const result = await write('settings', event.target.id, value);

                if (result === event.target.id) {
                    const tx = await berta.write('appointments');

                    const r = await tx.appointments.updateAnd('field', field, 'staffnumber', staffnumber, {
                        active: event.target.checked
                    });

                    validate();
                } else {
                    console.error('result === event.target.id')
                }
                break;

            case 'username':
                if (event.target.validity.valid) {
                    //TODO write('strings', { id: event.target.id, value: event.target.value });
                }
                break;

            case 'appointment':
                if (event.target.validity.valid) {
                    const [_, usernumber, field, staffnumber, task] = data;
                    const result = await write('appointments',
                        event.target.id,
                        event.target.value ? {
                            active: true,
                            time: getn(event.target.value),
                            usernumber: parseInt(usernumber),
                            staffnumber: parseInt(staffnumber),
                            field: field,
                            task: task
                        } : null
                    );
                    validate();
                    // result is the key for the new or updated record
                    /*                     if (result === event.target.id) {
                                            
                                        } else {
                                            console.error('result === event.target.id')
                                        } */

                } else console.error(event.target.value)
                break;
        }
    }

    await loadData();
    await validate();
    render();

    btnValidate.addEventListener('click', function (e) {
        validate()
    });

    btnQuery.addEventListener('click', function (e) {
        query()
    });

    btnReset.addEventListener('click', function (e) {
        reset()
    });

}

addEventListener('load', main);