import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipmentDocuments, createEquipmentDocument, deleteEquipmentDocument } from '../lib/api';
import { FileText, Download, Trash2, Plus, Calendar, ShieldCheck, Image as ImageIcon, ExternalLink, X, File } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface DocumentVaultProps {
  equipmentId: string;
}

export default function DocumentVault({ equipmentId }: DocumentVaultProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: '',
    type: 'manual',
    file_url: 'https://picsum.photos/seed/doc/400/300',
    expiry_date: ''
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ['equipmentDocuments', equipmentId],
    queryFn: () => getEquipmentDocuments(equipmentId)
  });

  const createMutation = useMutation({
    mutationFn: (doc: any) => createEquipmentDocument({ ...doc, equipment_id: equipmentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipmentDocuments', equipmentId] });
      setIsAddOpen(false);
      setNewDoc({ title: '', type: 'manual', file_url: 'https://picsum.photos/seed/doc/400/300', expiry_date: '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEquipmentDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipmentDocuments', equipmentId] });
    }
  });

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'manual': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'certificate': return <ShieldCheck className="w-5 h-5 text-green-500" />;
      case 'photo': return <ImageIcon className="w-5 h-5 text-purple-500" />;
      default: return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black text-gray-900 tracking-tight">{t('doc_vault')}</h3>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('add')} {t('documents')}</span>
        </button>
      </div>

      <AnimatePresence>
        {isAddOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-orange-50 rounded-2xl border border-orange-100 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Title</label>
                 <input
                   type="text"
                   value={newDoc.title}
                   onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                   className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                   placeholder="e.g. Operating Manual v2"
                 />
               </div>
               <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Type</label>
                 <select
                   value={newDoc.type}
                   onChange={e => setNewDoc({ ...newDoc, type: e.target.value })}
                   className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                 >
                   <option value="manual">{t('operating_manuals')}</option>
                   <option value="certificate">{t('certificates')}</option>
                   <option value="photo">{t('condition_photos')}</option>
                 </select>
               </div>
               <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">URL (Mock Upload)</label>
                 <input
                   type="text"
                   disabled
                   value={newDoc.file_url}
                   className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg outline-none cursor-not-allowed"
                 />
               </div>
               <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t('expiry')}</label>
                 <input
                   type="date"
                   value={newDoc.expiry_date}
                   onChange={e => setNewDoc({ ...newDoc, expiry_date: e.target.value })}
                   className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                 />
               </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
               <button onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">{t('cancel')}</button>
               <button
                 onClick={() => createMutation.mutate(newDoc)}
                 disabled={!newDoc.title || createMutation.isPending}
                 className="px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black disabled:opacity-50"
               >
                 {t('save')}
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map(n => <div key={n} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)
        ) : documents?.length === 0 ? (
          <div className="md:col-span-3 text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">{t('no_docs')}</p>
          </div>
        ) : (
          documents?.map((doc: any) => (
            <motion.div
              layout
              key={doc.id}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-100">
                    {getDocIcon(doc.type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{doc.title}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t(doc.type)}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(doc.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                {doc.expiry_date ? (
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>{t('expiry')}: {new Date(doc.expiry_date).toLocaleDateString()}</span>
                  </div>
                ) : <div />}
                
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 text-[10px] font-black text-orange-600 hover:text-orange-700 uppercase"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>View</span>
                </a>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
