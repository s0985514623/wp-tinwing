import { rest } from 'msw';
import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';
import { default as products } from './products';

const AMOUNT = 30;

const insurers = new Array(AMOUNT).fill(0).map((_, index) => {
    return {
        id: index,
        created_at: dayjs()
            .subtract(faker.datatype.number({ min: 1, max: 400 }), 'day')
            .toISOString(),
        insurer_number: faker.phone.number(`${faker.random.alpha({ count: 4, casing: 'upper' })}###`),
        name: faker.company.name(),
        payment_rate: faker.datatype.number({
            min: 0.6,
            max: 0.9,
            precision: 0.01,
        }),
    };
});

const getInsurers = rest.get('/insurers', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(insurers));
});

const getInsurer = rest.get('/insurers/:id', (req, res, ctx) => {
    const { id } = req.params;
    const insurer = insurers.filter((i) => i.id === parseInt(id, 10));

    return res(ctx.status(200), ctx.json(insurer));
});

export const mockInsurers = [getInsurers, getInsurer, ...products];
