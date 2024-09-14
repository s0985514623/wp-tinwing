import { clients } from './clients';
import { agents } from './agents';
import { insurers } from './insurers';
import { debitNotes } from './debitNotes';
import { quotations } from './quotations';
import { reports } from './reports';
import { clientsSummary } from './clientsSummary';
import { archive } from './archive';
import { accounting } from './accounting';
import { creditNotes } from './creditNotes';

const resources = [...clientsSummary, ...quotations, ...debitNotes, ...creditNotes, ...clients, ...archive, ...reports, ...agents, ...insurers, ...accounting];

export default resources;
