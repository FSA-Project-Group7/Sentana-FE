import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

// 1. CHUẨN HÓA TOAST 
export const notify = {
    success: (message) => toast.success(message || "Thao tác thành công!"),
    error: (message) => toast.error(message || "Có lỗi xảy ra!"),
    warning: (message) => toast.warning(message),
    info: (message) => toast.info(message),
};

// 2. KHUÔN MẪU CHO XÓA / GỠ 
export const confirmDelete = Swal.mixin({
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',   // Đỏ báo động
    cancelButtonColor: '#6c757d', // Xám nhạt
    confirmButtonText: '<i class="bi bi-trash me-1"></i> Đồng ý xóa',
    cancelButtonText: 'Hủy bỏ',
    reverseButtons: true, // Nút Hủy bên trái, Xác nhận bên phải
});

// 3. KHUÔN MẪU CHO XÁC NHẬN THAO TÁC BÌNH THƯỜNG 
// (Dùng cho Khôi phục, Thanh lý hợp đồng, Phê duyệt...)
export const confirmAction = Swal.mixin({
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#0d6efd', // Xanh dương
    cancelButtonColor: '#6c757d',
    confirmButtonText: '<i class="bi bi-check-lg me-1"></i> Xác nhận',
    cancelButtonText: 'Hủy bỏ',
    reverseButtons: true,
});