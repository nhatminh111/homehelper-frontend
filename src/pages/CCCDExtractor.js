import React, { useState } from 'react';
import { pythonOCRAPI } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUpload,
  faDownload,
  faCheckCircle,
  faExclamationTriangle,
  faSpinner,
  faCamera,
  faIdCard
} from '@fortawesome/free-solid-svg-icons';

const CCCDExtractor = () => {
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [faceImage, setFaceImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'front') {
        setFrontImage(file);
        const reader = new FileReader();
        reader.onload = (ev) => setFrontPreview(ev.target.result);
        reader.readAsDataURL(file);
      } else {
        setBackImage(file);
        const reader = new FileReader();
        reader.onload = (ev) => setBackPreview(ev.target.result);
        reader.readAsDataURL(file);
      }
    }
  };

  const extractCCCD = async () => {
    if (!frontImage) {
      setError('Vui lòng tải ảnh mặt trước CCCD');
      return;
    }

    setLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      const result = await pythonOCRAPI.extractCCCD(frontImage, backImage || null);
      if (result.success) {
        setExtractedData(result.data);
        setFaceImage(result.face_image || null);
      } else {
        setError(result.error || 'OCR extraction failed');
      }
    } catch (err) {
      setError(err.message || 'Python OCR service not available');
    } finally {
      setLoading(false);
    }
  };

  const downloadData = () => {
    if (!extractedData) return;
    const dataStr = JSON.stringify(extractedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cccd_extracted_data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const fieldLabels = {
    number: 'Số CCCD',
    full_name: 'Họ và tên',
    dob: 'Ngày sinh',
    gender: 'Giới tính',
    nationality: 'Quốc tịch',
    place_of_origin: 'Quê quán',
    place_of_residence: 'Nơi thường trú',
    expiry_date: 'Có giá trị đến'
  };

  return (
    <div className="container py-5">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="mb-1">
            <FontAwesomeIcon icon={faIdCard} className="mr-2" />
            Trích xuất thông tin CCCD (Python OCR)
          </h2>
          <p className="text-muted">Tải ảnh CCCD để trích xuất thông tin tự động</p>
        </div>
      </div>

      <div className="row">
        {/* Upload Section */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <FontAwesomeIcon icon={faUpload} className="mr-2" />
                Upload your image
              </h4>
            </div>
            <div className="card-body">
              {/* Front Image */}
              <div className="mb-4">
                <label className="form-label fw-bold">Ảnh CCCD mặt trước *</label>
                <div className="upload-area border rounded p-3 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'front')}
                    className="d-none"
                    id="front-upload"
                  />
                  <label htmlFor="front-upload" className="btn btn-outline-primary btn-lg w-100">
                    <FontAwesomeIcon icon={faCamera} className="mr-2" />
                    {frontImage ? 'Thay đổi ảnh' : 'Chọn ảnh mặt trước'}
                  </label>
                  {frontPreview && (
                    <div className="mt-3">
                      <img
                        src={frontPreview}
                        alt="Front preview"
                        className="img-fluid rounded shadow"
                        style={{ maxHeight: '300px' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Back Image - Optional */}
              <div className="mb-4">
                <label className="form-label fw-bold">Ảnh CCCD mặt sau (tùy chọn)</label>
                <div className="upload-area border rounded p-3 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'back')}
                    className="d-none"
                    id="back-upload"
                  />
                  <label htmlFor="back-upload" className="btn btn-outline-secondary w-100">
                    <FontAwesomeIcon icon={faCamera} className="mr-2" />
                    {backImage ? 'Thay đổi ảnh' : 'Chọn ảnh mặt sau'}
                  </label>
                  {backPreview && (
                    <div className="mt-3">
                      <img
                        src={backPreview}
                        alt="Back preview"
                        className="img-fluid rounded shadow"
                        style={{ maxHeight: '300px' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <button
                className="btn btn-primary btn-lg w-100"
                onClick={extractCCCD}
                disabled={loading || !frontImage}
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                    Trích xuất thông tin
                  </>
                )}
              </button>

              {error && (
                <div className="alert alert-danger mt-3 d-flex align-items-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Result Section */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header bg-success text-white d-flex align-items-center justify-content-between">
              <h4 className="mb-0">
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                Kết quả trích xuất
              </h4>
              <button className="btn btn-light btn-sm" onClick={downloadData} disabled={!extractedData}>
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                Tải dữ liệu
              </button>
            </div>
            <div className="card-body">
              {!extractedData ? (
                <div className="text-center text-muted">
                  <p>Chưa có dữ liệu. Vui lòng tải ảnh và bấm Trích xuất.</p>
                </div>
              ) : (
                <div className="row">
                  <div className="col-12">
                    <ul className="list-group">
                      {Object.entries(extractedData).map(([key, value]) => (
                        <li key={key} className="list-group-item d-flex justify-content-between align-items-center">
                          <span className="text-muted">{fieldLabels[key] || key}</span>
                          <strong>{String(value)}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {faceImage && (
                    <div className="col-12 mt-3">
                      <h6>Ảnh khuôn mặt</h6>
                      <img src={faceImage} alt="Face" className="img-fluid rounded shadow" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CCCDExtractor;



