import { rest } from 'msw';
import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';

const AMOUNT = 30;
const names = ['iHOME 家居保險', 'iHOME 家居保險（升級）', '家傭保 4.0', '旅遊保', '勞工保', '汽車保'];

const insurerproducts = new Array(AMOUNT).fill(0).map((_, index) => {
    const debitNoteIds = new Array(30).fill(0).map((__, i) => i);

    return {
        id: index,
        created_at: dayjs()
            .subtract(faker.datatype.number({ min: 1, max: 400 }), 'day')
            .toISOString(),
        name: faker.helpers.arrayElement(names),
        termId: faker.datatype.number({ min: 0, max: 30 }),
        policyNo: faker.phone.number(`######## ${faker.random.alpha({ count: 3, casing: 'upper' })}`),
        insuranceAmount:
            faker.datatype.number({
                min: 10,
                max: 300,
            }) * 100000,
        remark: faker.lorem.lines(),
        debitNoteIds: faker.helpers.arrayElements(debitNoteIds),
        insurerId: faker.datatype.number({ min: 0, max: 30 }),
    };
});

const getInsurerProducts = rest.get('/insurer-products', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(insurerproducts));
});

const getInsurerProduct = rest.get('/insurer-products/:id', (req, res, ctx) => {
    const { id } = req.params;
    const insurerProduct = insurerproducts.filter((p) => p.id === parseInt(id, 10));

    return res(ctx.status(200), ctx.json(insurerProduct));
});

export default [getInsurerProducts, getInsurerProduct];
