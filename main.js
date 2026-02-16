const main = async (event) => {

    const durations = {
        checkup: 90,
        report: 30,
        test: 90
    }

    const berta = await dberta.open('emr-planer-db', {
        1: {
            strings: "@id",
            appointments: ", time, user, staff, task, active",
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

        /*         const appointmentKeys = await tx.appointments.getAllKeys();
        
                appointmentKeys.forEach(id => {
                    tx.appointments.get(id)
                        .then(entry => data.elements[id].value = gett(entry.time));
                }); */
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
        const instant = new Date(data.elements.week.valueAsNumber).toTemporalInstant();
        const zdt = instant.toZonedDateTimeISO("UTC");
        let date = zdt.toPlainDate();

        document.querySelectorAll('h3.render-week-monday').forEach(elem => {
            elem.textContent = dateOrHoliday(date);
        })

        date = date.add({ days: 1 });

        document.querySelectorAll('h3.render-week-tuesday').forEach(elem => {
            elem.textContent = dateOrHoliday(date);
        })

        date = date.add({ days: 1 });

        document.querySelectorAll('h3.render-week-wednesday').forEach(elem => {
            elem.textContent = dateOrHoliday(date);
        })

        date = date.add({ days: 1 });

        document.querySelectorAll('h3.render-week-thursday').forEach(elem => {
            elem.textContent = dateOrHoliday(date);
        })

        date = date.add({ days: 1 });

        document.querySelectorAll('h3.render-week-friday').forEach(elem => {
            elem.textContent = dateOrHoliday(date);
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
            if (value1.active !== 'true') return;

            // compare each entry with each entry
            map.forEach((value2, key2) => {

                // disabled entries are skipped
                if (value2.active !== 'true') return;

                if ((key1 !== key2)
                    && ((value1.user === value2.user)
                        || (value1.staff === value2.staff))) {

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

    for (let n = 0; n < 10; n++) {

        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td><input class="username" id="username-user${n}" value="Teilnehmer ${n + 1}"></td>
                <td><input class="appointment" data-user="user${n}" data-staff="physician1" data-task="checkup"></td>
                <td><input class="appointment" data-user="user${n}" data-staff="physician2" data-task="checkup"></td>
                <td><input class="appointment" data-user="user${n}" data-staff="physician3" data-task="checkup"></td>
                <td><input class="appointment" data-user="user${n}" data-staff="physician1" data-task="test"></td>
                <td><input class="appointment" data-user="user${n}" data-staff="physician1" data-task="report"></td>
                <td><input class="appointment" data-user="user${n}" data-staff="physician2" data-task="test"></td>
                <td><input class="appointment" data-user="user${n}" data-staff="physician2" data-task="report"></td>
                <td><input class="appointment" data-user="user${n}" data-staff="physician3" data-task="test"></td>
                <td><input class="appointment" data-user="user${n}" data-staff="physician3" data-task="report"></td>
                <td><input class="appointment" data-user="user${n}" data-staff="physician4" data-task="test"></td>
                <td><input class="appointment" data-user="user${n}" data-staff="physician4" data-task="report"></td>
            </tr>
            `);
    }

    const section = document.querySelector('section');

    for (let n = 0; n < 10; n++) {

        section.insertAdjacentHTML('beforeend', `
            <article>
                <header>
                    <h2>Termine für <output for="username-user${n}"></output></h2>
                </header>
                <h3 class="render-week-monday"></h3>
                <dl>
                    <dt>bla</dt>
                    <dd>blub</dd>
                    <dt>bla</dt>
                    <dd>blub</dd>
                </dl>
                <h3 class="render-week-tuesday"></h3>
                <h3 class="render-week-wednesday"></h3>
                <h3 class="render-week-thursday"></h3>
                <h3 class="render-week-friday"></h3>
            </article>
            `);
    }

    function updateOutputs(target) {
        data.querySelectorAll(`output[for=${target.id}]`).forEach(output => {
            output.value = target.value;
        })
    }

    data.elements.week.addEventListener('change', async (event) => {
        // prevent invalid dates
        event.target.valueAsNumber = event.target?.valueAsNumber
            || Temporal.Now.instant().epochMilliseconds;

        await write('settings',
            event.target.id, {
            valueAsNumber: event.target.valueAsNumber
        });
    });

    data.querySelectorAll('.username').forEach(async (elem) => {

        elem.addEventListener('change', async (event) => {
            // prevent empty cells
            event.target.value = event.target?.value
                || event.target.defaultValue;

            await write('settings',
                event.target.id,
                event.target.value ? {
                    value: event.target.value
                } : null);
            updateOutputs(event.target);
        });
    });

    data.querySelectorAll('.staffname').forEach(async (elem) => {

        elem.id = 'staffname-' + Object.values(elem.dataset).join('-');

        elem.addEventListener('change', async (event) => {
            // prevent empty cells
            event.target.value = event.target?.value
                || event.target.defaultValue;

            await write('settings',
                event.target.id,
                event.target.value ? {
                    value: event.target.value
                } : null);
            updateOutputs(event.target);
        })

    });

    const tx = await berta.read('settings', 'appointments');
    const settingsKeys = await tx.settings.getAllKeys();

    settingsKeys.forEach(id => {
        tx.settings.get(id)
            .then(entry => {
                switch (true) {
                    case Object.hasOwn(entry, 'checked'):
                        data.elements[id].checked = entry.checked;
                        break;

                    case Object.hasOwn(entry, 'valueAsNumber'):
                        data.elements[id].valueAsNumber = entry.valueAsNumber;
                        break;

                    case Object.hasOwn(entry, 'value'):
                        data.elements[id].value = entry.value;
                        updateOutputs(data.elements[id]);
                        break;
                }
            })
    });


    data.querySelectorAll('.appointment').forEach(elem => {

        // update the <datalist>
        const updateList = async (target) => {

            const tx = await berta.read('appointments');
            const entries = await tx.appointments.where('active', 'true');

            Array.from(appointments.options).forEach(option => {

                option.removeAttribute('disabled');

                entries.forEach(entry => {

                    if ((entry.user === target.dataset.user)
                        || ((entry.staff === target.dataset.staff))) {
                        const
                            start1 = getn(option.value),
                            end1 = start1 + durations[target.dataset.task],
                            start2 = entry.time,
                            end2 = start2 + durations[entry.task];

                        if ((start1 < end2) && (start2 < end1)) {
                            option.setAttribute('disabled', true);
                        }
                    }
                });
            });
        }

        //console.log(Object.values(elem.dataset).join('-'))
        elem.id = 'appointment-' + Object.values(elem.dataset).join('-');

        // empty or pattern is valid
        elem.pattern = "(?:(?i:MO|DI|MI|DO|FR) [01][0-9]:[0-5][0-9]){0,1}";
        //elem.placeholder = '__ __:__'// 'TT HH:MM';

        // This is a read-only property so setAttribute()
        elem.setAttribute('list', 'appointments');

        // update appointments list early as possible
        elem.addEventListener('pointerenter', event => {
            updateList(event.target);
        });

        // store the current value as placeholder...
        elem.addEventListener('focus', event => {
            event.target.placeholder = event.target.value;
            event.target.value = '';
            updateList(event.target);
        });

        // ... set value back from placeholder
        elem.addEventListener('blur', event => {
            event.target.value = event.target.placeholder;
            event.target.placeholder = '';

            validate();
        });

        elem.addEventListener('keydown', async (event) => {
            if (event.key === 'Delete') {
                event.target.setCustomValidity('');
                event.target.placeholder = '';
                event.target.value = '';

                await write('appointments',
                    event.target.id,
                    null);
            }
        });

        elem.addEventListener('change', async (event) => {
            event.target.placeholder = event.target.value;

            await write('appointments',
                event.target.id,
                event.target.value ? {
                    active: 'true',
                    time: getn(event.target.value),
                    user: event.target.dataset.user,
                    staff: event.target.dataset.staff,
                    task: event.target.dataset.task
                } : null
            );

            validate();
        });
    });

    const appointmentKeys = await tx.appointments.getAllKeys();
    appointmentKeys.forEach(id => {
        tx.appointments.get(id)
            .then(entry => data.elements[id].value = gett(entry.time));
    });


    data.querySelectorAll('[name="participant"]').forEach(elem => {

        elem.addEventListener('change', async (event) => {

            const tx = await berta.write('settings', 'appointments');

            // only setting fires event, so we do not know
            // the former selected item and delete them all
            tx.settings.deleteAnd('name', event.target.name)
                .then(() => {
                    return tx.settings.put({
                        name: event.target.name,
                        checked: true
                    }, event.target.id)
                })
                .then(() => {
                    return tx.appointments.updateAnd('user', dberta.le(event.target.value), {
                        active: 'true'
                    });
                })
                .then(() => {
                    return tx.appointments.updateAnd('user', dberta.gt(event.target.value), {
                        active: 'false'
                    });
                })
                .then(() => validate());
        });
    })

    data.querySelectorAll('.staff').forEach(elem => {

        elem.addEventListener('change', async (event) => {
            const result = await write('settings',
                event.target.id, {
                checked: event.target.checked
            });

            if (result === event.target.id) {
                const tx = await berta.write('appointments');

                await tx.appointments.updateAnd('staff', event.target.dataset.staff, {
                    active: event.target.checked
                });

                validate();
            }
        });
    });

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
                        render();
                        return;

                    case 'radio':
                    case 'checkbox':
                        return
                        value.checked = event.target.checked
                        break;
                    default:
                        console.error('unknown type: ', type)
                }
                return

                const result = await write('settings', event.target.id, value);

                if (result === event.target.id) {
                    const tx = await berta.write('appointments');

                    const r = await tx.appointments.updateAnd('staff', event.target.datast.staff, {
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

            case 'appointmentX':
                event.target.placeholder = event.target.value
                if (event.target.validity.valid) {
                    const [_, usernumber, field, staffnumber, task] = data;
                    const result = await write('appointments',
                        event.target.id,
                        event.target.value ? {
                            active: 'true',
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