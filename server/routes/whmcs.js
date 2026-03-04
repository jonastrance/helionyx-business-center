import { Router } from 'express';

const r = Router();

const WHMCS_URL = process.env.WHMCS_URL || 'https://helionyxcommons.com/includes/api.php';
const WHMCS_ID = process.env.WHMCS_IDENTIFIER;
const WHMCS_SECRET = process.env.WHMCS_SECRET;

// Generic WHMCS API call
async function whmcsCall(action, params = {}) {
  if (!WHMCS_ID || !WHMCS_SECRET) {
    throw new Error('WHMCS credentials not configured');
  }

  const formData = new URLSearchParams();
  formData.append('identifier', WHMCS_ID);
  formData.append('secret', WHMCS_SECRET);
  formData.append('action', action);
  formData.append('responsetype', 'json');

  for (const [key, value] of Object.entries(params)) {
    formData.append(key, value);
  }

  const response = await fetch(WHMCS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  const text = await response.text();
  try {
    const data = JSON.parse(text);
    if (data.result === 'error') {
      throw new Error(data.message || 'WHMCS API error');
    }
    return data;
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error(`Invalid WHMCS response: ${text.substring(0, 100)}`);
    }
    throw e;
  }
}

// Get stats
r.get('/stats', async (req, res) => {
  try {
    if (!WHMCS_ID || !WHMCS_SECRET) {
      return res.json({
        error: 'WHMCS credentials not configured',
        configured: false,
        clients: 0,
        tickets: 0,
        unpaidInvoices: 0,
        recentOrders: [],
      });
    }

    // Get client count
    const clientsData = await whmcsCall('GetClients', { limitstart: 0, limitnum: 1 });
    const clientCount = parseInt(clientsData.totalresults || 0, 10);

    // Get open tickets
    const ticketsData = await whmcsCall('GetTickets', { status: 'Open', limitnum: 100 });
    const openTickets = Array.isArray(ticketsData.tickets?.ticket)
      ? ticketsData.tickets.ticket.length
      : 0;

    // Get unpaid invoices
    const invoicesData = await whmcsCall('GetInvoices', { status: 'Unpaid', limitnum: 100 });
    const unpaidInvoices = Array.isArray(invoicesData.invoices?.invoice)
      ? invoicesData.invoices.invoice.length
      : 0;

    // Get recent orders
    const ordersData = await whmcsCall('GetOrders', { limitstart: 0, limitnum: 10, status: 'Active' });
    const recentOrders = Array.isArray(ordersData.orders?.order)
      ? ordersData.orders.order.map(o => ({
          id: o.id,
          orderId: o.ordernumber,
          clientId: o.userid,
          date: o.date,
          amount: o.amount,
          status: o.status,
        }))
      : [];

    res.json({
      configured: true,
      clients: clientCount,
      tickets: openTickets,
      unpaidInvoices,
      recentOrders,
    });
  } catch (e) {
    res.json({
      error: e.message,
      configured: false,
      clients: 0,
      tickets: 0,
      unpaidInvoices: 0,
      recentOrders: [],
    });
  }
});

export default r;
