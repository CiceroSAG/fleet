import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getEquipment } from '../lib/api';
import { 
  Truck, Users, Fuel, ClipboardList, Package, 
  Map, Activity, Search, Warehouse, FileText, 
  Settings, ShieldCheck, AlertTriangle, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: equipment } = useQuery({ 
    queryKey: ['equipment'], 
    queryFn: getEquipment,
    enabled: open // Only fetch when palette is open
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col"
          >
            <Command className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center px-4 border-b border-gray-100">
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <Command.Input
                  autoFocus
                  placeholder="Search assets, pages, or commands..."
                  className="w-full h-14 bg-transparent border-none outline-none text-gray-900 font-medium placeholder:text-gray-400"
                />
                <div className="flex items-center space-x-1 ml-2">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold border-b-2 border-gray-200">ESC</kbd>
                </div>
              </div>

              <Command.List className="max-h-[450px] overflow-y-auto p-2 scrollbar-hide">
                <Command.Empty className="py-12 text-center text-sm text-gray-500">
                  No results found.
                </Command.Empty>

                {equipment && equipment.length > 0 && (
                  <Command.Group heading="Quick Asset Jump" className="px-2 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {equipment.slice(0, 10).map((item: any) => (
                      <Command.Item
                        key={item.id}
                        onSelect={() => runCommand(() => navigate(`/equipment/${item.id}`))}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-default transition-all data-[selected=true]:bg-orange-50 data-[selected=true]:text-orange-900"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-1.5 bg-orange-100 rounded-lg">
                            <Truck className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <span className="font-bold text-sm">{item.asset_tag}</span>
                            <span className="ml-2 text-xs text-gray-400">{item.manufacturer} {item.model}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.status === 'Active' ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'
                          }`}>
                            {item.status}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                <Command.Group heading="Navigation" className="px-2 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 border-t border-gray-50 pt-4">
                  <Item icon={Truck} label="Fleet Management" onSelect={() => runCommand(() => navigate('/equipment'))} />
                  <Item icon={Warehouse} label="Workshop Operations" onSelect={() => runCommand(() => navigate('/workshop'))} />
                  <Item icon={Package} label="Parts & Inventory" onSelect={() => runCommand(() => navigate('/parts'))} />
                  <Item icon={ClipboardList} label="Maintenance Logs" onSelect={() => runCommand(() => navigate('/maintenance'))} />
                  <Item icon={FileText} label="Field Service Reports" onSelect={() => runCommand(() => navigate('/field-service-reports'))} />
                  <Item icon={ShieldCheck} label="Daily Inspections" onSelect={() => runCommand(() => navigate('/inspections'))} />
                </Command.Group>

                <Command.Group heading="Operations" className="px-2 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">
                  <Item icon={Fuel} label="Log Fuel Consumption" onSelect={() => runCommand(() => navigate('/fuel'))} />
                  <Item icon={Map} label="Real-Time tracking" onSelect={() => runCommand(() => navigate('/tracking'))} />
                  <Item icon={AlertTriangle} label="Report New Incident" onSelect={() => runCommand(() => navigate('/incidents'))} />
                </Command.Group>

                <Command.Group heading="System" className="px-2 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">
                  <Item icon={Users} label="User Permissions" onSelect={() => runCommand(() => navigate('/users'))} />
                  <Item icon={Settings} label="Global Settings" onSelect={() => runCommand(() => navigate('/settings'))} />
                </Command.Group>
              </Command.List>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-400">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center"><span className="mr-1">↑↓</span> Navigate</span>
                  <span className="flex items-center"><span className="mr-1">↵</span> Select</span>
                </div>
                <span>Faned Fleet Command</span>
              </div>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Item({ icon: Icon, label, onSelect }: { icon: any, label: string, onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center space-x-3 px-3 py-2.5 rounded-xl cursor-default transition-all data-[selected=true]:bg-orange-600 data-[selected=true]:text-white data-[selected=true]:shadow-lg data-[selected=true]:shadow-orange-200"
    >
      <Icon className="w-5 h-5 opacity-80" />
      <span className="font-bold">{label}</span>
    </Command.Item>
  );
}
