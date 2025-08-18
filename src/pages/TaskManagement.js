import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faSearch, 
  faFilter, 
  faCalendar, 
  faClock,
  faMapMarkerAlt,
  faUser,
  faComments,
  faCheck,
  faTimes,
  faEdit,
  faTrash,
  faEye,
  faStar,
  faDollarSign,
  faList,
  faCheckCircle,
  faExclamationTriangle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

const TaskManagement = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const tasks = [
    {
      id: 1,
      title: 'House Cleaning',
      tasker: 'Sarah Johnson',
      date: '2025-01-20',
      time: '09:00',
      status: 'scheduled',
      amount: 75,
      location: '123 Main St, Downtown',
      checklist: [
        'Vacuum all rooms',
        'Dust surfaces',
        'Clean bathrooms',
        'Mop floors',
        'Take out trash'
      ],
      priority: 'normal',
      type: 'regular'
    },
    {
      id: 2,
      title: 'Kitchen Deep Cleaning',
      tasker: 'Maria Rodriguez',
      date: '2025-01-18',
      time: '14:00',
      status: 'in-progress',
      amount: 120,
      location: '456 Oak Ave, Uptown',
      checklist: [
        'Clean oven and stovetop',
        'Wipe down cabinets',
        'Clean refrigerator',
        'Scrub sink and countertops',
        'Mop kitchen floor'
      ],
      priority: 'high',
      type: 'sos'
    },
    {
      id: 3,
      title: 'Window Cleaning',
      tasker: 'Jennifer Chen',
      date: '2025-01-15',
      time: '10:30',
      status: 'completed',
      amount: 60,
      location: '789 Pine St, Midtown',
      checklist: [
        'Clean interior windows',
        'Clean exterior windows',
        'Wipe window sills',
        'Clean window tracks'
      ],
      priority: 'normal',
      type: 'regular',
      rating: 4.9
    }
  ];

  const statusColors = {
    'scheduled': 'info',
    'in-progress': 'warning',
    'completed': 'success',
    'cancelled': 'danger'
  };

  const priorityColors = {
    'low': 'success',
    'normal': 'info',
    'high': 'warning',
    'urgent': 'danger'
  };

  return (
    <div className="task-management-container">
      {/* Header */}
      <div className="page-header bg-white shadow-sm">
        <div className="container">
          <div className="row align-items-center py-4">
            <div className="col-md-6">
              <h1 className="mb-0">Task Management</h1>
              <p className="text-muted mb-0">Manage your cleaning tasks and schedules</p>
            </div>
            <div className="col-md-6 text-right">
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateTask(true)}
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Create New Task
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-4">
        <div className="row">
          {/* Left Column - Task List */}
          <div className="col-lg-8">
            {/* Filters and Search */}
            <div className="filters-section bg-white rounded shadow-sm p-3 mb-4">
              <div className="row align-items-center">
                <div className="col-md-4">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search tasks..."
                    />
                    <div className="input-group-append">
                      <button className="btn btn-outline-secondary">
                        <FontAwesomeIcon icon={faSearch} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-8">
                  <div className="d-flex justify-content-end">
                    <div className="btn-group mr-2" role="group">
                      <button
                        type="button"
                        className={`btn btn-sm ${activeTab === 'active' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActiveTab('active')}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${activeTab === 'completed' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActiveTab('completed')}
                      >
                        Completed
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${activeTab === 'cancelled' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActiveTab('cancelled')}
                      >
                        Cancelled
                      </button>
                    </div>
                    <button className="btn btn-outline-secondary btn-sm">
                      <FontAwesomeIcon icon={faFilter} className="mr-1" />
                      Filter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks List */}
            <div className="tasks-list">
              {tasks.map((task) => (
                <div key={task.id} className="task-card bg-white rounded shadow-sm p-4 mb-3">
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <div className="d-flex align-items-center mb-2">
                        <h5 className="mb-0 mr-3">{task.title}</h5>
                        <span className={`badge badge-${statusColors[task.status]} mr-2`}>
                          {task.status.replace('-', ' ').toUpperCase()}
                        </span>
                        <span className={`badge badge-${priorityColors[task.priority]}`}>
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="task-details">
                        <div className="row">
                          <div className="col-md-6">
                            <p className="mb-1">
                              <FontAwesomeIcon icon={faUser} className="mr-2 text-muted" />
                              {task.tasker}
                            </p>
                            <p className="mb-1">
                              <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-muted" />
                              {task.location}
                            </p>
                          </div>
                          <div className="col-md-6">
                            <p className="mb-1">
                              <FontAwesomeIcon icon={faCalendar} className="mr-2 text-muted" />
                              {task.date}
                            </p>
                            <p className="mb-1">
                              <FontAwesomeIcon icon={faClock} className="mr-2 text-muted" />
                              {task.time}
                            </p>
                          </div>
                        </div>
                        
                        <div className="task-amount mt-2">
                          <strong className="text-primary">${task.amount}</strong>
                          {task.rating && (
                            <span className="ml-3">
                              <FontAwesomeIcon icon={faStar} className="text-warning mr-1" />
                              {task.rating}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-4 text-right">
                      <div className="task-actions">
                        <button 
                          className="btn btn-outline-primary btn-sm mr-2"
                          onClick={() => setSelectedTask(task)}
                        >
                          <FontAwesomeIcon icon={faEye} className="mr-1" />
                          View
                        </button>
                        <button 
                          className="btn btn-outline-success btn-sm mr-2"
                          onClick={() => setShowChat(true)}
                        >
                          <FontAwesomeIcon icon={faComments} className="mr-1" />
                          Chat
                        </button>
                        {task.status === 'scheduled' && (
                          <button className="btn btn-outline-warning btn-sm">
                            <FontAwesomeIcon icon={faEdit} className="mr-1" />
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Task Details */}
          <div className="col-lg-4">
            {selectedTask ? (
              <div className="task-details-panel bg-white rounded shadow-sm p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Task Details</h5>
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setSelectedTask(null)}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                <h6 className="mb-3">{selectedTask.title}</h6>
                
                <div className="task-info mb-4">
                  <div className="info-item mb-2">
                    <strong>Tasker:</strong> {selectedTask.tasker}
                  </div>
                  <div className="info-item mb-2">
                    <strong>Date:</strong> {selectedTask.date} at {selectedTask.time}
                  </div>
                  <div className="info-item mb-2">
                    <strong>Location:</strong> {selectedTask.location}
                  </div>
                  <div className="info-item mb-2">
                    <strong>Amount:</strong> ${selectedTask.amount}
                  </div>
                  <div className="info-item mb-2">
                    <strong>Type:</strong> 
                    <span className={`badge badge-${selectedTask.type === 'sos' ? 'danger' : 'info'} ml-2`}>
                      {selectedTask.type.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="task-checklist mb-4">
                  <h6>Task Checklist</h6>
                  <ul className="list-unstyled">
                    {selectedTask.checklist.map((item, index) => (
                      <li key={index} className="d-flex align-items-center mb-2">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-success mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="task-actions">
                  <button className="btn btn-primary btn-block mb-2">
                    <FontAwesomeIcon icon={faComments} className="mr-2" />
                    Start Chat
                  </button>
                  {selectedTask.status === 'scheduled' && (
                    <>
                      <button className="btn btn-outline-warning btn-block mb-2">
                        <FontAwesomeIcon icon={faEdit} className="mr-2" />
                        Edit Task
                      </button>
                      <button className="btn btn-outline-danger btn-block">
                        <FontAwesomeIcon icon={faTimes} className="mr-2" />
                        Cancel Task
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="task-details-placeholder bg-white rounded shadow-sm p-4 text-center">
                <FontAwesomeIcon icon={faEye} size="3x" className="text-muted mb-3" />
                <h6>Select a task to view details</h6>
                <p className="text-muted">Click on "View" button to see task information</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="modal-overlay">
          <div className="modal-content bg-white rounded shadow-lg p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5>Create New Task</h5>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowCreateTask(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label>Task Title</label>
                    <input type="text" className="form-control" placeholder="e.g., House Cleaning" />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label>Service Type</label>
                    <select className="form-control">
                      <option>House Cleaning</option>
                      <option>Kitchen Cleaning</option>
                      <option>Bathroom Cleaning</option>
                      <option>Window Cleaning</option>
                      <option>Deep Cleaning</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label>Date</label>
                    <input type="date" className="form-control" />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label>Time</label>
                    <input type="time" className="form-control" />
                  </div>
                </div>
              </div>

              <div className="form-group mb-3">
                <label>Location</label>
                <input type="text" className="form-control" placeholder="Enter address" />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label>Priority</label>
                    <select className="form-control">
                      <option>Normal</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label>Task Type</label>
                    <select className="form-control">
                      <option>Regular</option>
                      <option>SOS (Emergency)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group mb-3">
                <label>Special Instructions</label>
                <textarea className="form-control" rows="3" placeholder="Any special requirements..."></textarea>
              </div>

              <div className="text-right">
                <button 
                  type="button" 
                  className="btn btn-secondary mr-2"
                  onClick={() => setShowCreateTask(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && (
        <div className="modal-overlay">
          <div className="modal-content bg-white rounded shadow-lg p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5>Chat with Tasker</h5>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowChat(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="chat-container" style={{ height: '300px', border: '1px solid #dee2e6', borderRadius: '8px', padding: '1rem', overflowY: 'auto' }}>
              <div className="chat-messages">
                <div className="message received mb-3">
                  <div className="message-content bg-light p-2 rounded">
                    <small className="text-muted">Sarah Johnson - 10:30 AM</small>
                    <p className="mb-0">Hi! I'm on my way to your location. Should be there in about 15 minutes.</p>
                  </div>
                </div>
                <div className="message sent mb-3 text-right">
                  <div className="message-content bg-primary text-white p-2 rounded d-inline-block">
                    <small className="text-white-50">You - 10:32 AM</small>
                    <p className="mb-0">Perfect! I'll be waiting. Please ring the doorbell when you arrive.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="chat-input mt-3">
              <div className="input-group">
                <input type="text" className="form-control" placeholder="Type your message..." />
                <div className="input-group-append">
                  <button className="btn btn-primary">Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .task-management-container {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        
        .page-header {
          border-bottom: 1px solid #e9ecef;
        }
        
        .task-card {
          transition: transform 0.2s;
          cursor: pointer;
        }
        
        .task-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .task-details-panel {
          position: sticky;
          top: 20px;
        }
        
        .task-details-placeholder {
          position: sticky;
          top: 20px;
          min-height: 300px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
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
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .chat-container {
          background-color: #f8f9fa;
        }
        
        .message.received .message-content {
          max-width: 80%;
        }
        
        .message.sent .message-content {
          max-width: 80%;
          margin-left: auto;
        }
        
        .info-item {
          font-size: 0.9rem;
        }
        
        .task-actions .btn {
          margin-bottom: 0.5rem;
        }
        
        .task-amount {
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
};

export default TaskManagement;
