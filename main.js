const main = async (event) => {

    const berta = await dberta.open('emr-planer-db', {
        1: {
            strings: "@id",
            appointments: ", time, user, type"
        }
    });

    async function loadData() {
        const tx = await berta.read('strings', 'appointments');

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
    }

    async function write(store, id, value) {
        const tx = await berta.write(store);

        if (value) {
            return tx[store].put(value, id);
        } else {
            return tx[store].delete(id);
        }
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

            // compare each entry with each entry
            map.forEach((value2, key2) => {
                if ((key1 !== key2) // do not compare it with itself
                    && ((value1.user === value2.user) // only for the same user OR
                        || (value1.type === value2.type))) { // only for the same type

                    if (value1.time === value2.time) {
                        data.elements[key1].setCustomValidity('time');
                    }
                }
            });
        });
    }

    const tbody = document.querySelector("tbody");
    const placeholder = 'TT hh:mm';
    const pattern = new RegExp('(?i:MO|DI|MI|DO|FR) [01][0-9]:[0-5][0-9]');

    for (let n = 1; n < 11; n++) {

        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td><input id="username-user-${n}"></td>
                <td><input id="appointment-user-${n}-med-1" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-med-2" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-med-3" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-test-1" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-report-1" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-test-2" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-report-2" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-test-3" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-report-3" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-test-4" pattern="${pattern.source}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user-${n}-report-4" pattern="${pattern.source}" placeholder="${placeholder}"></td>
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
            case 'username':
                if (event.target.validity.valid) {
                    write('strings', { id: event.target.id, value: event.target.value });
                }
                break;

            case 'appointment':
                if (event.target.validity.valid) {
                    const [user, unum, type, tnum] = data;
                    const result = await write('appointments',
                        event.target.id,
                        event.target.value ? {
                            time: getn(event.target.value),
                            user: user + unum,
                            type: type + tnum
                        } : null
                    );

                    validate();
                } else console.error(event.target.value)
                break;
        }
    }

    loadData();
    validate();

    btnValidate.addEventListener('click', function (e) {
        validate()
    });
}

addEventListener('load', main);