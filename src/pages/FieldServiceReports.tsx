import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFieldServiceReports, getAssignedMaintenanceSchedules, getTechnicians, deleteFieldServiceReport } from '../lib/api';
import { Plus, Search, FileText, Calendar, Building2, User, ChevronRight, Filter, X, ClipboardList, Truck, Clock, AlertCircle, Printer, Edit, Trash2 } from 'lucide-react';
import FieldServiceReportForm from '../components/FieldServiceReportForm';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/auth';

export default function FieldServiceReports() {
  const { profile, session } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
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
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => setSelectedReport(report)}
              >
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="bg-orange-50 p-3 rounded-xl">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      report.job_type === 'PM' ? 'bg-blue-50 text-blue-600' :
                      report.job_type === 'RP' ? 'bg-red-50 text-red-600' :
                      report.job_type === 'BD' ? 'bg-orange-50 text-orange-600' :
                      'bg-green-50 text-green-600'
                    }`}>
                      {report.job_type}
                    </span>
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
                      <span className="text-xs font-medium truncate">{report.technician_name}</span>
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
                  onClick={() => window.print()} 
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                  title="Print Report"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div id="printable-report" className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Technician</span>
                  <p className="text-sm font-bold text-gray-900">{selectedReport.technician_name}</p>
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
