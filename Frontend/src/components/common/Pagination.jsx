import React from 'react';

const Pagination = ({
    totalPages,
    totalItems,
    itemsPerPage = 10,
    currentPage,
    onPageChange
}) => {

    let finalTotalPages = totalPages;

    if (finalTotalPages === undefined || finalTotalPages === null) {
        finalTotalPages = Math.ceil((totalItems || 0) / itemsPerPage);
    }

    if (!finalTotalPages || isNaN(finalTotalPages) || finalTotalPages <= 1 || !isFinite(finalTotalPages)) {
        return null;
    }

    return (
        <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light mt-3 rounded-bottom">
            <nav>
                <ul className="pagination pagination-sm mb-0">
                    {/* Nút Trước */}
                    <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
                            Trước
                        </button>
                    </li>

                    {/* Danh sách các số trang */}
                    {[...Array(finalTotalPages)].map((_, index) => (
                        <li key={index + 1} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => onPageChange(index + 1)}>
                                {index + 1}
                            </button>
                        </li>
                    ))}

                    {/* Nút Sau */}
                    <li className={`page-item ${currentPage >= finalTotalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= finalTotalPages}>
                            Sau
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Pagination;