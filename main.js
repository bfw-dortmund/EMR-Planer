const main = async (event) => {

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

        const res = await tx.appointments.queryAnd('usernumber', 1, 'active', 'true');

        res.sort((a, b) => a.time - b.time)
        console.log(res)
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
                    // TODO session durations
                    if (value1.time === value2.time) {
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

    for (let n = 10; n > 0; n--) {

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

    loadData();
    validate();

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