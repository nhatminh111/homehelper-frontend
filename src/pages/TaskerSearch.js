import React, { useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { addressAPI, servicesAPI } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faMapMarkerAlt,
  faStar,
  faEye,
  faFilter,
  faDollarSign,
  faBars,
} from '@fortawesome/free-solid-svg-icons';
import socketService from '../services/socketService';
import '../css/TaskerSearch.css'; // Nhập file CSS riêng

const TaskerSearch = () => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const geolocateControlRef = useRef(null);
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null); // { lng, lat }
  const [circleLayer, setCircleLayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    radius: 15000,
    minRating: 0,
    services: [],
  });
  const [activeFilters, setActiveFilters] = useState(0);
  const [taskers, setTaskers] = useState([]);
  const [services, setServices] = useState([]);
  const [searchMetadata, setSearchMetadata] = useState({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // SOS mode state
  const [isSOSMode, setIsSOSMode] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [variantPreview, setVariantPreview] = useState(null);
  const [sosJobTitle, setSosJobTitle] = useState('');
  const [sosJobDescription, setSosJobDescription] = useState('');
  const [sosPhotos, setSosPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [sosStatus, setSosStatus] = useState(null);
  const [durationHours, setDurationHours] = useState(1);
  const [durationDays, setDurationDays] = useState(1);
  const [sosBookingId, setSosBookingId] = useState(null); // Track current SOS job
  const [acceptedTasker, setAcceptedTasker] = useState(null); // Info of tasker who accepted
  const [toastMessage, setToastMessage] = useState(null);
  const [topRightNotification, setTopRightNotification] = useState(null);
  const [sosDisabledUntil, setSosDisabledUntil] = useState(() => {
    try {
      const v = localStorage.getItem('sos_disabled_until');
      return v ? Number(v) : null;
    } catch (e) {
      return null;
    }
  });
  const [nowTs, setNowTs] = useState(Date.now());

  // Load active SOS booking when page mounts (in case user navigated back)
  const loadActiveSOSBooking = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('http://localhost:3001/api/bookings/customer/active-sos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success && data.data) {
        const booking = data.data;
        setSosBookingId(booking.booking_id);
        const isAccepted = booking.status === 'Đã chấp nhận';
        setSosStatus(isAccepted ? 'accepted' : 'waiting_accept');
        // Prefer booking.tasker_name if present to avoid extra API call
        if (isAccepted && booking.tasker_id) {
          const nameFromBooking = booking.tasker_name || booking.tasker_name || booking.tasker_name;
          if (nameFromBooking) {
            setAcceptedTasker({ tasker_id: booking.tasker_id, tasker_name: nameFromBooking });
          } else {
            // Fetch tasker info if booking doesn't include name
            const taskerRes = await fetch(`http://localhost:3001/api/tasker/${booking.tasker_id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            const taskerData = await taskerRes.json();
            if (taskerData.success && taskerData.data) {
              setAcceptedTasker({
                tasker_id: booking.tasker_id,
                tasker_name: taskerData.data.user_name || taskerData.data.name
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading active SOS booking:', err);
    }
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesData = await servicesAPI.getAllServices();
        setServices(
          servicesData.map((service) => ({
            id: service.service_id,
            name: service.name,
            variants: service.variants || [],
          }))
        );
      } catch (error) {
        console.error('Error fetching services:', error);
        setError('Không thể tải danh sách dịch vụ');
      }
    };
    fetchServices();
    // Load active SOS booking when page mounts
    loadActiveSOSBooking();
  }, []);

  // Poll SOS booking status periodically (backup for real-time socket)
  useEffect(() => {
    if (!sosBookingId || sosStatus !== 'waiting_accept' || acceptedTasker) {
      return; // Stop polling if SOS is accepted or no booking
    }

    const pollInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3001/api/bookings/${sosBookingId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        if (data.data && data.data.status === 'Đã chấp nhận' && data.data.tasker_id && !acceptedTasker) {
          console.log('🎉 Poll detected: SOS has been accepted!', data.data);
          
          // Use tasker_name from booking if available to show immediately
          const nameFromBooking = data.data.tasker_name || data.data.tasker_name;
          if (nameFromBooking) {
            setAcceptedTasker({ tasker_id: data.data.tasker_id, tasker_name: nameFromBooking });
            setSosStatus('accepted');
            setToastMessage({ 
              type: 'success', 
              message: '✅ Công việc đã được nhận! ' + nameFromBooking 
            });
            return;
          }

          // Fetch tasker info
          const taskerRes = await fetch(`http://localhost:3001/api/tasker/${data.data.tasker_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const taskerData = await taskerRes.json();
          if (taskerData.success && taskerData.data) {
            setAcceptedTasker({
              tasker_id: data.data.tasker_id,
              tasker_name: taskerData.data.user_name || taskerData.data.name
            });
            setSosStatus('accepted');
            setToastMessage({ 
              type: 'success', 
              message: '✅ Công việc đã được nhận! ' + (taskerData.data.user_name || taskerData.data.name) 
            });
          }
        }
      } catch (err) {
        console.error('Error polling SOS status:', err);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [sosBookingId, sosStatus, acceptedTasker]);

  // Listen for SOS job created and accepted events in real-time
  useEffect(() => {
    const handleSosCreated = (e) => {
      const data = e.detail || e;
      console.log('✅ [handleSosCreated] SOS job created event received:', data);
      setSosBookingId(data.booking_id);
      setSosStatus('waiting_accept');
      setAcceptedTasker(null);
      setToastMessage({ type: 'success', message: 'Gửi SOS thành công — đang chờ tasker nhận.' });
      setTopRightNotification({ type: 'info', message: '📩 SOS đã được gửi. Hệ thống đang thông báo tasker.' });
      // ensure cooldown is set (in case socket event arrives after create)
      const until = Date.now() + 30 * 1000;
      setSosDisabledUntil(until);
      try { localStorage.setItem('sos_disabled_until', String(until)); } catch (e) {}
      console.log('📍 [handleSosCreated] State updated - sosBookingId:', data.booking_id, 'sosStatus: waiting_accept');
    };

    const handleSosAccepted = async (e) => {
      const data = e.detail || e;
      console.log('🎉 [handleSosAccepted] Event triggered with data:', data);
      
      // Immediately fetch the full tasker info for real-time display
      try {
        const token = localStorage.getItem('token');
        const taskerId = data.taken_by_tasker_id || data.tasker_id;
        console.log('🔍 [handleSosAccepted] Extracted taskerId:', taskerId);
        
        if (!taskerId) {
          throw new Error('Missing tasker ID in event data');
        }
        
        const taskerRes = await fetch(`http://localhost:3001/api/tasker/${taskerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const taskerData = await taskerRes.json();
        console.log('📦 [handleSosAccepted] Fetched tasker data:', taskerData);
        
        if (taskerData.success && taskerData.data) {
          const taskerName = taskerData.data.user_name || taskerData.data.name;
          console.log('✅ [handleSosAccepted] Setting acceptedTasker:', { tasker_id: taskerId, tasker_name: taskerName });
          
          setAcceptedTasker({
            tasker_id: taskerId,
            tasker_name: taskerName
          });
        } else {
          throw new Error('Invalid tasker data response');
        }
      } catch (err) {
        console.error('❌ [handleSosAccepted] Error fetching tasker info:', err);
        // Fallback: use data from socket event
        const fallbackTaskerId = data.taken_by_tasker_id || data.tasker_id;
        const fallbackTaskerName = data.taken_by_name || data.tasker_name || 'Tasker';
        console.log('📌 [handleSosAccepted] Using fallback data:', { fallbackTaskerId, fallbackTaskerName });
        
        setAcceptedTasker({
          tasker_id: fallbackTaskerId,
          tasker_name: fallbackTaskerName,
        });
      }
      
      console.log('📍 [handleSosAccepted] Setting sosStatus to accepted');
      setSosStatus('accepted');
      setToastMessage({ type: 'success', message: 'Công việc đã được nhận. Vui lòng kiểm tra thông tin người nhận.' });
      // clear create cooldown when accepted
      setSosDisabledUntil(null);
      try { localStorage.removeItem('sos_disabled_until'); } catch (e) {}
    };

    window.addEventListener('socket_sos_job_created', handleSosCreated);
    // Listen to both events for compatibility
    window.addEventListener('socket_sos_job_taken', handleSosAccepted);
    window.addEventListener('socket_sos_job_accepted', handleSosAccepted);
    
    // Also listen for socket disconnection
    window.addEventListener('socket_error', (e) => {
      console.error('🔌 [TaskerSearch] Socket error event:', e.detail);
      if (sosBookingId && sosStatus === 'waiting_accept') {
        setToastMessage({ type: 'warning', message: '⚠️ Kết nối bị mất. Đang tự động kết nối lại...' });
      }
    });

    return () => {
      window.removeEventListener('socket_sos_job_created', handleSosCreated);
      window.removeEventListener('socket_sos_job_taken', handleSosAccepted);
      window.removeEventListener('socket_sos_job_accepted', handleSosAccepted);
      window.removeEventListener('socket_error', handleSosCreated);
    };
  }, []);

  // Auto-hide toast when set
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Auto-hide top-right notification
  useEffect(() => {
    if (!topRightNotification) return;
    const t = setTimeout(() => setTopRightNotification(null), 4000);
    return () => clearTimeout(t);
  }, [topRightNotification]);

  useEffect(() => {
    let map = null;
    const initMap = () => {
      if (!window.vietmapgl || !mapContainer.current || mapRef.current) {
        return;
      }
      const apiKey = process.env.REACT_APP_VIETMAP_APIKEY || '1fa61c768541c030585bdd9aa021c5a7e74a477fe7ae2540';
      map = new window.vietmapgl.Map({
        container: mapContainer.current,
        style: `https://maps.vietmap.vn/mt/tm/style.json?apikey=${apiKey}`,
        center: [106.654551, 10.762317],
        zoom: 11,
      });
      const geolocateControl = new window.vietmapgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      });
      map.addControl(geolocateControl);
      map.addControl(new window.vietmapgl.NavigationControl(), 'top-right');
      mapRef.current = map;
      geolocateControlRef.current = geolocateControl;

      geolocateControl.on('geolocate', (e) => {
        const { longitude: lng, latitude: lat } = e.coords;
        setCurrentLocation({ lat, lng });
        map.flyTo({ center: [lng, lat], zoom: 14 });
        setError(null);
      });

      map.on('load', () => {
        map.addSource('taskers', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
        map.addLayer({
          id: 'taskers-layer',
          type: 'circle',
          source: 'taskers',
          paint: {
            'circle-radius': 12,
            'circle-color': '#ff5733',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
          },
        });
        map.addSource('current-location', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
        map.addLayer({
          id: 'current-location-layer',
          type: 'circle',
          source: 'current-location',
          paint: {
            'circle-radius': 15,
            'circle-color': '#e74c3c',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
          },
        });
        map.on('click', 'taskers-layer', (e) => {
          const coordinates = e.features[0].geometry.coordinates.slice();
          const { name, distance } = e.features[0].properties;
          new window.vietmapgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
              <h6>${name}</h6>
              <p>Khoảng cách: ${(distance / 1000).toFixed(2)} km</p>
            `)
            .addTo(map);
        });
      });
    };

    if (!window.vietmapgl) {
      if (!document.querySelector('script[src*="vietmap-gl.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@vietmap/vietmap-gl-js@4.2.0/vietmap-gl.js';
        script.async = true;
        script.onload = initMap;
        document.body.appendChild(script);
        const link = document.createElement('link');
        link.href = 'https://unpkg.com/@vietmap/vietmap-gl-js@4.2.0/vietmap-gl.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
    } else {
      initMap();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const filterCount =
      (filters.services.length > 0 ? 1 : 0) +
      (filters.minRating > 0 ? 1 : 0) +
      (filters.radius !== 5000 ? 1 : 0);
    setActiveFilters(filterCount);
  }, [filters]);

  const searchNearbyTaskers = async () => {
    if (!currentLocation) {
      setError('Vui lòng lấy vị trí hiện tại trước khi tìm kiếm.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await addressAPI.searchNearby(
        currentLocation.lat,
        currentLocation.lng,
        filters.radius,
        filters.services,
        filters.minRating,
        token
      );
      if (mapRef.current && mapRef.current.getSource('taskers')) {
        mapRef.current.getSource('taskers').setData({
          type: 'FeatureCollection',
          features: response.users.map((tasker) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [tasker.lng, tasker.lat],
            },
            properties: {
              user_id: tasker.user_id,
              name: tasker.name,
              distance: tasker.distance,
            },
          })),
        });
        // Ensure the layer is visible and uses the same red dot style in SOS mode
        try {
          if (mapRef.current.getLayer('taskers-layer')) {
            mapRef.current.setLayoutProperty('taskers-layer', 'visibility', 'visible');
            // enforce paint color used for normal mode markers
            mapRef.current.setPaintProperty('taskers-layer', 'circle-color', '#ff5733');
            mapRef.current.setPaintProperty('taskers-layer', 'circle-radius', 12);
          }
        } catch (e) {
          // non-fatal
          console.debug('Could not set taskers-layer properties:', e);
        }
      }
      setSearchMetadata({
        filters_applied: { min_rating: filters.minRating, services: filters.services },
        total_filtered_before_geofence: response.total_filtered_before_geofence || 0,
        total_in_range: response.users ? response.users.length : 0,
      });
      if (mapRef.current && mapRef.current.getSource('current-location')) {
        mapRef.current.getSource('current-location').setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [currentLocation.lng, currentLocation.lat] },
              properties: {},
            },
          ],
        });
      }
      if (circleLayer && mapRef.current.getLayer('circle-layer')) {
        mapRef.current.removeLayer('circle-layer');
        mapRef.current.removeSource('circle');
      }
      if (mapRef.current) {
        mapRef.current.addSource('circle', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [currentLocation.lng, currentLocation.lat],
            },
            properties: {
              radius: filters.radius,
            },
          },
        });
        mapRef.current.addLayer({
          id: 'circle-layer',
          type: 'circle',
          source: 'circle',
          paint: {
            'circle-radius': ['case', ['==', ['get', 'radius'], 0], 0, ['/', ['get', 'radius'], 100]],
            'circle-color': '#007cbf',
            'circle-opacity': 0.2,
          },
        });
        setCircleLayer(true);
      }
      setTaskers(
        response.users.map((user) => ({
          ...user,
          service_variants: user.service_variants || [],
          distance: parseFloat(user.distance) || 0,
          rating: parseFloat(user.rating) || 0,
        }))
      );
    } catch (error) {
      console.error('Search error:', error);
      setError(`Lỗi khi tìm kiếm tasker: ${error.message}`);
      setTaskers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceToggle = (serviceId) => {
    setFilters((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const toggleSOSMode = async () => {
    const next = !isSOSMode;

    if (next) {
      // Entering SOS mode
      const authed = (typeof isAuthenticated === 'function') ? isAuthenticated() : !!(isAuthenticated && token);
      if (!authed) {
        console.warn('❌ User not authenticated. Redirecting to login...');
        setToastMessage({ type: 'warning', message: 'Vui lòng đăng nhập để sử dụng chức năng SOS' });
        setTimeout(() => navigate('/login'), 1000);
        return; // do not enter SOS mode
      }

      console.log('✅ User authenticated. Entering SOS mode...');
      setIsFilterOpen(false);
      // Clear old SOS bookings when entering SOS mode
      setSosBookingId(null);
      setAcceptedTasker(null);
      setSosStatus(null);
      setIsSOSMode(true);

      // Try to auto-trigger geolocation (robustly) and await result
      console.log('📍 Triggering auto-geolocation...');
      setToastMessage({ type: 'info', message: '📍 Đang lấy vị trí của bạn...' });
      try {
        const ok = await triggerGeolocation();
        if (ok) {
          setToastMessage({ type: 'success', message: '📍 Vị trí đã được lấy.' });
        } else {
          setToastMessage({ type: 'warning', message: '⚠️ Không thể tự động lấy vị trí — vui lòng nhấn nút vị trí.' });
          setError('Không thể lấy vị trí. Vui lòng kiểm tra quyền truy cập vị trí.');
        }
      } catch (e) {
        console.warn('❌ Auto geolocate failed:', e);
        setToastMessage({ type: 'warning', message: '⚠️ Không thể lấy vị trí — kiểm tra quyền truy cập.' });
        setError('Không thể lấy vị trí. Vui lòng kiểm tra quyền truy cập vị trí.');
      }
    } else {
      // Exiting SOS mode
      setIsSOSMode(false);
      setSosBookingId(null);
      setAcceptedTasker(null);
      setSosStatus(null);
      setToastMessage(null);
    }
  };

  const handleSelectServiceForSOS = (serviceId) => {
    setSelectedServiceId(serviceId);
    setSelectedVariantId(null);
    const s = services.find((x) => x.id === serviceId);
    setVariantPreview(null);
  };

  const handleSelectVariant = (variantId) => {
    setSelectedVariantId(variantId);
    // find variant object
    const svc = services.find((s) => s.id === selectedServiceId);
    const v = svc?.variants?.find((vv) => vv.variant_id === variantId);
    setVariantPreview(v || null);
  };

  const isElderlyOrChildCare = (serviceName) => {
    if (!serviceName) return false;
    const normalized = serviceName.trim().toLowerCase();
    return (
      normalized.includes('chăm sóc người già') ||
      normalized.includes('chăm sóc trẻ em') ||
      normalized.includes('chăm sóc bệnh nhân') ||
      normalized.includes('cham soc nguoi gia') ||
      normalized.includes('cham soc tre em') ||
      normalized.includes('cham soc benh nhan')
    );
  };

  const isCookingService = (serviceName) => {
    if (!serviceName) return false;
    const normalized = serviceName.trim().toLowerCase();
    return normalized.includes('nấu ăn') || normalized.includes('nau an');
  };

  const uploadSosPhoto = async (file) => {
    if (!file) return null;
    setUploadingPhotos(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const formData = new FormData();
      formData.append('images', file);
      const res = await fetch('http://localhost:3001/api/uploads/post-images', {
        method: 'POST',
        headers: {
          Authorization: user?.token ? `Bearer ${user.token}` : undefined,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data && data.data.urls && data.data.urls.length > 0) {
        return data.data.urls[0];
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploadingPhotos(false);
    }
    return null;
  };

  const handleAddSosPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setSosPhotos((prev) => [...prev, preview]);
    const uploaded = await uploadSosPhoto(file);
    if (uploaded) {
      setSosPhotos((prev) => prev.map((p) => (p === preview ? uploaded : p)));
    }
  };

  const handleCreateSOS = async () => {
    if (!selectedVariantId) {
      alert('Vui lòng chọn biến thể dịch vụ');
      return;
    }
    if (!sosJobDescription.trim()) {
      alert('Vui lòng nhập mô tả công việc');
      return;
    }
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user?.user_id) {
      alert('Vui lòng đăng nhập để gửi SOS');
      return;
    }

    // booking_time is the time the booking was created (use server/client now as source)
    const bookingTimeISO = new Date().toISOString();
    // compute start_time = booking_time + 20 minutes
    const startTimeISO = new Date(new Date(bookingTimeISO).getTime() + 20 * 60 * 1000).toISOString();

    // try reverse-geocode coordinates to address (using Nominatim as fallback)
    let addressString = '';
    if (currentLocation && currentLocation.lat && currentLocation.lng) {
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
            currentLocation.lat
          )}&lon=${encodeURIComponent(currentLocation.lng)}`,
          { headers: { 'User-Agent': 'homehelper-dev' } }
        );
        if (resp.ok) {
          const data = await resp.json();
          addressString = data.display_name || `${currentLocation.lat},${currentLocation.lng}`;
        } else {
          addressString = `${currentLocation.lat},${currentLocation.lng}`;
        }
      } catch (err) {
        console.warn('Reverse geocode failed, using coords:', err);
        addressString = `${currentLocation.lat},${currentLocation.lng}`;
      }
    }

    const payload = {
      variant_id: selectedVariantId,
      // include both coords and a human-readable address
      location: currentLocation ? `${currentLocation.lat},${currentLocation.lng}` : '',
      address: addressString,
      booking_time: bookingTimeISO,
      start_time: startTimeISO,
      type: 'Home',
      task: {
        description: sosJobTitle || sosJobDescription,
        checklist: sosJobDescription,
        photos: sosPhotos || [],
      },
    };

    // include duration according to service type
    const svc = services.find((s) => s.id === selectedServiceId);
    const svcName = svc?.name || '';
    if (isElderlyOrChildCare(svcName)) {
      payload.duration_days = parseInt(durationDays) || 1;
    } else if (isCookingService(svcName)) {
      // Cooking: no duration multiplier, just price_max * 1.3
      payload.duration_days = null;
      payload.duration_hours = null;
    } else {
      // default: hourly
      payload.duration_hours = parseInt(durationHours) || 1;
    }

    // compute expected price (+30%)
    const priceBase = variantPreview ? (variantPreview.price_max || variantPreview.price_min || 0) : 0;
    let expectedPrice;
    if (isCookingService(svcName)) {
      // Cooking: price_max * 1.3 only
      expectedPrice = Math.round(priceBase * 1.3);
    } else {
      // Care or hourly: multiply by duration
      const duration = payload.duration_days || payload.duration_hours || 1;
      expectedPrice = Math.round(priceBase * duration * 1.3);
    }
    payload.expected_price = expectedPrice;

    try {
      setSosStatus('sending');
      // Ensure socket is connected
      if (!socketService.getSocket() || !socketService.getConnectionStatus().isConnected) {
        alert('Socket chưa kết nối, vui lòng thử lại sau');
        setSosStatus(null);
        return;
      }

      socketService.createSOSJob(payload);
      // wait for server acknowledgement via 'sos_job_created' event (handled in SocketContext)
      setSosStatus('waiting_accept');
      setToastMessage({ type: 'info', message: 'Đang gửi SOS...' });
      // disable SOS button immediately for 10 minutes
       const until = Date.now() + 30 * 1000;    // 30 giây
      setSosDisabledUntil(until);
      try { localStorage.setItem('sos_disabled_until', String(until)); } catch (e) {}
      
      // Auto-search nearby taskers when SOS is sent to show them on map
      if (currentLocation) {
        try {
          const response = await addressAPI.searchNearby(
            currentLocation.lat,
            currentLocation.lng,
            filters.radius,
            [selectedServiceId], // filter by selected service
            filters.minRating,
            token
          );
          if (response.users && response.users.length > 0) {
            // Update map with nearby taskers
            if (mapRef.current && mapRef.current.getSource('taskers')) {
              mapRef.current.getSource('taskers').setData({
                type: 'FeatureCollection',
                features: response.users.map((tasker) => ({
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [tasker.lng, tasker.lat],
                  },
                  properties: {
                    user_id: tasker.user_id,
                    name: tasker.name,
                    distance: tasker.distance,
                  },
                })),
              });
              // Update taskers list
              setTaskers(
                response.users.map((user) => ({
                  ...user,
                  service_variants: user.service_variants || [],
                  distance: parseFloat(user.distance) || 0,
                  rating: parseFloat(user.rating) || 0,
                }))
              );
            }
          }
        } catch (err) {
          console.warn('Error fetching nearby taskers for SOS:', err);
        }
      }
    } catch (err) {
      console.error('Lỗi gửi SOS:', err);
      setSosStatus('error');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Try to trigger geolocation robustly: use control API if available,
  // otherwise attempt to click the control DOM node (with retries).
  const triggerGeolocation = async (opts = { attempts: 6, interval: 300 }) => {
    const { attempts, interval } = opts || {};

    const tryClickDom = () => {
      // common control selectors used by Vietmap/Mapbox-style controls
      const selectors = [
        '.vietmapgl-ctrl-geolocate button',
        '.vietmapgl-ctrl-geolocate',
        '.vietmapgl-ctrl-icon',
        '.mapboxgl-ctrl-geolocate button'
      ];
      for (const s of selectors) {
        const el = document.querySelector(s);
        if (el) {
          try { el.click(); return true; } catch (e) { continue; }
        }
      }
      return false;
    };

    // 1) Preferred: use control reference if available
    if (geolocateControlRef.current && typeof geolocateControlRef.current.trigger === 'function') {
      try {
        geolocateControlRef.current.trigger();
        return true;
      } catch (e) {
        console.warn('Geolocate control trigger failed:', e);
      }
    }

    // 2) Fallback: attempt DOM click with retries
    for (let i = 0; i < attempts; i += 1) {
      const ok = tryClickDom();
      if (ok) return true;
      // wait a bit and retry (control may not be rendered immediately)
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, interval));
    }

    console.warn('Unable to auto-trigger geolocation control');
    return false;
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Keep a ticking timestamp to re-evaluate cooldown and show remaining time
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const isCooldownActive = sosDisabledUntil && nowTs < sosDisabledUntil && sosStatus !== 'accepted';
  const cooldownMinutesLeft = sosDisabledUntil ? Math.ceil(Math.max(0, sosDisabledUntil - nowTs) / 60000) : 0;

  return (
    <div className="tasker-search-container">
      {/* Header Section */}
      <div className={`hero-section ${isSOSMode ? 'sos-active' : ''}`} style={{ backgroundImage: "url('/images/bg_2.jpg')" }}>
        <div className="overlay"></div>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="hero-content text-center text-white">
                <div className="d-flex justify-content-center align-items-center gap-3">
                  <h1 className="mb-3">Tìm Tasker Gần Bạn</h1>
                  {isSOSMode && (
                    <div className="sos-indicator">
                      <span className="pulse" aria-hidden></span>
                      SOS
                    </div>
                  )}
                </div>
                <p className="lead">Tìm kiếm tasker chuyên nghiệp theo vị trí, dịch vụ và đánh giá</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`container-fluid py-4 main-content ${isSOSMode ? 'sos-mode' : ''}`}>
        <div className={`row ${isSOSMode ? 'sos-mode-layout' : ''}`}>
          {/* Mobile Filter Toggle Button */}
          <div className="col-12 d-lg-none mb-3">
            <button className="btn btn-primary w-100" onClick={toggleFilter}>
              <FontAwesomeIcon icon={faBars} className="mr-2" />
              Bộ Lọc Tìm Kiếm ({activeFilters})
            </button>
          </div>

          {/* Left Sidebar - Filters */}
          <div className={`${isSOSMode ? 'd-none' : 'col-lg-3'} filters-sidebar-container ${isFilterOpen ? 'filters-open' : ''}`}>
            <div className="filters-sidebar bg-white rounded shadow-sm p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Bộ Lọc Tìm Kiếm</h5>
                <button className="btn btn-outline-primary btn-sm d-lg-block d-none">
                  <FontAwesomeIcon icon={faFilter} className="mr-1" />
                  Bộ lọc ({activeFilters})
                </button>
                <button className="btn btn-outline-secondary btn-sm d-lg-none" onClick={toggleFilter}>
                  Đóng
                </button>
              </div>

              {/* Location */}
              <div className="filter-section mb-4">
                <h6>Vị trí</h6>
                <button
                  className="btn btn-outline-secondary btn-sm w-100 mb-2"
                  onClick={triggerGeolocation}
                  disabled={isLoading}
                >
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                  Sử dụng vị trí hiện tại
                </button>
                <div className="form-group">
                  <label>Bán kính tìm kiếm: {filters.radius / 1000} km</label>
                  <input
                    type="range"
                    className="form-control-range"
                    min="1000"
                    max="15000"
                    step="1000"
                    value={filters.radius}
                    onChange={(e) => handleFilterChange('radius', parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Minimum Rating */}
              <div className="filter-section mb-4">
                <h6>Đánh giá tối thiểu</h6>
                <div className="form-group">
                  <label>{filters.minRating} sao</label>
                  <input
                    type="range"
                    className="form-control-range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                  />
                  <div className="d-flex align-items-center mt-2">
                    <FontAwesomeIcon icon={faStar} className="text-warning mr-1" />
                    <span>{filters.minRating > 0 ? `${filters.minRating}+ sao` : 'Tất cả'}</span>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="filter-section mb-4">
                <h6>Dịch vụ</h6>
                <div className="services-list">
                  {services.map((service) => (
                    <div key={service.id} className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`service-${service.id}`}
                        checked={filters.services.includes(service.id)}
                        onChange={() => handleServiceToggle(service.id)}
                      />
                      <label className="form-check-label" htmlFor={`service-${service.id}`}>
                        {service.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Apply Filters Button */}
              <button
                className="btn btn-primary w-100"
                onClick={searchNearbyTaskers}
                disabled={isLoading || !currentLocation}
              >
                <FontAwesomeIcon icon={faSearch} className="mr-2" />
                {isLoading ? 'Đang tìm kiếm...' : 'Áp dụng bộ lọc'}
              </button>
            </div>
          </div>

          {/* Right Content - Search Results */}
          <div className={`${isSOSMode ? 'col-12' : 'col-lg-9'} search-results-container`}>
            {/* Error Message */}
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {/* Search Summary */}
            {taskers.length > 0 && (
              <div className="search-summary bg-white rounded shadow-sm p-3 mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">
                      Tìm thấy {taskers.length} tasker trong bán kính {filters.radius / 1000}km
                      {filters.minRating > 0 && ` với đánh giá ${filters.minRating}+ sao`}
                      {filters.services.length > 0 &&
                        ` cung cấp dịch vụ: ${filters.services
                          .map((id) => services.find((s) => s.id === id)?.name || 'Unknown')
                          .join(', ')}`}
                    </h5>
                    <p className="text-muted mb-0">
                      Tổng tasker phù hợp trước lọc vị trí: {searchMetadata.total_filtered_before_geofence || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SOS Panel Toggle & Form */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
                  SOS - Gửi yêu cầu khẩn
                </h5>
                <button className={`btn ${isSOSMode ? 'btn-outline-danger' : 'btn-danger'}`} onClick={toggleSOSMode}>
                  {isSOSMode ? 'Thoát SOS' : 'Chuyển sang SOS'}
                </button>
              </div>

              {isSOSMode && (
                <div className="card border-danger border-2 bg-white rounded-3 shadow-sm">
                  <div className="card-body p-4">
                    {/* Section 1: Service & Pricing */}
                    <div className="mb-4">
                      <h6 className="fw-bold text-dark mb-3">
                        <i className="bi bi-briefcase me-2 text-primary"></i>
                        Chọn dịch vụ
                      </h6>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Dịch vụ</label>
                          <select className="form-select form-select-lg" value={selectedServiceId || ''} onChange={(e) => handleSelectServiceForSOS(Number(e.target.value))}>
                            <option value="">-- Chọn dịch vụ --</option>
                            {services
                              .filter(s => {
                                const name = String(s.name || '').toLowerCase();
                                return (
                                  name.includes('nấu ăn') || name.includes('nau an') ||
                                  name.includes('dọn dẹp') || name.includes('don dep') ||
                                  name.includes('chăm sóc người già') || name.includes('cham soc nguoi gia') ||
                                  name.includes('chăm sóc trẻ em') || name.includes('cham soc tre em') ||
                                  name.includes('chăm sóc bệnh nhân') || name.includes('cham soc benh nhan')
                                );
                              })
                              .map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                          </select>
                        </div>

                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Biến thể</label>
                          <select className="form-select form-select-lg" value={selectedVariantId || ''} onChange={(e) => handleSelectVariant(Number(e.target.value))}>
                            <option value="">-- Chọn biến thể --</option>
                            {services.find(s => s.id === selectedServiceId)?.variants?.map(v => (
                              <option key={v.variant_id} value={v.variant_id}>{v.variant_name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Giá dự tính (+30%)</label>
                          <div className="bg-success bg-opacity-10 border border-success rounded-2 p-3 text-center h-100 d-flex align-items-center justify-content-center">
                            <div>
                              <div className="small text-muted mb-1">Giá dự tính:</div>
                              <h4 className="fw-bold text-success mb-0">
                                {variantPreview ? (() => {
                                  const priceMax = Number(variantPreview.price_max || variantPreview.price_min || 0);
                                  const svc = services.find((s) => s.id === selectedServiceId);
                                  const svcName = svc?.name || '';
                                  let preview;
                                  if (isCookingService(svcName)) {
                                    preview = Math.round(priceMax * 1.3);
                                  } else if (isElderlyOrChildCare(svcName)) {
                                    const multiplier = Number(durationDays || 1);
                                    preview = Math.round(priceMax * multiplier * 1.3);
                                  } else {
                                    const multiplier = Number(durationHours || 1);
                                    preview = Math.round(priceMax * multiplier * 1.3);
                                  }
                                  return `${preview.toLocaleString('vi-VN')}đ`;
                                })() : '—'}
                              </h4>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Duration Input - Show Only If Needed */}
                      {(() => {
                        const svc = services.find((s) => s.id === selectedServiceId);
                        const svcName = svc?.name || '';
                        if (isCookingService(svcName)) {
                          return null;
                        }
                        if (isElderlyOrChildCare(svcName)) {
                          return (
                            <div className="row g-3 mt-1">
                              <div className="col-md-4">
                                <label className="form-label fw-semibold">Số ngày cần chăm sóc</label>
                                <input
                                  type="number"
                                  min={1}
                                  className="form-control form-control-lg"
                                  value={durationDays}
                                  onChange={(e) => setDurationDays(e.target.value ? Number(e.target.value) : '')}
                                  placeholder="Nhập số ngày"
                                />
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className="row g-3 mt-1">
                            <div className="col-md-4">
                              <label className="form-label fw-semibold">Số giờ dự tính</label>
                              <input
                                type="number"
                                min={1}
                                className="form-control form-control-lg"
                                value={durationHours}
                                onChange={(e) => setDurationHours(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Nhập số giờ"
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <hr className="my-4" />

                    {/* Section 2: Job Details */}
                    <div className="mb-4">
                      <h6 className="fw-bold text-dark mb-3">
                        <i className="bi bi-file-text me-2 text-primary"></i>
                        Chi tiết công việc
                      </h6>
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label fw-semibold">Tiêu đề công việc</label>
                          <input 
                            className="form-control form-control-lg" 
                            value={sosJobTitle} 
                            onChange={(e) => setSosJobTitle(e.target.value)} 
                            placeholder="Tóm tắt ngắn gọn công việc của bạn"
                          />
                        </div>

                        <div className="col-12">
                          <label className="form-label fw-semibold">Mô tả chi tiết</label>
                          <textarea 
                            className="form-control" 
                            rows={4} 
                            value={sosJobDescription} 
                            onChange={(e) => setSosJobDescription(e.target.value)}
                            placeholder="Mô tả chi tiết về công việc bạn cần làm, yêu cầu đặc biệt, v.v..."
                          />
                        </div>
                      </div>
                    </div>

                    <hr className="my-4" />

                    {/* Section 3: Photos */}
                    <div className="mb-4">
                      <h6 className="fw-bold text-dark mb-3">
                        <i className="bi bi-image me-2 text-primary"></i>
                        Hình ảnh tham khảo (Tùy chọn)
                      </h6>
                      <div className="d-flex align-items-start gap-3">
                        <label className="btn btn-outline-primary btn-lg flex-shrink-0">
                          <i className="bi bi-plus-circle me-2"></i>
                          Thêm ảnh
                          <input type="file" accept="image/*" hidden onChange={handleAddSosPhoto} disabled={uploadingPhotos} />
                        </label>
                        <div className="d-flex gap-2 flex-wrap">
                          {sosPhotos.map((url, i) => (
                            <div key={i} style={{ width: 100, height: 100, overflow: 'hidden', borderRadius: 8, border: '2px solid #dee2e6' }}>
                              <img src={url} alt={`sos-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ))}
                        </div>
                      </div>
                      {uploadingPhotos && <small className="text-muted d-block mt-2">Đang tải ảnh lên...</small>}
                    </div>

                    <hr className="my-4" />

                    {/* Section 4: Action Button */}
                    <div className="d-flex justify-content-end gap-2">
                      <button 
                        className="btn btn-outline-secondary btn-lg" 
                        onClick={toggleSOSMode}
                      >
                        Hủy
                      </button>
                      <button 
                        className="btn btn-danger btn-lg fw-bold" 
                        onClick={handleCreateSOS} 
                        disabled={!selectedVariantId || !sosJobDescription || uploadingPhotos || sosStatus === 'sending' || isCooldownActive}
                      >
                        <i className="bi bi-exclamation-circle me-2"></i>
                        {sosStatus === 'sending' ? 'Đang gửi...' : isCooldownActive ? `Đã gửi — chờ ${cooldownMinutesLeft} phút` : 'Gửi SOS ngay'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Map Container */}
            <div className="map-container bg-white rounded shadow-sm mb-4">
              <div
                ref={mapContainer}
                style={{
                  width: '100%',
                  height: '500px',
                  position: 'relative',
                  border: '2px solid #007bff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  borderRadius: '8px',
                }}
              />
            </div>

            {/* Taskers List */}
            <div className={`taskers-list-container bg-white rounded shadow-sm p-4 ${acceptedTasker && sosBookingId && isSOSMode ? 'hide-on-sos-accepted' : ''}`}>
              <h5 className="mb-3">{isSOSMode ? 'Tìm thấy người giúp việc' : 'Tasker Gần Bạn'}</h5>

              {/* SOS loader / accepted booking summary shown under title */}
              {isSOSMode && sosBookingId && !acceptedTasker && sosStatus === 'waiting_accept' && (
                <div className="bg-white rounded shadow-sm p-3 mb-3 d-flex align-items-center gap-3 sos-waiting-card">
                  <div className="spinner-border text-primary" role="status" style={{width: '2rem', height: '2rem'}}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <div>
                    <div className="fw-semibold">Đang chờ tasker nhận...</div>
                    <div className="small text-muted">Hệ thống đang thông báo các tasker gần bạn — vui lòng chờ hoặc hủy SOS để thử lại.</div>
                  </div>
                </div>
              )}

              {isSOSMode && sosBookingId && acceptedTasker && (
                <div className="bg-white rounded shadow-sm p-3 mb-3 accepted-booking-summary">
                  <div className="d-flex align-items-center justify-content-between flex-wrap">
                    <div className="d-flex align-items-center gap-3">
                      <div className="avatar-circle bg-success text-white d-flex align-items-center justify-content-center" style={{width:56,height:56,borderRadius:28,fontSize:20,fontWeight:700}}>
                        {acceptedTasker.tasker_name?.slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className="fw-semibold text-success">✓ {acceptedTasker.tasker_name} đã nhận đơn</div>
                        <div className="small text-muted">Vui lòng thanh toán để bắt đầu dịch vụ.</div>
                      </div>
                    </div>
                    <div className="d-flex gap-2 mt-3 mt-md-0">
                      <button className="btn btn-outline-primary btn-sm" onClick={() => window.location.href = `/tasker-profile/${acceptedTasker.tasker_id}`}>
                        Hồ sơ
                      </button>
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => window.location.href = `/chat?bookingId=${sosBookingId}&peer=${acceptedTasker.tasker_id}`}>
                        Chat
                      </button>
                      <button className="btn btn-success btn-sm fw-semibold" onClick={() => window.location.href = `/payment/${sosBookingId}`}>
                        💳 Thanh toán
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="taskers-list">
                {taskers.length > 0 ? (
                  taskers.map((tasker) => (
                    <div key={tasker.user_id} className="mb-3">
                      <div className="tasker-card bg-white rounded shadow-sm p-4">
                        <div className="row align-items-center">
                          {/* Avatar, Name, and Rating (Left) */}
                          <div className="col-md-3 col-12 col-md-auto mb-3 mb-md-0">
                            <div className="tasker-avatar-wrapper">
                              <div className="tasker-avatar">
                                <span className="initials">{tasker.name?.slice(0, 2).toUpperCase()}</span>
                              </div>
                              <div className="tasker-basic-info mt-2">
                                <h6 className="mb-1">{tasker.name}</h6>
                                <div className="rating mb-1">
                                  <FontAwesomeIcon icon={faStar} className="text-warning mr-1" />
                                  <span>{tasker.rating ? `${tasker.rating.toFixed(1)}/5` : 'Chưa có đánh giá'}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Services (Middle) */}
                          <div className="col-md-6 col-12 col-md-auto mb-3 mb-md-0 services-container">
                            <div className="services-offered">
                              {tasker.service_variants && tasker.service_variants.length > 0 ? (
                                tasker.service_variants.map((variant, index) => (
                                  <span key={index} className="badge badge-soft-primary mr-2 mb-1">
                                    {variant.service_name}
                                  </span>
                                ))
                              ) : (
                                <small className="text-muted">Không có dịch vụ</small>
                              )}
                            </div>
                          </div>

                          {/* Actions (Right) */}
                          <div className="col-md-3 col-12 col-md-auto text-md-right d-flex flex-column flex-md-row justify-content-md-end">
                            <Link
                              to={`/tasker-profile/${tasker.user_id}`}
                              className="btn btn-outline-primary btn-sm mb-2 mb-md-0 mr-md-2 w-100 w-md-auto"
                            >
                              <FontAwesomeIcon icon={faEye} className="mr-1" />
                              Xem hồ sơ
                            </Link>
                            <button className="btn btn-primary btn-sm w-100 w-md-auto">
                              Đặt dịch vụ
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">Không tìm thấy tasker nào phù hợp với tiêu chí. Thử điều chỉnh bộ lọc!</p>
                )}
              </div>
            </div>

            {/* Inline toast for SOS actions */}
            {toastMessage && (
              <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 20000 }}>
                <div className={`toast show align-items-center text-white bg-${toastMessage.type}`} role="alert">
                  <div className="d-flex">
                    <div className="toast-body">{toastMessage.message}</div>
                    <button type="button" className="btn-close btn-close-white me-2 m-auto" aria-label="Close" onClick={() => setToastMessage(null)}></button>
                  </div>
                </div>
              </div>
            )}

            {/* Top-right notification (e.g., SOS sent) */}
            {topRightNotification && (
              <div style={{ position: 'fixed', right: 20, top: 20, zIndex: 20000 }}>
                <div className={`toast show align-items-center text-dark bg-white border`} role="alert">
                  <div className="d-flex">
                    <div className="toast-body">{topRightNotification.message}</div>
                    <button type="button" className="btn-close ms-2 m-auto" aria-label="Close" onClick={() => setTopRightNotification(null)}></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskerSearch;