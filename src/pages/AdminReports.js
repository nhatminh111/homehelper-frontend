import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import systemReportService from '../services/systemReportService';
import '../css/AdminReports.css'; // Will create this css file next

const AdminReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedImage, setSelectedImage] = useState(null); // For image modal

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await systemReportService.getAllReports(page, 10, filterStatus || null);
            setReports(data.reports);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Lỗi lấy danh sách báo cáo:', error);
            toast.error('Không thể tải danh sách báo cáo');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [page, filterStatus]);

    const handleStatusChange = async (id, newStatus) => {
        try {
            await systemReportService.updateStatus(id, newStatus);
            toast.success('Cập nhật trạng thái thành công');
            fetchReports(); // Refresh list
        } catch (error) {
            console.error('Lỗi cập nhật trạng thái:', error);
            toast.error('Cập nhật trạng thái thất bại');
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Pending': return 'badge-warning';
            case 'In Progress': return 'badge-info';
            case 'Resolved': return 'badge-success';
            case 'Rejected': return 'badge-danger';
            default: return 'badge-secondary';
        }
    };

    return (
        <div className="admin-reports-container">
            <div className="admin-reports-header">
                <h2>Quản lý Báo cáo Sự cố</h2>
                <div className="filter-group">
                    <select
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="Pending">Chờ xử lý</option>
                        <option value="In Progress">Đang xử lý</option>
                        <option value="Resolved">Đã giải quyết</option>
                        <option value="Rejected">Từ chối</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-spinner">Đang tải...</div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="reports-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Người báo cáo</th>
                                    <th>Tiêu đề</th>
                                    <th>Mô tả</th>
                                    <th>Ảnh</th>
                                    <th>Ngày tạo</th>
                                    <th>Trạng thái</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.length > 0 ? (
                                    reports.map(report => (
                                        <tr key={report.report_id}>
                                            <td>#{report.report_id}</td>
                                            <td>
                                                <div>{report.user_name}</div>
                                                <small>{report.user_email}</small>
                                            </td>
                                            <td>{report.title}</td>
                                            <td className="description-cell" title={report.description}>
                                                {report.description.length > 50
                                                    ? report.description.substring(0, 50) + '...'
                                                    : report.description}
                                            </td>
                                            <td>
                                                {report.image_url ? (
                                                    <button
                                                        className="btn-view-image"
                                                        onClick={() => setSelectedImage(report.image_url)}
                                                    >
                                                        <i className="fas fa-image"></i> Xem ảnh
                                                    </button>
                                                ) : 'Không có'}
                                            </td>
                                            <td>{new Date(report.created_at).toLocaleDateString('vi-VN')}</td>
                                            <td>
                                                <span className={`status-badge ${getStatusBadgeClass(report.status)}`}>
                                                    {report.status}
                                                </span>
                                            </td>
                                            <td>
                                                <select
                                                    value={report.status}
                                                    onChange={(e) => handleStatusChange(report.report_id, e.target.value)}
                                                    className="status-select"
                                                >
                                                    <option value="Pending">Chờ xử lý</option>
                                                    <option value="In Progress">Đang xử lý</option>
                                                    <option value="Resolved">Đã giải quyết</option>
                                                    <option value="Rejected">Từ chối</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center">Không có báo cáo nào</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(prev => prev - 1)}
                        >
                            Trước
                        </button>
                        <span>Trang {page} / {totalPages || 1}</span>
                        <button
                            disabled={page === totalPages || totalPages === 0}
                            onClick={() => setPage(prev => prev + 1)}
                        >
                            Sau
                        </button>
                    </div>
                </>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div className="image-modal" onClick={() => setSelectedImage(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedImage(null)}>
                            <i className="fas fa-times"></i>
                        </button>
                        <img src={selectedImage} alt="Report" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReports;
