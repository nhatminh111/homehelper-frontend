import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faTasks,
  faCalendar,
  faDollarSign,
  faStar,
  faVideo,
  faCertificate,
  faUserCog,
  faSearch
} from '@fortawesome/free-solid-svg-icons';

const TaskerHome = () => {
  const stats = [
    { title: 'Active Jobs', value: 4, icon: faTasks, color: 'primary' },
    { title: 'Earnings (mo.)', value: '$820', icon: faDollarSign, color: 'success' },
    { title: 'Avg. Rating', value: '4.8', icon: faStar, color: 'warning' },
    { title: 'Videos Approved', value: 7, icon: faVideo, color: 'info' }
  ];

  const menu = [
    { label: 'My Tasks', icon: faTasks, to: '/tasks' },
    { label: 'Schedule', icon: faCalendar, to: '/tasks' },
    { label: 'Earnings', icon: faDollarSign, to: '/payment' },
    { label: 'Ratings & Complaints', icon: faStar, to: '/ratings' },
    { label: 'Upload Videos', icon: faVideo, to: '/video-upload' },
    { label: 'Certifications', icon: faCertificate, to: '/account' },
    { label: 'Find Customers', icon: faSearch, to: '/tasker-search' },
    { label: 'Profile & Settings', icon: faUserCog, to: '/account' }
  ];

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-lg-3 mb-4">
          <div className="bg-white rounded shadow-sm p-3">
            <h6 className="mb-3">
              <FontAwesomeIcon icon={faTachometerAlt} className="mr-2" />
              Tasker Panel
            </h6>
            <div className="list-group">
              {menu.map(item => (
                <Link key={item.label} to={item.to} className="list-group-item list-group-item-action d-flex align-items-center">
                  <FontAwesomeIcon icon={item.icon} className="mr-2 text-primary" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-9">
          <div className="row">
            {stats.map(s => (
              <div key={s.title} className="col-md-6 col-xl-3 mb-3">
                <div className={`rounded text-white bg-${s.color} p-3 shadow-sm`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="mb-1">{s.value}</h4>
                      <small>{s.title}</small>
                    </div>
                    <FontAwesomeIcon icon={s.icon} size="2x" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded shadow-sm p-4">
            <h5 className="mb-3">Quick Actions</h5>
            <div className="row">
              {[{label:'Create SOS Slot',to:'/tasks'},{label:'Withdraw Funds',to:'/payment'},{label:'Respond to Rating',to:'/ratings'},{label:'Upload Work Video',to:'/video-upload'}].map(a => (
                <div key={a.label} className="col-md-6 col-xl-3 mb-2">
                  <Link to={a.to} className="btn btn-outline-primary btn-block btn-sm">{a.label}</Link>
                </div>
              ))}
            </div>

            <hr />
            <h6 className="mb-3">Tips</h6>
            <ul className="mb-0">
              <li>Keep schedule up to date for higher visibility.</li>
              <li>Upload work videos to earn points and badges.</li>
              <li>Maintain 95%+ completion rate for bonus tiers.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskerHome;

