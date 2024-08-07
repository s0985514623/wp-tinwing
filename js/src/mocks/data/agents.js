import { rest } from 'msw';
import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';

const AMOUNT = 30;

const agents = new Array(AMOUNT).fill(0).map((_, index) => {
    return {
        id: index,
        created_at: dayjs()
            .subtract(faker.datatype.number({ min: 1, max: 400 }), 'day')
            .toISOString(),
        agentNumber: faker.phone.number('POB###'),
        name: faker.company.name(),
        contact1: faker.name.fullName(),
        tel1: faker.phone.number('########'),
        contact2: faker.name.fullName(),
        tel2: faker.phone.number('########'),
    };
});

const getAgents = rest.get('/agents', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(agents));
});

const getAgent = rest.get('/agents/:id', (req, res, ctx) => {
    const { id } = req.params;
    const agent = agents.filter((a) => a.id === parseInt(id, 10));

    return res(ctx.status(200), ctx.json(agent));
});

export const mockAgents = [getAgents, getAgent];
