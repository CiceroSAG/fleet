import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFieldServiceReports, getAssignedMaintenanceSchedules, getTechnicians, deleteFieldServiceReport, getSettings } from '../lib/api';
import { Plus, Search, FileText, Calendar, Building2, User, ChevronRight, Filter, X, ClipboardList, Truck, Clock, AlertCircle, Printer, Edit, Trash2, CheckCircle2, Wrench, ShieldCheck, Download } from 'lucide-react';
import FieldServiceReportForm from '../components/FieldServiceReportForm';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/auth';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function FieldServiceReports() {
  const { profile, session } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(new URLSearchParams(window.location.search).get('action') === 'new');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [editingReport, setEditingReport] = useState<any>(null);
  const [techFilter, setTechFilter] = useState('all');
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['fieldServiceReports'],
    queryFn: getFieldServiceReports,
  });

  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: getTechnicians,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings
  });

  const { data: assignedTasks } = useQuery({ 
    queryKey: ['assignedTasks', session?.user?.id], 
    queryFn: () => getAssignedMaintenanceSchedules(session?.user?.id || ''),
    enabled: !!session?.user?.id && profile?.role === 'Technician'
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFieldServiceReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldServiceReports'] });
      setSelectedReport(null);
      setIsDeleting(false);
    },
  });

  const handleDelete = () => {
    if (selectedReport) {
      deleteMutation.mutate(selectedReport.id);
    }
  };

  const downloadSingleReportPDF = async (report: any) => {
    const doc = new jsPDF();
    const brandName = settings?.company_name || 'FANED MINING SERVICES SARL';
    const primaryColor: [number, number, number] = [249, 115, 22]; // Orange-500
    const secondaryColor: [number, number, number] = [55, 65, 81]; // Gray-700
    const accentColor: [number, number, number] = [255, 247, 237]; // Orange-50
    
    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 45, 'F');
    
    // Header Content
    let headerX = 15;
    if (settings?.logo_url) {
      try {
        const img = new Image();
        img.src = settings.logo_url;
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 15, 10, 25, 25);
        headerX = 45;
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }
    }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(brandName, headerX, 22);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('FIELD SERVICE REPORT • LOGISTICS & MAINTENANCE • KAMOA COPPER PROJECTS', headerX, 32);
    
    // Report Identity Card
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.roundedRect(10, 50, 190, 40, 2, 2, 'F');
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1);
    doc.line(15, 50, 15, 90); // Accent line
    
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORT INFORMATION', 20, 58);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID:`, 20, 68);
    doc.text(`DATE:`, 20, 76);
    doc.text(`TECHNICIANS:`, 20, 84);
    
    doc.setFont('helvetica', 'bold');
    doc.text(report.id.substring(0, 12).toUpperCase(), 45, 68);
    doc.text(new Date(report.report_date).toLocaleDateString(), 45, 76);
    
    const techNames = report.field_service_report_technicians?.length > 0
      ? report.field_service_report_technicians.map((rt: any) => rt.technicians?.name).join(', ')
      : report.technician_name;
    doc.text((techNames || '').toUpperCase(), 45, 84);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`WORKPLACE:`, 110, 68);
    doc.text(`STATUS:`, 110, 76);
    doc.text(`JOB TYPE:`, 110, 84);
    
    doc.setFont('helvetica', 'bold');
    doc.text((report.workplace || '').toUpperCase(), 135, 68);
    doc.setTextColor(report.status === 'completed' ? 16 : 249, report.status === 'completed' ? 185 : 115, report.status === 'completed' ? 129 : 22);
    doc.text((report.status || 'Pending').toUpperCase(), 135, 76);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text((report.job_type || 'N/A').toUpperCase(), 135, 84);
    
    // Checklists Section
    let currentY = 105;
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. INSPECTION CHECKLISTS', 10, currentY);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(10, currentY + 2, 200, currentY + 2);
    
    const checklistData = [
      ['MAINTENANCE', report.maintenance_details ? Object.entries(report.maintenance_details)
        .filter(([_, v]) => v)
        .map(([k, _]) => k.replace(/_/g, ' ').toUpperCase())
        .join(', ') || 'N/A' : 'N/A'],
      ['REPAIRS', report.repair_details ? Object.entries(report.repair_details)
        .filter(([_, v]) => v)
        .map(([k, _]) => k.replace(/_/g, ' ').toUpperCase())
        .join(', ') || 'N/A' : 'N/A'],
      ['SAFETY & INCIDENTS', report.safety_details?.incident_type !== 'none' 
        ? `${report.safety_details.incident_type.replace(/_/g, ' ').toUpperCase()} (SEVERITY: ${report.safety_details.severity.toUpperCase()})` 
        : 'NO INCIDENTS RECORDED']
    ];
    
    autoTable(doc, {
      startY: currentY + 6,
      head: [['Category', 'Details / Observations']],
      body: checklistData,
      theme: 'grid',
      headStyles: { fillColor: secondaryColor, textColor: 255, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, fillColor: [249, 250, 251] as any },
        1: { cellWidth: 'auto' }
      }
    });

    // Equipment Section
    currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. EQUIPMENT INVOLVED', 10, currentY);
    doc.line(10, currentY + 2, 200, currentY + 2);
    
    const equipmentData = report.field_service_report_assets?.map((a: any) => [
      a.equipment?.asset_tag,
      a.equipment?.model,
      a.index_value,
      a.next_service_date ? new Date(a.next_service_date).toLocaleDateString() : 'N/A'
    ]) || [];
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Asset Tag', 'Model / Serial', 'Current Index', 'Next Service Due']],
      body: equipmentData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: 255 },
      alternateRowStyles: { fillColor: accentColor },
      bodyStyles: { fontSize: 9 }
    });
    
    // Job Description & Actions Section
    currentY = (doc as any).lastAutoTable.finalY + 15;
    if (currentY > 230) { doc.addPage(); currentY = 20; }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('3. WORK DETAILS & ACTIONS', 10, currentY);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.line(10, currentY + 2, 200, currentY + 2);
    
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('JOB DESCRIPTION / SCOPE OF WORK:', 10, currentY + 10);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(report.job_description || 'No description provided.', 85);
    doc.text(descLines, 15, currentY + 16);
    
    doc.setFont('helvetica', 'bold');
    doc.text('ACTIONS TAKEN / REPAIRS PERFORMED:', 105, currentY + 10);
    doc.setFont('helvetica', 'normal');
    const actionLines = doc.splitTextToSize(report.action_taken || 'No action recorded.', 85);
    doc.text(actionLines, 110, currentY + 16);
    
    const descH = (descLines.length * 5);
    const actionH = (actionLines.length * 5);
    currentY = Math.max(currentY + 20 + descH, currentY + 20 + actionH, currentY + 40);

    // Parts Section
    if (report.field_service_report_parts?.length > 0) {
      if (currentY > 230) { doc.addPage(); currentY = 20; }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('4. REPLACEMENT PARTS', 10, currentY);
      doc.line(10, currentY + 2, 200, currentY + 2);
      
      const partsData = report.field_service_report_parts.map((p: any) => [
        p.part_description,
        p.quantity_used,
        p.remark || '-'
      ]);
      
      autoTable(doc, {
        startY: currentY + 6,
        head: [['Part Description', 'Quantity', 'Remarks']],
        body: partsData,
        theme: 'grid',
        headStyles: { fillColor: secondaryColor, textColor: 255 },
        bodyStyles: { fontSize: 8 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Signatures / Approvals
    if (currentY > 230) { doc.addPage(); currentY = 20; }
    
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(10, currentY, 190, 45, 2, 2, 'F');
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${report.field_service_report_parts?.length > 0 ? '5' : '4'}. AUTHORIZATION & SIGN-OFF`, 15, currentY + 8);
    
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(8);
    
    // Tech sign area
    doc.text('TECHNICIAN SIGNATURE:', 20, currentY + 18);
    doc.line(20, currentY + 30, 65, currentY + 30);
    doc.setFont('helvetica', 'bold');
    doc.text((techNames || 'N/A').toUpperCase(), 20, currentY + 35);
    doc.setFont('helvetica', 'normal');
    
    // Supervisor sign area
    doc.text('SUPERVISOR APPROVAL:', 80, currentY + 18);
    doc.line(80, currentY + 30, 125, currentY + 30);
    doc.setFont('helvetica', 'bold');
    doc.text((report.supervisor_name || 'PENDING APPROVAL').toUpperCase(), 80, currentY + 35);
    doc.setFont('helvetica', 'normal');
    
    // Manager sign area
    doc.text('KAMOA HOD / MANAGER:', 140, currentY + 18);
    doc.line(140, currentY + 30, 185, currentY + 30);
    doc.setFont('helvetica', 'bold');
    doc.text((report.manager_name || 'PENDING APPROVAL').toUpperCase(), 140, currentY + 35);
    
    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`FANED MINING SERVICES SARL - Confidential Official Documentation`, 105, 285, { align: 'center' });
      doc.text(`Kamoa Copper Projects - Field Service Management System`, 105, 290, { align: 'center' });
      doc.text(`Page ${i} of ${pageCount}`, 195, 290, { align: 'right' });
    }

    doc.save(`FSR_${report.id.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const filteredReports = reports?.filter(report => {
    const matchesSearch = 
      report.workplace?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.job_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.technician_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTech = techFilter === 'all' || report.technician_name === techFilter;
    
    return matchesSearch && matchesTech;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Field Service Reports</h1>
          <p className="text-gray-500 mt-1">Manage and track on-site maintenance and repair reports</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Report</span>
        </button>
      </div>

      {/* My Assigned Tasks (Technician Only) */}
      {profile?.role === 'Technician' && assignedTasks && assignedTasks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center space-x-2 text-gray-900">
            <ClipboardList className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold">My Assigned Tasks</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedTasks.map((task: any) => (
              <div key={task.id} className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition-all space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-100 p-2.5 rounded-xl">
                      <Truck className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{task.equipment?.asset_tag}</p>
                      <p className="text-xs text-gray-500">{task.equipment?.model}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    task.priority === 'critical' ? 'bg-red-100 text-red-600' :
                    task.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm font-bold text-gray-800">{task.maintenance_type}</p>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">{task.description}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center space-x-1.5 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-semibold">Due: {new Date(task.next_due).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => setSelectedSchedule(task)}
                    className="flex items-center space-x-1 bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-orange-700 transition-colors shadow-sm"
                  >
                    <span>Submit FSR</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search reports by workplace, description, or technician..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-gray-600 font-medium min-w-[200px]"
          >
            <option value="all">All Technicians</option>
            {technicians?.map((tech: any) => (
              <option key={tech.id} value={tech.name}>{tech.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredReports?.map((report) => (
              <motion.div
                key={report.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => setSelectedReport(report)}
              >
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="bg-orange-50 p-3 rounded-xl">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        report.job_type === 'PM' ? 'bg-blue-50 text-blue-600' :
                        report.job_type === 'RP' ? 'bg-red-50 text-red-600' :
                        report.job_type === 'BD' ? 'bg-orange-50 text-orange-600' :
                        'bg-green-50 text-green-600'
                      }`}>
                        {report.job_type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        report.status === 'completed' ? 'bg-green-100 text-green-700' :
                        report.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {report.status || 'pending'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{report.workplace}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{report.job_description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-medium">{new Date(report.report_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-500">
                      <User className="w-4 h-4" />
                      <div className="flex -space-x-1 overflow-hidden">
                        {report.field_service_report_technicians?.length > 0 ? (
                          report.field_service_report_technicians.map((rt: any, i: number) => (
                            <div 
                              key={i} 
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center"
                              title={rt.technicians?.name}
                            >
                              <span className="text-[10px] font-medium text-gray-600">
                                {rt.technicians?.name?.split(' ').map((n: any) => n[0]).join('')}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs font-medium truncate">{report.technician_name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex -space-x-2">
                      {report.field_service_report_assets?.slice(0, 3).map((asset: any, i: number) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-600">
                          {asset.equipment?.asset_tag.slice(-2)}
                        </div>
                      ))}
                      {report.field_service_report_assets?.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-600">
                          +{report.field_service_report_assets.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-sm font-bold">
                      <span>View</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {(selectedSchedule || isFormOpen || editingReport) && (
        <FieldServiceReportForm 
          onClose={() => {
            setIsFormOpen(false);
            setSelectedSchedule(null);
            setEditingReport(null);
          }} 
          initialData={editingReport ? {
            id: editingReport.id,
            workplace: editingReport.workplace,
            job_type: editingReport.job_type,
            job_description: editingReport.job_description,
            action_taken: editingReport.action_taken,
            technician_name: editingReport.technician_name,
            supervisor_name: editingReport.supervisor_name,
            supervisor_date: editingReport.supervisor_date,
            manager_name: editingReport.manager_name,
            manager_date: editingReport.manager_date,
            kamoa_hod_name: editingReport.kamoa_hod_name,
            kamoa_hod_date: editingReport.kamoa_hod_date,
            technician_id: editingReport.technician_id,
            report_date: editingReport.report_date,
            status: editingReport.status,
            maintenance_details: editingReport.maintenance_details || {
              inspection: false,
              oil_change: false,
              greasing: false,
              other: false,
            },
            repair_details: editingReport.repair_details || {
              mechanical: false,
              electrical: false,
              hydraulic: false,
              body_work: false,
              tires: false,
            },
            safety_details: editingReport.safety_details || {
              incident_type: 'none',
              severity: 'Minor',
            },
            assets: editingReport.field_service_report_assets?.map((a: any) => ({
              equipment_id: a.equipment_id,
              index_value: a.index_value,
              next_service_date: a.next_service_date
            })),
            parts: editingReport.field_service_report_parts?.map((p: any) => ({
              part_description: p.part_description,
              quantity_used: p.quantity_used,
              remark: p.remark
            }))
          } : selectedSchedule ? {
            scheduleId: selectedSchedule.id,
            job_type: selectedSchedule.maintenance_type === 'preventive' ? 'PM' : 
                      selectedSchedule.maintenance_type === 'corrective' ? 'RP' : 'BD',
            job_description: selectedSchedule.description,
            maintenance_details: {
              inspection: selectedSchedule.maintenance_type === 'preventive',
              oil_change: false,
              greasing: false,
              other: false,
            },
            repair_details: {
              mechanical: selectedSchedule.maintenance_type === 'corrective',
              electrical: false,
              hydraulic: false,
              body_work: false,
              tires: false,
            },
            safety_details: {
              incident_type: 'none',
              severity: 'Minor',
            },
            assets: [{
              equipment_id: selectedSchedule.equipment_id,
              index_value: 0,
              next_service_date: ''
            }]
          } : undefined}
        />
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 no-print">
              <h2 className="text-xl font-bold text-gray-900">Report Details</h2>
              <div className="flex items-center space-x-2">
                {(profile?.role === 'Admin' || profile?.role === 'Technician') && (
                  <button 
                    onClick={() => {
                      setEditingReport(selectedReport);
                      setSelectedReport(null);
                    }} 
                    className="p-2 hover:bg-orange-100 rounded-full transition-colors text-orange-600"
                    title="Edit Report"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
                {profile?.role === 'Admin' && (
                  <button 
                    onClick={() => setIsDeleting(true)} 
                    className="p-2 hover:bg-red-100 rounded-full transition-colors text-red-600"
                    title="Delete Report"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={() => {
                    window.focus();
                    window.print();
                  }} 
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                  title="Print Report"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => downloadSingleReportPDF(selectedReport)} 
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors text-orange-600"
                  title="Download PDF"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div id="printable-report" className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Header only for print */}
              <div className="hidden print:block border-b-2 border-orange-600 pb-6 mb-8">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    {settings?.logo_url && (
                      <img 
                        src={settings.logo_url} 
                        alt="Logo" 
                        className="w-16 h-16 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div>
                      <h1 className="text-3xl font-black text-orange-600 tracking-tighter">{settings?.company_name || 'Fleet Management System'}</h1>
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Field Service Report</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">Report ID: {selectedReport.id.substring(0, 8)}</p>
                    <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Workplace</span>
                  <p className="font-bold text-gray-900">{selectedReport.workplace}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Job Type</span>
                  <p className="font-bold text-gray-900">{selectedReport.job_type}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</span>
                  <p className="font-bold text-gray-900">{new Date(selectedReport.report_date).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
                  <p className={`font-bold uppercase ${
                    selectedReport.status === 'completed' ? 'text-green-600' :
                    selectedReport.status === 'in_progress' ? 'text-orange-600' :
                    'text-gray-600'
                  }`}>
                    {selectedReport.status || 'pending'}
                  </p>
                </div>
                {selectedReport.schedule_id && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Linked Schedule</span>
                    <p className="font-bold text-orange-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {selectedReport.schedule_id.substring(0, 8)}...
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Checklists & Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Maintenance Checklist View */}
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <h5 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3" />
                      Maintenance
                    </h5>
                    <div className="space-y-2">
                      {selectedReport.maintenance_details && Object.entries(selectedReport.maintenance_details).map(([key, value]) => (
                        value && (
                          <div key={key} className="flex items-center gap-2 text-blue-800 text-xs font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span className="capitalize">{key.replace('_', ' ')}</span>
                          </div>
                        )
                      ))}
                      {(!selectedReport.maintenance_details || !Object.values(selectedReport.maintenance_details).some(v => v)) && (
                        <p className="text-gray-400 text-[10px] italic">No maintenance items checked</p>
                      )}
                    </div>
                  </div>

                  {/* Repair Checklist View */}
                  <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                    <h5 className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Wrench className="w-3 h-3" />
                      Repairs
                    </h5>
                    <div className="space-y-2">
                      {selectedReport.repair_details && Object.entries(selectedReport.repair_details).map(([key, value]) => (
                        value && (
                          <div key={key} className="flex items-center gap-2 text-orange-800 text-xs font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            <span className="capitalize">{key.replace('_', ' ')}</span>
                          </div>
                        )
                      ))}
                      {(!selectedReport.repair_details || !Object.values(selectedReport.repair_details).some(v => v)) && (
                        <p className="text-gray-400 text-[10px] italic">No repair items checked</p>
                      )}
                    </div>
                  </div>

                  {/* Safety View */}
                  <div className="p-4 bg-red-50/50 rounded-xl border border-red-100">
                    <h5 className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3" />
                      Safety
                    </h5>
                    <div className="space-y-2">
                      {selectedReport.safety_details?.incident_type && selectedReport.safety_details.incident_type !== 'none' ? (
                        <div className="space-y-2">
                          <div className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase">
                            {selectedReport.safety_details.incident_type.replace('_', ' ')}
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-500 font-bold uppercase tracking-tighter">Severity:</span>
                            <span className={`font-bold uppercase ${
                              selectedReport.safety_details.severity === 'Critical' ? 'text-red-600' :
                              selectedReport.safety_details.severity === 'Major' ? 'text-orange-600' :
                              'text-blue-600'
                            }`}>
                              {selectedReport.safety_details.severity}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-[10px] italic">No incidents reported</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Equipment Involved</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedReport.field_service_report_assets?.map((asset: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <p className="font-bold text-gray-900">{asset.equipment?.asset_tag}</p>
                        <p className="text-xs text-gray-500">{asset.equipment?.model}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase">Index</p>
                        <p className="font-mono text-sm">{asset.index_value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Job Description</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{selectedReport.job_description}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Action Taken</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{selectedReport.action_taken}</p>
                </div>
              </div>

              {selectedReport.field_service_report_parts?.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Parts Used</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 uppercase text-[10px] tracking-widest">
                        <th className="pb-2">Description</th>
                        <th className="pb-2">Qty</th>
                        <th className="pb-2">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedReport.field_service_report_parts.map((part: any, i: number) => (
                        <tr key={i}>
                          <td className="py-2 text-gray-900 font-medium">{part.part_description}</td>
                          <td className="py-2 text-gray-900">{part.quantity_used}</td>
                          <td className="py-2 text-gray-500">{part.remark}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-gray-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Technicians</span>
                  <p className="text-sm font-bold text-gray-900">
                    {selectedReport.field_service_report_technicians?.length > 0
                      ? selectedReport.field_service_report_technicians.map((rt: any) => rt.technicians?.name).join(', ')
                      : selectedReport.technician_name
                    }
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Supervisor</span>
                  <p className="text-sm font-bold text-gray-900">{selectedReport.supervisor_name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manager</span>
                  <p className="text-sm font-bold text-gray-900">{selectedReport.manager_name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">KAMOA HOD</span>
                  <p className="text-sm font-bold text-gray-900">{selectedReport.kamoa_hod_name}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Confirm Deletion</h3>
            </div>
            <p className="text-gray-600">Are you sure you want to delete this report? This action cannot be undone.</p>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setIsDeleting(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
