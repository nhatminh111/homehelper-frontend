import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faUserShield,
  faDollarSign,
  faChartLine,
  faTools,
  faFileAlt,
  faBell,
  faShieldAlt,
  faClipboardList
} from '@fortawesome/free-solid-svg-icons';

const AdminHome = () => {
  const cards = [
    { title: 'Users', value: '15,420', icon: faUsers, color: 'primary' },
    { title: 'Active Taskers', value: '1,245', icon: faUserShield, color: 'success' },
    { title: 'Revenue (mo.)', value: '$125k', icon: faDollarSign, color: 'warning' },
    { title: 'Avg Rating', value: '4.8', icon: faChartLine, color: 'info' }
  ];

  const adminLinks = [
    { label: 'System Management', to: '/system', icon: faTools },
    { label: 'Reports & Analytics', to: '/system', icon: faFileAlt },
    { label: 'Content Moderation', to: '/content', icon: faClipboardList },
    { label: 'Send Notifications', to: '/system', icon: faBell },
    { label: 'Security & Status', to: '/system', icon: faShieldAlt }
  ];

  return (
    <div className="container py-4">
      <div className="row mb-3">
        {cards.map(c => (
          <div key={c.title} className="col-md-6 col-xl-3 mb-3">
            <div className={`rounded text-white bg-${c.color} p-3 shadow-sm`}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-1">{c.value}</h4>
                  <small>{c.title}</small>
                </div>
                <FontAwesomeIcon icon={c.icon} size="2x" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded shadow-sm p-4">
        <h5 className="mb-3">Admin Shortcuts</h5>
        <div className="row">
          {adminLinks.map(l => (
            <div key={l.label} className="col-sm-6 col-md-4 col-xl-3 mb-2">
              <Link to={l.to} className="btn btn-outline-primary btn-block">
                <FontAwesomeIcon icon={l.icon} className="mr-2" />
                {l.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminHome;

