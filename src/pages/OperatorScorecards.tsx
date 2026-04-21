import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProfiles } from '../lib/api';
import { Activity, Star, TrendingUp, AlertTriangle, Clock, Fuel } from 'lucide-react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function OperatorScorecards() {
  const { data: operators } = useQuery({ queryKey: ['operators'], queryFn: getProfiles });
  
  // Mock performance data for visualization
  const performanceData = [
    { name: 'Fuel Efficiency', value: 88, color: '#22c55e' },
    { name: 'Safety Score', value: 94, color: '#3b82f6' },
    { name: 'Productivity', value: 76, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
          Operator Performance Scorecards
        </h1>
        <p className="text-gray-500 font-medium">Gamified efficiency and safety metrics for precision mining</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Top Performers</h3>
             <div className="space-y-4">
                {operators?.slice(0, 3).map((op, i) => (
                  <div key={op.id} className="flex items-center justify-between">
                     <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-black text-orange-600">
                           {op.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                           <p className="text-sm font-black">{op.full_name || 'Anonymous'}</p>
                           <p className="text-[10px] text-gray-400 font-bold uppercase">Operator</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-xs font-black text-green-600">{90 + (3 - i)}%</p>
                        <p className="text-[8px] text-gray-300 font-bold">Rank #{i+1}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-6 text-white shadow-xl">
             <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Overall Fleet Efficiency</h3>
             <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                        data={performanceData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {performanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', background: '#18181b', color: '#fff' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                      />
                   </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="mt-4 space-y-2">
                {performanceData.map(d => (
                  <div key={d.name} className="flex justify-between items-center text-[10px] font-bold">
                     <span className="text-zinc-500">{d.name}</span>
                     <span className="text-white">{d.value}%</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {operators?.map((op) => (
                <motion.div
                  key={op.id}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative group overflow-hidden"
                >
                   <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center space-x-4">
                           <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                             <Activity className="w-6 h-6 text-orange-600" />
                           </div>
                           <div>
                             <h4 className="text-xl font-black text-gray-900">{op.full_name}</h4>
                             <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">ID: {op.id.substring(0, 8)}</p>
                           </div>
                        </div>
                        <div className="bg-green-50 text-green-600 px-4 py-2 rounded-2xl font-black text-sm">
                           Elite
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-8">
                         <div className="bg-gray-50 rounded-2xl p-4 text-center">
                            <Fuel className="w-4 h-4 mx-auto mb-2 text-blue-500" />
                            <p className="text-[8px] text-gray-400 font-bold uppercase">Fuel Cons.</p>
                            <p className="text-sm font-black">-12%</p>
                         </div>
                         <div className="bg-gray-50 rounded-2xl p-4 text-center">
                            <Clock className="w-4 h-4 mx-auto mb-2 text-orange-500" />
                            <p className="text-[8px] text-gray-400 font-bold uppercase">Idle Time</p>
                            <p className="text-sm font-black">4.2%</p>
                         </div>
                         <div className="bg-gray-50 rounded-2xl p-4 text-center">
                            <AlertTriangle className="w-4 h-4 mx-auto mb-2 text-red-500" />
                            <p className="text-[8px] text-gray-400 font-bold uppercase">Incidents</p>
                            <p className="text-sm font-black">0</p>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-gray-400">Monthly Target</span>
                            <span className="text-gray-900">85% Achieved</span>
                         </div>
                         <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: '85%' }}
                              className="h-full bg-orange-600"
                            />
                         </div>
                      </div>
                   </div>
                   
                   {/* Decorative background number */}
                   <div className="absolute -bottom-4 -right-2 text-gray-50 text-8xl font-black select-none pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      {op.full_name?.charAt(0)}
                   </div>
                </motion.div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
