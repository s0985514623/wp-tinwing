import { Authenticated } from '@refinedev/core'
import { ErrorComponent } from '@refinedev/antd'
import { AuthPage } from 'pages/auth'
import '@refinedev/antd/dist/reset.css'
import {
  CatchAllNavigate,
  NavigateToResource,
} from '@refinedev/react-router-v6'
import { Outlet, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout'

import { ListView as ClientsSummaryList } from './pages/clientsSummary'

import {
  ListView as DebitNoteList,
  EditView as DebitNoteEdit,
  CreateView as DebitNoteCreate,
  ShowView as DebitNoteShow,
} from './pages/debitNotes'

import {
  ListView as QuotationList,
  EditView as QuotationEdit,
  CreateView as QuotationCreate,
  ShowView as QuotationShow,
} from './pages/quotations'

import {
  ListView as RenewalList,
  EditView as RenewalEdit,
  CreateView as RenewalCreate,
  ShowView as RenewalShow,
} from './pages/renewals'

import {
  ListView as ReceiptList,
  EditView as ReceiptEdit,
  CreateView as ReceiptCreate,
  ShowView as ReceiptShow,
} from './pages/receipts'

import {
  ListView as ClientList,
  EditView as ClientEdit,
  CreateView as ClientCreate,
} from './pages/clients'

import {
  ListView as InsurerList,
  EditView as InsurerEdit,
  CreateView as InsurerCreate,
} from './pages/insurers'

import {
  ListView as InsurerProductList,
  EditView as InsurerProductEdit,
  CreateView as InsurerProductCreate,
} from './pages/insurerProducts'

import {
  ListView as AgentList,
  EditView as AgentEdit,
  CreateView as AgentCreate,
} from './pages/agents'

import {
  ListView as TermList,
  EditView as TermEdit,
  CreateView as TermCreate,
} from './pages/terms'
import { ListView as DashboardList } from './pages/accounting/dashboard/ListView'
import { ListView as InsurerPaymentRecordList } from './pages/accounting/InsurerPayment/Record/ListView'
import { ListView as InsurerPaymentSummaryList } from './pages/accounting/InsurerPayment/Summary/ListView'
import { EditView as InsurerPaymentRecordEdit } from './pages/accounting/InsurerPayment/Record/EditView'
import { ListView as ExpenseRecordList } from './pages/accounting/Expense/Record/ListView'
import { ListView as ExpenseSummaryList } from './pages/accounting/Expense/Summary/ListView'
import { EditView as ExpenseRecordEdit } from './pages/accounting/Expense/Record/EditView'
import { CreateView as ExpenseRecordCreate } from './pages/accounting/Expense/Record/CreateView'
import { ShowView as ExpenseSummaryShow } from './pages/accounting/Expense/Summary/ShowView'
import Reports from './pages/reports'

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        element={
          <Authenticated fallback={<CatchAllNavigate to="/login" />}>
            <Layout>
              <Outlet />
            </Layout>
          </Authenticated>
        }
      >
        <Route
          index
          element={<NavigateToResource resource="clientsSummary" />}
        />

        <Route path="/clientsSummary">
          <Route index element={<ClientsSummaryList />} />
        </Route>

        <Route path="/quotations">
          <Route index element={<QuotationList />} />
          <Route path="create" element={<QuotationCreate />} />
          <Route path="edit/:id" element={<QuotationEdit />} />
          <Route path="show/:id" element={<QuotationShow />} />
        </Route>

        <Route path="/debitNotes">
          <Route index element={<DebitNoteList />} />
          <Route path="create" element={<DebitNoteCreate />} />
          <Route path="edit/:id" element={<DebitNoteEdit />} />
          <Route path="show/:id" element={<DebitNoteShow />} />
        </Route>

        <Route path="/receipts">
          <Route index element={<ReceiptList />} />
          <Route path="create" element={<ReceiptCreate />} />
          <Route path="edit/:id" element={<ReceiptEdit />} />
          <Route path="show/:id" element={<ReceiptShow />} />
        </Route>

        <Route path="/renewals">
          <Route index element={<RenewalList />} />
          <Route path="create" element={<RenewalCreate />} />
          <Route path="edit/:id" element={<RenewalEdit />} />
          <Route path="show/:id" element={<RenewalShow />} />
        </Route>

        <Route path="/clients">
          <Route index element={<ClientList />} />
          <Route path="create" element={<ClientCreate />} />
          <Route path="edit/:id" element={<ClientEdit />} />
        </Route>

        <Route path="/reports">
          <Route index element={<Reports />} />
        </Route>

        <Route path="/insurers">
          <Route index element={<InsurerList />} />
          <Route path="create" element={<InsurerCreate />} />
          <Route path="edit/:id" element={<InsurerEdit />} />
        </Route>

        <Route path="/insurer-products">
          <Route index element={<InsurerProductList />} />
          <Route path="create" element={<InsurerProductCreate />} />
          <Route path="edit/:id" element={<InsurerProductEdit />} />
        </Route>

        <Route path="/agents">
          <Route index element={<AgentList />} />
          <Route path="create" element={<AgentCreate />} />
          <Route path="edit/:id" element={<AgentEdit />} />
        </Route>

        <Route path="/terms/insurance_class">
          <Route index element={<TermList taxonomy="insurance_class" />} />
          <Route
            path="create"
            element={<TermCreate taxonomy="insurance_class" />}
          />
          <Route
            path="edit/:id"
            element={<TermEdit taxonomy="insurance_class" />}
          />
        </Route>

        <Route path="/archived_Quotations">
          <Route index element={<QuotationList />} />
        </Route>
        <Route path="/archived_debit_notes">
          <Route index element={<DebitNoteList />} />
        </Route>
        <Route path="/archived_receipts">
          <Route index element={<ReceiptList />} />
        </Route>
        <Route path="/archived_renewals">
          <Route index element={<RenewalList />} />
        </Route>
        <Route path="/dashboard">
          <Route index element={<DashboardList />} />
        </Route>
        <Route path="/income">
          <Route index element={<ReceiptList />} />
        </Route>
        <Route path="/insurerPayment/record">
          <Route index element={<InsurerPaymentRecordList />} />
          <Route path="edit/:id" element={<InsurerPaymentRecordEdit />} />
        </Route>
        <Route path="/insurerPayment/summary">
          <Route index element={<InsurerPaymentSummaryList />} />
        </Route>
        <Route path="/otherExpenses/record">
          <Route index element={<ExpenseRecordList />} />
          <Route path="create" element={<ExpenseRecordCreate />} />
          <Route path="edit/:id" element={<ExpenseRecordEdit />} />
        </Route>
        <Route path="/otherExpenses/summary">
          <Route index element={<ExpenseSummaryList />} />
          <Route path="show/:year/:month" element={<ExpenseSummaryShow />} />
        </Route>
      </Route>
      <Route
        element={
          <Authenticated fallback={<Outlet />}>
            <NavigateToResource />
          </Authenticated>
        }
      >
        <Route
          path="/login"
          element={
            <AuthPage
              type="login"
              providers={
                [
                  // {
                  //     name: 'google',
                  //     label: 'Sign in with Google',
                  // },
                ]
              }
              wrapperProps={{
                style: {
                  backgroundImage:
                    'url(https://images.unsplash.com/photo-1508108712903-49b7ef9b1df8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2669&q=80)',
                  backgroundSize: 'cover',
                  minHeight: '100vh',
                },
              }}
            />
          }
        />
      </Route>
      <Route
        element={
          <Authenticated>
            <Layout>
              <Outlet />
            </Layout>
          </Authenticated>
        }
      >
        <Route path="*" element={<ErrorComponent />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
