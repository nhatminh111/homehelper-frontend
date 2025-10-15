import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import '../css/TaskerSearch.css'; // Nhập file CSS riêng

const TaskerSearch = () => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const geolocateControlRef = useRef(null);
  const { token, isAuthenticated } = useAuth();
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null); // { lng, lat }
  const [circleLayer, setCircleLayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    radius: 5000,
    minRating: 0,
    services: [],
  });
  const [activeFilters, setActiveFilters] = useState(0);
  const [taskers, setTaskers] = useState([]);
  const [services, setServices] = useState([]);
  const [searchMetadata, setSearchMetadata] = useState({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesData = await servicesAPI.getAllServices();
        setServices(
          servicesData.map((service) => ({
            id: service.service_id,
            name: service.name,
          }))
        );
      } catch (error) {
        console.error('Error fetching services:', error);
        setError('Không thể tải danh sách dịch vụ');
      }
    };
    fetchServices();
  }, []);

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

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const triggerGeolocation = () => {
    if (geolocateControlRef.current) {
      geolocateControlRef.current.trigger();
    }
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  return (
    <div className="tasker-search-container">
      {/* Header Section */}
      <div className="hero-section" style={{ backgroundImage: "url('/images/bg_2.jpg')" }}>
        <div className="overlay"></div>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="hero-content text-center text-white">
                <h1 className="mb-3">Tìm Tasker Gần Bạn</h1>
                <p className="lead">Tìm kiếm tasker chuyên nghiệp theo vị trí, dịch vụ và đánh giá</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-fluid py-4 main-content">
        <div className="row">
          {/* Mobile Filter Toggle Button */}
          <div className="col-12 d-lg-none mb-3">
            <button className="btn btn-primary w-100" onClick={toggleFilter}>
              <FontAwesomeIcon icon={faBars} className="mr-2" />
              Bộ Lọc Tìm Kiếm ({activeFilters})
            </button>
          </div>

          {/* Left Sidebar - Filters */}
          <div className={`col-lg-3 filters-sidebar-container ${isFilterOpen ? 'filters-open' : ''}`}>
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
          <div className="col-lg-9 search-results-container">
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
            <div className="taskers-list-container bg-white rounded shadow-sm p-4">
              <h5 className="mb-3">Tasker Gần Bạn</h5>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskerSearch;