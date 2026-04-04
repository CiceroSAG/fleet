import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIncidents, deleteIncident, getIncidentPatterns, getCorrectiveActions, createIncidentInvestigation } from '@/lib/api';
import { Plus, Search, Edit2, Trash2, FileText, TrendingUp, AlertTriangle } from 'lucide-react';
import IncidentForm from '@/components/IncidentForm';
import { useAuth } from '@/lib/auth';

export default function Incidents() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [investigatingIncident, setInvestigatingIncident] = useState<any>(null);
  const [showPatterns, setShowPatterns] = useState(false);
  const [investigationForm, setInvestigationForm] = useState({
    rootCause: '',
    contributingFactors: '',
    preventiveMeasures: ''
  });

  const queryClient = useQueryClient();
  const { profile } = useAuth();
  // Operators can insert, Admins/Managers can edit/delete
  const canEditDelete = profile?.role === 'Admin' || profile?.role === 'Manager';

  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['incidents'],
    queryFn: getIncidents
  });

  // Investigation queries
  const { data: patterns } = useQuery({
    queryKey: ['incidentPatterns', '30'],
    queryFn: () => getIncidentPatterns('30'),
    enabled: showPatterns
  });

  const { data: correctiveActions, error: investigationError } = useQuery({
    queryKey: ['correctiveActions', investigatingIncident?.id],
    queryFn: () => getCorrectiveActions(investigatingIncident.id),
    enabled: !!investigatingIncident
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIncident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    }
  });

  const investigationMutation = useMutation({
    mutationFn: ({ incidentId, investigation }: { incidentId: string; investigation: any }) => 
      createIncidentInvestigation(incidentId, investigation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      closeInvestigation();
    }
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this incident?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditForm = (item: any) => {
    setEditingLog(item);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingLog(null);
    setIsFormOpen(false);
  };

  const startInvestigation = (incident: any) => {
    setInvestigatingIncident(incident);
  };

  const closeInvestigation = () => {
    setInvestigatingIncident(null);
    setInvestigationForm({
      rootCause: '',
      contributingFactors: '',
      preventiveMeasures: ''
    });
  };

  const handleInvestigationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    investigationMutation.mutate({
      incidentId: investigatingIncident.id,
      investigation: investigationForm
    });
  };

  const filteredLogs = logs?.filter((item: any) => 
    item.equipment?.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type_of_damage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading incidents</h3>
        <p className="mt-1 text-sm text-gray-500">
          There was an error loading the incident data. Please check your database connection and ensure all required tables exist.
        </p>
        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidents & Damage</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track damage reports and incidents across the fleet.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsFormOpen(true)}
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Report Incident
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-300 sm:rounded-lg">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="relative rounded-md shadow-sm max-w-sm w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-orange-500 focus:ring-orange-500 sm:text-sm py-2 border"
              placeholder="Search by asset tag or damage type..."
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading incidents...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p className="font-medium">Database Connection Error</p>
            <p className="text-sm mt-1">Please ensure your Supabase URL and Anon Key are set.</p>
          </div>
        ) : !filteredLogs || filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No incidents reported.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Equipment</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Damage Type</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Severity</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Reported By</th>
                  {canEditDelete && (
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredLogs.map((item: any) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {item.equipment?.asset_tag}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {item.type_of_damage}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        item.severity === 'Low' ? 'bg-gray-100 text-gray-800' : 
                        item.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                        item.severity === 'High' ? 'bg-orange-100 text-orange-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.reported_by || '-'}</td>
                    {canEditDelete && (
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => startInvestigation(item)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Search className="h-4 w-4" />
                          <span className="sr-only">Investigate</span>
                        </button>
                        <button
                          onClick={() => openEditForm(item)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Investigation Workflow */}
      {investigatingIncident && correctiveActions && !investigationError && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Incident Investigation: {investigatingIncident.equipment?.asset_tag}
            </h2>
            <button
              onClick={() => setInvestigatingIncident(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Corrective Actions</h3>
              <div className="space-y-3">
                {correctiveActions.recommendations.map((rec: any, index: number) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 ${
                    rec.priority === 'critical' ? 'border-red-500 bg-red-50' :
                    rec.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{rec.action}</p>
                        <p className="text-sm text-gray-600">{rec.department}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Investigation Form</h3>
              <form onSubmit={handleInvestigationSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Root Cause</label>
                  <textarea
                    value={investigationForm.rootCause}
                    onChange={(e) => setInvestigationForm(prev => ({ ...prev, rootCause: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
                    rows={3}
                    placeholder="Describe the root cause of this incident..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contributing Factors</label>
                  <textarea
                    value={investigationForm.contributingFactors}
                    onChange={(e) => setInvestigationForm(prev => ({ ...prev, contributingFactors: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
                    rows={2}
                    placeholder="List any contributing factors..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preventive Measures</label>
                  <textarea
                    value={investigationForm.preventiveMeasures}
                    onChange={(e) => setInvestigationForm(prev => ({ ...prev, preventiveMeasures: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
                    rows={2}
                    placeholder="Recommended preventive measures..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={investigationMutation.isPending}
                  className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                  {investigationMutation.isPending ? 'Submitting...' : 'Complete Investigation'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Investigation Error */}
      {investigatingIncident && investigationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Investigation Error</h3>
              <p className="mt-1 text-sm text-red-700">
                Unable to load corrective actions. This feature requires database schema updates.
              </p>
              <button
                onClick={() => setInvestigatingIncident(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Close Investigation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incident Patterns Analysis */}
      {showPatterns && patterns && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Incident Patterns (Last 30 Days)
            </h2>
            <button
              onClick={() => setShowPatterns(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">By Type</h3>
              <div className="mt-2 space-y-1">
                {Object.entries(patterns.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span>{type}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">By Severity</h3>
              <div className="mt-2 space-y-1">
                {Object.entries(patterns.bySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex justify-between text-sm">
                    <span className={`capitalize ${
                      severity === 'High' ? 'text-red-600' :
                      severity === 'Medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>{severity}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Top Equipment</h3>
              <div className="mt-2 space-y-1">
                {Object.entries(patterns.byEquipment).slice(0, 3).map(([equipment, count]) => (
                  <div key={equipment} className="flex justify-between text-sm">
                    <span className="truncate mr-2">{equipment}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Trend</h3>
              <div className="mt-2">
                {patterns.trends.map((trend: any, index: number) => (
                  <div key={index} className="text-sm">
                    <p className="font-medium">{trend.period}</p>
                    <p className={`${trend.trend === 'increasing' ? 'text-red-600' : trend.trend === 'decreasing' ? 'text-green-600' : 'text-gray-600'}`}>
                      {trend.incidents} incidents ({trend.change}% {trend.trend})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowPatterns(!showPatterns)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          {showPatterns ? 'Hide Patterns' : 'Show Patterns'}
        </button>
      </div>

      {isFormOpen && (
        <IncidentForm log={editingLog} onClose={closeForm} />
      )}
    </div>
  );
}
