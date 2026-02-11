const main = async (event) => {

    const berta = await dberta.open('emr-planer-db', {
        1: {
            strings: "@id",
            appointments: "@id, time, user, type"
        }
    });

    async function loadData() {
        const tx = await berta.read('strings', 'appointments');

        tx.strings.getAll().then(arr => {
            arr.forEach(entry => {
                data.elements[entry.id].value = entry.value;
            });
        });

        tx.appointments.getAll().then(arr => {
            arr.forEach(entry => {
                data.elements[entry.id].value = gett(entry.time);
            });
        })
    }

    async function write(store, value) {
        const tx = await berta.write(store);

        if (value) {
            return tx[store].put(value);
        } else {
            return tx[store].delete(id);
        }
    }

    const tbody = document.querySelector("tbody");
    const placeholder = 'TT hh:mm';
    const pattern = '(?i:MO|DI|MI|DO|FR) [01][0-9]:[0-5][0-9]';

    for (let n = 1; n < 11; n++) {

        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td><input id="username-user${pad2(n)}"></td>
                <td><input id="appointment-user${pad2(n)}-med01" pattern="${pattern}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user${pad2(n)}-med02" pattern="${pattern}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user${pad2(n)}-med03" pattern="${pattern}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user${pad2(n)}-test1" pattern="${pattern}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user${pad2(n)}-report1" pattern="${pattern}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user${pad2(n)}-test2" pattern="${pattern}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user${pad2(n)}-report2" pattern="${pattern}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user${pad2(n)}-test3" pattern="${pattern}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user${pad2(n)}-report3" pattern="${pattern}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user${pad2(n)}-test4" pattern="${pattern}" placeholder="${placeholder}"></td>
                <td><input id="appointment-user${pad2(n)}-report4" pattern="${pattern}" placeholder="${placeholder}"></td>
            </tr>
            `);
    }

    data.oninput = async (event) => {
        const [kind, data] = event.target.id.split('-');

        switch (kind) {
            case 'editable':
                write('strings', { id: event.target.id, value: event.target.value });
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
                    const time = getn(event.target.value);
                    const [user, type] = data;

                    const result = await write('appointments',
                        event.target.value
                            ? {
                                id: event.target.id,
                                time: time,
                                user: user,
                                type: type
                            }
                            : null
                    );

                    // TODO
                    if (result === event.target.id) {
                        const tx = await berta.read('appointments');

                        console.log(await tx.appointments.queryAnd('user', user, 'time', dberta.between(time, time+100)))
                    }
                }
                break;
        }
    }

    loadData();
}

addEventListener('load', main);