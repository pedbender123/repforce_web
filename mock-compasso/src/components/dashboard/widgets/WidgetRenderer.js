import React, { useState, useEffect } from 'react';
import { 
    ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, 
    PieChart, Pie, Cell, Treemap, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ComposedChart
} from 'recharts';
import { Settings, FileText, ArrowRight } from 'lucide-react';
import apiClient from '../../../api/apiClient';

// --- COLORS ---
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const WidgetRenderer = ({ widget }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (widget.config && (widget.config.entity_slug || widget.config.static_data)) {
            fetchData();
        }
    }, [widget.config]);

    const fetchData = async () => {
        if (widget.config.static_data) {
             setData(widget.config.static_data);
             return;
        }

        setLoading(true);
        setError(null);
        try {
            // Simplified API call - In real app, this would change based on widget type
            // e.g. /aggregate for charts, /entries for lists
            const payload = {
                metric: widget.config.metric || 'count',
                field: widget.config.target_field,
                group_by: widget.config.group_by,
                limit: widget.config.limit || 50
            };
            const endpoint = widget.type.includes('LIST') || widget.type.includes('TABLE') 
                ? `/api/engine/query/${widget.config.entity_slug}`
                : `/api/engine/analytics/aggregate/${widget.config.entity_slug}`;

            const { data: res } = await apiClient.post(endpoint, payload);
            setData(res);
        } catch (e) {
            console.error(e);
            setError("Erro ao carregar dados");
        } finally {
            setLoading(false);
        }
    };

    if (!widget.config?.entity_slug && !widget.config?.static_data) {
        return <div className="h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">
            Sem configuração. <Settings size={12} className="inline ml-1"/>
        </div>;
    }
    
    if (loading) return <div className="h-full flex items-center justify-center text-gray-400 text-xs">Carregando...</div>;
    if (error) return <div className="h-full flex items-center justify-center text-gray-400 text-xs">{error}</div>;
    if (!data) return <div className="h-full flex items-center justify-center text-gray-400 text-xs">Sem dados</div>;

    // --- RENDERERS ---

    const renderScorecard = () => {
        // Expecting data { value: 123 }
        const val = data.value !== undefined ? data.value : (data.count || 0);
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <span className="text-4xl font-black text-slate-700 dark:text-white">{val}</span>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{widget.title || widget.config.metric}</span>
                {widget.config.trend && (
                     <span className={`text-[10px] font-bold mt-1 ${widget.config.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {widget.config.trend > 0 ? '+' : ''}{widget.config.trend}% vs mês anterior
                     </span>
                )}
            </div>
        );
    };

    const renderProgressBar = () => {
        const val = data.value || 0;
        const max = widget.config.max || 100;
        const pct = Math.min(100, Math.max(0, (val / max) * 100));
        return (
            <div className="flex flex-col justify-center h-full px-6 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span>{widget.title}</span>
                    <span>{val} / {max}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                    <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-500 flex items-center justify-center" 
                        style={{ width: `${pct}%` }}
                    >
                        {pct > 10 && <span className="text-[9px] text-white font-bold">{Math.round(pct)}%</span>}
                    </div>
                </div>
            </div>
        );
    };

    const renderGauge = () => {
        const val = data.value || 0;
        const max = widget.config.max || 100;
        
        // Simple 180 degree pie chart to simulate gauge
        const gaugeData = [
            { name: 'Value', value: val, fill: COLORS[0] },
            { name: 'Rest', value: max - val, fill: '#e2e8f0' } // slate-200
        ];
        
        return (
            <div className="h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={gaugeData}
                            cx="50%"
                            cy="70%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius="60%"
                            outerRadius="80%"
                            paddingAngle={0}
                            dataKey="value"
                        >
                            {gaugeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-[65%] left-0 w-full text-center">
                    <span className="text-2xl font-black text-slate-700 dark:text-white">{val}</span>
                    <span className="block text-[10px] text-slate-500 font-bold uppercase">/ {max}</span>
                </div>
            </div>
        );
    };

    // Helper for chart data
    const getChartData = () => {
        if (Array.isArray(data)) return data;
        if (data.labels && data.values) {
           return data.labels.map((l, i) => ({ name: l, value: data.values[i], value2: data.values2?.[i] || 0 }));
        }
        return [];
    };
    const chartData = getChartData();

    const renderBar = (layout = 'horizontal', stacked = false) => (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout={layout} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5}/>
                {layout === 'horizontal' ? <XAxis dataKey="name" style={{fontSize: 10}}/> : <XAxis type="number" style={{fontSize: 10}}/>}
                {layout === 'horizontal' ? <YAxis style={{fontSize: 10}}/> : <YAxis dataKey="name" type="category" width={80} style={{fontSize: 10}}/>}
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    cursor={{fill: 'rgba(59, 130, 246, 0.1)'}}
                />
                <Bar dataKey="value" stackId={stacked ? "a" : undefined} fill={COLORS[0]} radius={[4, 4, 0, 0]} barSize={layout==='vertical'? 20 : undefined} />
                {stacked && <Bar dataKey="value2" stackId="a" fill={COLORS[1]} radius={[4, 4, 0, 0]} />}
            </BarChart>
        </ResponsiveContainer>
    );

    const renderLine = (area = false) => {
        const ChartComponent = area ? AreaChart : LineChart;
        return (
            <ResponsiveContainer width="100%" height="100%">
                <ChartComponent data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5}/>
                    <XAxis dataKey="name" style={{fontSize: 10}}/>
                    <YAxis style={{fontSize: 10}}/>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}/>
                    {area && <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0}/>
                        </linearGradient>
                    </defs>}
                    {area 
                       ? <Area type="monotone" dataKey="value" stroke={COLORS[0]} fillOpacity={1} fill="url(#colorVal)" />
                       : <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2} dot={{r: 3}} />
                    }
                </ChartComponent>
            </ResponsiveContainer>
        );
    };

    const renderDonut = () => (
         <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}/>
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{fontSize: '10px'}}/>
            </PieChart>
        </ResponsiveContainer>
    );

    const renderPareto = () => {
        // Sort DESC
        const sortedData = [...chartData].sort((a,b) => b.value - a.value);
        const total = sortedData.reduce((acc, curr) => acc + curr.value, 0);
        let cum = 0;
        const paretoData = sortedData.map(d => {
            cum += d.value;
            return {
                ...d,
                cumulativePercentage: Math.round((cum / total) * 100)
            };
        });

        return (
            <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart data={paretoData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5}/>
                    <XAxis dataKey="name" style={{fontSize: 10}}/>
                    <YAxis yAxisId="left" style={{fontSize: 10}}/>
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" style={{fontSize: 10}}/>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}/>
                    <Bar yAxisId="left" dataKey="value" fill={COLORS[0]} barSize={20} radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" stroke="#ef4444" strokeWidth={2} dot={false} />
                 </ComposedChart>
            </ResponsiveContainer>
        );
    };

    const renderTreemap = () => (
        <ResponsiveContainer width="100%" height="100%">
            <Treemap
                data={chartData} // must be nested for real treemap, but recharts accepts flat array with 'size'
                dataKey="value"
                stroke="#fff"
                fill="#8884d8"
                content={<CustomTreemapContent />}
            />
        </ResponsiveContainer>
    );
    
    // Custom Content for Treemap to add colors
    const CustomTreemapContent = (props) => {
        const { root, depth, x, y, width, height, index, name, value } = props;
        return (
          <g>
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              style={{
                fill: COLORS[index % COLORS.length],
                stroke: '#fff',
                strokeWidth: 2 / (depth + 1e-10),
                strokeOpacity: 1 / (depth + 1e-10),
              }}
            />
            {width > 30 && height > 30 && (
                <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#fff" fontSize={10} fontWeight="bold">
                    {name} ({value})
                </text>
            )}
          </g>
        );
    };

    const renderHeatmap = (isTable = true) => {
        // Expecting data as array of objects
        const list = Array.isArray(data) ? data : (data.items || []);
        
        return (
            <div className="h-full overflow-y-auto no-scrollbar">
                <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase font-bold">
                        <tr>
                            <th className="p-2">Nome</th>
                            <th className="p-2 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {list.map((item, idx) => {
                            const val = item.value || 0;
                            // Simple heatmap logic: Higher value -> more intense color
                            const intensity = Math.min(100, (val / 100) * 100); 
                            const bg = `rgba(59, 130, 246, ${intensity / 100})`;
                            
                            return (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                                    <td className="p-2 font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        {item.name}
                                        {widget.type === 'HEATMAP_LIST' && <ArrowRight size={10} className="text-gray-400"/>}
                                    </td>
                                    <td className="p-2 text-right font-bold" style={{ backgroundColor: bg, color: intensity > 60 ? 'white' : 'inherit' }}>
                                        {val}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderWaterfall = () => {
         // Waterfall logic needs 'start', 'end', 'value'.
         // Simplified: Just showing step changes.
         return <div className="p-4 text-center text-xs text-gray-400">Gráfico Waterfall (Implementação Simplificada)</div>;
    };


    switch (widget.type) {
        case 'SCORECARD': return renderScorecard();
        case 'PROGRESS_BAR': return renderProgressBar();
        case 'GAUGE': return renderGauge();
        case 'BAR_VERTICAL': return renderBar('horizontal');
        case 'BAR_HORIZONTAL': return renderBar('vertical');
        case 'STACKED_BAR': return renderBar('horizontal', true);
        case 'LINE': return renderLine(false);
        case 'AREA': return renderLine(true);
        case 'DONUT': return renderDonut();
        case 'PARETO': return renderPareto();
        case 'TREEMAP': return renderTreemap();
        case 'HEATMAP_TABLE': return renderHeatmap(true);
        case 'HEATMAP_LIST': return renderHeatmap(false);
        case 'WATERFALL': return renderWaterfall();
        default: return <div className="p-4 text-center text-xs text-gray-400">Tipo de widget desconhecido: {widget.type}</div>;
    }
};

export default WidgetRenderer;
