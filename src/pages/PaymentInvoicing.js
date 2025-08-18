import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCreditCard, 
  faWallet, 
  faMoneyBillWave,
  faFileInvoice,
  faDownload,
  faPrint,
  faEye,
  faCheck,
  faTimes,
  faClock,
  faCalendar,
  faDollarSign,
  faChartLine,
  faArrowUp,
  faArrowDown,
  faFilter,
  faSearch,
  faPlus
} from '@fortawesome/free-solid-svg-icons';

const PaymentInvoicing = () => {
  const [activeTab, setActiveTab] = useState('payments');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const payments = [
    {
      id: 1,
      service: 'House Cleaning',
      tasker: 'Sarah Johnson',
      date: '2025-01-15',
      amount: 75,
      status: 'completed',
      method: 'credit_card',
      invoiceNumber: 'INV-2025-001'
    },
    {
      id: 2,
      service: 'Kitchen Deep Cleaning',
      tasker: 'Maria Rodriguez',
      date: '2025-01-18',
      amount: 120,
      status: 'pending',
      method: 'digital_wallet',
      invoiceNumber: 'INV-2025-002'
    },
    {
      id: 3,
      service: 'Window Cleaning',
      tasker: 'Jennifer Chen',
      date: '2025-01-20',
      amount: 60,
      status: 'completed',
      method: 'cash',
      invoiceNumber: 'INV-2025-003'
    }
  ];

  const invoices = [
    {
      id: 1,
      invoiceNumber: 'INV-2025-001',
      service: 'House Cleaning',
      tasker: 'Sarah Johnson',
      date: '2025-01-15',
      dueDate: '2025-01-15',
      amount: 75,
      tax: 6.25,
      total: 81.25,
      status: 'paid',
      items: [
        { description: 'House Cleaning Service', quantity: 1, rate: 75, amount: 75 }
      ]
    },
    {
      id: 2,
      invoiceNumber: 'INV-2025-002',
      service: 'Kitchen Deep Cleaning',
      tasker: 'Maria Rodriguez',
      date: '2025-01-18',
      dueDate: '2025-01-18',
      amount: 120,
      tax: 10,
      total: 130,
      status: 'pending',
      items: [
        { description: 'Kitchen Deep Cleaning Service', quantity: 1, rate: 120, amount: 120 }
      ]
    }
  ];

  const earnings = {
    totalEarnings: 1250,
    thisMonth: 450,
    lastMonth: 800,
    pendingAmount: 130,
    completedJobs: 24,
    averagePerJob: 52.08
  };

  const paymentMethods = [
    { id: 'credit_card', name: 'Credit Card', icon: faCreditCard, last4: '1234' },
    { id: 'digital_wallet', name: 'Digital Wallet', icon: faWallet, balance: 250 },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: faMoneyBillWave, account: '****5678' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      default: return 'secondary';
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'credit_card': return faCreditCard;
      case 'digital_wallet': return faWallet;
      case 'cash': return faMoneyBillWave;
      default: return faCreditCard;
    }
  };

  return (
    <div className="payment-invoicing-container">
      {/* Header */}
      <div className="page-header bg-white shadow-sm">
        <div className="container">
          <div className="row align-items-center py-4">
            <div className="col-md-6">
              <h1 className="mb-0">Payment & Invoicing</h1>
              <p className="text-muted mb-0">Manage payments, invoices, and earnings</p>
            </div>
            <div className="col-md-6 text-right">
              <button className="btn btn-primary mr-2">
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                Export Report
              </button>
              <button className="btn btn-outline-primary">
                <FontAwesomeIcon icon={faPrint} className="mr-2" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-4">
        {/* Earnings Overview */}
        <div className="earnings-overview mb-4">
          <div className="row">
            <div className="col-md-3 mb-3">
              <div className="earnings-card bg-primary text-white rounded p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1">${earnings.totalEarnings}</h4>
                    <p className="mb-0">Total Earnings</p>
                  </div>
                  <FontAwesomeIcon icon={faChartLine} size="2x" />
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="earnings-card bg-success text-white rounded p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1">${earnings.thisMonth}</h4>
                    <p className="mb-0">This Month</p>
                  </div>
                  <FontAwesomeIcon icon={faArrowUp} size="2x" />
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="earnings-card bg-warning text-white rounded p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1">${earnings.pendingAmount}</h4>
                    <p className="mb-0">Pending</p>
                  </div>
                  <FontAwesomeIcon icon={faClock} size="2x" />
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="earnings-card bg-info text-white rounded p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1">{earnings.completedJobs}</h4>
                    <p className="mb-0">Jobs Completed</p>
                  </div>
                  <FontAwesomeIcon icon={faCheck} size="2x" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Left Column - Main Content */}
          <div className="col-lg-8">
            {/* Tabs */}
            <div className="tabs-section bg-white rounded shadow-sm mb-4">
              <ul className="nav nav-tabs" id="paymentTabs" role="tablist">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'payments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('payments')}
                  >
                    <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
                    Payments
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'invoices' ? 'active' : ''}`}
                    onClick={() => setActiveTab('invoices')}
                  >
                    <FontAwesomeIcon icon={faFileInvoice} className="mr-2" />
                    Invoices
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'earnings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('earnings')}
                  >
                    <FontAwesomeIcon icon={faChartLine} className="mr-2" />
                    Earnings
                  </button>
                </li>
              </ul>

              <div className="tab-content p-4">
                {/* Payments Tab */}
                {activeTab === 'payments' && (
                  <div className="payments-content">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>Payment History</h5>
                      <div className="d-flex">
                        <div className="input-group mr-2" style={{ width: '200px' }}>
                          <input type="text" className="form-control" placeholder="Search..." />
                          <div className="input-group-append">
                            <button className="btn btn-outline-secondary">
                              <FontAwesomeIcon icon={faSearch} />
                            </button>
                          </div>
                        </div>
                        <button className="btn btn-outline-secondary">
                          <FontAwesomeIcon icon={faFilter} className="mr-1" />
                          Filter
                        </button>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Service</th>
                            <th>Tasker</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment) => (
                            <tr key={payment.id}>
                              <td>{payment.service}</td>
                              <td>{payment.tasker}</td>
                              <td>{payment.date}</td>
                              <td>${payment.amount}</td>
                              <td>
                                <FontAwesomeIcon icon={getMethodIcon(payment.method)} className="mr-1" />
                                {payment.method.replace('_', ' ').toUpperCase()}
                              </td>
                              <td>
                                <span className={`badge badge-${getStatusColor(payment.status)}`}>
                                  {payment.status.toUpperCase()}
                                </span>
                              </td>
                              <td>
                                <button className="btn btn-sm btn-outline-primary mr-1">
                                  <FontAwesomeIcon icon={faEye} />
                                </button>
                                <button className="btn btn-sm btn-outline-secondary">
                                  <FontAwesomeIcon icon={faDownload} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Invoices Tab */}
                {activeTab === 'invoices' && (
                  <div className="invoices-content">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>Invoice History</h5>
                      <button className="btn btn-primary">
                        <FontAwesomeIcon icon={faFileInvoice} className="mr-2" />
                        Generate Invoice
                      </button>
                    </div>

                    <div className="invoices-list">
                      {invoices.map((invoice) => (
                        <div key={invoice.id} className="invoice-card border rounded p-3 mb-3">
                          <div className="row align-items-center">
                            <div className="col-md-3">
                              <h6 className="mb-1">{invoice.invoiceNumber}</h6>
                              <p className="text-muted mb-0">{invoice.service}</p>
                            </div>
                            <div className="col-md-2">
                              <p className="mb-1">{invoice.tasker}</p>
                              <small className="text-muted">{invoice.date}</small>
                            </div>
                            <div className="col-md-2">
                              <h6 className="text-primary mb-0">${invoice.total}</h6>
                              <small className="text-muted">Due: {invoice.dueDate}</small>
                            </div>
                            <div className="col-md-2">
                              <span className={`badge badge-${getStatusColor(invoice.status)}`}>
                                {invoice.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="col-md-3 text-right">
                              <button 
                                className="btn btn-sm btn-outline-primary mr-1"
                                onClick={() => setSelectedInvoice(invoice)}
                              >
                                <FontAwesomeIcon icon={faEye} className="mr-1" />
                                View
                              </button>
                              <button className="btn btn-sm btn-outline-secondary mr-1">
                                <FontAwesomeIcon icon={faDownload} className="mr-1" />
                                Download
                              </button>
                              <button className="btn btn-sm btn-outline-info">
                                <FontAwesomeIcon icon={faPrint} className="mr-1" />
                                Print
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Earnings Tab */}
                {activeTab === 'earnings' && (
                  <div className="earnings-content">
                    <h5 className="mb-3">Earnings Overview</h5>
                    
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <div className="earnings-chart bg-light rounded p-3">
                          <h6>Monthly Earnings</h6>
                          <div className="chart-placeholder d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                            <div className="text-center">
                              <FontAwesomeIcon icon={faChartLine} size="3x" className="text-muted mb-3" />
                              <p className="text-muted">Chart would be displayed here</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="earnings-stats">
                          <div className="stat-item d-flex justify-content-between align-items-center p-3 border-bottom">
                            <span>Average per Job</span>
                            <strong>${earnings.averagePerJob}</strong>
                          </div>
                          <div className="stat-item d-flex justify-content-between align-items-center p-3 border-bottom">
                            <span>This Month</span>
                            <strong>${earnings.thisMonth}</strong>
                          </div>
                          <div className="stat-item d-flex justify-content-between align-items-center p-3 border-bottom">
                            <span>Last Month</span>
                            <strong>${earnings.lastMonth}</strong>
                          </div>
                          <div className="stat-item d-flex justify-content-between align-items-center p-3">
                            <span>Pending Amount</span>
                            <strong className="text-warning">${earnings.pendingAmount}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Payment Methods & Quick Actions */}
          <div className="col-lg-4">
            {/* Payment Methods */}
            <div className="payment-methods bg-white rounded shadow-sm p-4 mb-4">
              <h5 className="mb-3">Payment Methods</h5>
              {paymentMethods.map((method) => (
                <div key={method.id} className="payment-method-item border rounded p-3 mb-2">
                  <div className="d-flex align-items-center">
                    <FontAwesomeIcon icon={method.icon} className="mr-3 text-primary" />
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{method.name}</h6>
                      <small className="text-muted">
                        {method.last4 ? `****${method.last4}` : 
                         method.balance ? `Balance: $${method.balance}` : 
                         method.account ? `Account: ${method.account}` : ''}
                      </small>
                    </div>
                    <button className="btn btn-sm btn-outline-primary">Edit</button>
                  </div>
                </div>
              ))}
              <button className="btn btn-outline-primary btn-block mt-3">
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Add Payment Method
              </button>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions bg-white rounded shadow-sm p-4">
              <h5 className="mb-3">Quick Actions</h5>
              <button className="btn btn-primary btn-block mb-2">
                <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2" />
                Withdraw Funds
              </button>
              <button className="btn btn-outline-primary btn-block mb-2">
                <FontAwesomeIcon icon={faFileInvoice} className="mr-2" />
                Request Invoice
              </button>
              <button className="btn btn-outline-secondary btn-block">
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                Download Statement
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content bg-white rounded shadow-lg p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5>Invoice Details</h5>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSelectedInvoice(null)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="invoice-details">
              <div className="row mb-4">
                <div className="col-md-6">
                  <h6>Invoice Information</h6>
                  <p><strong>Invoice #:</strong> {selectedInvoice.invoiceNumber}</p>
                  <p><strong>Date:</strong> {selectedInvoice.date}</p>
                  <p><strong>Due Date:</strong> {selectedInvoice.dueDate}</p>
                </div>
                <div className="col-md-6">
                  <h6>Service Details</h6>
                  <p><strong>Service:</strong> {selectedInvoice.service}</p>
                  <p><strong>Tasker:</strong> {selectedInvoice.tasker}</p>
                  <p><strong>Status:</strong> 
                    <span className={`badge badge-${getStatusColor(selectedInvoice.status)} ml-2`}>
                      {selectedInvoice.status.toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>

              <div className="invoice-items mb-4">
                <h6>Items</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Rate</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.description}</td>
                          <td>{item.quantity}</td>
                          <td>${item.rate}</td>
                          <td>${item.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="invoice-summary">
                <div className="row">
                  <div className="col-md-6 offset-md-6">
                    <div className="summary-item d-flex justify-content-between">
                      <span>Subtotal:</span>
                      <span>${selectedInvoice.amount}</span>
                    </div>
                    <div className="summary-item d-flex justify-content-between">
                      <span>Tax:</span>
                      <span>${selectedInvoice.tax}</span>
                    </div>
                    <div className="summary-item d-flex justify-content-between border-top pt-2">
                      <strong>Total:</strong>
                      <strong>${selectedInvoice.total}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="invoice-actions mt-4 text-right">
                <button className="btn btn-outline-secondary mr-2">
                  <FontAwesomeIcon icon={faPrint} className="mr-1" />
                  Print
                </button>
                <button className="btn btn-outline-primary mr-2">
                  <FontAwesomeIcon icon={faDownload} className="mr-1" />
                  Download
                </button>
                <button className="btn btn-primary">
                  <FontAwesomeIcon icon={faCheck} className="mr-1" />
                  Mark as Paid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .payment-invoicing-container {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        
        .page-header {
          border-bottom: 1px solid #e9ecef;
        }
        
        .earnings-card {
          transition: transform 0.2s;
        }
        
        .earnings-card:hover {
          transform: translateY(-2px);
        }
        
        .invoice-card {
          transition: transform 0.2s;
        }
        
        .invoice-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .payment-method-item {
          transition: transform 0.2s;
        }
        
        .payment-method-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
        }
        
        .modal-content {
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .chart-placeholder {
          background-color: #f8f9fa;
          border: 2px dashed #dee2e6;
        }
        
        .stat-item {
          transition: background-color 0.2s;
        }
        
        .stat-item:hover {
          background-color: #f8f9fa;
        }
        
        .summary-item {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default PaymentInvoicing;
