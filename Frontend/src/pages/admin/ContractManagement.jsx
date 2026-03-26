import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 🎨 TỐI ƯU CSS UI/UX CHUẨN SAAS (VISUAL UPGRADE ONLY)
const customStyles = `
/* --- ANIMATIONS --- */
@keyframes pulse-warning { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }
@keyframes pulse-danger { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
.btn-suggest-extend { animation: pulse-warning 2s infinite; border-color: #f59e0b !important; }
.btn-suggest-terminate { animation: pulse-danger 2s infinite; border-color: #ef4444 !important; }

/* --- MODERN LAYOUT & CARDS --- */
.modern-card { background: #ffffff; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #f1f5f9; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.modern-card:hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04); transform: translateY(-2px); }
.page-header { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: white; padding: 32px 40px; border-radius: 24px; margin-bottom: 32px; box-shadow: 0 20px 25px -5px rgba(30, 58, 138, 0.15); position: relative; overflow: hidden; }
.page-header::after { content: ''; position: absolute; top: -50%; right: -10%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%); border-radius: 50%; pointer-events: none; }

/* --- BUTTONS --- */
.btn-gradient-primary { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; font-weight: 700; letter-spacing: 0.3px; }
.btn-gradient-primary:hover { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; box-shadow: 0 8px 16px rgba(37, 99, 235, 0.25); transform: translateY(-1px); }
.btn-gradient-warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border: none; font-weight: 700; letter-spacing: 0.3px; }
.btn-gradient-warning:hover { background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: white; box-shadow: 0 8px 16px rgba(217, 119, 6, 0.25); transform: translateY(-1px); }

/* --- ADVANCED TABLE (SPACED ROWS) --- */
.table-container { background: transparent; }
.table-custom { border-collapse: separate; border-spacing: 0 12px; margin-top: -12px; }
.table-custom th { background: transparent; color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; border: none; padding: 0 24px 8px 24px; }
.table-custom td { background: #ffffff; padding: 20px 24px; vertical-align: middle; color: #334155; border-top: 1px solid #f8fafc; border-bottom: 1px solid #f8fafc; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.table-custom td:first-child { border-left: 1px solid #f8fafc; border-top-left-radius: 16px; border-bottom-left-radius: 16px; }
.table-custom td:last-child { border-right: 1px solid #f8fafc; border-top-right-radius: 16px; border-bottom-right-radius: 16px; }
.table-custom tbody tr:hover td { background-color: #f8fafc; border-color: #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.04); transform: scale(1.001); z-index: 1; position: relative; }
.status-badge { padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 6px; letter-spacing: 0.3px; text-transform: uppercase; }

/* --- INPUTS & FORMS --- */
.input-icon-wrapper { position: relative; }
.input-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #94a3b8; z-index: 5; pointer-events: none; font-size: 1.1rem; }
.form-control-icon { padding-left: 48px !important; border-radius: 12px; border: 1px solid #e2e8f0; padding-top: 12px; padding-bottom: 12px; font-weight: 500; background-color: #f8fafc; transition: all 0.2s; }
.form-control-icon:focus { background-color: #ffffff; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.form-section { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.01); }
.form-section-title { font-size: 0.9rem; font-weight: 800; color: #0f172a; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; }
.disabled-overlay { opacity: 0.5; pointer-events: none; filter: grayscale(100%); }
.disabled-field { background-color: #f1f5f9 !important; color: #64748b !important; border-color: #e2e8f0 !important; pointer-events: none; }

/* --- DROPDOWN ACTION MENU --- */
.action-dropdown .btn { border-radius: 12px; padding: 8px 16px; font-weight: 700; letter-spacing: 0.2px; }
.action-dropdown .dropdown-menu { border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border-radius: 16px; padding: 12px; }
.action-dropdown .dropdown-item { border-radius: 10px; padding: 10px 16px; font-weight: 600; font-size: 0.875rem; color: #475569; transition: all 0.2s; margin-bottom: 4px; }
.action-dropdown .dropdown-item:last-child { margin-bottom: 0; }
.action-dropdown .dropdown-item:hover { background-color: #f1f5f9; color: #0f172a; transform: translateX(4px); }
.dropdown-item.strict-disabled { opacity: 0.4; cursor: not-allowed; background: transparent; color: #94a3b8 !important; pointer-events: none; }
.lock-icon { font-size: 0.85rem; margin-left: auto; color: #cbd5e1; }

/* --- DRAWER (OFFCANVAS) --- */
.drawer-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); z-index: 1040; opacity: 0; visibility: hidden; transition: all 0.3s ease; }
.drawer-backdrop.open { opacity: 1; visibility: visible; }
.custom-drawer { position: fixed; top: 0; right: -100%; width: 900px; max-width: 100vw; height: 100vh; background: #f8fafc; z-index: 1050; transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; box-shadow: -20px 0 50px rgba(0,0,0,0.1); }
.custom-drawer.open { right: 0; }
.drawer-header { padding: 24px 32px; background: #ffffff; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; z-index: 10; }
.drawer-body { padding: 32px; flex: 1; overflow-y: auto; }
.drawer-body::-webkit-scrollbar { width: 6px; }
.drawer-body::-webkit-scrollbar-track { background: transparent; }
.drawer-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.drawer-body::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
.drawer-footer { padding: 24px 32px; background: #ffffff; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 16px; z-index: 10; box-shadow: 0 -4px 12px rgba(0,0,0,0.02); }

/* --- TIMELINE --- */
.timeline-container { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.timeline-track { position: relative; height: 10px; background: #f1f5f9; border-radius: 5px; margin: 28px 0 16px 0; border: 1px solid #e2e8f0; }
.timeline-progress { position: absolute; left: 0; top: 0; height: 100%; background: linear-gradient(90deg, #3b82f6, #10b981); border-radius: 5px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
.timeline-marker { position: absolute; top: -6px; width: 22px; height: 22px; border-radius: 50%; background: #fff; border: 4px solid #3b82f6; box-shadow: 0 0 0 4px #eff6ff; }
.timeline-now { position: absolute; top: -16px; width: 2px; height: 42px; background: #ef4444; z-index: 2; }
.timeline-now::after { content: 'Hôm nay'; position: absolute; top: -24px; left: 50%; transform: translateX(-50%); font-size: 0.7rem; font-weight: 800; color: #ef4444; background: #fee2e2; padding: 4px 8px; border-radius: 6px; box-shadow: 0 2px 4px rgba(239,68,68,0.1); }
`;

const ContractManagement = () => {
    // ==========================================
    // 1. DATA STATES (GIỮ NGUYÊN 100%)
    // ==========================================
    const [contracts, setContracts] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [residents, setResidents] = useState([]);
    const [systemServices, setSystemServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletedContracts, setDeletedContracts] = useState([]);
    const [loadingDeleted, setLoadingDeleted] = useState(false);

    // ==========================================
    // 2. PAGINATION & FILTER STATES (GIỮ NGUYÊN 100%)
    // ==========================================
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const relationships = [{ id: 2, name: 'Vợ/Chồng' }, { id: 3, name: 'Con cái' }, { id: 4, name: 'Anh/Chị/Em' }, { id: 5, name: 'Bạn cùng phòng' }, { id: 6, name: 'Khác' }];

    // ==========================================
    // 3. UI CONTROL STATES (GIỮ NGUYÊN 100%)
    // ==========================================
    const [activeDrawer, setActiveDrawer] = useState(null);
    const [selectedContract, setSelectedContract] = useState(null);

    // ==========================================
    // 4. FORM STATES (GIỮ NGUYÊN 100%)
    // ==========================================
    const initialFormState = { apartmentId: '', residentAccountId: '', startDay: '', endDay: '', monthlyRent: '', deposit: '', file: null, existingFileUrl: '', additionalResidents: [], selectedServices: [] };
    const [formData, setFormData] = useState(initialFormState);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editContractId, setEditContractId] = useState(null);

    // ==========================================
    // 5. EXTEND STATES (GIỮ NGUYÊN 100%)
    // ==========================================
    const [extendContractId, setExtendContractId] = useState(null);
    const [extendNewEndDate, setExtendNewEndDate] = useState('');
    const [extendOldEndDate, setExtendOldEndDate] = useState(''); 
    const [isExtending, setIsExtending] = useState(false);

    // ==========================================
    // 6. TERMINATE / CANCEL / TRASH STATES (GIỮ NGUYÊN 100%)
    // ==========================================
    const [selectedTerminateId, setSelectedTerminateId] = useState(null);
    const [actionDate, setActionDate] = useState(''); 
    const [actionNote, setActionNote] = useState(''); 
    const [terminateResult, setTerminateResult] = useState(null);
    const [isTerminating, setIsTerminating] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    // --- HELPERS CHỐNG LỖI (GIỮ NGUYÊN 100%) ---
    const preventInvalidNumber = (e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); };
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN') : "";
    const closeDrawer = () => { setActiveDrawer(null); setDeleteConfirmText(''); };

    // --- BỘ NÃO STATE MACHINE (GIỮ NGUYÊN 100%) ---
    const analyzeStateMachine = (contract) => {
        if (!contract) return { type: 'UNKNOWN', label: 'Lỗi', bg: 'secondary', permissions: {} };
        
        const dbStatus = contract.status ?? contract.Status; 
        if (dbStatus === 2) return { type: 'DRAFT', label: 'Bản Nháp', bg: 'secondary', permissions: { canEditCore: true, canEditAddons: true, canSubmit: true, canCancel: false, canTerminate: false, canExtend: false, canSoftDelete: true }};
        if (dbStatus === -1) return { type: 'CANCELLED', label: 'Đã Hủy', bg: 'secondary', permissions: { canEditCore: false, canEditAddons: false, canSubmit: false, canCancel: false, canTerminate: false, canExtend: false, canSoftDelete: true }};
        if (dbStatus === 0) return { type: 'TERMINATED', label: 'Đã Thanh Lý', bg: 'dark', permissions: { canEditCore: false, canEditAddons: false, canSubmit: false, canCancel: false, canTerminate: false, canExtend: false, canSoftDelete: false, reasonNoDelete: "Chứa công nợ lịch sử" }};

        const startDay = contract.startDay ?? contract.StartDay;
        const endDay = contract.endDay ?? contract.EndDay;
        if (!startDay || !endDay) return { type: 'UNKNOWN', label: 'Lỗi Dữ liệu', bg: 'danger', permissions: {} };

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const start = new Date(startDay); start.setHours(0, 0, 0, 0);
        const end = new Date(endDay); end.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

        if (today < start) return { type: 'PENDING', label: 'Chờ Hiệu Lực', bg: 'info', permissions: { canEditCore: true, canEditAddons: true, canSubmit: false, canCancel: true, canTerminate: false, canExtend: false, canSoftDelete: false, reasonNoDelete: "Dùng chức năng Hủy" }};
        if (today > end) return { type: 'OVERDUE', label: 'Quá Hạn (Vi Phạm)', bg: 'danger', permissions: { canEditCore: false, canEditAddons: false, canSubmit: false, canCancel: false, canTerminate: true, canExtend: true, requiresExtendNote: true, canSoftDelete: false, reasonNoDelete: "Cần xử lý vi phạm" }};
        if (diffDays <= 30) return { type: 'EXPIRING_SOON', label: 'Sắp Hết Hạn', bg: 'warning', permissions: { canEditCore: false, canEditAddons: true, canSubmit: false, canCancel: false, canTerminate: true, canExtend: true, canSoftDelete: false, reasonNoDelete: "Hợp đồng đang chạy" }};

        return { type: 'ACTIVE', label: 'Đang Hiệu Lực', bg: 'success', permissions: { canEditCore: false, canEditAddons: true, canSubmit: false, canCancel: false, canTerminate: true, canExtend: true, canSoftDelete: false, reasonNoDelete: "Hợp đồng đang chạy" }};
    };

    // --- FETCH DATA (GIỮ NGUYÊN 100%) ---
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

    const fetchDeletedContracts = async () => {
        setLoadingDeleted(true);
        try {
            const res = await api.get('/contract/deleted-contracts');
            setDeletedContracts(res.data?.data || res.data?.Data || res.data || []);
        } catch (error) { toast.error("Lỗi lấy lịch sử!"); } 
        finally { setLoadingDeleted(false); }
    };

    // --- ACTION ROUTER (GIỮ NGUYÊN 100%) ---
    const handleActionClick = async (actionType, contract) => {
        const state = analyzeStateMachine(contract);
        setSelectedContract(contract);
        
        setActionDate(''); setActionNote(''); setTerminateResult(null);
        setExtendNewEndDate(''); setExtendOldEndDate('');

        if (actionType === 'EDIT') {
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
            setActiveDrawer(actionType);
        }
        else if (actionType === 'DELETE') {
            if (!state.permissions.canSoftDelete) return toast.warning(`BẢO VỆ: ${state.permissions.reasonNoDelete}`);
            if(window.confirm("Đưa hợp đồng này vào thùng rác?")) {
                try { await api.delete(`/contract/${contract.contractId || contract.ContractId}/soft-delete`); toast.success("Đã xóa mềm!"); fetchData(); } 
                catch (error) { toast.error("Lỗi xóa!"); }
            }
        }
    };

    // --- FORM LOGIC CHÍNH (GIỮ NGUYÊN 100%) ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type !== "application/pdf") { toast.error("Chỉ chấp nhận định dạng PDF!"); e.target.value = ''; return; }
        if (file && file.size > 5 * 1024 * 1024) { toast.error("File quá lớn (>5MB)!"); e.target.value = ''; return; }
        setFormData(prev => ({ ...prev, file }));
    };

    const handleListChange = (listName, index, field, value) => {
        const newArr = [...formData[listName]]; newArr[index][field] = value; setFormData({ ...formData, [listName]: newArr });
    };

    const addResidentRow = () => setFormData(prev => ({ ...prev, additionalResidents: [...prev.additionalResidents, { accountId: '', relationshipId: '' }] }));
    const removeResidentRow = (index) => setFormData(prev => ({ ...prev, additionalResidents: prev.additionalResidents.filter((_, i) => i !== index) }));
    const addServiceRow = () => setFormData(prev => ({ ...prev, selectedServices: [...prev.selectedServices, { serviceId: '', actualPrice: '' }] }));
    const removeServiceRow = (index) => setFormData(prev => ({ ...prev, selectedServices: prev.selectedServices.filter((_, i) => i !== index) }));

    const handleSaveContract = async (isDraftSubmit) => {
        if (!formData.apartmentId || !formData.residentAccountId || !formData.startDay || !formData.endDay) return toast.warning("Thiếu trường bắt buộc!");
        if (new Date(formData.startDay) >= new Date(formData.endDay)) return toast.warning("Ngày kết thúc phải lớn hơn ngày bắt đầu!");
        if (!isEditMode && !formData.file && !isDraftSubmit) return toast.warning("Bắt buộc tải PDF khi Phát hành chính thức!");

        setIsSubmitting(true);
        const payload = new FormData();
        payload.append("ApartmentId", formData.apartmentId); payload.append("ResidentAccountId", formData.residentAccountId);
        payload.append("StartDay", formData.startDay); payload.append("EndDay", formData.endDay);
        payload.append("MonthlyRent", formData.monthlyRent || 0); payload.append("Deposit", formData.deposit || 0);
        payload.append("Status", isDraftSubmit ? 2 : 1); 
        if (formData.file) payload.append("File", formData.file);

        formData.additionalResidents.forEach((r, i) => { if (r.accountId && r.relationshipId) { payload.append(`AdditionalResidents[${i}].AccountId`, r.accountId); payload.append(`AdditionalResidents[${i}].RelationshipId`, r.relationshipId); }});
        formData.selectedServices.forEach((s, i) => { if (s.serviceId) { payload.append(`Services[${i}].ServiceId`, s.serviceId); if (s.actualPrice) payload.append(`Services[${i}].ActualPrice`, s.actualPrice); }});

        try {
            const url = isEditMode ? `/contract/${editContractId}/update-contract` : '/contract/create-contract';
            const method = isEditMode ? 'put' : 'post';
            await api[method](url, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success(isDraftSubmit ? "Đã lưu nháp!" : "Phát hành hợp đồng thành công!");
            closeDrawer(); fetchData();
        } catch (error) { toast.error("Backend từ chối thao tác."); } 
        finally { setIsSubmitting(false); }
    };

    const handleExecuteExtend = async (e) => {
        e.preventDefault();
        if (new Date(extendNewEndDate) <= new Date(extendOldEndDate)) return toast.error("Guard: Ngày gia hạn phải lớn hơn ngày kết thúc cũ!");
        
        setIsExtending(true);
        try {
            await api.put(`/contract/${extendContractId}/extend`, { newEndDate: extendNewEndDate, penaltyNote: actionNote });
            toast.success("Gia hạn thành công!"); closeDrawer(); fetchData();
        } catch (error) { toast.error("Lỗi gia hạn."); } finally { setIsExtending(false); }
    };

    const handleExecuteTerminate = async (e) => {
        e.preventDefault();
        setIsTerminating(true);
        try {
            const res = await api.put(`/contract/${selectedTerminateId}/terminate`, { terminationDate: actionDate, additionalCost: Number(actionNote || 0) });
            setTerminateResult(res?.data?.data || res?.data?.Data || res?.data);
            toast.success("Đã chốt thanh lý!"); fetchData(); 
        } catch (error) { toast.error("Thanh lý thất bại."); } finally { setIsTerminating(false); }
    };

    const handleExecuteCancel = async () => {
        if(!window.confirm("Hủy hợp đồng chưa hiệu lực?")) return;
        try {
            await api.delete(`/contract/${selectedTerminateId}/soft-delete`); 
            toast.success("Đã Hủy hợp đồng!"); closeDrawer(); fetchData();
        } catch (error) { toast.error("Lỗi khi hủy."); }
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

    // --- FILTERING & COMPUTATIONS (GIỮ NGUYÊN 100%) ---
    const safeApartments = apartments.filter(Boolean);
    const safeResidents = residents.filter(Boolean);
    const safeServices = systemServices.filter(Boolean);

    const availableApartments = safeApartments.filter(a => {
        const st = a.status ?? a.Status;
        return (st === 1 || String(st).toLowerCase() === 'vacant') || (isEditMode && Number(a.apartmentId ?? a.ApartmentId) === Number(formData.apartmentId));
    });

    const availableResidents = safeResidents.filter(r => {
        const st = r.status ?? r.Status;
        return st == null || st === 1 || String(st).toLowerCase() === 'active';
    });

    const selectedResidentIds = [Number(formData.residentAccountId), ...formData.additionalResidents.map(r => Number(r.accountId))].filter(id => id !== 0 && !isNaN(id));
    const selectedServiceIds = formData.selectedServices.map(s => Number(s.serviceId)).filter(id => id !== 0 && !isNaN(id));

    const dashboardStats = useMemo(() => {
        let active = 0, expiring = 0, overdue = 0;
        contracts.filter(Boolean).forEach(c => {
            const type = analyzeStateMachine(c).type;
            if (type === 'ACTIVE' || type === 'PENDING') active++;
            if (type === 'EXPIRING_SOON') expiring++;
            if (type === 'OVERDUE') overdue++;
        });
        return { total: contracts.filter(Boolean).length, active, expiring, overdue };
    }, [contracts]);

    const filteredContracts = contracts.filter(Boolean).filter(c => {
        const searchStr = searchTerm.toLowerCase();
        const matchSearch = (c.contractCode || '').toLowerCase().includes(searchStr) || 
                            (c.account?.info?.fullName || c.account?.fullName || '').toLowerCase().includes(searchStr) || 
                            (c.apartment?.apartmentCode || '').toLowerCase().includes(searchStr);
        let matchStatus = true;
        if (filterStatus !== 'all') {
            const type = analyzeStateMachine(c).type;
            if (filterStatus === '1') matchStatus = type === 'ACTIVE' || type === 'PENDING';
            else if (filterStatus === 'expiring') matchStatus = type === 'EXPIRING_SOON';
            else if (filterStatus === 'overdue') matchStatus = type === 'OVERDUE';
            else if (filterStatus === '0') matchStatus = type === 'TERMINATED' || type === 'CANCELLED';
            else if (filterStatus === 'draft') matchStatus = type === 'DRAFT';
        }
        return matchSearch && matchStatus;
    });

    const currentItems = filteredContracts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // --- TIMELINE VISUALIZER (GIỮ NGUYÊN 100%) ---
    const renderTimeline = (contract, stateMachine) => {
        if (!contract || !contract.startDay || !contract.endDay || stateMachine.type === 'DRAFT' || stateMachine.type === 'CANCELLED') return null;
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

    // --- 9. RENDER UI CHÍNH (ĐƯỢC NÂNG CẤP CSS) ---
    return (
        <div className="container-fluid p-0 pb-5" style={{ backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
            <style>{customStyles}</style>
            <ToastContainer enableMultiContainer containerId="contractToast" position="top-right" autoClose={3000} limit={1} theme="colored" />

            <div className="px-5 pt-4">
                {/* HERO HEADER */}
                <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div style={{zIndex: 2}}>
                        <h2 className="fw-bolder mb-1"><i className="bi bi-shield-check me-2 text-info"></i>Contract Center</h2>
                        <p className="mb-0 text-white-50 fw-medium" style={{ fontSize: '0.95rem' }}>Hệ thống quản trị vòng đời và giám sát tài chính</p>
                    </div>
                    <div className="d-flex gap-3" style={{zIndex: 2}}>
                        <button className="btn btn-light fw-bold text-dark rounded-pill px-4 py-2 shadow-sm" onClick={fetchDeletedContracts} data-bs-toggle="modal" data-bs-target="#trashModal">
                            <i className="bi bi-archive-fill me-2 text-danger"></i>Lịch sử & Thùng rác
                        </button>
                        <button className="btn btn-gradient-warning rounded-pill px-4 py-2 shadow" onClick={() => { setIsEditMode(false); setFormData(initialFormState); setActiveDrawer('FORM'); document.getElementById('file').value=''; }}>
                            <i className="bi bi-pen-fill me-2"></i>Ký Hợp Đồng
                        </button>
                    </div>
                </div>

                {/* STATS DASHBOARD */}
                <div className="row g-4 mb-4">
                    {[{ title: "Tổng Hợp Đồng", val: dashboardStats.total, color: "primary", icon: "bi-layers" }, { title: "Đang Hiệu Lực", val: dashboardStats.active, color: "success", icon: "bi-check-circle" }, { title: "Sắp Hết Hạn (≤30 ngày)", val: dashboardStats.expiring, color: "warning", icon: "bi-hourglass-bottom", alert: dashboardStats.expiring > 0 ? "Cần gia hạn ngay!" : null }, { title: "QUÁ HẠN / VI PHẠM", val: dashboardStats.overdue, color: "danger", icon: "bi-exclamation-octagon", alert: dashboardStats.overdue > 0 ? "🚨 Thanh lý khẩn cấp!" : null }].map((s, i) => (
                        <div className="col-md-3" key={i}>
                            <div className={`modern-card h-100 border-start border-${s.color} border-4`}>
                                <div className="card-body p-4 d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-muted fw-bold mb-2 text-uppercase" style={{fontSize: '0.75rem', letterSpacing:'0.5px'}}>{s.title}</h6>
                                        <h2 className={`fw-bold mb-0 text-${s.color}`}>{s.val}</h2>
                                        {s.alert && <small className={`text-${s.color} fw-bold mt-2 d-block`}><i className="bi bi-bell-fill me-1"></i>{s.alert}</small>}
                                    </div>
                                    <div className={`bg-${s.color} bg-opacity-10 p-3 rounded-circle`}><i className={`bi ${s.icon} text-${s.color} fs-3`}></i></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* FILTER BAR */}
                <div className="modern-card mb-4 p-3 d-flex flex-wrap gap-3 align-items-center">
                    <div className="flex-grow-1" style={{ minWidth: '300px' }}>
                        <div className="input-icon-wrapper">
                            <i className="bi bi-search input-icon"></i>
                            <input type="text" className="form-control form-control-icon bg-light border-0 shadow-none" placeholder="Tìm kiếm Mã HĐ, Tên cư dân, Số phòng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                    <div style={{ minWidth: '220px' }}>
                        <select className="form-control-icon form-select bg-light border-0 fw-semibold text-secondary shadow-none w-100" style={{paddingLeft: '16px !important'}} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="all">Hiển thị: Tất cả</option>
                            <option value="draft">🔘 Bản nháp (Draft)</option>
                            <option value="1">🟢 Đang hiệu lực / Chờ</option>
                            <option value="expiring">🟡 Sắp hết hạn</option>
                            <option value="overdue">🔴 Quá hạn (Vi phạm)</option>
                            <option value="0">⚫ Đã thanh lý</option>
                        </select>
                    </div>
                </div>

                {/* SPACED TABLE AREA */}
                <div className="table-container">
                    {loading ? (<div className="text-center py-5"><div className="spinner-border text-primary mb-3"></div></div>) : filteredContracts.length === 0 ? (
                        <div className="modern-card text-center py-5 shadow-sm">
                            <i className="bi bi-inbox empty-state-icon mb-3 d-block"></i>
                            <h4 className="fw-bold text-dark">Không có dữ liệu</h4>
                            <p className="text-muted mb-4">Bạn chưa tạo hợp đồng nào hoặc không có kết quả phù hợp với bộ lọc.</p>
                            <button className="btn btn-gradient-primary rounded-pill px-4 py-2" onClick={() => { setIsEditMode(false); setFormData(initialFormState); setActiveDrawer('FORM'); }}><i className="bi bi-plus-lg me-2"></i>Tạo Hợp Đồng Đầu Tiên</button>
                        </div>
                    ) : (
                        <div className="table-responsive" style={{overflowX: 'visible'}}>
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
                                                        <ul className="dropdown-menu dropdown-menu-end mt-2" style={{minWidth: '240px'}}>
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
                            <div className="p-3 d-flex justify-content-center w-100"><Pagination totalItems={filteredContracts.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} /></div>
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================= */}
            {/* OFFCANVAS DRAWERS & MODALS (BẢO LƯU 100% LOGIC CŨ) */}
            {/* ========================================= */}
            
            <div className={`drawer-backdrop ${activeDrawer ? 'open' : ''}`} onClick={closeDrawer}></div>

            {/* 1. DRAWER FORM (CREATE/EDIT) */}
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

                    <form id="drawerForm" onSubmit={(e) => { e.preventDefault(); handleSaveContract(false); }}>
                        <div className="form-section">
                            <div className="form-section-title"><i className="bi bi-1-circle-fill me-2 text-primary fs-5"></i>Thông tin Lõi (Core Data)</div>
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold small text-muted">Đại diện Cư dân *</label>
                                    <div className={isEditMode && selectedContract && !analyzeStateMachine(selectedContract).permissions.canEditCore ? 'disabled-overlay' : ''}>
                                        <Select options={safeResidents.map(r => ({ value: r.accountId, label: `${r.fullName || r.userName} - CCCD: ${r.identityCard || 'N/A'}` }))} onChange={(opt) => setFormData(prev => ({ ...prev, residentAccountId: opt ? opt.value : '' }))} value={formData.residentAccountId ? { label: "Đã Chọn Chủ Hộ", value: formData.residentAccountId } : null} isDisabled={isEditMode && !analyzeStateMachine(selectedContract).permissions.canEditCore} />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold small text-muted">Căn hộ *</label>
                                    <div className={isEditMode && selectedContract && !analyzeStateMachine(selectedContract).permissions.canEditCore ? 'disabled-overlay' : ''}>
                                        <Select options={availableApartments.map(a => ({ value: a.apartmentId, label: `${a.apartmentCode}` }))} onChange={(opt) => setFormData(prev => ({ ...prev, apartmentId: opt ? opt.value : '' }))} value={formData.apartmentId ? { label: "Đã Chọn Căn Hộ", value: formData.apartmentId } : null} isDisabled={isEditMode && !analyzeStateMachine(selectedContract).permissions.canEditCore} />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold small text-muted">Kỳ hạn Thuê *</label>
                                    <div className="d-flex gap-2 align-items-center">
                                        <input type="date" className={`form-control shadow-none ${isEditMode && selectedContract && !analyzeStateMachine(selectedContract).permissions.canEditCore ? 'disabled-field' : ''}`} name="startDay" value={formData.startDay} onChange={handleInputChange} readOnly={isEditMode && selectedContract && !analyzeStateMachine(selectedContract).permissions.canEditCore} required />
                                        <span className="text-muted fw-bold">-</span>
                                        <input type="date" className={`form-control shadow-none ${isEditMode && selectedContract && !analyzeStateMachine(selectedContract).permissions.canEditCore ? 'disabled-field' : ''}`} name="endDay" value={formData.endDay} min={formData.startDay} onChange={handleInputChange} readOnly={isEditMode && selectedContract && !analyzeStateMachine(selectedContract).permissions.canEditCore} required />
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
                                    <input id="file" type="file" className="form-control shadow-none bg-light" onChange={handleFileChange} accept="application/pdf" required={!isEditMode} />
                                    {isEditMode && formData.existingFileUrl && <div className="small mt-2"><a href={formData.existingFileUrl} target="_blank" rel="noreferrer" className="fw-bold text-danger text-decoration-none"><i className="bi bi-file-pdf-fill me-1"></i>Xem bản Scan hiện tại</a></div>}
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <div className="d-flex justify-content-between align-items-center mb-4"><div className="form-section-title mb-0"><i className="bi bi-2-circle-fill me-2 text-primary fs-5"></i>Cư Dân Phụ (Add-ons)</div><button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3" onClick={addResidentRow} disabled={formData.additionalResidents.length >= 4}><i className="bi bi-plus-lg me-1"></i> Thêm Cư dân</button></div>
                            {formData.additionalResidents.length === 0 ? <div className="text-center p-4 bg-light rounded-3 text-muted border border-dashed small fw-semibold">Phòng chỉ có 1 chủ hộ, không có người ở ghép.</div> : formData.additionalResidents.map((res, index) => (
                                <div className="d-flex gap-2 mb-2 p-2 bg-light rounded-3 border" key={index}>
                                    <select className="form-select border-0 shadow-none bg-transparent fw-semibold" value={res.accountId} onChange={(e) => handleListChange('additionalResidents', index, 'accountId', e.target.value)}><option value="">-- Chọn Cư dân --</option>{safeResidents.map(r => (<option key={r.accountId} value={r.accountId}>{r.fullName}</option>))}</select>
                                    <select className="form-select border-0 shadow-none bg-transparent text-muted" style={{width: '180px'}} value={res.relationshipId} onChange={(e) => handleListChange('additionalResidents', index, 'relationshipId', e.target.value)}><option value="">-- Quan hệ --</option>{relationships.map(rel => <option key={rel.id} value={rel.id}>{rel.name}</option>)}</select>
                                    <button type="button" className="btn btn-white text-danger shadow-none" onClick={() => removeResidentRow(index)}><i className="bi bi-trash"></i></button>
                                </div>
                            ))}
                        </div>

                        <div className="form-section mb-0">
                            <div className="d-flex justify-content-between align-items-center mb-4"><div className="form-section-title mb-0"><i className="bi bi-3-circle-fill me-2 text-primary fs-5"></i>Dịch Vụ (Add-ons)</div><button type="button" className="btn btn-sm btn-outline-success rounded-pill px-3" onClick={addServiceRow}><i className="bi bi-plus-lg me-1"></i> Thêm Dịch vụ</button></div>
                            {formData.selectedServices.length === 0 ? <div className="text-center p-4 bg-light rounded-3 text-muted border border-dashed small fw-semibold">Không đăng ký dịch vụ cố định nào.</div> : formData.selectedServices.map((srv, index) => (
                                <div className="d-flex gap-2 mb-2 p-2 bg-light rounded-3 border" key={index}>
                                    <select className="form-select border-0 shadow-none bg-transparent fw-semibold" value={srv.serviceId} onChange={(e) => handleListChange('selectedServices', index, 'serviceId', e.target.value)}><option value="">-- Chọn Dịch vụ --</option>{safeServices.map(s => (<option key={s.serviceId} value={s.serviceId}>{s.serviceName}</option>))}</select>
                                    <div className="input-icon-wrapper" style={{width: '200px'}}><span className="input-icon fw-bold small">₫</span><input type="number" min="0" onKeyDown={preventInvalidNumber} className="form-control form-control-icon border-0 shadow-none bg-transparent" placeholder="Tùy chỉnh giá" value={srv.actualPrice} onChange={(e) => handleListChange('selectedServices', index, 'actualPrice', e.target.value)} /></div>
                                    <button type="button" className="btn btn-white text-danger shadow-none" onClick={() => removeServiceRow(index)}><i className="bi bi-trash"></i></button>
                                </div>
                            ))}
                        </div>
                    </form>
                </div>
                <div className="drawer-footer">
                    <button type="button" className="btn btn-light px-4 py-2 border fw-bold rounded-pill" onClick={closeDrawer}>Hủy thao tác</button>
                    {!isEditMode && <button type="button" className="btn btn-secondary px-4 py-2 fw-bold shadow-sm rounded-pill" onClick={() => handleSaveContract(true)} disabled={isSubmitting}>Lưu Nháp (Draft)</button>}
                    <button type="submit" form="drawerForm" className="btn btn-gradient-primary px-5 py-2 fw-bold shadow rounded-pill" disabled={isSubmitting}>{isSubmitting ? <span className="spinner-border spinner-border-sm"></span> : (isEditMode ? "Lưu Cập Nhật Data" : "Phát Hành Chính Thức")}</button>
                </div>
            </div>

            {/* 2. DRAWER EXTEND */}
            <div className={`custom-drawer ${activeDrawer === 'EXTEND' ? 'open' : ''}`} style={{width: '450px'}}>
                <div className="drawer-header bg-warning text-dark"><h5 className="fw-bold mb-0">Gia Hạn Hợp Đồng</h5><button className="btn-close" onClick={closeDrawer}></button></div>
                <div className="drawer-body bg-light">
                    <div className="form-section">
                        {selectedContract && analyzeStateMachine(selectedContract).type === 'OVERDUE' && <div className="alert alert-danger fw-bold small"><i className="bi bi-shield-exclamation me-2"></i>Hợp đồng vi phạm. Bắt buộc nhập Ghi chú.</div>}
                        <label className="fw-bold mb-2 small text-muted">Ngày kết thúc cũ:</label>
                        <input type="text" className="form-control disabled-field mb-4 py-3 fw-bold" value={formatDate(extendOldEndDate)} readOnly />
                        <label className="fw-bold mb-2 small text-primary">Ngày kết thúc mới <span className="text-danger">*</span></label>
                        <input type="date" className="form-control form-control-lg border-warning border-2 mb-4 py-3 fw-bold" value={extendNewEndDate} min={extendOldEndDate} onChange={e => setExtendNewEndDate(e.target.value)} />
                        {selectedContract && analyzeStateMachine(selectedContract).type === 'OVERDUE' && (
                            <><label className="fw-bold mb-2 small text-danger">Ghi chú Vi phạm <span className="text-danger">*</span></label><textarea className="form-control bg-light" rows="4" value={actionNote} onChange={e => setActionNote(e.target.value)} placeholder="Nhập lý do hoặc mức phạt..."></textarea></>
                        )}
                    </div>
                </div>
                <div className="drawer-footer"><button className="btn btn-light border rounded-pill px-4 fw-bold" onClick={closeDrawer}>Hủy</button><button className="btn btn-gradient-warning rounded-pill text-white fw-bold px-5" onClick={handleExecuteExtend} disabled={isSubmitting || !extendNewEndDate || (selectedContract && analyzeStateMachine(selectedContract).type === 'OVERDUE' && !actionNote)}>{isSubmitting ? <span className="spinner-border spinner-border-sm"></span> : "Xác nhận Gia Hạn"}</button></div>
            </div>

            {/* 3. DRAWER TERMINATE / CANCEL */}
            <div className={`custom-drawer ${activeDrawer === 'TERMINATE' || activeDrawer === 'CANCEL' ? 'open' : ''}`} style={{width: '500px'}}>
                <div className={`drawer-header text-white ${activeDrawer === 'CANCEL' ? 'bg-warning text-dark' : 'bg-danger'}`}><h5 className="fw-bold mb-0">{activeDrawer === 'CANCEL' ? 'Hủy Giao Kèo' : 'Thanh Lý Hợp Đồng'}</h5><button className={`btn-close ${activeDrawer === 'TERMINATE' ? 'btn-close-white' : ''}`} onClick={closeDrawer}></button></div>
                <div className="drawer-body bg-light">
                    {activeDrawer === 'CANCEL' ? (
                        <div className="form-section text-center"><h5 className="text-danger fw-bold mb-3">Xác nhận Hủy?</h5><p className="text-muted">Hợp đồng chưa hiệu lực sẽ bị vô hiệu hóa.</p></div>
                    ) : (
                        <div className="form-section">
                            <label className="fw-bold mb-2 small text-muted">Ngày bàn giao thực tế <span className="text-danger">*</span></label>
                            <input type="date" className="form-control form-control-lg mb-4 py-3 shadow-none border-danger border-opacity-50" value={actionDate} onChange={e => setActionDate(e.target.value)} />
                            <label className="fw-bold mb-2 small text-muted">Phạt hư hỏng tài sản (VNĐ)</label>
                            <div className="input-icon-wrapper mb-4"><span className="input-icon fw-bold">₫</span><input type="number" min="0" onKeyDown={preventInvalidNumber} className="form-control form-control-icon form-control-lg py-3 shadow-none bg-light" value={actionNote} onChange={e => setActionNote(e.target.value)} placeholder="0" /></div>
                            {terminateResult && (
                                <div className="bg-light p-4 rounded-4 border border-dark shadow-sm">
                                    <h6 className="fw-bold mb-3 text-primary text-uppercase" style={{letterSpacing:'0.5px'}}>Biên bản đối soát:</h6>
                                    <div className="d-flex justify-content-between mb-2"><span className="text-muted">Hóa đơn:</span> <strong className="fs-6">{formatCurrency(terminateResult.totalInvoice)}</strong></div>
                                    <div className="d-flex justify-content-between mb-2"><span className="text-muted">Khách nộp:</span> <strong className="text-success fs-6">{formatCurrency(terminateResult.totalPaid)}</strong></div>
                                    <div className="d-flex justify-content-between mb-3"><span className="text-muted">Trừ phạt:</span> <strong className="text-danger fs-6">{formatCurrency(terminateResult.additionalCost)}</strong></div><hr/>
                                    {terminateResult.refundAmount < 0 && <div className="text-danger fw-bolder fs-5 d-flex justify-content-between align-items-center mt-3"><span>KHÁCH ĐÓNG THÊM:</span> <span>{formatCurrency(Math.abs(terminateResult.refundAmount))}</span></div>}
                                    {terminateResult.refundAmount > 0 && <div className="text-success fw-bolder fs-5 d-flex justify-content-between align-items-center mt-3"><span>BQL HOÀN LẠI:</span> <span>{formatCurrency(terminateResult.refundAmount)}</span></div>}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="drawer-footer"><button className="btn btn-light border rounded-pill px-4 fw-bold" onClick={closeDrawer}>Đóng</button>
                    {activeDrawer === 'CANCEL' ? <button className="btn btn-gradient-warning rounded-pill fw-bold px-5" onClick={handleExecuteCancel}>Xác Nhận Hủy</button> : <button className="btn btn-danger rounded-pill fw-bold px-5 shadow" onClick={handleExecuteTerminate} disabled={isSubmitting || !actionDate}>{isSubmitting ? <span className="spinner-border spinner-border-sm"></span> : "Chốt Thanh Lý & Thu Hồi"}</button>}
                </div>
            </div>

            {/* 4. MODAL TRASH */}
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
                                                        <div className="dropdown-menu p-3 shadow-lg border-0 rounded-4" style={{width: '280px'}}>
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