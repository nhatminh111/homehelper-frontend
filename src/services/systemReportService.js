import api from './api';

const systemReportService = {
    // User tạo báo cáo
    createReport: async (data) => {
        try {
            const response = await api.post('/system-reports', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Admin lấy danh sách báo cáo
    getAllReports: async (page = 1, limit = 10, status = null) => {
        try {
            const params = { page, limit };
            if (status) params.status = status;

            const response = await api.get('/system-reports', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Admin cập nhật trạng thái
    updateStatus: async (id, status) => {
        try {
            const response = await api.put(`/system-reports/${id}/status`, { status });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default systemReportService;
