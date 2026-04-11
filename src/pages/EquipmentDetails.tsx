import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getEquipmentDetails, getSettings } from '@/lib/api';
import { ArrowLeft, Fuel, Wrench, AlertTriangle, Settings, DollarSign, FileText } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/utils';

export default function EquipmentDetails() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['equipmentDetails', id],
    queryFn: () => getEquipmentDetails(id!),
    enabled: !!id
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings
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
      <div className="mb-6">
        <Link to="/equipment" className="inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-500">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Equipment
        </Link>
      </div>

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
                <dd className="mt-1 text-sm text-gray-900">{equipment.current_location || '-'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Assigned Operator</dt>
                <dd className="mt-1 text-sm text-gray-900">{equipment.operators?.name || 'Unassigned'}</dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Lifecycle & Warranty</h4>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Purchase Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString() : '-'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Purchase Price</dt>
                <dd className="mt-1 text-sm text-gray-900">{equipment.purchase_price ? `${currencySymbol}${Number(equipment.purchase_price).toLocaleString()}` : '-'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Warranty Provider</dt>
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
              <span className="font-medium">{currencySymbol}{totalFuelCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Maintenance Costs</span>
              <span className="font-medium">{currencySymbol}{totalMaintCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Repair Costs</span>
              <span className="font-medium">{currencySymbol}{totalRepairCost.toFixed(2)}</span>
            </div>
            <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="font-bold text-gray-900">Total TCO</span>
              <span className="font-bold text-green-600 text-lg">{currencySymbol}{tco.toFixed(2)}</span>
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
    </div>
  );
}
