import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipmentDetails, getSettings, getWorkshopBays, updateEquipment } from '@/lib/api';
import { ArrowLeft, Fuel, Wrench, AlertTriangle, Settings, DollarSign, FileText, QrCode, Shield, Calendar, MapPin, Tag, Warehouse, ClipboardCheck } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import DocumentVault from '@/components/DocumentVault';
import FieldServiceReportForm from '@/components/FieldServiceReportForm';
import { useTranslation } from 'react-i18next';

export default function EquipmentDetails() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuth();
  const [showQR, setShowQR] = useState(false);
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');

  useEffect(() => {
    if (searchParams.get('action') === 'inspection') {
      setShowInspectionForm(true);
      // Clean up the URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['equipmentDetails', id],
    queryFn: () => getEquipmentDetails(id!),
    enabled: !!id
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings
  });

  const { data: bays } = useQuery({
    queryKey: ['workshopBays'],
    queryFn: getWorkshopBays
  });

  const mutation = useMutation({
    mutationFn: (updates: any) => updateEquipment(id!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipmentDetails', id] });
    }
  });

  const currencySymbol = getCurrencySymbol(settings?.currency);

  if (isLoading) {
    return <div className="p-8 text-center">Loading equipment details...</div>;
  }

  if (error || !data) {
    return <div className="p-8 text-center text-red-500">Error loading equipment details.</div>;
  }

  const { equipment, fuel, maintenance, repairs, incidents, fsr } = data;

  // Calculate Total Cost of Ownership (TCO)
  const totalFuelCost = fuel?.reduce((sum: number, f: any) => sum + Number(f.cost || 0), 0) || 0;
  const totalMaintCost = maintenance?.reduce((sum: number, m: any) => sum + Number(m.cost || 0), 0) || 0;
  const totalRepairCost = repairs?.reduce((sum: number, r: any) => sum + Number(r.cost || 0), 0) || 0;
  const tco = totalFuelCost + totalMaintCost + totalRepairCost;

  // Combine all events into a single timeline
  const timelineEvents = [
    ...fuel.map((f: any) => ({ ...f, type: 'fuel', dateStr: f.date })),
    ...maintenance.map((m: any) => ({ ...m, type: 'maintenance', dateStr: m.date })),
    ...repairs.map((r: any) => ({ ...r, type: 'repair', dateStr: r.date_reported })),
    ...incidents.map((i: any) => ({ ...i, type: 'incident', dateStr: i.date })),
    ...(fsr || []).map((f: any) => ({ ...f, type: 'fsr', dateStr: f.report_date }))
  ].sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/equipment" className="inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-500">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Equipment
        </Link>
        
        {(profile?.role?.toLowerCase() === 'admin' || profile?.role?.toLowerCase() === 'manager') && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowInspectionForm(true)}
              className="inline-flex items-center px-4 py-2 bg-orange-600 border border-orange-500 rounded-xl text-sm font-bold text-white hover:bg-orange-700 transition-all shadow-sm"
            >
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Inspection
            </button>
            <button
              onClick={() => setShowQR(true)}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              <QrCode className="mr-2 h-4 w-4 text-orange-600" />
              QR Tag
            </button>
          </div>
        )}
      </div>

      {showInspectionForm && (
        <FieldServiceReportForm 
          onClose={() => setShowInspectionForm(false)} 
          initialData={{
            job_type: 'Inspection',
            job_description: 'Pre-start safety inspection triggered via scan Pulsar.',
            assets: [{ equipment_id: id!, index_value: 0, next_service_date: '' }]
          }}
        />
      )}

      {showQR && (
        <QRCodeGenerator 
          assetTag={equipment.asset_tag}
          assetName={`${equipment.manufacturer} ${equipment.model}`}
          onClose={() => setShowQR(false)}
        />
      )}

      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-6 py-3 rounded-2xl text-sm font-black transition-all ${activeTab === 'details' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
        >
          {t('active')} Details
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-6 py-3 rounded-2xl text-sm font-black transition-all ${activeTab === 'documents' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
        >
          {t('doc_vault')}
        </button>
      </div>

      {activeTab === 'details' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg lg:col-span-2">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {equipment.asset_tag} - {equipment.type}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {equipment.manufacturer} {equipment.model} ({equipment.year})
                  </p>
                </div>
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold leading-5 ${
                    equipment.status === 'Active' ? 'bg-green-100 text-green-800' : 
                    equipment.status === 'Under Maintenance' ? 'bg-yellow-100 text-yellow-800' : 
                    equipment.status === 'Out of Service' ? 'bg-gray-100 text-gray-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {equipment.status}
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-[10px] font-black text-gray-400 uppercase flex items-center mb-1"><Tag className="w-3 h-3 mr-1" /> NFC Tag Status</dt>
                    <dd className={`mt-1 text-sm font-black px-3 py-1 rounded-lg inline-block ${equipment.nfc_tag ? 'bg-green-50 text-green-700 ring-1 ring-green-100' : 'bg-red-50 text-red-600 ring-1 ring-red-100 italic'}`}>
                      {equipment.nfc_tag || 'Not Assigned'}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-[10px] font-black text-gray-400 uppercase flex items-center mb-1"><QrCode className="w-3 h-3 mr-1" /> QR Code Status</dt>
                    <dd className={`mt-1 text-sm font-black px-3 py-1 rounded-lg inline-block ${equipment.qr_code_tag ? 'bg-green-50 text-green-700 ring-1 ring-green-100' : 'bg-red-50 text-red-600 ring-1 ring-red-100 italic'}`}>
                      {equipment.qr_code_tag || 'Not Assigned'}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
                    <dd className="mt-1 text-sm text-gray-900">{equipment.serial_number || '-'}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">License Plate</dt>
                    <dd className="mt-1 text-sm text-gray-900">{equipment.license_plate || '-'}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">VIN</dt>
                    <dd className="mt-1 text-sm text-gray-900">{equipment.vin || '-'}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Current Location</dt>
                    <dd className="mt-1 text-sm text-gray-900 flex items-center"><MapPin className="w-3 h-3 mr-1 text-red-500" /> {equipment.current_location || '-'}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Assigned Operator</dt>
                    <dd className="mt-1 text-sm text-gray-900 underline decoration-orange-200 underline-offset-4">{equipment.operators?.name || 'Unassigned'}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-bold text-gray-400 uppercase flex items-center mb-2"><Warehouse className="w-3 h-3 mr-1" /> Workshop Bay</dt>
                    <dd className="mt-1">
                      <select
                        value={equipment.workshop_bay_id || ''}
                        onChange={(e) => {
                          const bay_id = e.target.value || null;
                          mutation.mutate({ 
                            workshop_bay_id: bay_id,
                            workshop_entry_date: bay_id ? new Date().toISOString() : null,
                            status: bay_id ? 'Under Maintenance' : 'Active'
                          });
                        }}
                        className="w-full sm:w-64 px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-bold focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">{t('available')} (No Bay)</option>
                        {bays?.map((bay: any) => (
                          <option key={bay.id} value={bay.id}>{bay.name} ({t(bay.status)})</option>
                        ))}
                      </select>
                      {equipment.workshop_bay_id && (
                        <p className="mt-2 text-[10px] text-gray-400 italic">
                          Entered: {new Date(equipment.workshop_entry_date).toLocaleString()}
                        </p>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Lifecycle & Warranty</h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center"><Calendar className="w-3 h-3 mr-1" /> Purchase Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">{equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString() : '-'}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Purchase Price</dt>
                    <dd className="mt-1 text-sm text-gray-900">{equipment.purchase_price ? `${currencySymbol}${Number(equipment.purchase_price).toLocaleString()}` : '-'}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center"><Shield className="w-3 h-3 mr-1" /> Warranty Provider</dt>
                    <dd className="mt-1 text-sm text-gray-900">{equipment.warranty_provider || '-'}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Warranty Expiry</dt>
                    <dd className="mt-1 text-sm text-gray-900">{equipment.warranty_end_date ? new Date(equipment.warranty_end_date).toLocaleDateString() : '-'}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Current Book Value</dt>
                    <dd className="mt-1 text-sm text-gray-900">{equipment.current_book_value ? `${currencySymbol}${Number(equipment.current_book_value).toLocaleString()}` : '-'}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Useful Life</dt>
                    <dd className="mt-1 text-sm text-gray-900">{equipment.useful_life_years ? `${equipment.useful_life_years} Years` : '-'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Total Cost of Ownership
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Fuel Costs</span>
                  <span className="font-medium">{currencySymbol}{(totalFuelCost || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Maintenance Costs</span>
                  <span className="font-medium">{currencySymbol}{(totalMaintCost || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Repair Costs</span>
                  <span className="font-medium">{currencySymbol}{(totalRepairCost || 0).toFixed(2)}</span>
                </div>
                <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total TCO</span>
                  <span className="font-bold text-green-600 text-lg">{currencySymbol}{(tco || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-4">Audit Trail & History</h3>
          
          {timelineEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">
              No history recorded for this equipment yet.
            </div>
          ) : (
            <div className="flow-root bg-white shadow sm:rounded-lg p-6">
              <ul role="list" className="-mb-8">
                {timelineEvents.map((event, eventIdx) => (
                  <li key={`${event.type}-${event.id}`}>
                    <div className="relative pb-8">
                      {eventIdx !== timelineEvents.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                            event.type === 'fuel' ? 'bg-blue-500' :
                            event.type === 'maintenance' ? 'bg-purple-500' :
                            event.type === 'repair' ? 'bg-yellow-500' :
                            event.type === 'fsr' ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}>
                            {event.type === 'fuel' && <Fuel className="h-4 w-4 text-white" />}
                            {event.type === 'maintenance' && <Settings className="h-4 w-4 text-white" />}
                            {event.type === 'repair' && <Wrench className="h-4 w-4 text-white" />}
                            {event.type === 'fsr' && <FileText className="h-4 w-4 text-white" />}
                            {event.type === 'incident' && <AlertTriangle className="h-4 w-4 text-white" />}
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-gray-500">
                              {event.type === 'fuel' && <>Added <span className="font-medium text-gray-900">{event.quantity}L</span> of fuel ({currencySymbol}{event.cost})</>}
                              {event.type === 'maintenance' && <><span className="font-medium text-gray-900 capitalize">{event.service_type}</span> maintenance performed ({currencySymbol}{event.cost})</>}
                              {event.type === 'repair' && <>Repair logged: <span className="font-medium text-gray-900">{event.issue_description}</span></>}
                              {event.type === 'fsr' && <>Field Service Report: <span className="font-medium text-gray-900">{event.job_type}</span> - {event.workplace}</>}
                              {event.type === 'incident' && <>Incident reported: <span className="font-medium text-gray-900">{event.type_of_damage}</span> (Severity: {event.severity})</>}
                            </p>
                            {(event.notes || event.odometer || event.odometer_reading) && (
                              <p className="mt-1 text-sm text-gray-500">
                                {event.notes && <span>Notes: {event.notes}</span>}
                                {(event.odometer || event.odometer_reading) && (
                                  <span className="ml-2">Odometer: {event.odometer || event.odometer_reading}</span>
                                )}
                              </p>
                            )}
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-gray-500">
                            <time dateTime={event.dateStr}>{new Date(event.dateStr).toLocaleDateString()}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white shadow rounded-2xl p-8">
          <DocumentVault equipmentId={id!} />
        </div>
      )}
    </div>
  );
}
