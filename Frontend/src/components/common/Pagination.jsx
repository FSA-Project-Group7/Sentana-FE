import React from 'react';

const Pagination = ({ totalPages, currentPage, onPageChange }) => {
    // Chốt chặn bọc thép: Nếu totalPages không phải số hợp lệ hoặc chỉ có 1 trang thì không hiển thị
    if (!totalPages || isNaN(totalPages) || totalPages <= 1) return null;

    return (
        <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light mt-3 rounded-bottom">
            <nav>
                <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => onPageChange(currentPage - 1)}>Trước</button>
                    </li>

                    {[...Array(totalPages)].map((_, index) => (
                        <li key={index + 1} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => onPageChange(index + 1)}>
                                {index + 1}
                            </button>
                        </li>
                    ))}

                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => onPageChange(currentPage + 1)}>Sau</button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Pagination;