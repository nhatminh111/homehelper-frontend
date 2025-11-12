import React, { useState } from 'react';
import { pythonOCRAPI, cccdAPI, checkVerifiedCCCD, getCCCDStatus } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
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
  const { user: authUser } = useAuth();
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [faceImage, setFaceImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Face verification states
  const [cameraImage, setCameraImage] = useState(null);
  const [cameraPreview, setCameraPreview] = useState(null);
  const [faceVerificationResult, setFaceVerificationResult] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  // Thêm state cho user input
  const [userInput, setUserInput] = useState({
    number: '',
    full_name: '',
    dob: '',
    gender: 'Nam'
  });
  const [comparisonResult, setComparisonResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [isVerified, setIsVerified] = useState(!!(authUser && authUser.cccd_status === 'Đã xác minh'));

  // Check verified on mount
  React.useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const verifiedRes = await checkVerifiedCCCD(token);
        if (verifiedRes && verifiedRes.hasVerified !== undefined) {
          setIsVerified(!!verifiedRes.hasVerified);
        } else if (verifiedRes?.data?.hasVerified) {
          setIsVerified(true);
        }

        // Fallback: check latest status
        if (!isVerified) {
          const statusRes = await getCCCDStatus(token);
          const status = statusRes?.data || statusRes;
          if (status && (status.verification_status === 'Verified' || status.status === 'Verified')) {
            setIsVerified(true);
          }
        }
      } catch (_) {}
    })();
  }, []);

  // React to auth user changes (if context already has verified status)
  React.useEffect(() => {
    if (authUser && authUser.cccd_status === 'Đã xác minh') {
      setIsVerified(true);
    }
  }, [authUser]);

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
        
        // Auto-fill form fields with extracted data
        setUserInput({
          number: result.data.number || '',
          full_name: result.data.full_name || '',
          dob: result.data.dob || '',
          gender: result.data.gender || 'Nam'
        });
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

  // Camera capture functionality
  const startCamera = async () => {
    console.log('🎥 Starting camera...');
    // Show modal first
    setShowCamera(true);
    console.log('📱 Modal should be visible now');
    
    // Wait a bit for modal to render
    setTimeout(async () => {
      try {
        console.log('📷 Requesting camera access...');
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Trình duyệt không hỗ trợ camera (mediaDevices)');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          } 
        });
        
        console.log('✅ Camera access granted');
        const video = document.getElementById('camera-video');
        console.log('📺 Video element:', video);
        
        if (video) {
          video.srcObject = stream;
          console.log('🎬 Video stream set');
          // Some browsers require an explicit play() call after setting srcObject
          const ensurePlay = async () => {
            try {
              await video.play();
              console.log('▶️ Video is playing');
            } catch (e) {
console.warn('⚠️ Autoplay prevented, retry on metadata loaded:', e);
            }
          };
          if (video.readyState >= 2) {
            ensurePlay();
          } else {
            video.onloadedmetadata = () => ensurePlay();
          }
        } else {
          console.error('❌ Video element not found!');
        }
      } catch (err) {
        console.error('❌ Camera error:', err);
        setError('Không thể truy cập camera: ' + err.message);
        setShowCamera(false);
      }
    }, 100);
  };

  const capturePhoto = () => {
    const video = document.getElementById('camera-video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      setCameraImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => setCameraPreview(e.target.result);
      reader.readAsDataURL(file);
      
      setShowCamera(false);
      stopCamera();
    }, 'image/jpeg', 0.8);
  };

  const stopCamera = () => {
    const video = document.getElementById('camera-video');
    if (video && video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }
    setShowCamera(false);
  };

  // Face verification function
  const verifyFace = async () => {
    if (!faceImage || !cameraImage) {
      setError('Vui lòng có ảnh khuôn mặt từ CCCD và ảnh chụp từ camera');
      return;
    }

    setIsCapturing(true);
    setError(null);

    try {
      // Convert faceImage URL to File object if needed
      let faceFile = faceImage;
      if (typeof faceImage === 'string') {
        console.log('Converting faceImage URL to File...');
        const response = await fetch(faceImage);
        const blob = await response.blob();
        faceFile = new File([blob], 'face_from_cccd.jpg', { type: 'image/jpeg' });
      }

      // Create FormData for face comparison
      const formData = new FormData();
      formData.append('face_image', faceFile);
      formData.append('camera_image', cameraImage);

      console.log('📤 Sending face verification request...');
      console.log('Face file:', faceFile);
      console.log('Camera file:', cameraImage);

      const response = await fetch('http://localhost:8080/api/compare-faces', {
        method: 'POST',
        body: formData
      });

      console.log('📡 Response status:', response.status);

      const result = await response.json();
      
      if (result.success) {
        setFaceVerificationResult({
          isMatch: result.is_match,
          confidence: result.confidence,
          message: result.is_match ?
`✅ Khuôn mặt khớp (độ tin cậy: ${Math.round(result.confidence * 100)}%)` :
            `❌ Khuôn mặt không khớp (độ tin cậy: ${Math.round(result.confidence * 100)}%)`
        });
      } else {
        setError(result.error || 'Lỗi khi so sánh khuôn mặt');
      }
    } catch (err) {
      setError('Không thể kết nối đến dịch vụ so sánh khuôn mặt: ' + err.message);
    } finally {
      setIsCapturing(false);
    }
  };

  // Function so sánh dữ liệu
  const compareData = () => {
    if (!extractedData) {
      setError('Vui lòng trích xuất dữ liệu từ ảnh trước');
      return;
    }

    const normalize = (str) => {
      if (!str) return '';
      return str.toLowerCase()
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const normalizeDate = (dateStr) => {
      if (!dateStr) return '';
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
      return dateStr;
    };

    const comparisons = {
      number: normalize(extractedData.number) === normalize(userInput.number),
      full_name: normalize(extractedData.full_name) === normalize(userInput.full_name),
      dob: normalizeDate(extractedData.dob) === normalizeDate(userInput.dob),
      gender: normalize(extractedData.gender) === normalize(userInput.gender)
    };

    const matchCount = Object.values(comparisons).filter(match => match).length;
    const totalFields = Object.keys(comparisons).length;
    const matchRate = matchCount / totalFields;

    setComparisonResult({
      comparisons,
      matchCount,
      totalFields,
      matchRate,
      isMatch: matchRate >= 0.8
    });
  };

  // Function submit CCCD vào backend
  const submitToBackend = async () => {
    if (!frontImage || !comparisonResult || !comparisonResult.isMatch) {
      setError('Vui lòng đảm bảo thông tin khớp 100% trước khi gửi');
      return;
    }

    if (!faceVerificationResult || !faceVerificationResult.isMatch) {
      setError('Vui lòng hoàn thành xác minh khuôn mặt trước khi gửi');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSubmitResult(null);

    try {
      const token = (() => {
        try { return localStorage.getItem('token'); } catch (_) { return null; }
      })();

      // Upload ảnh mặt lên Cloudinary trước
      let faceCloudUrl = null;
      let facePublicId = null;
      if (faceImage) {
        try {
          console.log('🖼️ Uploading face image to Cloudinary:', faceImage);
          const faceUploadResponse = await cccdAPI.uploadFaceImage(faceImage, token);
          if (faceUploadResponse.success) {
            faceCloudUrl = faceUploadResponse.data.face_cloud_url || null;
            facePublicId = faceUploadResponse.data.face_public_id || null;
            console.log('✅ Face image uploaded to Cloudinary. public_id:', facePublicId);
          }
        } catch (error) {
          console.warn('⚠️ Face image upload failed:', error.message);
        }
      }

      const payload = {
        front: frontImage,
        back: backImage || undefined,
        number: userInput.number,
        full_name: userInput.full_name,
        dob: userInput.dob,
        gender: userInput.gender,
        // Gửi kèm dữ liệu OCR đã trích xuất để backend so sánh trực tiếp
        ocr_payload: extractedData ? JSON.stringify(extractedData) : undefined,
        face_cloud_url: faceCloudUrl || undefined,
        face_public_id: facePublicId || undefined, // ưu tiên public_id an toàn
      };
      
      console.log('📤 Sending payload with face_cloud_url:', faceCloudUrl);

      const response = await cccdAPI.submit(payload, token);
      
      setSubmitResult({
        success: true,
        message: 'CCCD đã được gửi xác minh thành công!',
        data: response
      });

      // Reset form sau khi submit thành công
      setUserInput({ number: '', full_name: '', dob: '', gender: 'Nam' });
      setComparisonResult(null);
      setExtractedData(null);
      setFaceImage(null);
      setFrontImage(null);
      setBackImage(null);
      setFrontPreview(null);
      setBackPreview(null);

    } catch (error) {
      console.error('Submit CCCD error:', error);
      setSubmitResult({
        success: false,
        message: error.message || 'Lỗi khi gửi CCCD xác minh'
      });
    } finally {
      setSubmitting(false);
    }
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

  // Nếu đã xác minh: chặn toàn bộ nội dung, chỉ hiển thị thông báo
  if (isVerified) {
    return (
      <div className="container py-5">
        <div className="row">
          <div className="col-12">
            <div className="alert alert-success">
              Tài khoản của bạn đã được xác minh CCCD. Trang này đã bị khóa.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5 position-relative">
      {(loading || submitting) && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1050 }}
          className="d-flex align-items-center justify-content-center"
        >
          <div className="bg-white shadow-lg p-4 rounded" style={{ minWidth: 280, textAlign: 'center', borderRadius: 12 }}>
            <FontAwesomeIcon icon={faSpinner} spin className="mb-2" />
            <div className="text-muted">
              {submitting ? 'Đang gửi xác minh CCCD...' : 'Đang trích xuất CCCD...'}
            </div>
          </div>
        </div>
      )}
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
        <div className={`col-lg-6 ${isVerified ? 'pe-none opacity-50' : ''}`}>
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

        {/* User Input Section */}
        <div className={`col-lg-6 ${isVerified ? 'pe-none opacity-50' : ''}`}>
          <div className="card h-100">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <FontAwesomeIcon icon={faIdCard} className="mr-2" />
                Nhập thông tin để so sánh
              </h4>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-bold">Số CCCD</label>
                <input
                  type="text"
                  className="form-control"
                  value={userInput.number}
                  onChange={(e) => setUserInput({...userInput, number: e.target.value})}
                  placeholder="Nhập số CCCD"
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-bold">Họ và tên</label>
                <input
                  type="text"
                  className="form-control"
                  value={userInput.full_name}
                  onChange={(e) => setUserInput({...userInput, full_name: e.target.value})}
                  placeholder="Nhập họ và tên"
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-bold">Ngày sinh (dd/mm/yyyy)</label>
                <input
                  type="text"
                  className="form-control"
                  value={userInput.dob}
                  onChange={(e) => setUserInput({...userInput, dob: e.target.value})}
                  placeholder="dd/mm/yyyy"
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-bold">Giới tính</label>
                <select
                  className="form-control"
                  value={userInput.gender}
                  onChange={(e) => setUserInput({...userInput, gender: e.target.value})}
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
              
              <button
className="btn btn-success btn-lg w-100"
                onClick={compareData}
                disabled={!extractedData}
              >
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                So sánh thông tin
              </button>
              
              {comparisonResult && (
                <div className="mt-4">
                  <div className={`alert ${comparisonResult.isMatch ? 'alert-success' : 'alert-danger'}`}>
                    <h5>
                      {comparisonResult.isMatch ? '✅ Khớp' : '❌ Không khớp'}
                    </h5>
                    <p>Tỷ lệ khớp: {Math.round(comparisonResult.matchRate * 100)}% ({comparisonResult.matchCount}/{comparisonResult.totalFields})</p>
                  </div>
                  
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Trường</th>
                          <th>Kết quả</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(comparisonResult.comparisons).map(([field, isMatch]) => (
                          <tr key={field}>
                            <td>{fieldLabels[field] || field}</td>
                            <td>
                              <span className={`badge ${isMatch ? 'bg-success' : 'bg-danger'}`}>
                                {isMatch ? 'Khớp' : 'Không khớp'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Nút submit khi khớp 100% và có xác minh khuôn mặt */}
                  {comparisonResult.matchRate === 1 && faceVerificationResult && faceVerificationResult.isMatch && (
                    <div className="mt-3">
                      <button
                        className="btn btn-warning btn-lg w-100"
                        onClick={submitToBackend}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                            Đang gửi xác minh...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                            Gửi xác minh CCCD
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Thông báo cần xác minh khuôn mặt */}
                  {comparisonResult.matchRate === 1 && (!faceVerificationResult || !faceVerificationResult.isMatch) && (
<div className="mt-3">
                      <div className="alert alert-info">
                        <h6>📸 Cần xác minh khuôn mặt</h6>
                        <p className="mb-0">Vui lòng hoàn thành xác minh khuôn mặt ở phần bên dưới để có thể gửi xác minh CCCD.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Hiển thị kết quả submit */}
              {submitResult && (
                <div className={`alert ${submitResult.success ? 'alert-success' : 'alert-danger'} mt-3`}>
                  <h6>{submitResult.success ? '✅ Thành công' : '❌ Lỗi'}</h6>
                  <p>{submitResult.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Face Verification Section */}
      {faceImage && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-warning text-dark">
                <h4 className="mb-0">
                  <FontAwesomeIcon icon={faCamera} className="mr-2" />
                  Xác minh khuôn mặt
                </h4>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Ảnh khuôn mặt từ CCCD</h6>
                    <img src={faceImage} alt="CCCD Face" className="img-fluid rounded shadow mb-3" />
                  </div>
                  <div className="col-md-6">
                    <h6>Ảnh chụp từ camera</h6>
                    {!cameraPreview ? (
                      <div className="text-center">
                        <button 
                          className="btn btn-primary btn-lg"
                          onClick={() => {
                            console.log('🔘 Camera button clicked!');
                            startCamera();
                          }}
                          disabled={showCamera}
                        >
                          <FontAwesomeIcon icon={faCamera} className="mr-2" />
                          Chụp ảnh từ camera
                        </button>
                      </div>
                    ) : (
                      <div>
                        <img src={cameraPreview} alt="Camera Capture" className="img-fluid rounded shadow mb-3" />
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-warning"
                            onClick={() => {
                              setCameraPreview(null);
                              setCameraImage(null);
                              setFaceVerificationResult(null);
                            }}
                          disabled={isCapturing}
                          >
                            Chụp lại
</button>
                          <button 
                            className="btn btn-success"
                            onClick={verifyFace}
                            disabled={isCapturing}
                          >
                            {isCapturing ? (
                              <>
                                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                Đang xác minh...
                              </>
                            ) : (
                              'Xác minh khuôn mặt'
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Camera Modal */}
                {showCamera && (
                  <div
                    className="modal show d-block"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 2000
                    }}
                  >
                    <div className="modal-dialog modal-lg">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title">Chụp ảnh khuôn mặt</h5>
                          <button type="button" className="btn-close" onClick={stopCamera}></button>
                        </div>
                        <div className="modal-body text-center">
                          <video 
                            id="camera-video" 
                            autoPlay 
                            playsInline 
                            className="img-fluid rounded"
                            style={{maxHeight: '400px'}}
                          ></video>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn btn-secondary" onClick={stopCamera}>
                            Hủy
                          </button>
                          <button type="button" className="btn btn-primary" onClick={capturePhoto}>
                            <FontAwesomeIcon icon={faCamera} className="mr-2" />
                            Chụp ảnh
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Face Verification Result */}
                {faceVerificationResult && (
                  <div className="mt-3">
                    <div className={`alert ${faceVerificationResult.isMatch ? 'alert-success' : 'alert-danger'}`}>
                      <h6>{faceVerificationResult.message}</h6>
                    </div>
</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CCCDExtractor;