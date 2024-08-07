import { rest } from 'msw';
import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';

const AMOUNT = 30;

const clients = new Array(AMOUNT).fill(0).map((_, index) => {
    const name = faker.name.fullName();

    return {
        id: index,
        created_at: dayjs()
            .subtract(faker.datatype.number({ min: 1, max: 400 }), 'day')
            .toISOString(),
        nameZh: name,
        nameEn: name,
        address: faker.address.streetAddress(true),
        company: faker.company.name(),
        officeGenLine: faker.phone.number('########'),
        directLine: faker.phone.number('####'),
        mobile1: faker.phone.number('########'),
        mobile2: faker.phone.number('########'),
        contact2: faker.name.fullName(),
        tel2: faker.phone.number('########'),
        contact3: faker.name.fullName(),
        tel3: faker.phone.number('########'),
        remark: faker.lorem.lines(),
        agentId: faker.datatype.number({ min: 0, max: 400 }),
    };
});

const getClients = rest.get('/clients', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(clients));
});

const getClient = rest.get('/clients/:id', (req, res, ctx) => {
    const { id } = req.params;
    const client = clients.filter((c) => c.id === parseInt(id, 10));

    return res(ctx.status(200), ctx.json(client));
});

const createClient = rest.post('/clients', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({}));
});

export const mockClients = [getClients, getClient, createClient];
