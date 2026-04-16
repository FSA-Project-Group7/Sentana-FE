import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ContractManagement.css';

const ContractManagement = () => {
    // ==========================================
    // 1. DATA STATES
    // ==========================================
    const [contracts, setContracts] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [residents, setResidents] = useState([]);
    const [systemServices, setSystemServices] = useState([]);
    const [loading, setLoading] = useState(true);

    const [deletedContracts, setDeletedContracts] = useState([]);
    const [loadingDeleted, setLoadingDeleted] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const relationships = [{ id: 2, name: 'Vợ/Chồng' }, { id: 3, name: 'Con cái' }, { id: 4, name: 'Anh/Chị/Em' }, { id: 5, name: 'Bạn cùng phòng' }, { id: 6, name: 'Khác' }];

    // ==========================================
    // 2. UI & FORM STATES
    // ==========================================
    const [activeDrawer, setActiveDrawer] = useState(null); // 'FORM', 'VIEW', 'EXTEND', 'TERMINATE', 'CANCEL', 'SETTLE'
    const [selectedContract, setSelectedContract] = useState(null);

    const initialFormState = { apartmentId: '', residentAccountId: '', startDay: '', endDay: '', monthlyRent: '', deposit: '', file: null, existingFileUrl: '', additionalResidents: [], selectedServices: [] };
    const [formData, setFormData] = useState(initialFormState);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editContractId, setEditContractId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [extendContractId, setExtendContractId] = useState(null);
    const [extendNewEndDate, setExtendNewEndDate] = useState('');
    const [extendOldEndDate, setExtendOldEndDate] = useState('');
    const [isExtending, setIsExtending] = useState(false);

    const [selectedTerminateId, setSelectedTerminateId] = useState(null);
    const [actionDate, setActionDate] = useState('');
    const [additionalCost, setAdditionalCost] = useState('');
    const [terminationReason, setTerminationReason] = useState(''); 
    const [terminateResult, setTerminateResult] = useState(null);
    const [isTerminating, setIsTerminating] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const [settleAdditionalCost, setSettleAdditionalCost] = useState('');
    const [settleNote, setSettleNote] = useState('');
    const [isSettling, setIsSettling] = useState(false);

    // --- HELPERS ---
    const preventInvalidNumber = (e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); };
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN') : "";
    
    const closeDrawer = () => { 
        setActiveDrawer(null); 
        setDeleteConfirmText(''); 
        setTerminateResult(null); 
        setTerminationReason(''); 
        setSettleAdditionalCost(''); 
        setSettleNote(''); 
    };

    // 👉 HÀM BẮT LỖI THÔNG MINH TỪ BACKEND ASP.NET CORE
    const parseBackendError = (error) => {
        const resData = error.response?.data;
        if (!resData) return "Lỗi kết nối đến máy chủ!";

        if (resData.errors && typeof resData.errors === 'object' && !Array.isArray(resData.errors)) {
            const errorMessages = Object.values(resData.errors).flat();
            if (errorMessages.length > 0) return errorMessages.join(' | ');
        }
        
        if (resData.message || resData.Message) {
            return resData.message || resData.Message;
        }

        if (typeof resData === 'string') return resData;
        
        return "Lỗi dữ liệu đầu vào không hợp lệ!";
    };

    // --- BỘ NÃO STATE MACHINE ---
    const analyzeStateMachine = (contract) => {
        if (!contract) return { type: 'UNKNOWN', label: 'Lỗi', bg: 'secondary', permissions: {} };

        const dbStatus = contract.status ?? contract.Status;
        const settlementStatus = contract.settlementStatus ?? contract.SettlementStatus;

        if (dbStatus === -1) return { type: 'CANCELLED', label: 'Đã Hủy', bg: 'secondary', permissions: { canEditCore: false, canEditAddons: false, canSubmit: false, canCancel: false, canTerminate: false, canExtend: false, canSoftDelete: true } };
        
        if (dbStatus === 0) {
            if (settlementStatus === 1) {
                return { type: 'PENDING_INSPECTION', label: 'Chờ Kiểm Tra Phòng', bg: 'warning', icon: 'bi-search', permissions: { canEditCore: false, canEditAddons: false, canSubmit: false, canCancel: false, canTerminate: false, canExtend: false, canSoftDelete: false, canSettle: true, reasonNoDelete: "Đang chờ kiểm tra phòng" } };
            }
            if (settlementStatus === 2) {
                return { type: 'PENDING_SETTLEMENT', label: 'Chờ Thu/Chi Tiền', bg: 'danger', icon: 'bi-currency-dollar', permissions: { canEditCore: false, canEditAddons: false, canSubmit: false, canCancel: false, canTerminate: false, canExtend: false, canSoftDelete: false, canSettle: true, reasonNoDelete: "Chưa thanh toán xong công nợ" } };
            }
            return { type: 'TERMINATED', label: 'Đã Tất Toán', bg: 'dark', icon: 'bi-check-all', permissions: { canEditCore: false, canEditAddons: false, canSubmit: false, canCancel: false, canTerminate: false, canExtend: false, canSoftDelete: false, reasonNoDelete: "Chứa công nợ lịch sử" } };
        }

        const startDay = contract.startDay ?? contract.StartDay;
        const endDay = contract.endDay ?? contract.EndDay;
        if (!startDay || !endDay) return { type: 'UNKNOWN', label: 'Lỗi Dữ liệu', bg: 'danger', permissions: {} };

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const start = new Date(startDay); start.setHours(0, 0, 0, 0);
        const end = new Date(endDay); end.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

        if (today < start) return { type: 'PENDING', label: 'Chờ Hiệu Lực', bg: 'info', permissions: { canEditCore: true, canEditAddons: true, canSubmit: false, canCancel: true, canTerminate: false, canExtend: false, canSoftDelete: false, reasonNoDelete: "Dùng chức năng Hủy" } };
        if (today > end) return { type: 'OVERDUE', label: 'Quá Hạn', bg: 'danger', permissions: { canEditCore: false, canEditAddons: false, canSubmit: false, canCancel: false, canTerminate: true, canExtend: true, requiresExtendNote: true, canSoftDelete: false, reasonNoDelete: "Cần xử lý vi phạm" } };
        if (diffDays <= 30) return { type: 'EXPIRING_SOON', label: 'Sắp Hết Hạn', bg: 'warning', permissions: { canEditCore: false, canEditAddons: true, canSubmit: false, canCancel: false, canTerminate: true, canExtend: true, canSoftDelete: false, reasonNoDelete: "Hợp đồng đang chạy" } };

        return { type: 'ACTIVE', label: 'Đang Hiệu Lực', bg: 'success', permissions: { canEditCore: false, canEditAddons: true, canSubmit: false, canCancel: false, canTerminate: true, canExtend: true, canSoftDelete: false, reasonNoDelete: "Hợp đồng đang chạy" } };
    };

    // --- API FETCHING ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const [cRes, aRes, rRes, sRes] = await Promise.all([
                api.get('/contract/view-all-contract').catch(() => ({ data: [] })),
                api.get('/Apartments').catch(() => ({ data: [] })),
                api.get('/Residents/GetAllResidents').catch(() => ({ data: [] })),
                api.get('/Service').catch(() => ({ data: [] }))
            ]);
            setContracts(Array.isArray(cRes.data?.data || cRes.data?.Data || cRes.data) ? (cRes.data?.data || cRes.data?.Data || cRes.data) : []);
            setApartments(Array.isArray(aRes.data?.data || aRes.data?.Data || aRes.data) ? (aRes.data?.data || aRes.data?.Data || aRes.data) : []);
            setResidents(Array.isArray(rRes.data?.data || rRes.data?.Data || rRes.data) ? (rRes.data?.data || rRes.data?.Data || rRes.data) : []);
            setSystemServices(Array.isArray(sRes.data?.data || sRes.data?.Data || sRes.data) ? (sRes.data?.data || sRes.data?.Data || sRes.data) : []);
        } catch (error) { toast.error("Lỗi đồng bộ hệ thống!"); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus]);

    // Update termination preview when additionalCost changes
    useEffect(() => {
        if (terminateResult && terminateResult.isPreview && additionalCost !== '') {
            const deposit = terminateResult.Deposit || 0;
            const unpaidInvoice = terminateResult.UnpaidInvoice || 0;
            const additional = Number(additionalCost) || 0;
            const refund = deposit - unpaidInvoice - additional;
            
            setTerminateResult({
                ...terminateResult,
                AdditionalCost: additional,
                RefundAmount: refund
            });
        }
    }, [additionalCost]);

    const fetchDeletedContracts = async () => {
        setLoadingDeleted(true);
        try {
            const res = await api.get('/contract/deleted-contracts');
            setDeletedContracts(res.data?.data || res.data?.Data || res.data || []);
        } catch (error) { toast.error("Lỗi lấy lịch sử!"); }
        finally { setLoadingDeleted(false); }
    };

    // --- ACTIONS ROUTER ---
    const handleActionClick = async (actionType, contract) => {
        const state = analyzeStateMachine(contract);
        setSelectedContract(contract);

        setActionDate(''); setAdditionalCost(''); setTerminateResult(null); setTerminationReason('');
        setExtendNewEndDate(''); setExtendOldEndDate(''); setSettleAdditionalCost(''); setSettleNote('');

        if (actionType === 'VIEW') {
            setActiveDrawer('VIEW');
        }
        else if (actionType === 'EDIT') {
            const currentId = contract.contractId || contract.ContractId;
            setEditContractId(currentId);
            setFormData({
                apartmentId: contract.apartmentId || '', residentAccountId: contract.accountId || '',
                startDay: contract.startDay ? String(contract.startDay).substring(0, 10) : '',
                endDay: contract.endDay ? String(contract.endDay).substring(0, 10) : '',
                monthlyRent: contract.monthlyRent ?? '', deposit: contract.deposit ?? '',
                file: null, existingFileUrl: contract.file || contract.File || '', additionalResidents: [], selectedServices: []
            });
            try {
                const res = await api.get(`/contract/view-contract/${currentId}`);
                const detail = res?.data?.data || res?.data?.Data || res?.data || {};
                setFormData(prev => ({
                    ...prev,
                    additionalResidents: (detail?.additionalResidents || []).map(r => ({ accountId: String(r?.accountId), relationshipId: String(r?.relationshipId) })),
                    selectedServices: (detail?.selectedServices || []).map(s => ({ serviceId: String(s?.serviceId), actualPrice: String(s?.actualPrice) }))
                }));
            } catch (error) { toast.error("Không thể tải chi tiết!"); return; }
            setIsEditMode(true);
            setActiveDrawer('FORM');
        }
        else if (actionType === 'EXTEND') {
            setExtendContractId(contract.contractId || contract.ContractId);
            setExtendOldEndDate(contract.endDay ? String(contract.endDay).substring(0, 10) : '');
            setActiveDrawer('EXTEND');
        }
        else if (actionType === 'TERMINATE' || actionType === 'CANCEL') {
            setSelectedTerminateId(contract.contractId || contract.ContractId);
            setActionDate(new Date().toISOString().substring(0, 10));
            
            // Fetch invoice data for termination preview
            if (actionType === 'TERMINATE') {
                try {
                    const contractId = contract.contractId || contract.ContractId;
                    // Use new endpoint to get ALL unpaid invoices for this contract
                    const invoiceRes = await api.get(`/invoice/contract/${contractId}/unpaid`);
                    const invoices = invoiceRes?.data?.data || invoiceRes?.data?.Data || invoiceRes?.data || [];
                    
                    console.log("🔍 All unpaid invoices from API:", invoices);
                    console.log("🔍 Contract ID:", contractId);
                    
                    // Calculate unpaid invoice
                    let totalInvoice = 0;
                    let totalPaid = 0;
                    const unpaidInvoiceList = [];
                    
                    for (const inv of invoices) {
                        const invTotal = inv.totalMoney || inv.TotalMoney || 0;
                        const invPaid = inv.paidAmount || inv.PaidAmount || 0;
                        const invUnpaid = invTotal - invPaid;
                        
                        totalInvoice += invTotal;
                        totalPaid += invPaid;
                        
                        // Track ALL unpaid invoices (even if partially paid)
                        if (invUnpaid > 0) {
                            unpaidInvoiceList.push({
                                month: inv.billingMonth || inv.BillingMonth,
                                year: inv.billingYear || inv.BillingYear,
                                amount: invUnpaid,
                                total: invTotal,
                                paid: invPaid
                            });
                        }
                    }
                    
                    // Sort by year and month ascending
                    unpaidInvoiceList.sort((a, b) => {
                        if (a.year !== b.year) return a.year - b.year;
                        return a.month - b.month;
                    });
                    
                    const unpaidInvoice = totalInvoice - totalPaid;
                    
                    console.log("📊 Unpaid Invoice Details:", {
                        totalInvoice,
                        totalPaid,
                        unpaidInvoice,
                        unpaidInvoiceList
                    });
                    
                    // Set preview data with detailed unpaid invoice list
                    setTerminateResult({
                        Deposit: contract.deposit || contract.Deposit || 0,
                        UnpaidInvoice: unpaidInvoice,
                        UnpaidInvoiceList: unpaidInvoiceList,
                        AdditionalCost: 0,
                        RefundAmount: (contract.deposit || contract.Deposit || 0) - unpaidInvoice - 0,
                        isPreview: true
                    });
                } catch (error) {
                    console.error("Error fetching invoice data:", error);
                    // Set default preview with deposit only
                    setTerminateResult({
                        Deposit: contract.deposit || contract.Deposit || 0,
                        UnpaidInvoice: 0,
                        UnpaidInvoiceList: [],
                        AdditionalCost: 0,
                        RefundAmount: contract.deposit || contract.Deposit || 0,
                        isPreview: true
                    });
                }
            }
            
            setActiveDrawer(actionType);
        }
        else if (actionType === 'SETTLE') {
            // Fetch deposit settlement details before showing settle drawer
            try {
                const res = await api.get(`/contract/${contract.contractId || contract.ContractId}/deposit-settlement`);
                const settlementData = res.data;
                setSelectedContract({ ...contract, settlementData });
                setSettleAdditionalCost(settlementData.additionalCost || '');
                setActiveDrawer('SETTLE');
            } catch (error) {
                toast.error("Không thể tải thông tin quyết toán!");
            }
        }
        else if (actionType === 'DELETE') {
            if (!state.permissions.canSoftDelete) return toast.warning(`BẢO VỆ: ${state.permissions.reasonNoDelete}`);
            if (window.confirm("Đưa hợp đồng này vào thùng rác?")) {
                try { await api.delete(`/contract/${contract.contractId || contract.ContractId}/soft-delete`); toast.success("Đã xóa mềm!"); fetchData(); }
                catch (error) { toast.error("Lỗi xóa!"); }
            }
        }
    };

    // --- FORM LOGIC ---
    const handleInputChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type !== "application/pdf") { toast.error("Chỉ chấp nhận định dạng PDF!"); e.target.value = ''; return; }
        if (file && file.size > 5 * 1024 * 1024) { toast.error("File quá lớn (>5MB)!"); e.target.value = ''; return; }
        setFormData(prev => ({ ...prev, file }));
    };

    const handleListChange = (listName, index, field, value) => {
        const newArr = [...formData[listName]]; newArr[index][field] = value; setFormData({ ...formData, [listName]: newArr });
    };

    const addResidentRow = () => setFormData(prev => ({ ...prev, additionalResidents: [...(prev.additionalResidents || []), { accountId: '', relationshipId: '' }] }));
    const removeResidentRow = (index) => setFormData(prev => ({ ...prev, additionalResidents: (prev.additionalResidents || []).filter((_, i) => i !== index) }));
    const addServiceRow = () => setFormData(prev => ({ ...prev, selectedServices: [...(prev.selectedServices || []), { serviceId: '', actualPrice: '' }] }));
    const removeServiceRow = (index) => setFormData(prev => ({ ...prev, selectedServices: (prev.selectedServices || []).filter((_, i) => i !== index) }));

    const handleSaveContract = async () => {
        if (!formData.apartmentId || !formData.residentAccountId || !formData.startDay || !formData.endDay) {
            return toast.warning("Thiếu thông tin Cư dân, Căn hộ hoặc Ngày tháng!");
        }
        if (new Date(formData.startDay) >= new Date(formData.endDay)) {
            return toast.warning("Ngày kết thúc phải lớn hơn ngày bắt đầu!");
        }

        const rent = Number(formData.monthlyRent || 0);
        const deposit = Number(formData.deposit || 0);

        if (rent <= 0) {
            return toast.warning("🚨 HỢP LỆ: Giá thuê hợp đồng bắt buộc phải lớn hơn 0 VNĐ!");
        }
        if (deposit < 0) {
            return toast.warning("🚨 HỢP LỆ: Tiền cọc không được là số âm!");
        }
        if (!isEditMode && !formData.file) {
            return toast.warning("🚨 HỢP LỆ: Bắt buộc phải tải lên bản Scan PDF có chữ ký!");
        }

        // Validate additional residents
        if (formData.additionalResidents && formData.additionalResidents.length > 0) {
            for (let i = 0; i < formData.additionalResidents.length; i++) {
                const resident = formData.additionalResidents[i];
                const accountId = Number(resident.accountId);
                
                if (!resident.accountId || accountId <= 0) {
                    return toast.warning(`🚨 Người ở ghép thứ ${i + 1}: Vui lòng chọn tài khoản hợp lệ!`);
                }
                
                if (!resident.relationshipId) {
                    return toast.warning(`🚨 Người ở ghép thứ ${i + 1}: Vui lòng chọn mối quan hệ!`);
                }

                // Check if account exists in residents list
                const residentExists = residents.find(r => r.accountId === accountId);
                if (!residentExists) {
                    return toast.warning(`🚨 Người ở ghép thứ ${i + 1}: Tài khoản không tồn tại trong hệ thống!`);
                }
            }
        }

        // Debug logging for update mode
        if (isEditMode) {
            console.log('[DEBUG] Updating contract with AdditionalResidents:', formData.additionalResidents);
            console.log('[DEBUG] AdditionalResidents AccountIds:', formData.additionalResidents?.map(r => r.accountId));
        }

        setIsSubmitting(true);
        const payload = new FormData();
        payload.append("ApartmentId", formData.apartmentId); 
        payload.append("ResidentAccountId", formData.residentAccountId);
        payload.append("StartDay", formData.startDay); 
        payload.append("EndDay", formData.endDay);
        payload.append("MonthlyRent", rent); 
        payload.append("Deposit", deposit); 
        if (formData.file) payload.append("File", formData.file);

        (formData.additionalResidents || []).forEach((r, i) => { 
            if (r.accountId && r.relationshipId) { 
                payload.append(`AdditionalResidents[${i}].AccountId`, r.accountId); 
                payload.append(`AdditionalResidents[${i}].RelationshipId`, r.relationshipId); 
            } 
        });
        (formData.selectedServices || []).forEach((s, i) => { 
            if (s.serviceId) { 
                payload.append(`Services[${i}].ServiceId`, s.serviceId); 
                if (s.actualPrice) payload.append(`Services[${i}].ActualPrice`, s.actualPrice); 
            } 
        });

        try {
            const url = isEditMode ? `/contract/${editContractId}/update-contract` : '/contract/create-contract';
            const method = isEditMode ? 'put' : 'post';
            await api[method](url, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success("Phát hành hợp đồng thành công!");
            closeDrawer(); fetchData();
        } catch (error) {
            console.error("Chi tiết lỗi BE:", error.response?.data);
            const backendMessage = parseBackendError(error);
            toast.error("LỖI TỪ MÁY CHỦ: " + backendMessage);
        }
        finally { setIsSubmitting(false); }
    };

    const handleExecuteExtend = async (e) => {
        e.preventDefault();
        if (new Date(extendNewEndDate) <= new Date(extendOldEndDate)) return toast.error("Ngày gia hạn phải lớn hơn ngày cũ!");

        setIsExtending(true);
        try {
            await api.put(`/contract/${extendContractId}/extend`, { newEndDate: extendNewEndDate });
            toast.success("Gia hạn thành công!"); closeDrawer(); fetchData();
        } catch (error) { 
            const backendMessage = parseBackendError(error);
            toast.error("Gia hạn thất bại: " + backendMessage); 
        } 
        finally { setIsExtending(false); }
    };

    const handleExecuteTerminate = async (e) => {
        e.preventDefault();
        if (additionalCost < 0) return toast.warning("Phí phát sinh không được là số âm!");

        setIsTerminating(true);
        try {
            const res = await api.put(`/contract/${selectedTerminateId}/terminate`,
                {
                    terminationDate: actionDate,
                    additionalCost: Number(additionalCost || 0),
                    terminationReason: terminationReason
                });
            
            console.log("🔍 Full Response:", res);
            console.log("🔍 Response Status:", res.status);
            console.log("🔍 Response Data:", res.data);
            
            // Kiểm tra statusCode trong response data
            const responseData = res?.data;
            if (responseData?.statusCode && responseData.statusCode !== 200) {
                // Backend trả về lỗi nhưng HTTP status vẫn là 200
                throw new Error(responseData.message || "Thanh lý thất bại");
            }
            
            const result = responseData?.data || responseData?.Data || responseData;
            console.log("🔍 Termination Result:", result);
            
            // Remove isPreview flag to show success message
            setTerminateResult({ ...result, isPreview: false });
            toast.success("Đã chốt thanh lý!"); 
            fetchData();
        } catch (error) { 
            console.error("❌ Termination Error:", error);
            console.error("❌ Error Response:", error.response);
            const backendMessage = parseBackendError(error);
            toast.error("Thanh lý thất bại: " + backendMessage); 
        } 
        finally { setIsTerminating(false); }
    };

    const handleExecuteCancel = async () => {
        if (!window.confirm("Hủy hợp đồng chưa hiệu lực?")) return;
        try {
            await api.delete(`/contract/${selectedTerminateId}/soft-delete`);
            toast.success("Đã Hủy hợp đồng!"); closeDrawer(); fetchData();
        } catch (error) { 
            const backendMessage = parseBackendError(error);
            toast.error("Lỗi khi hủy: " + backendMessage); 
        }
    };

    const handleExecuteSettle = async () => {
        setIsSettling(true);
        try {
            await api.put(`/contract/${selectedContract.contractId || selectedContract.ContractId}/settle`, {
                additionalCost: Number(settleAdditionalCost || 0),
                note: settleNote
            });
            toast.success("Đã hoàn tất quyết toán hợp đồng!");
            closeDrawer();
            fetchData(); 
        } catch (error) {
            const backendMessage = parseBackendError(error);
            toast.error("Quyết toán thất bại: " + backendMessage);
        } finally {
            setIsSettling(false);
        }
    };

    const handleRestoreContract = async (id) => {
        try { await api.put(`/contract/${id}/restore`); toast.success("Đã khôi phục!"); fetchDeletedContracts(); fetchData(); }
        catch (error) { toast.error("Lỗi khôi phục!"); }
    };

    const handleHardDeleteContract = async (id) => {
        if (deleteConfirmText !== "XAC NHAN") return toast.warning("Vui lòng gõ XAC NHAN để xóa vĩnh viễn!");
        try { await api.delete(`/contract/${id}/hard-delete`); toast.success("Đã xóa cứng!"); setDeleteConfirmText(''); fetchDeletedContracts(); }
        catch (error) { toast.error("Lỗi xóa vĩnh viễn!"); }
    };

    const safeApartments = (apartments || []).filter(Boolean);
    const safeResidents = (residents || []).filter(Boolean);
    const safeServices = (systemServices || []).filter(Boolean);

    const availableApartments = safeApartments.filter(a => {
        const st = a.status ?? a.Status;
        return (st === 1 || String(st).toLowerCase() === 'vacant') || (isEditMode && Number(a.apartmentId ?? a.ApartmentId) === Number(formData.apartmentId));
    });

    const availableResidents = safeResidents.filter(r => {
        const st = r.status ?? r.Status;
        return st == null || st === 1 || String(st).toLowerCase() === 'active';
    });

    const selectedResidentIds = [Number(formData.residentAccountId), ...(formData.additionalResidents || []).map(r => Number(r.accountId))].filter(id => id !== 0 && !isNaN(id));
    const selectedServiceIds = (formData.selectedServices || []).map(s => Number(s.serviceId)).filter(id => id !== 0 && !isNaN(id));

    const dashboardStats = useMemo(() => {
        let active = 0, expiring = 0, overdue = 0;
        (contracts || []).filter(Boolean).forEach(c => {
            const type = analyzeStateMachine(c).type;
            if (type === 'ACTIVE' || type === 'PENDING') active++;
            if (type === 'EXPIRING_SOON') expiring++;
            if (type === 'OVERDUE') overdue++;
        });
        return { total: (contracts || []).filter(Boolean).length, active, expiring, overdue };
    }, [contracts]);

    const filteredContracts = (contracts || []).filter(Boolean).filter(c => {
        const searchStr = searchTerm.toLowerCase();
        const matchSearch = (c.contractCode || '').toLowerCase().includes(searchStr) ||
            (c.account?.info?.fullName || c.account?.fullName || '').toLowerCase().includes(searchStr) ||
            (c.apartment?.apartmentCode || '').toLowerCase().includes(searchStr);
        let matchStatus = true;
        if (filterStatus !== 'all') {
            const type = analyzeStateMachine(c).type;
            if (filterStatus === '1') matchStatus = type === 'ACTIVE' || type === 'PENDING';
            else if (filterStatus === 'expiring') matchStatus = type === 'EXPIRING_SOON';
            else if (filterStatus === 'pending_inspection') matchStatus = type === 'PENDING_INSPECTION';
            else if (filterStatus === 'pending_settlement') matchStatus = type === 'PENDING_SETTLEMENT';
            else if (filterStatus === '0') matchStatus = type === 'TERMINATED' || type === 'CANCELLED';
        }
        return matchSearch && matchStatus;
    });

    const currentItems = filteredContracts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const renderTimeline = (contract, stateMachine) => {
        if (!contract || !contract.startDay || !contract.endDay || stateMachine.type === 'CANCELLED') return null;
        const start = new Date(contract.startDay); const end = new Date(contract.endDay); const today = new Date();
        const total = end - start; const passed = today - start;
        let progress = total > 0 ? (passed / total) * 100 : 0;
        progress = Math.max(0, Math.min(100, progress));

        return (
            <div className="timeline-container shadow-sm">
                <h6 className="fw-bold mb-3 text-dark d-flex justify-content-between"><span>Tiến độ Hợp Đồng</span> <span className={`badge bg-${stateMachine.bg} px-3 py-2 rounded-pill`}>{stateMachine.label}</span></h6>
                <div className="d-flex justify-content-between small fw-bold text-muted mb-1"><span>{formatDate(contract.startDay)}</span><span>{formatDate(contract.endDay)}</span></div>
                <div className="timeline-track">
                    <div className="timeline-progress" style={{ width: `${progress}%`, background: stateMachine.type === 'OVERDUE' ? '#ef4444' : '' }}></div>
                    <div className="timeline-marker" style={{ left: '0%' }}></div>
                    <div className="timeline-marker" style={{ left: '100%', borderColor: stateMachine.type === 'OVERDUE' ? '#ef4444' : '#e2e8f0' }}></div>
                    {progress > 0 && progress <= 100 && <div className="timeline-now" style={{ left: `${progress}%` }}></div>}
                </div>
            </div>
        );
    };

    return (
        <div className="container-fluid p-0 pb-5" style={{ backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
            <ToastContainer enableMultiContainer containerId="contractToast" position="top-right" autoClose={5000} limit={2} />

            <div className="px-5 pt-4">
                <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div style={{ zIndex: 2 }}>
                        <h2 className="fw-bolder mb-1"><i className="bi bi-shield-check me-2 text-info"></i>Contract Center</h2>
                        <p className="mb-0 text-white-50 fw-medium" style={{ fontSize: '0.95rem' }}>Hệ thống quản trị vòng đời và giám sát tài chính</p>
                    </div>
                    <div className="d-flex gap-3" style={{ zIndex: 2 }}>
                        <button className="btn btn-light fw-bold text-dark rounded-pill px-4 py-2 shadow-sm" onClick={fetchDeletedContracts} data-bs-toggle="modal" data-bs-target="#trashModal">
                            <i className="bi bi-archive-fill me-2 text-danger"></i>Lịch sử & Thùng rác
                        </button>
                        <button className="btn btn-gradient-warning rounded-pill px-4 py-2 shadow" onClick={() => { setIsEditMode(false); setFormData(initialFormState); setActiveDrawer('FORM'); document.getElementById('file').value = ''; }}>
                            <i className="bi bi-pen-fill me-2"></i>Ký Hợp Đồng
                        </button>
                    </div>
                </div>

                <div className="row g-4 mb-4">
                    {[
                        { title: "Tổng Hợp Đồng", val: dashboardStats.total, color: "primary", icon: "bi-layers" }, 
                        { title: "Đang Hiệu Lực", val: dashboardStats.active, color: "success", icon: "bi-check-circle" }, 
                        { title: "Sắp Hết Hạn", val: dashboardStats.expiring, color: "warning", icon: "bi-hourglass-bottom", alert: dashboardStats.expiring > 0 ? "Cần gia hạn ngay!" : null }
                    ].map((s, i) => (
                        <div className="col-md-4" key={i}>
                            <div className={`modern-card h-100 border-start border-${s.color} border-4`}>
                                <div className="card-body p-4 d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-muted fw-bold mb-2 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>{s.title}</h6>
                                        <h2 className={`fw-bold mb-0 text-${s.color}`}>{s.val}</h2>
                                        {s.alert && <small className={`text-${s.color} fw-bold mt-2 d-block`}><i className="bi bi-bell-fill me-1"></i>{s.alert}</small>}
                                    </div>
                                    <div className={`bg-${s.color} bg-opacity-10 p-3 rounded-circle`}><i className={`bi ${s.icon} text-${s.color} fs-3`}></i></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="modern-card mb-4 p-3 d-flex flex-wrap gap-3 align-items-center">
                    <div className="flex-grow-1" style={{ minWidth: '300px' }}>
                        <div className="input-icon-wrapper">
                            <i className="bi bi-search input-icon"></i>
                            <input type="text" className="form-control form-control-icon bg-light border-0 shadow-none" placeholder="Tìm kiếm Mã HĐ, Tên cư dân, Số phòng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                    <div style={{ minWidth: '220px' }}>
                        <select className="form-control-icon form-select bg-light border-0 fw-semibold text-secondary shadow-none w-100" style={{ paddingLeft: '16px !important' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="all">Hiển thị: Tất cả</option>
                            <option value="1">🟢 Đang hiệu lực / Chờ</option>
                            <option value="expiring">🟡 Sắp hết hạn</option>
                            <option value="pending_inspection">🟠 Chờ kiểm tra phòng</option>
                            <option value="pending_settlement">🔴 Chờ khách thanh toán</option>
                            <option value="0">⚫ Đã tất toán hoàn toàn</option>
                        </select>
                    </div>
                </div>

                <div className="table-container">
                    {loading ? (<div className="text-center py-5"><div className="spinner-border text-primary mb-3"></div></div>) : filteredContracts.length === 0 ? (
                        <div className="modern-card text-center py-5 shadow-sm">
                            <i className="bi bi-inbox empty-state-icon mb-3 d-block"></i>
                            <h4 className="fw-bold text-dark">Không có dữ liệu</h4>
                            <p className="text-muted mb-4">Bạn chưa tạo hợp đồng nào hoặc không có kết quả phù hợp với bộ lọc.</p>
                            <button className="btn btn-gradient-primary rounded-pill px-4 py-2" onClick={() => { setIsEditMode(false); setFormData(initialFormState); setActiveDrawer('FORM'); }}><i className="bi bi-plus-lg me-2"></i>Tạo Hợp Đồng Đầu Tiên</button>
                        </div>
                    ) : (
                        <div className="table-responsive" style={{ overflowX: 'visible' }}>
                            <table className="table table-custom w-100">
                                <thead>
                                    <tr><th className="ps-4">Hợp Đồng</th><th>Chủ Hộ</th><th>Thời hạn & Tài chính</th><th>Trạng Thái</th><th className="text-end pe-4">Thao tác</th></tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((contract, idx) => {
                                        const state = analyzeStateMachine(contract);
                                        return (
                                            <tr key={contract.contractId || idx} className={state.type === 'OVERDUE' ? 'border border-danger' : ''}>
                                                <td className="ps-4">
                                                    <div className="fw-bold text-dark mb-1 fs-6">{contract?.contractCode || 'N/A'}</div>
                                                    {(contract?.file || contract?.File) ? <a href={contract?.file || contract?.File} target="_blank" rel="noreferrer" className="badge bg-danger bg-opacity-10 text-danger border border-danger text-decoration-none"><i className="bi bi-file-pdf-fill me-1"></i>Bản PDF</a> : <span className="badge bg-light text-muted border">Chưa up file</span>}
                                                </td>
                                                <td>
                                                    <div className="fw-bold text-dark">{contract?.account?.info?.fullName || contract?.account?.userName || "N/A"}</div>
                                                    <span className="badge bg-dark text-white rounded-pill px-3 py-1 mt-2"><i className="bi bi-door-open text-warning me-1"></i>P.{contract?.apartment?.apartmentCode || "N/A"}</span>
                                                </td>
                                                <td>
                                                    <div className="small mb-1"><span className="text-muted">Từ: </span><span className="fw-semibold">{formatDate(contract?.startDay)}</span> <span className="text-muted mx-1">đến</span> <span className={`fw-bold ${state.type === 'EXPIRING_SOON' || state.type === 'OVERDUE' ? 'text-danger' : 'text-dark'}`}>{formatDate(contract?.endDay)}</span></div>
                                                    <div className="small text-secondary fw-semibold">Rent: {formatCurrency(contract?.monthlyRent)}</div>
                                                    {state.alert && <div className={`small fw-bold mt-2 text-${state.bg}`}><i className="bi bi-info-circle-fill me-1"></i>{state.alert}</div>}
                                                </td>
                                                <td><div className={`status-badge bg-${state.bg} bg-opacity-10 text-${state.bg} border border-${state.bg}`}><i className={`bi ${state.icon}`}></i> {state.label}</div></td>

                                                <td className="text-end pe-4 action-dropdown">
                                                    <div className="dropdown d-inline-block">
                                                        <button className={`btn btn-sm ${state.type === 'OVERDUE' ? 'btn-danger btn-suggest-terminate' : state.type === 'EXPIRING_SOON' ? 'btn-warning btn-suggest-extend' : 'btn-light border'} rounded-pill px-4 py-2 shadow-sm`} data-bs-toggle="dropdown">Hành động <i className="bi bi-chevron-down ms-1"></i></button>
                                                        <ul className="dropdown-menu dropdown-menu-end mt-2" style={{ minWidth: '240px' }}>
                                                            <li><button className="dropdown-item d-flex align-items-center fw-bold text-dark" onClick={() => handleActionClick('VIEW', contract)}>
                                                                <i className="bi bi-eye-fill me-3 fs-5 text-secondary"></i> Xem chi tiết HĐ
                                                            </button></li>
                                                            
                                                            {state.permissions.canSettle && (
                                                                <li>
                                                                    <button 
                                                                        className="dropdown-item d-flex align-items-center text-primary fw-bold bg-primary bg-opacity-10 mt-1" 
                                                                        onClick={() => handleActionClick('SETTLE', contract)}
                                                                    >
                                                                        <i className={`bi ${state.type === 'PENDING_INSPECTION' ? 'bi-search' : 'bi-currency-dollar'} me-3 fs-5`}></i> 
                                                                        {state.type === 'PENDING_INSPECTION' ? 'Điền biên bản kiểm tra phòng' : 'Xác nhận Đã thu/chi tiền'}
                                                                    </button>
                                                                </li>
                                                            )}

                                                            <li><button className={`dropdown-item d-flex align-items-center ${!state.permissions.canEditCore && !state.permissions.canEditAddons ? 'strict-disabled' : 'text-primary'}`} onClick={() => handleActionClick('EDIT', contract)} title={!state.permissions.canEditCore ? "Chỉ sửa Dịch vụ & Người phụ" : ""}>
                                                                <i className="bi bi-pencil-square me-3 fs-5"></i> {state.permissions.canEditCore ? 'Sửa toàn bộ' : 'Cập nhật Add-ons'} {(!state.permissions.canEditCore && !state.permissions.canEditAddons) && <i className="bi bi-lock-fill lock-icon"></i>}
                                                            </button></li>
                                                            <li><button className={`dropdown-item d-flex align-items-center ${!state.permissions.canExtend ? 'strict-disabled' : 'text-info'}`} onClick={() => handleActionClick('EXTEND', contract)}>
                                                                <i className="bi bi-calendar-plus me-3 fs-5"></i> Gia hạn Hợp đồng {!state.permissions.canExtend && <i className="bi bi-lock-fill lock-icon"></i>}
                                                            </button></li>
                                                            {state.type === 'PENDING' && (
                                                                <li><button className="dropdown-item d-flex align-items-center text-warning" onClick={() => handleActionClick('CANCEL', contract)}><i className="bi bi-x-circle me-3 fs-5"></i> Hủy Giao Kèo</button></li>
                                                            )}
                                                            {state.type !== 'PENDING' && (
                                                                <li><button className={`dropdown-item d-flex align-items-center ${!state.permissions.canTerminate ? 'strict-disabled' : 'text-danger'}`} onClick={() => handleActionClick('TERMINATE', contract)}>
                                                                    <i className="bi bi-x-octagon-fill me-3 fs-5"></i> Thanh lý / Thu hồi {!state.permissions.canTerminate && <i className="bi bi-lock-fill lock-icon"></i>}
                                                                </button></li>
                                                            )}
                                                            <li><hr className="dropdown-divider my-1" /></li>
                                                            <li><button className={`dropdown-item d-flex align-items-center ${!state.permissions.canSoftDelete ? 'strict-disabled' : 'text-danger'}`} onClick={() => handleActionClick('DELETE', contract)}>
                                                                <i className="bi bi-trash3-fill me-3 fs-5"></i> Bỏ vào Thùng Rác {!state.permissions.canSoftDelete && <i className="bi bi-lock-fill ms-2"></i>}
                                                            </button></li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="p-3 d-flex justify-content-center w-100"><Pagination totalPages={Math.ceil(filteredContracts.length / itemsPerPage)} currentPage={currentPage} onPageChange={setCurrentPage} /></div>
                        </div>
                    )}
                </div>
            </div>

            <div className={`drawer-backdrop ${activeDrawer ? 'open' : ''}`} onClick={closeDrawer}></div>

            <div className={`custom-drawer ${activeDrawer === 'VIEW' ? 'open' : ''}`} style={{ width: '600px' }}>
                <div className="drawer-header bg-dark text-white"><h4 className="fw-bold mb-0">Chi Tiết Hợp Đồng</h4><button className="btn-close btn-close-white" onClick={closeDrawer}></button></div>
                <div className="drawer-body bg-light">
                    {selectedContract && (() => {
                        const sm = analyzeStateMachine(selectedContract);
                        return (
                            <>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4 className="fw-bold text-primary mb-0">{selectedContract.contractCode}</h4>
                                    <div className={`status-badge bg-${sm.bg} bg-opacity-10 text-${sm.bg} border border-${sm.bg}`}>{sm.label}</div>
                                </div>
                                <div className="form-section shadow-sm mb-4">
                                    <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Thông tin Pháp lý</h6>
                                    <div className="row mb-2"><div className="col-5 text-muted">Chủ Hộ:</div><div className="col-7 fw-semibold">{selectedContract.account?.info?.fullName || selectedContract.account?.userName || 'N/A'}</div></div>
                                    <div className="row mb-2"><div className="col-5 text-muted">Phòng:</div><div className="col-7 fw-semibold">{selectedContract.apartment?.apartmentCode}</div></div>
                                    <div className="row mb-2"><div className="col-5 text-muted">Thời hạn:</div><div className="col-7 fw-semibold">{formatDate(selectedContract.startDay)} - {formatDate(selectedContract.endDay)}</div></div>
                                    <div className="row mb-2"><div className="col-5 text-muted">Tiền Thuê:</div><div className="col-7 fw-semibold text-primary">{formatCurrency(selectedContract.monthlyRent)}/tháng</div></div>
                                    <div className="row mb-2"><div className="col-5 text-muted">Tiền Cọc (Deposit):</div><div className="col-7 fw-semibold text-success">{formatCurrency(selectedContract.deposit)}</div></div>
                                    <div className="row mt-4"><div className="col-12">
                                        {(selectedContract.file || selectedContract.File) ? (
                                            <a href={selectedContract.file || selectedContract.File} target="_blank" rel="noreferrer" className="btn btn-outline-danger w-100 fw-bold"><i className="bi bi-file-earmark-pdf-fill me-2"></i>Tải Bản PDF Gốc</a>
                                        ) : <div className="text-muted fst-italic text-center bg-light p-2 rounded">Không có file đính kèm</div>}
                                    </div></div>
                                </div>

                                {(sm.type === 'TERMINATED' || sm.type === 'PENDING_INSPECTION' || sm.type === 'PENDING_SETTLEMENT') && (
                                    <div className="form-section shadow-sm bg-white border-dark border-2 mt-4">
                                        <h6 className="fw-bold text-danger border-bottom border-danger pb-2 mb-3">
                                            <i className="bi bi-calculator me-2"></i>Chi Tiết Quyết Toán
                                        </h6>
                                        <div className="row mb-2">
                                            <div className="col-6 text-muted">Tiền cọc ban đầu:</div>
                                            <div className="col-6 fw-semibold">{formatCurrency(selectedContract.deposit)}</div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-6 text-muted">Phạt / Hư hỏng (Additional):</div>
                                            <div className="col-6 fw-bold text-danger">- {formatCurrency(selectedContract.additionalCost || 0)}</div>
                                        </div>
                                        <hr className="my-2" />
                                        <div className="row mb-2">
                                            <div className="col-6 text-dark fw-bold">Tổng tiền hoàn trả (Refund):</div>
                                            <div className="col-6 fw-bolder fs-5 text-success">{formatCurrency(selectedContract.refundAmount || 0)}</div>
                                        </div>
                                        
                                        {selectedContract.settledAt && (
                                            <div className="mt-3 small text-muted fst-italic">
                                                <i className="bi bi-check-circle-fill text-success me-1"></i> 
                                                Hoàn tất quyết toán vào: {new Date(selectedContract.settledAt).toLocaleString('vi-VN')}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )
                    })()}
                </div>
                <div className="drawer-footer"><button className="btn btn-light border fw-bold px-4 rounded-pill" onClick={closeDrawer}>Đóng</button></div>
            </div>

            <div className={`custom-drawer ${activeDrawer === 'FORM' ? 'open' : ''}`}>
                <div className="drawer-header"><h4 className="fw-bold mb-0 text-dark">{isEditMode ? 'Cập Nhật Hợp Đồng' : 'Khởi Tạo Hợp Đồng'}</h4><button className="btn btn-light rounded-circle" onClick={closeDrawer}><i className="bi bi-x-lg"></i></button></div>
                <div className="drawer-body bg-light">
                    {isEditMode && selectedContract && (() => {
                        const sm = analyzeStateMachine(selectedContract);
                        return (
                            <>
                                {renderTimeline(selectedContract, sm)}
                                {!sm.permissions.canEditCore && (
                                    <div className="alert alert-warning border-0 shadow-sm fw-semibold mb-4 d-flex align-items-center"><i className="bi bi-lock-fill fs-4 me-3 text-warning"></i><div><span className="d-block text-dark mb-1">Khóa An Toàn Nghiệp Vụ</span><small className="text-muted fw-normal">Trạng thái <b>{sm.label}</b>. Bạn chỉ được phép cập nhật Cư dân phụ và Dịch vụ đính kèm. Core Data đã bị khóa.</small></div></div>
                                )}
                            </>
                        );
                    })()}

                    <form id="drawerForm" onSubmit={(e) => { e.preventDefault(); handleSaveContract(); }}>
                        <div className="form-section">
                            <div className="form-section-title"><i className="bi bi-1-circle-fill me-2 text-primary fs-5"></i>Thông tin Lõi (Core Data)</div>
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold small text-muted">Đại diện Cư dân *</label>
                                    <div className={isEditMode && selectedContract && !analyzeStateMachine(selectedContract).permissions.canEditCore ? 'disabled-overlay' : ''}>
                                        <select className="form-select bg-white py-2 shadow-none" value={formData.residentAccountId} onChange={(e) => setFormData(prev => ({ ...prev, residentAccountId: e.target.value }))} disabled={isEditMode && !analyzeStateMachine(selectedContract).permissions.canEditCore}>
                                            <option value="">-- Chọn Cư dân --</option>
                                            {safeResidents.filter(r => !selectedResidentIds.includes(Number(r.accountId || r.AccountId)) || Number(r.accountId || r.AccountId) === Number(formData.residentAccountId)).map(r => (
                                                <option key={r.accountId || r.AccountId} value={r.accountId || r.AccountId}>{r.fullName || r.userName || 'N/A'} - CCCD: {r.identityCard || 'N/A'}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold small text-muted">Căn hộ *</label>
                                    <div className={isEditMode && selectedContract && !analyzeStateMachine(selectedContract).permissions.canEditCore ? 'disabled-overlay' : ''}>
                                        <select className="form-select bg-white py-2 shadow-none" value={formData.apartmentId} onChange={(e) => setFormData(prev => ({ ...prev, apartmentId: e.target.value }))} disabled={isEditMode && !analyzeStateMachine(selectedContract).permissions.canEditCore}>
                                            <option value="">-- Chọn Căn hộ --</option>
                                            {availableApartments.map(a => (
                                                <option key={a.apartmentId || a.ApartmentId} value={a.apartmentId || a.ApartmentId}>{a.apartmentCode || a.ApartmentCode}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold small text-muted">Kỳ hạn Thuê *</label>
                                    <div className="d-flex gap-2 align-items-center">
                                        <input type="date" className={`form-control shadow-none py-2 ${isEditMode && selectedContract && !analyzeStateMachine(selectedContract).permissions.canEditCore ? 'disabled-field' : ''}`} name="startDay" value={formData.startDay} onChange={handleInputChange} readOnly={isEditMode && selectedContract && !analyzeStateMachine(selectedContract).permissions.canEditCore} required />
                                        <span className="text-muted fw-bold">-</span>
                                        <input type="date" className={`form-control shadow-none py-2 ${isEditMode && selectedContract && !analyzeStateMachine(selectedContract).permissions.canEditCore ? 'disabled-field' : ''}`} name="endDay" value={formData.endDay} min={formData.startDay} onChange={handleInputChange} readOnly={isEditMode && selectedContract && !analyzeStateMachine(selectedContract).permissions.canEditCore} required />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold small text-muted">Tài chính cố định</label>
                                    <div className="d-flex gap-2">
                                        <div className="input-icon-wrapper w-50"><span className="input-icon fw-bold small">₫</span><input type="number" className={`form-control form-control-icon shadow-none ${isEditMode && selectedContract && !analyzeStateMachine(selectedContract).permissions.canEditCore ? 'disabled-field' : ''}`} placeholder="Giá thuê" name="monthlyRent" value={formData.monthlyRent} onKeyDown={preventInvalidNumber} onChange={handleInputChange} readOnly={isEditMode && selectedContract && !analyzeStateMachine(selectedContract).permissions.canEditCore} /></div>
                                        <div className="input-icon-wrapper w-50"><span className="input-icon fw-bold small text-success">₫</span><input type="number" className={`form-control form-control-icon shadow-none ${isEditMode && selectedContract && !analyzeStateMachine(selectedContract).permissions.canEditCore ? 'disabled-field' : ''}`} placeholder="Tiền cọc" name="deposit" value={formData.deposit} onKeyDown={preventInvalidNumber} onChange={handleInputChange} readOnly={isEditMode && selectedContract && !analyzeStateMachine(selectedContract).permissions.canEditCore} /></div>
                                    </div>
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-bold small text-muted">Hợp đồng PDF đính kèm {!isEditMode && "*"}</label>
                                    <input id="file" type="file" className="form-control shadow-none bg-light py-2" onChange={handleFileChange} accept="application/pdf" required={!isEditMode} />
                                    {isEditMode && formData.existingFileUrl && <div className="small mt-2"><a href={formData.existingFileUrl} target="_blank" rel="noreferrer" className="fw-bold text-danger text-decoration-none"><i className="bi bi-file-pdf-fill me-1"></i>Xem bản Scan hiện tại</a></div>}
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <div className="d-flex justify-content-between align-items-center mb-4"><div className="form-section-title mb-0"><i className="bi bi-2-circle-fill me-2 text-primary fs-5"></i>Cư Dân Phụ (Add-ons)</div><button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3" onClick={addResidentRow} disabled={(formData.additionalResidents || []).length >= 4}><i className="bi bi-plus-lg me-1"></i> Thêm Cư dân</button></div>
                            {(formData.additionalResidents || []).length === 0 ? <div className="text-center p-4 bg-light rounded-3 text-muted border border-dashed small fw-semibold">Phòng chỉ có 1 chủ hộ, không có người ở ghép.</div> : (formData.additionalResidents || []).map((res, index) => (
                                <div className="d-flex gap-2 mb-2 p-2 bg-light rounded-3 border" key={index}>
                                    <select className="form-select border-0 shadow-none bg-transparent fw-semibold py-2" value={res.accountId} onChange={(e) => handleListChange('additionalResidents', index, 'accountId', e.target.value)}>
                                        <option value="">-- Chọn Cư dân --</option>
                                        {safeResidents.filter(r => !selectedResidentIds.includes(Number(r.accountId || r.AccountId)) || Number(r.accountId || r.AccountId) === Number(res.accountId)).map(r => (
                                            <option key={r.accountId || r.AccountId} value={r.accountId || r.AccountId}>{r.fullName || r.userName}</option>
                                        ))}
                                    </select>
                                    <select className="form-select border-0 shadow-none bg-transparent text-muted py-2" style={{ width: '180px' }} value={res.relationshipId} onChange={(e) => handleListChange('additionalResidents', index, 'relationshipId', e.target.value)}><option value="">-- Quan hệ --</option>{relationships.map(rel => <option key={rel.id} value={rel.id}>{rel.name}</option>)}</select>
                                    <button type="button" className="btn btn-white text-danger shadow-none" onClick={() => removeResidentRow(index)}><i className="bi bi-trash fs-5"></i></button>
                                </div>
                            ))}
                        </div>

                        <div className="form-section mb-0">
                            <div className="d-flex justify-content-between align-items-center mb-4"><div className="form-section-title mb-0"><i className="bi bi-3-circle-fill me-2 text-primary fs-5"></i>Dịch Vụ (Add-ons)</div><button type="button" className="btn btn-sm btn-outline-success rounded-pill px-3" onClick={addServiceRow}><i className="bi bi-plus-lg me-1"></i> Thêm Dịch vụ</button></div>
                            {(formData.selectedServices || []).length === 0 ? <div className="text-center p-4 bg-light rounded-3 text-muted border border-dashed small fw-semibold">Không đăng ký dịch vụ cố định nào.</div> : (formData.selectedServices || []).map((srv, index) => (
                                <div className="d-flex gap-2 mb-2 p-2 bg-light rounded-3 border" key={index}>
                                    <select className="form-select border-0 shadow-none bg-transparent fw-semibold py-2" value={srv.serviceId} onChange={(e) => handleListChange('selectedServices', index, 'serviceId', e.target.value)}>
                                        <option value="">-- Chọn Dịch vụ --</option>
                                        {safeServices.filter(s => !selectedServiceIds.includes(Number(s.serviceId || s.ServiceId)) || Number(s.serviceId || s.ServiceId) === Number(srv.serviceId)).map(s => (
                                            <option key={s.serviceId || s.ServiceId} value={s.serviceId || s.ServiceId}>{s.serviceName || s.ServiceName}</option>
                                        ))}
                                    </select>
                                    <div className="input-icon-wrapper" style={{ width: '200px' }}><span className="input-icon fw-bold small">₫</span><input type="number" min="0" onKeyDown={preventInvalidNumber} className="form-control form-control-icon border-0 shadow-none bg-transparent py-2" placeholder="Tùy chỉnh giá" value={srv.actualPrice} onChange={(e) => handleListChange('selectedServices', index, 'actualPrice', e.target.value)} /></div>
                                    <button type="button" className="btn btn-white text-danger shadow-none" onClick={() => removeServiceRow(index)}><i className="bi bi-trash fs-5"></i></button>
                                </div>
                            ))}
                        </div>
                    </form>
                </div>
                <div className="drawer-footer">
                    <button type="button" className="btn btn-light px-4 py-2 border fw-bold rounded-pill" onClick={closeDrawer}>Hủy thao tác</button>
                    <button type="submit" form="drawerForm" className="btn btn-gradient-primary px-5 py-2 fw-bold shadow rounded-pill" disabled={isSubmitting}>{isSubmitting ? <span className="spinner-border spinner-border-sm"></span> : (isEditMode ? "Lưu Cập Nhật Data" : "Phát Hành")}</button>
                </div>
            </div>

            <div className={`custom-drawer ${activeDrawer === 'EXTEND' ? 'open' : ''}`} style={{ width: '450px' }}>
                <div className="drawer-header bg-warning text-dark"><h5 className="fw-bold mb-0">Gia Hạn Hợp Đồng</h5><button className="btn-close" onClick={closeDrawer}></button></div>
                <div className="drawer-body bg-light">
                    <div className="form-section">
                        <label className="fw-bold mb-2 small text-muted">Ngày kết thúc cũ:</label>
                        <input type="text" className="form-control disabled-field mb-4 py-3 fw-bold" value={formatDate(extendOldEndDate)} readOnly />
                        <label className="fw-bold mb-2 small text-primary">Ngày kết thúc mới <span className="text-danger">*</span></label>
                        <input type="date" className="form-control form-control-lg border-warning border-2 mb-4 py-3 fw-bold shadow-none" value={extendNewEndDate} min={extendOldEndDate} onChange={e => setExtendNewEndDate(e.target.value)} />
                    </div>
                </div>
                <div className="drawer-footer"><button className="btn btn-light border rounded-pill px-4 fw-bold" onClick={closeDrawer}>Hủy</button><button className="btn btn-gradient-warning text-white fw-bold px-5 rounded-pill shadow" onClick={handleExecuteExtend} disabled={isSubmitting || !extendNewEndDate}>{isSubmitting ? <span className="spinner-border spinner-border-sm"></span> : "Xác nhận Gia Hạn"}</button></div>
            </div>

            <div className={`custom-drawer ${activeDrawer === 'SETTLE' ? 'open' : ''}`} style={{ width: '500px' }}>
                <div className="drawer-header bg-primary text-white">
                    <h5 className="fw-bold mb-0">Xử Lý Quyết Toán</h5>
                    <button className="btn-close btn-close-white" onClick={closeDrawer}></button>
                </div>
                <div className="drawer-body bg-light">
                    {selectedContract?.settlementData && (
                        <div className="alert alert-light border shadow-sm mb-4">
                            <h6 className="fw-bold text-primary mb-3">Thông Tin Hợp Đồng</h6>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Mã hợp đồng:</span>
                                <strong>{selectedContract.settlementData.contractCode}</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Căn hộ:</span>
                                <strong>{selectedContract.settlementData.apartmentName}</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Cư dân:</span>
                                <strong>{selectedContract.settlementData.residentName}</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Tiền cọc gốc:</span>
                                <strong className="text-success">{formatCurrency(selectedContract.settlementData.deposit)}</strong>
                            </div>
                            {selectedContract.settlementData.additionalCost > 0 && (
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Phí phát sinh hiện tại:</span>
                                    <strong className="text-danger">{formatCurrency(selectedContract.settlementData.additionalCost)}</strong>
                                </div>
                            )}
                            {selectedContract.settlementData.refundAmount !== null && (
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Số tiền hoàn trả dự kiến:</span>
                                    <strong className={selectedContract.settlementData.refundAmount >= 0 ? 'text-success' : 'text-danger'}>
                                        {formatCurrency(selectedContract.settlementData.refundAmount)}
                                    </strong>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="form-section">
                        <div className="alert alert-info border-0 shadow-sm mb-4">
                            <strong>Hướng dẫn:</strong> Nhập các khoản phí phát sinh (nếu có) sau khi kiểm tra phòng. Hệ thống sẽ tự động đối trừ vào tiền cọc.
                        </div>

                        <label className="fw-bold mb-2 small text-muted">Phí phạt / Hư hỏng tài sản (VNĐ)</label>
                        <div className="input-icon-wrapper mb-4">
                            <span className="input-icon fw-bold">₫</span>
                            <input 
                                type="number" min="0" onKeyDown={preventInvalidNumber}
                                className="form-control form-control-icon form-control-lg py-3 shadow-none bg-white" 
                                value={settleAdditionalCost} 
                                onChange={e => setSettleAdditionalCost(e.target.value)} 
                                placeholder="VD: 500000" 
                            />
                        </div>

                        <label className="fw-bold mb-2 small text-muted">Ghi chú quyết toán</label>
                        <textarea 
                            className="form-control shadow-none bg-white mb-4" 
                            rows="3" 
                            value={settleNote}
                            onChange={e => setSettleNote(e.target.value)}
                            placeholder="Ghi chú lại tình trạng phòng..."
                        ></textarea>
                    </div>
                </div>
                <div className="drawer-footer">
                    <button className="btn btn-light border rounded-pill px-4 fw-bold" onClick={closeDrawer}>Hủy</button>
                    <button className="btn btn-primary rounded-pill fw-bold px-5 shadow" onClick={handleExecuteSettle} disabled={isSettling}>
                        {isSettling ? <span className="spinner-border spinner-border-sm"></span> : "Xác nhận & Chốt sổ"}
                    </button>
                </div>
            </div>

            <div className={`custom-drawer ${activeDrawer === 'TERMINATE' || activeDrawer === 'CANCEL' ? 'open' : ''}`} style={{ width: '500px' }}>
                <div className={`drawer-header text-white ${activeDrawer === 'CANCEL' ? 'bg-warning text-dark' : 'bg-danger'}`}><h5 className="fw-bold mb-0">{activeDrawer === 'CANCEL' ? 'Hủy Giao Kèo' : 'Thanh Lý Hợp Đồng'}</h5><button className={`btn-close ${activeDrawer === 'TERMINATE' ? 'btn-close-white' : ''}`} onClick={closeDrawer}></button></div>
                <div className="drawer-body bg-light">
                    {activeDrawer === 'CANCEL' ? (
                        <div className="form-section text-center"><h5 className="text-danger fw-bold mb-3">Xác nhận Hủy?</h5><p className="text-muted">Hợp đồng chưa hiệu lực sẽ bị vô hiệu hóa.</p></div>
                    ) : (
                        <div className="form-section">
                            <label className="fw-bold mb-2 small text-muted">Ngày bàn giao thực tế <span className="text-danger">*</span></label>
                            <input type="date" className="form-control form-control-lg mb-4 py-3 shadow-none border-danger border-opacity-50" value={actionDate} onChange={e => setActionDate(e.target.value)} />

                            <label className="fw-bold mb-2 small text-muted">Phạt / Hư hỏng tài sản (VNĐ)</label>
                            <div className="input-icon-wrapper mb-4">
                                <span className="input-icon fw-bold">₫</span>
                                <input type="number" min="0" onKeyDown={preventInvalidNumber} className="form-control form-control-icon form-control-lg py-3 shadow-none bg-light border-0" value={additionalCost} onChange={e => setAdditionalCost(e.target.value)} placeholder="0" />
                            </div>
                            <label className="fw-bold mb-2 small text-danger">Lý do thu phí phát sinh / Ghi chú</label>
                            <textarea 
                                className="form-control mb-4 shadow-none bg-light border-0" 
                                rows="3" 
                                placeholder="Nhập lý do phạt hoặc ghi chú thanh lý..."
                                value={terminationReason}
                                onChange={(e) => setTerminationReason(e.target.value)}
                            ></textarea>
                            <div className="bg-white p-4 rounded-4 border border-dark shadow-sm">
                                <h6 className="fw-bold mb-3 text-primary text-uppercase" style={{ letterSpacing: '0.5px' }}>Bảng Tính Toán Trước Khi <strong>
                                    <i>Chốt</i>
                                    </strong>
                                    </h6>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-success">
                                        <i className="bi bi-plus-circle-fill me-1"></i>
                                        Tiền cọc (Deposit):
                                    </span> 
                                    <strong className="fs-6 text-success">
                                        {formatCurrency(terminateResult?.Deposit || terminateResult?.deposit || 0)}
                                    </strong>
                                </div>
                                <div className="mb-2">
                                    <div className="d-flex justify-content-between">
                                        <span className="text-danger">
                                            <i className="bi bi-dash-circle-fill me-1"></i>
                                            Hóa đơn chưa trả (Unpaid Invoice):
                                        </span> 
                                        <strong className="fs-6 text-danger">
                                            {formatCurrency(terminateResult?.UnpaidInvoice || terminateResult?.unpaidInvoice || 0)}
                                        </strong>
                                    </div>
                                    {terminateResult?.UnpaidInvoiceList && terminateResult.UnpaidInvoiceList.length > 0 && (
                                        <div className="ms-4 mt-1 small text-muted">
                                            {terminateResult.UnpaidInvoiceList.map((inv, idx) => (
                                                <div key={idx} className="d-flex justify-content-between">
                                                    <span>• Tháng {inv.month}/{inv.year}:</span>
                                                    <span className="text-danger fw-semibold">{formatCurrency(inv.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="d-flex justify-content-between mb-3">
                                    <span className="text-danger">
                                        <i className="bi bi-dash-circle-fill me-1"></i>
                                        Chi phí phát sinh (Additional Cost):
                                    </span> 
                                    <strong className="text-danger fs-6">{formatCurrency(additionalCost || 0)}</strong>
                                </div>
                                <hr className="my-2" />
                                <div className="small text-muted mb-2 fst-italic">
                                    <i className="bi bi-calculator me-1"></i>
                                    Công thức: Refund = Tiền cọc - Hóa đơn chưa trả - Chi phí phát sinh
                                </div>
                                {terminateResult ? (
                                    (terminateResult.RefundAmount || terminateResult.refundAmount || 0) < 0 ? (
                                        <div className="text-danger fw-bolder fs-5 d-flex justify-content-between align-items-center mt-3">
                                            <span>
                                                <i className="bi bi-exclamation-circle-fill me-2"></i>
                                                Bên thuê cần trả:
                                            </span> 
                                            <span>{formatCurrency(Math.abs(terminateResult.RefundAmount || terminateResult.refundAmount || 0))}</span>
                                        </div>
                                    ) : (terminateResult.RefundAmount || terminateResult.refundAmount || 0) > 0 ? (
                                        <div className="text-success fw-bolder fs-5 d-flex justify-content-between align-items-center mt-3">
                                            <span>
                                                <i className="bi bi-check-circle-fill me-2"></i>
                                                BQL hoàn trả:
                                            </span> 
                                            <span>{formatCurrency(terminateResult.RefundAmount || terminateResult.refundAmount || 0)}</span>
                                        </div>
                                    ) : (
                                        <div className="text-secondary fw-bolder fs-5 d-flex justify-content-between align-items-center mt-3">
                                            <span>
                                                <i className="bi bi-check-circle-fill me-2"></i>
                                                ĐÃ THANH TOÁN ĐỦ
                                            </span> 
                                            <span>{formatCurrency(0)}</span>
                                        </div>
                                    )
                                ) : (
                                    <div className="text-muted fw-bold fs-6 text-center mt-3">
                                        <i className="bi bi-hourglass-split me-2"></i>Đang tải thông tin...
                                    </div>
                                )}
                            </div>

                                {terminateResult && !terminateResult.isPreview && (
                                <div className="alert alert-success mt-4 mb-0 fw-bold border-0 shadow-sm"><i className="bi bi-check-circle-fill me-2"></i>Đã chốt thanh lý và ghi nhận công nợ hệ thống!</div>
                            )}
                        </div>
                    )}
                </div>
                <div className="drawer-footer"><button className="btn btn-light border rounded-pill px-4 fw-bold" onClick={closeDrawer}>Đóng</button>
                    {activeDrawer === 'CANCEL' ? <button className="btn btn-gradient-warning rounded-pill fw-bold px-5" onClick={handleExecuteCancel}>Xác Nhận Hủy</button> : <button className="btn btn-danger rounded-pill fw-bold px-5 shadow" onClick={handleExecuteTerminate} disabled={isSubmitting || !actionDate || (terminateResult && !terminateResult.isPreview)}>{isSubmitting ? <span className="spinner-border spinner-border-sm"></span> : "Chốt Thanh Lý & Thu Hồi"}</button>}
                </div>
            </div>

            <div className="modal fade" id="trashModal" tabIndex="-1">
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content border-0 shadow-lg rounded-4">
                        <div className="modal-header bg-dark text-white px-4 py-3"><h5 className="modal-title fw-bold"><i className="bi bi-trash3-fill me-2 text-danger"></i>Thùng Rác & Lịch Sử</h5><button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
                        <div className="modal-body p-0 bg-light">
                            {loadingDeleted ? (<div className="text-center py-5"><div className="spinner-border text-secondary"></div></div>) : deletedContracts.length === 0 ? (<div className="text-center py-5 text-muted"><i className="bi bi-wind fs-1 d-block mb-3 opacity-50"></i>Thùng rác trống.</div>) : (
                                <table className="table table-custom table-hover align-middle text-center mb-0 bg-transparent">
                                    <thead><tr><th>Mã HĐ</th><th>Người Thuê</th><th>Căn Hộ</th><th>Ngày Xóa</th><th>Hành Động</th></tr></thead>
                                    <tbody>
                                        {deletedContracts.map(c => (
                                            <tr key={c?.contractId || c?.ContractId}>
                                                <td className="text-muted text-decoration-line-through fw-semibold">{c?.contractCode}</td>
                                                <td className="text-dark fw-bold">{c?.account?.info?.fullName || c?.account?.fullName || "N/A"}</td>
                                                <td><span className="badge bg-dark bg-opacity-10 text-dark rounded-pill px-3 py-1">{c?.apartment?.apartmentCode || "N/A"}</span></td>
                                                <td className="text-muted fw-semibold"><i className="bi bi-clock me-1"></i>{c?.updatedAt ? formatDate(c.updatedAt) : 'N/A'}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-light text-success rounded-pill px-3 border me-2 shadow-sm fw-bold" onClick={() => handleRestoreContract(c?.contractId || c?.ContractId)}><i className="bi bi-arrow-counterclockwise me-1"></i> Khôi phục</button>
                                                    <div className="dropdown d-inline-block">
                                                        <button className="btn btn-sm btn-danger rounded-pill px-3 shadow-sm fw-bold" data-bs-toggle="dropdown"><i className="bi bi-fire me-1"></i> Tiêu hủy</button>
                                                        <div className="dropdown-menu p-3 shadow-lg border-0 rounded-4" style={{ width: '280px' }}>
                                                            <label className="form-label text-danger fw-bold small mb-2">Gõ XAC NHAN để xóa vĩnh viễn:</label>
                                                            <input type="text" className="form-control form-control-sm mb-3 shadow-none bg-light" placeholder="XAC NHAN" onChange={(e) => setDeleteConfirmText(e.target.value)} />
                                                            <button className="btn btn-sm btn-danger w-100 fw-bold rounded-pill" onClick={() => handleHardDeleteContract(c?.contractId || c?.ContractId)} disabled={deleteConfirmText !== "XAC NHAN"}>Xóa Dữ Liệu Thực Sự</button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContractManagement;