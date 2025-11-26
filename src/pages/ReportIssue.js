import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import systemReportService from '../services/systemReportService';
import api from '../services/api';
import '../css/ReportIssue.css';

const ReportIssue = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        images: []
    });
    const [previewUrls, setPreviewUrls] = useState([]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setFormData(prev => ({
                ...prev,
                images: files
            }));
            // Create preview URLs for all selected files
            setPreviewUrls(files.map(f => URL.createObjectURL(f)));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.description) {
            toast.error('Vui lòng nhập tiêu đề và mô tả');
            return;
        }

        setLoading(true);
        try {
            let imageUrl = null;

            // Upload images if any
            if (formData.images && formData.images.length > 0) {
                const uploadForm = new FormData();
                formData.images.forEach(file => {
                    uploadForm.append('images', file);
                });

                const uploadRes = await api.post('/uploads/post-images', uploadForm);
                // Backend returns { data: { success, data: { urls, folder } } }
                imageUrl = uploadRes.data?.data?.urls?.[0] || null;
                console.log('Upload response:', uploadRes.data);
                console.log('Image URL:', imageUrl);
            }

            await systemReportService.createReport({
                title: formData.title,
                description: formData.description,
                image_url: imageUrl
            });

            toast.success('Gửi báo cáo thành công! Admin sẽ xem xét sớm nhất.');
            navigate('/');
        } catch (error) {
            console.error('Lỗi gửi báo cáo:', error);
            toast.error(error.message || 'Có lỗi xảy ra khi gửi báo cáo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="report-issue-container">
            <div className="report-issue-card">
                <h2>Báo cáo sự cố hệ thống</h2>
                <p className="subtitle">Hãy cho chúng tôi biết vấn đề bạn đang gặp phải</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Tiêu đề lỗi <span className="required">*</span></label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Ví dụ: Không thể đặt lịch, Lỗi thanh toán..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Mô tả chi tiết <span className="required">*</span></label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Mô tả chi tiết các bước dẫn đến lỗi..."
                            rows="5"
                            required
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label>Hình ảnh minh họa (có thể chọn nhiều)</label>
                        <div className="image-upload-wrapper">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                id="image-upload"
                                hidden
                            />
                            <label htmlFor="image-upload" className="image-upload-btn">
                                <i className="fas fa-camera"></i> Chọn ảnh
                            </label>
                            {previewUrls && previewUrls.length > 0 && (
                                <div className="image-preview-grid">
                                    {previewUrls.map((url, idx) => (
                                        <div key={idx} className="image-preview-item">
                                            <img src={url} alt={`Preview ${idx}`} />
                                            <button
                                                type="button"
                                                className="remove-image"
                                                onClick={() => {
                                                    const newFiles = formData.images.filter((_, i) => i !== idx);
                                                    const newPreviews = previewUrls.filter((_, i) => i !== idx);
                                                    setFormData(prev => ({ ...prev, images: newFiles }));
                                                    setPreviewUrls(newPreviews);
                                                }}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                            Hủy bỏ
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportIssue;
