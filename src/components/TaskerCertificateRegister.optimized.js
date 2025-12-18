import React, { useState, useEffect } from "react";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const getAuthToken = () => {
  try {
    let t = localStorage.getItem('token')
      || localStorage.getItem('accessToken')
      || localStorage.getItem('authToken')
      || localStorage.getItem('jwt');
    if (!t) {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        t = u?.token || u?.accessToken || u?.authToken || null;
      }
    }
    return t;
  } catch { return null; }
};

const TaskerCertificateRegister = ({ onSubmit, excludeServiceIds = [] }) => {
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [serviceCerts, setServiceCerts] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/services`)
      .then((res) => res.json())
      .then((data) => {
        let all = Array.isArray(data.data) ? data.data : [];
        if (excludeServiceIds && excludeServiceIds.length > 0) {
          all = all.filter(s => !excludeServiceIds.includes(String(s.service_id)));
        }
        setServices(all);
      })
      .catch(() => setServices([]));
  }, [excludeServiceIds]);

  // ...existing code from TaskerCertificateRegister.js...
  // Copy all logic, but replace the services list with the filtered one above

  // The rest of the component remains unchanged
  // ...existing code...
};

export default TaskerCertificateRegister;
