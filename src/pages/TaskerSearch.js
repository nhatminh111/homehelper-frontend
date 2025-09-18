import React, { useState, useEffect, useRef } from "react";
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

const TaskerSearch = () => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const geolocateControlRef = useRef(null);

  // State
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    location: "",
    radius: 5000,
    minRating: 4,
    hourlyRate: [20, 50],
    services: [],
    availability: "any",
    experience: "any",
    verifiedOnly: true,
  });
  const [activeFilters, setActiveFilters] = useState(3);
  const [taskers, setTaskers] = useState([]);
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch taskers from backend
  useEffect(() => {
    fetch(
      `http://localhost:3001/api/taskers?search=${encodeURIComponent(
        searchTerm
      )}`
    )
      .then((res) => res.json())
      .then((data) => setTaskers(data))
      .catch((err) => console.error("❌ Fetch error:", err));
  }, [searchTerm]);

  // Fetch services
  useEffect(() => {
    fetch("http://localhost:3001/api/services")
      .then((res) => res.json())
      .then((data) => {
        setServices(data.services || []);
      })
      .catch((err) => console.error("❌ Fetch services error:", err));
  }, []);

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleServiceToggle = (service) => {
    setFilters((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  // Placeholder functions
  const triggerGeolocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLoading(false);
        },
        (err) => {
          setError("Unable to retrieve your location.");
          setIsLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  const searchNearbyTaskers = () => {
    console.log(
      "Searching taskers with filters:",
      filters,
      "and location:",
      currentLocation
    );
  };

  return (
    <div className="tasker-search-container">
      {/* Header */}
      <div
        className="hero-section"
        style={{ backgroundImage: "url('/images/bg_2.jpg')" }}
      >
        <div className="overlay"></div>
        <div className="container text-center text-white">
          <h1 className="mb-3">Advanced Cleaner Search</h1>
          <h2 className="mb-4">Business Cleaner Search</h2>
          <p className="lead">
            Find professional cleaners near you with advanced filtering options
          </p>
        </div>
      </div>

      {/* Main */}
      <div className="container-fluid py-4">
        <div className="row">
          {/* Sidebar */}
          <div className="col-lg-3">
            <div className="filters-sidebar bg-white rounded shadow-sm p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Bộ Lọc Tìm Kiếm</h5>
                <button className="btn btn-outline-primary btn-sm">
                  <FontAwesomeIcon icon={faFilter} className="mr-1" /> Bộ lọc (
                  {activeFilters})
                </button>
              </div>

              <div className="mb-4">
                <Link to="/" className="text-decoration-none">
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />← Back
                  to Search
                </Link>
              </div>

              {/* Location */}
              <div className="filter-section mb-4">
                <h6>Vị trí</h6>
                <button
                  className="btn btn-outline-secondary btn-sm w-100 mb-2"
                  onClick={triggerGeolocation}
                  disabled={isLoading}
                >
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" /> Sử
                  dụng vị trí hiện tại
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

              {/* Rating */}
              <div className="filter-section mb-4">
                <h6>Đánh giá tối thiểu</h6>
                <input
                  type="range"
                  className="form-control-range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filters.minRating}
                  onChange={(e) =>
                    handleFilterChange("minRating", parseFloat(e.target.value))
                  }
                />
                <div className="d-flex align-items-center mt-2">
                  <FontAwesomeIcon
                    icon={faStar}
                    className="text-warning mr-1"
                  />
                  <span>{filters.minRating}+ stars</span>
                </div>
              </div>

              {/* Hourly Rate */}
              <div className="filter-section mb-4">
                <h6>Hourly Rate</h6>
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
                </div>
              </div>

              {/* Services */}
              <div className="filter-section mb-4">
                <h6>Dịch vụ</h6>
                <div className="services-list">
                  {services.length > 0
                    ? services.map((s) => (
                        <div key={s.id}>
                          <input
                            type="checkbox"
                            checked={filters.services.includes(s.name)}
                            onChange={() => handleServiceToggle(s.name)}
                          />{" "}
                          {s.name}
                        </div>
                      ))
                    : "N/A"}
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

              {/* Verified */}
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

              <button
                className="btn btn-primary w-100"
                onClick={searchNearbyTaskers}
                disabled={isLoading || !currentLocation}
              >
                <FontAwesomeIcon icon={faSearch} className="mr-2" />{" "}
                {isLoading ? "Đang tìm kiếm..." : "Áp dụng bộ lọc"}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="col-lg-9">
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Search Summary */}
            <div className="search-summary bg-white rounded shadow-sm p-3 mb-4">
              <h5>
                Found {taskers.length} cleaners within {filters.radius / 1000}km
                radius
              </h5>
              <div className="input-group mt-2">
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
              </div>
            </div>

            {/* Map Placeholder */}
            <div
              className="map-container bg-white rounded shadow-sm p-4 mb-4"
              style={{ height: "300px", border: "2px dashed #dee2e6" }}
            >
              <div className="text-center text-muted">
                <FontAwesomeIcon icon={faMapMarkerAlt} size="3x" />
                <p>Map showing cleaner locations would be displayed here</p>
              </div>
            </div>

            {/* Taskers List */}
            <div className="taskers-list">
              {taskers.length > 0 ? (
                taskers.map((tasker) => (
                  <div
                    key={tasker.user_id}
                    className="tasker-card bg-white rounded shadow-sm p-4 mb-3"
                  >
                    <div className="row align-items-center">
                      <div className="col-md-2">
                        <div className="tasker-avatar">
                          {tasker.name
                            ? tasker.name.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <h6>{tasker.name || "Unknown"}</h6>
                        <p className="text-muted mb-1">
                          <FontAwesomeIcon icon={faPhone} className="mr-1" />{" "}
                          {tasker.phone || "N/A"}
                        </p>
                        <p className="text-muted mb-0">
                          <FontAwesomeIcon icon={faUser} className="mr-1" />{" "}
                          {tasker.email || "N/A"}
                        </p>
                      </div>
                      <div className="col-md-3">
                        <p>
                          <strong>Services:</strong>{" "}
                          {tasker.services ? tasker.services.join(", ") : "N/A"}
                        </p>
                        <p>
                          <FontAwesomeIcon icon={faGlobe} className="mr-1" />
                          {tasker.languages
                            ? tasker.languages.join(", ")
                            : "N/A"}
                        </p>
                      </div>
                      <div className="col-md-2 text-center">
                        <FontAwesomeIcon
                          icon={faStar}
                          className="text-warning mr-1"
                        />
                        {tasker.rating || "N/A"}
                        {tasker.verified && (
                          <FontAwesomeIcon
                            icon={faAward}
                            className="text-success ml-2"
                          />
                        )}
                        <br />
                        <small className="text-muted">
                          {tasker.experience || "N/A"}
                        </small>
                      </div>
                      <div className="col-md-1 text-center text-primary">
                        {tasker.hourlyRate ? `$${tasker.hourlyRate}/hr` : "N/A"}
                      </div>
                      <div className="col-12 mt-3 text-right">
                        <Link
                          to={`/tasker-profile/${tasker.tasker_id}`}
                          className="btn btn-outline-primary btn-sm mr-2"
                        >
                          <FontAwesomeIcon icon={faEye} className="mr-1" /> View
                          Profile
                        </Link>
                        <button className="btn btn-outline-secondary btn-sm mr-2">
                          <FontAwesomeIcon icon={faComments} className="mr-1" />{" "}
                          Start Chat
                        </button>
                        <button className="btn btn-primary btn-sm">
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted text-center">No taskers found</p>
              )}
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
        @media (max-width: 768px) {
          .filters-sidebar {
            position: relative;
            margin-bottom: 2rem;
          }
          .hero-section {
            padding: 60px 0;
          }
        }
      `}</style>
    </div>
  );
};

export default TaskerSearch;
