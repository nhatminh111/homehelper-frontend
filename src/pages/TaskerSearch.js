<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faMapMarkerAlt,
  faStar,
  faDollarSign,
  faCheck,
  faEye,
  faComments,
  faFilter,
  faArrowLeft,
  faClock,
  faUser,
  faGlobe,
  faAward,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
=======
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
  faDollarSign
} from '@fortawesome/free-solid-svg-icons';
>>>>>>> f7d84bc98da8d00686ffbb6d735ecfadf325aff3

const TaskerSearch = () => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const geolocateControlRef = useRef(null);
  const { token, isAuthenticated } = useAuth();
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);  // { lng, lat }
  const [circleLayer, setCircleLayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
<<<<<<< HEAD
    location: "",
    radius: 5,
    minRating: 4,
    hourlyRate: [20, 50],
    services: [],
    availability: "any",
    experience: "any",
    verifiedOnly: true,
=======
    radius: 5000,
    minRating: 0,
    services: [],
>>>>>>> f7d84bc98da8d00686ffbb6d735ecfadf325aff3
  });
  const [activeFilters, setActiveFilters] = useState(0);
  const [taskers, setTaskers] = useState([]);
  const [services, setServices] = useState([]);
  const [searchMetadata, setSearchMetadata] = useState({});

<<<<<<< HEAD
  const [activeFilters, setActiveFilters] = useState(3);
  const [taskers, setTaskers] = useState([]);
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch dữ liệu từ backend
  useEffect(() => {
    fetch(
      `http://localhost:3001/api/taskers?search=${encodeURIComponent(
        searchTerm
      )}`
    )
      .then((res) => res.json())
      .then((data) => setTaskers(data))
      .catch((err) => console.error("❌ Fetch error:", err));
  }, [searchTerm]); // chạy lại khi search thay đổi

  useEffect(() => {
    fetch("http://localhost:3001/api/services")
      .then((res) => res.json())
      .then((data) => {
        console.log("📌 Services API:", data);
        setServices(data.services || []);
      })
      .catch((err) => console.error("❌ Fetch services error:", err));
  }, []);

  const handleServiceToggle = (service) => {
    setFilters((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
=======
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesData = await servicesAPI.getAllServices();
        setServices(servicesData.map(service => ({
          id: service.service_id,
          name: service.name,
        })));
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
      map.addControl(new window.vietmapgl.NavigationControl(), 'top-right'); // Thêm điều khiển zoom và xoay

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
          data: { type: 'FeatureCollection', features: [] }
        });

        map.addLayer({
          id: 'taskers-layer',
          type: 'circle',
          source: 'taskers',
          paint: {
            'circle-radius': 12, // Tăng kích thước điểm
            'circle-color': '#ff5733', // Màu cam nổi bật
            'circle-stroke-width': 3, // Tăng độ dày viền
            'circle-stroke-color': '#ffffff'
          }
        });

        map.addSource('current-location', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });

        map.addLayer({
          id: 'current-location-layer',
          type: 'circle',
          source: 'current-location',
          paint: {
            'circle-radius': 15, // Tăng kích thước điểm vị trí hiện tại
            'circle-color': '#e74c3c', // Màu đỏ nổi bật
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff'
          }
        });

        // Thêm popup khi click vào tasker
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
    const filterCount = (filters.services.length > 0 ? 1 : 0) + 
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
          features: response.users.map(tasker => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [tasker.lng, tasker.lat]
            },
            properties: {
              user_id: tasker.user_id,
              name: tasker.name,
              distance: tasker.distance
            }
          }))
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
          features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [currentLocation.lng, currentLocation.lat] }, properties: {} }]
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
              coordinates: [currentLocation.lng, currentLocation.lat] 
            },
            properties: {
              radius: filters.radius
            }
          }
        });

        mapRef.current.addLayer({
          id: 'circle-layer',
          type: 'circle',
          source: 'circle',
          paint: {
            'circle-radius': [
              'case',
              ['==', ['get', 'radius'], 0],
              0,
              ['/', ['get', 'radius'], 100]
            ],
            'circle-color': '#007cbf',
            'circle-opacity': 0.2
          }
        });

        setCircleLayer(true);
      }

      setTaskers(response.users.map(user => ({
        ...user,
        service_variants: user.service_variants || [],
        distance: parseFloat(user.distance) || 0,
        rating: parseFloat(user.rating) || 0
      })));
    } catch (error) {
      console.error('Search error:', error);
      setError(`Lỗi khi tìm kiếm tasker: ${error.message}`);
      setTaskers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceToggle = (serviceId) => {
    setFilters(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
>>>>>>> f7d84bc98da8d00686ffbb6d735ecfadf325aff3
    }));
  };

  const handleFilterChange = (key, value) => {
<<<<<<< HEAD
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
=======
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const triggerGeolocation = () => {
    if (geolocateControlRef.current) {
      geolocateControlRef.current.trigger();
    }
>>>>>>> f7d84bc98da8d00686ffbb6d735ecfadf325aff3
  };

  return (
    <div className="tasker-search-container">
      {/* Header Section */}
      <div
        className="hero-section"
        style={{ backgroundImage: "url('/images/bg_2.jpg')" }}
      >
        <div className="overlay"></div>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="hero-content text-center text-white">
<<<<<<< HEAD
                <h1 className="mb-3">Advanced Cleaner Search</h1>
                <h2 className="mb-4">Business Cleaner Search</h2>
                <p className="lead">
                  Find professional cleaners near you with advanced filtering
                  options
                </p>
=======
                <h1 className="mb-3">Tìm Tasker Gần Bạn</h1>
                <p className="lead">Tìm kiếm tasker chuyên nghiệp theo vị trí, dịch vụ và đánh giá</p>
>>>>>>> f7d84bc98da8d00686ffbb6d735ecfadf325aff3
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-fluid py-4">
        <div className="row">
          {/* Left Sidebar - Filters */}
          <div className="col-lg-3">
            <div className="filters-sidebar bg-white rounded shadow-sm p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Bộ Lọc Tìm Kiếm</h5>
                <button className="btn btn-outline-primary btn-sm">
                  <FontAwesomeIcon icon={faFilter} className="mr-1" />
                  Bộ lọc ({activeFilters})
                </button>
              </div>

<<<<<<< HEAD
              {/* Back to Search */}
              <div className="mb-4">
                <Link to="/" className="text-decoration-none">
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />← Back
                  to Search
                </Link>
              </div>

=======
>>>>>>> f7d84bc98da8d00686ffbb6d735ecfadf325aff3
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
                    onChange={(e) =>
                      handleFilterChange("radius", parseInt(e.target.value))
                    }
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
                    onChange={(e) =>
                      handleFilterChange(
                        "minRating",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                  <div className="d-flex align-items-center mt-2">
<<<<<<< HEAD
                    <FontAwesomeIcon
                      icon={faStar}
                      className="text-warning mr-1"
                    />
                    <span>{filters.minRating}+ stars</span>
                  </div>
                </div>
              </div>

              {/* Hourly Rate */}
              <div className="filter-section mb-4">
                <h6>Hourly Rate</h6>
                <div className="form-group">
                  <label>
                    Hourly Rate: ${filters.hourlyRate[0]}-$
                    {filters.hourlyRate[1]}
                  </label>
                  <div className="d-flex align-items-center">
                    <input
                      type="range"
                      className="form-control-range flex-grow-1"
                      min="10"
                      max="100"
                      value={filters.hourlyRate[0]}
                      onChange={(e) =>
                        handleFilterChange("hourlyRate", [
                          parseInt(e.target.value),
                          filters.hourlyRate[1],
                        ])
                      }
                    />
                    <span className="ml-2">-</span>
                    <input
                      type="range"
                      className="form-control-range flex-grow-1 ml-2"
                      min="10"
                      max="100"
                      value={filters.hourlyRate[1]}
                      onChange={(e) =>
                        handleFilterChange("hourlyRate", [
                          filters.hourlyRate[0],
                          parseInt(e.target.value),
                        ])
                      }
                    />
=======
                    <FontAwesomeIcon icon={faStar} className="text-warning mr-1" />
                    <span>{filters.minRating > 0 ? `${filters.minRating}+ sao` : 'Tất cả'}</span>
>>>>>>> f7d84bc98da8d00686ffbb6d735ecfadf325aff3
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="filter-section mb-4">
                <h6>Dịch vụ</h6>
                <div className="services-list">
<<<<<<< HEAD
                  {taskers.skills ? taskers.skills : "N/A"}
                </div>
              </div>

              {/* Availability */}
              <div className="filter-section mb-4">
                <h6>Availability</h6>
                <select
                  className="form-control"
                  value={filters.availability}
                  onChange={(e) =>
                    handleFilterChange("availability", e.target.value)
                  }
                >
                  <option value="any">Any time</option>
                  <option value="now">Available now</option>
                  <option value="today">Available today</option>
                  <option value="tomorrow">Available tomorrow</option>
                </select>
              </div>

              {/* Experience */}
              <div className="filter-section mb-4">
                <h6>Experience</h6>
                <select
                  className="form-control"
                  value={filters.experience}
                  onChange={(e) =>
                    handleFilterChange("experience", e.target.value)
                  }
                >
                  <option value="any">Any experience</option>
                  <option value="1-2">1-2 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="5+">5+ years</option>
                </select>
              </div>

              {/* Verified Only */}
              <div className="filter-section mb-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="verifiedOnly"
                    checked={filters.verifiedOnly}
                    onChange={(e) =>
                      handleFilterChange("verifiedOnly", e.target.checked)
                    }
                  />
                  <label className="form-check-label" htmlFor="verifiedOnly">
                    Verified cleaners only
                  </label>
                </div>
              </div>

=======
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

>>>>>>> f7d84bc98da8d00686ffbb6d735ecfadf325aff3
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
          <div className="col-lg-9">
            {/* Error Message */}
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '4px' }} role="alert">
                {error}
              </div>
            )}

            {/* Search Summary */}
<<<<<<< HEAD
            <div className="search-summary bg-white rounded shadow-sm p-3 mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">
                    Found {taskers.length} cleaners within {filters.radius}km
                    radius with {filters.minRating}+ star rating
                  </h5>
                  <p className="text-muted mb-0">
                    Showing results for your area
                  </p>
                </div>
                <div className="search-bar">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <div className="input-group-append">
                      <button className="btn btn-outline-secondary">
                        <FontAwesomeIcon icon={faSearch} />
                      </button>
                    </div>
=======
            {taskers.length > 0 && (
              <div className="search-summary bg-white rounded shadow-sm p-3 mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">
                      Tìm thấy {taskers.length} tasker trong bán kính {filters.radius / 1000}km 
                      {filters.minRating > 0 && ` với đánh giá ${filters.minRating}+ sao`}
                      {filters.services.length > 0 && ` cung cấp dịch vụ: ${filters.services.map(id => services.find(s => s.id === id)?.name || 'Unknown').join(', ')}`}
                    </h5>
                    <p className="text-muted mb-0">
                      Tổng tasker phù hợp trước lọc vị trí: {searchMetadata.total_filtered_before_geofence || 'N/A'}
                    </p>
>>>>>>> f7d84bc98da8d00686ffbb6d735ecfadf325aff3
                  </div>
                </div>
              </div>
            )}

            {/* Map Container */}
            <div className="map-container bg-white rounded shadow-sm p-4 mb-4">
<<<<<<< HEAD
              <div
                className="map-placeholder d-flex align-items-center justify-content-center"
                style={{ height: "300px", backgroundColor: "#e9ecef" }}
              >
                <div className="text-center">
                  <FontAwesomeIcon
                    icon={faMapMarkerAlt}
                    size="3x"
                    className="text-muted mb-3"
                  />
                  <h5>Interactive Map</h5>
                  <p className="text-muted">
                    Map showing cleaner locations would be displayed here
                  </p>
                </div>
              </div>
=======
              <div 
                ref={mapContainer} 
                style={{ 
                  width: '100%',
                  height: '600px', // Tăng chiều cao để map to hơn
                  position: 'relative',
                  border: '2px solid #007bff', // Thêm viền để nổi bật
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', // Thêm bóng đổ để nổi bật
                  borderRadius: '8px' // Bo góc để đẹp hơn
                }} 
              />
>>>>>>> f7d84bc98da8d00686ffbb6d735ecfadf325aff3
            </div>

            {/* Taskers List */}
            <div className="taskers-list">
              <h5 className="mb-3">Tasker Gần Bạn</h5>
              <div className="row">
<<<<<<< HEAD
                {taskers.length > 0 ? (
=======
                {taskers.length === 0 ? (
                  <p className="col-12 text-muted">Không tìm thấy tasker nào phù hợp với tiêu chí. Thử điều chỉnh bộ lọc!</p>
                ) : (
>>>>>>> f7d84bc98da8d00686ffbb6d735ecfadf325aff3
                  taskers.map((tasker) => (
                    <div key={tasker.user_id} className="col-12 mb-3">
                      <div className="tasker-card bg-white rounded shadow-sm p-4">
                        <div className="row align-items-center">
<<<<<<< HEAD
                          {/* Avatar */}
                          <div className="col-md-2">
                            <div className="tasker-avatar d-flex align-items-center justify-content-center">
                              <span className="initials">
                                {tasker.name
                                  ? tasker.name.charAt(0).toUpperCase()
                                  : "?"}
                              </span>
                            </div>
                          </div>

                          {/* Basic Info */}
                          <div className="col-md-4">
                            <h6 className="mb-1">{tasker.name || "Unknown"}</h6>
                            <p className="text-muted mb-1">
                              <FontAwesomeIcon
                                icon={faPhone}
                                className="mr-1"
                              />
                              {tasker.phone || "N/A"}
                            </p>
                            <p className="text-muted mb-0">
                              <FontAwesomeIcon icon={faUser} className="mr-1" />
                              {tasker.email || "N/A"}
                            </p>
                          </div>

                          {/* Services & Languages */}
                          <div className="col-md-3">
                            <p className="mb-1">
                              <strong>Services:</strong>{" "}
                              {tasker.services
                                ? tasker.services.join(", ")
                                : "N/A"}
                            </p>
                            <p className="mb-0">
                              <FontAwesomeIcon
                                icon={faGlobe}
                                className="mr-1"
                              />
                              {tasker.languages
                                ? tasker.languages.join(", ")
                                : "N/A"}
                            </p>
                          </div>

                          {/* Rating & Experience */}
                          <div className="col-md-2">
                            <div className="rating-section text-center">
                              <div className="d-flex align-items-center justify-content-center mb-1">
                                <FontAwesomeIcon
                                  icon={faStar}
                                  className="text-warning mr-1"
                                />
                                <span>{tasker.rating || "N/A"}</span>
                                {tasker.verified && (
                                  <FontAwesomeIcon
                                    icon={faAward}
                                    className="text-success ml-2"
                                  />
                                )}
                              </div>
                              <small className="text-muted">
                                {tasker.experience || "N/A"}
                              </small>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="col-md-1">
                            <div className="price-section text-center">
                              <h6 className="text-primary mb-0">
                                {tasker.hourlyRate
                                  ? `$${tasker.hourlyRate}/hr`
                                  : "N/A"}
                              </h6>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="col-12 mt-3">
                            <div className="d-flex justify-content-end">
                              <Link
                                to={`/tasker-profile/${tasker.tasker_id}`}
                                className="btn btn-outline-primary btn-sm mr-2"
                              >
                                <FontAwesomeIcon
                                  icon={faEye}
                                  className="mr-1"
                                />
                                View Profile
                              </Link>
                              <button className="btn btn-outline-secondary btn-sm mr-2">
                                <FontAwesomeIcon
                                  icon={faComments}
                                  className="mr-1"
                                />
                                Start Chat
                              </button>
                              <button className="btn btn-primary btn-sm">
                                Book Now
                              </button>
                            </div>
=======
                          {/* Avatar & Basic Info */}
                          <div className="col-md-3">
                            <div className="d-flex align-items-center">
                              <div className="tasker-avatar mr-3">
                                <span className="initials">{tasker.name?.slice(0, 2).toUpperCase()}</span>
                              </div>
                              <div>
                                <h6 className="mb-1">{tasker.name}</h6>
                                <div className="rating mb-1">
                                  <FontAwesomeIcon icon={faStar} className="text-warning mr-1" />
                                  <span>{tasker.rating ? `${tasker.rating.toFixed(1)}/5` : 'Chưa có đánh giá'}</span>
                                </div>
                                <small className="text-muted d-block">
                                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" />
                                  {(tasker.distance / 1000).toFixed(2)} km
                                </small>
                              </div>
                            </div>
                          </div>

                          {/* Services */}
                          <div className="col-md-6">
                            <div className="services-offered">
                              <h6 className="small text-muted mb-2">Dịch vụ cung cấp:</h6>
                              <div className="service-details">
                                {tasker.service_variants && tasker.service_variants.length > 0 ? (
                                  tasker.service_variants.map((variant, index) => (
                                    <div key={index} className="service-item mb-2">
                                      <span className="badge badge-soft-primary mr-2">
                                        {variant.service_name}
                                      </span>
                                      <small className="text-muted">
                                        {variant.variant_name} ({variant.pricing_type})
                                      </small>
                                      <div className="price-range small">
                                        <FontAwesomeIcon icon={faDollarSign} className="mr-1" />
                                        {variant.specific_price.toLocaleString('vi-VN')} /{variant.unit}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <small className="text-muted">Không có dịch vụ nào được cung cấp</small>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="col-md-3 text-right">
                            <Link 
                              to={`/tasker-profile/${tasker.user_id}`}
                              className="btn btn-outline-primary btn-sm d-block mb-2"
                            >
                              <FontAwesomeIcon icon={faEye} className="mr-1" />
                              Xem hồ sơ
                            </Link>
                            <button className="btn btn-primary btn-sm d-block w-100">
                              Đặt dịch vụ
                            </button>
>>>>>>> f7d84bc98da8d00686ffbb6d735ecfadf325aff3
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
<<<<<<< HEAD
                ) : (
                  <div className="col-12">
                    <p className="text-muted text-center">No taskers found</p>
                  </div>
=======
>>>>>>> f7d84bc98da8d00686ffbb6d735ecfadf325aff3
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .tasker-search-container {
          background-color: #f8f9fa;
          min-height: 100vh;
        }

        .hero-section {
          background-size: cover;
          background-position: center;
          padding: 100px 0;
          position: relative;
        }

        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
        }

        .hero-content {
          position: relative;
          z-index: 1;
        }

        .filters-sidebar {
          border: 1px solid #e9ecef;
          position: sticky;
          top: 20px;
        }

        .filter-section {
          padding-bottom: 1rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid #e9ecef;
        }

        .filter-section:last-child {
          border-bottom: none;
        }

        .services-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .tasker-avatar {
          width: 60px;
          height: 60px;
          background-color: #007bff;
          border-radius: 50%;
          color: white;
          font-weight: bold;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tasker-card {
          transition: transform 0.2s;
          border: 1px solid #eee;
        }

        .tasker-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
<<<<<<< HEAD

        .map-placeholder {
          border: 2px dashed #dee2e6;
        }

        .rating-section {
          min-height: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .price-section {
          min-height: 60px;
=======
        
        .map-container {
          position: relative;
        }
        
        .badge-soft-primary {
          background-color: rgba(0, 123, 255, 0.1);
          color: #007bff;
          font-weight: 500;
          padding: 0.5em 1em;
        }
        
        .service-item {
>>>>>>> f7d84bc98da8d00686ffbb6d735ecfadf325aff3
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .price-range {
          color: #28a745;
          font-weight: 500;
        }
        
        .form-control-range {
          width: 100%;
        }
        
        @media (max-width: 768px) {
          .filters-sidebar {
            position: relative;
            margin-bottom: 2rem;
          }
          
          .hero-section {
            padding: 60px 0;
          }
          
          .map-container {
            height: 400px !important; // Điều chỉnh cho di động
          }
        }
      `}</style>
    </div>
  );
};

export default TaskerSearch;