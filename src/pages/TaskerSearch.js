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

const TaskerSearch = () => {
  const [filters, setFilters] = useState({
    location: "",
    radius: 5,
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
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
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
                <h1 className="mb-3">Advanced Cleaner Search</h1>
                <h2 className="mb-4">Business Cleaner Search</h2>
                <p className="lead">
                  Find professional cleaners near you with advanced filtering
                  options
                </p>
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
                <h5 className="mb-0">Search Filters</h5>
                <button className="btn btn-outline-primary btn-sm">
                  <FontAwesomeIcon icon={faFilter} className="mr-1" />
                  Filter ({activeFilters})
                </button>
              </div>

              {/* Back to Search */}
              <div className="mb-4">
                <Link to="/" className="text-decoration-none">
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />← Back
                  to Search
                </Link>
              </div>

              {/* Location */}
              <div className="filter-section mb-4">
                <h6>Location</h6>
                <button className="btn btn-outline-secondary btn-sm w-100 mb-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                  Use My Location
                </button>
                <div className="form-group">
                  <label>Search Radius: {filters.radius} km</label>
                  <input
                    type="range"
                    className="form-control-range"
                    min="1"
                    max="20"
                    value={filters.radius}
                    onChange={(e) =>
                      handleFilterChange("radius", parseInt(e.target.value))
                    }
                  />
                </div>
              </div>

              {/* Minimum Rating */}
              <div className="filter-section mb-4">
                <h6>Minimum Rating</h6>
                <div className="form-group">
                  <label>Minimum Rating: {filters.minRating} stars</label>
                  <input
                    type="range"
                    className="form-control-range"
                    min="1"
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
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="filter-section mb-4">
                <h6>Services</h6>
                <div className="services-list">
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

              {/* Apply Filters Button */}
              <button className="btn btn-primary w-100">
                <FontAwesomeIcon icon={faSearch} className="mr-2" />
                Apply Filters
              </button>
            </div>
          </div>

          {/* Right Content - Search Results */}
          <div className="col-lg-9">
            {/* Search Summary */}
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
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="map-container bg-white rounded shadow-sm p-4 mb-4">
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
            </div>

            {/* Cleaners List */}
            <div className="cleaners-list">
              <h5 className="mb-3">Cleaners Near You</h5>
              <div className="row">
                {taskers.length > 0 ? (
                  taskers.map((tasker) => (
                    <div key={tasker.user_id} className="col-12 mb-3">
                      <div className="tasker-card bg-white rounded shadow-sm p-4">
                        <div className="row align-items-center">
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
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12">
                    <p className="text-muted text-center">No taskers found</p>
                  </div>
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
          position: sticky;
          top: 20px;
        }

        .filter-section {
          border-bottom: 1px solid #e9ecef;
          padding-bottom: 1rem;
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
        }

        .tasker-card {
          transition: transform 0.2s;
        }

        .tasker-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

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
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default TaskerSearch;
