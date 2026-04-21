import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getComplianceAlerts } from '../lib/api';
import { ShieldCheck, AlertTriangle, Clock, Truck, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { format, differenceInDays } from 'date-fns';

export default function ComplianceAlerts() {
  const { data: alerts, isLoading } = useQuery({ 
    queryKey: ['complianceAlerts'], 
    queryFn: getComplianceAlerts 
  });

  const getStatus = (expiryDate: string) => {
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return { label: 'Expired', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle };
    if (days < 30) return { label: 'Expiring Soon', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock };
    return { label: 'Compliant', color: 'bg-green-100 text-green-700 border-green-200', icon: ShieldCheck };
  };

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
          Compliance & Safety Registry
        </h1>
        <p className="text-gray-500 font-medium">Tracking certifications, permits, and mandatory inspections</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {alerts?.map((alert: any) => {
          const status = getStatus(alert.expiry_date);
          return (
            <motion.div
              key={alert.id}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 rounded-2xl">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${status.color} flex items-center gap-1`}>
                    <status.icon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>
                
                <h3 className="text-lg font-black text-gray-900 mb-1">{alert.document_type}</h3>
                <div className="flex items-center space-x-2 text-xs text-gray-400 font-bold uppercase mb-4">
                  <Truck className="w-3 h-3" />
                  <span>{alert.equipment?.asset_tag || 'Fleet Wide'}</span>
                </div>
                
                <p className="text-sm text-gray-500 mb-6">{alert.notes}</p>
              </div>

              <div className="pt-6 border-t border-gray-50 flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Expires On</p>
                  <p className="text-sm font-black text-gray-900">
                    {format(new Date(alert.expiry_date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <button className="text-xs font-black text-blue-600 hover:underline">
                  Update
                </button>
              </div>
            </motion.div>
          );
        })}
        
        {alerts?.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400 italic">
            <ShieldCheck className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="font-bold text-lg">No active compliance alerts.</p>
            <p className="text-sm">Maintenance and permits are all up to date.</p>
          </div>
        )}
      </div>
    </div>
  );
}
