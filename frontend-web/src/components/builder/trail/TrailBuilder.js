import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
    Controls, 
    Background, 
    applyNodeChanges, 
    applyEdgeChanges,
    Handle, 
    Position,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Zap, Database, Code, Mail, GitBranch, ArrowDown, Play, Save } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import FormulaEditorModal from '../FormulaEditorModal';

// --- VISUAL NODES ---

const TriggerNode = ({ data }) => {
    return (
        <div className="w-64 bg-slate-900 border-2 border-slate-700 rounded-xl shadow-xl p-3 relative group">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-500 rounded-lg text-white shadow-lg shadow-yellow-500/20">
                    <Zap size={20} fill="currentColor" />
                </div>
                <div>
                    <div className="text-xs font-bold text-yellow-500 tracking-wider">GATILHO</div>
                    <div className="text-sm font-bold text-white">{data.label}</div>
                </div>
            </div>
            
            <div className="text-[10px] text-slate-400 bg-slate-800 p-2 rounded border border-slate-700 font-mono overflow-hidden whitespace-nowrap text-ellipsis">
                {JSON.stringify(data.config || {}, null, 2)}
            </div>
            
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-yellow-500 border-2 border-slate-900" />
        </div>
    );
};

const ActionNode = ({ data }) => {
    const icons = { 'DB_UPDATE': Database, 'SCRIPT': Code, 'EMAIL': Mail };
    const Icon = icons[data.actionType] || Code;
    
    return (
        <div className="w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-shadow p-3 relative group">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500 border-2 border-white dark:border-slate-800" />
            
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Icon size={18} />
                </div>
                <div className="flex-1">
                    <div className="text-xs font-bold text-slate-400 uppercase">{data.actionType}</div>
                    <div className="text-sm font-bold text-slate-700 dark:text-white truncate">{data.label}</div>
                </div>
            </div>

            <button 
                className="w-full text-xs bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 py-1.5 rounded border border-slate-100 dark:border-slate-700 transition-colors"
                onClick={data.onEdit}
            >
                Configurar Ação
            </button>
            
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-2 border-white dark:border-slate-800" />
            
            {/* Add Button Placeholder - Logic to insert node below */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                    onClick={data.onAddNext}
                    className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-blue-500 rounded-full hover:scale-110 transition-transform"
                >
                    <Plus size={14} />
                </button>
            </div>
        </div>
    );
};

const DecisionNode = ({ data }) => {
    return (
        <div className="w-64 bg-white dark:bg-slate-800 border-2 border-orange-200 dark:border-orange-900/50 rounded-xl shadow-sm p-3 relative group">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-orange-500" />
            
            <div className="flex items-center gap-3 mb-2 justify-center">
                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                    <GitBranch size={16} />
                </div>
                <div className="font-bold text-slate-700 dark:text-white text-sm">Decisão (IF)</div>
            </div>
            
            <div 
                className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded p-2 text-xs font-mono text-center text-orange-700 dark:text-orange-400 cursor-pointer hover:bg-orange-100 transition-colors"
                onClick={data.onEdit}
            >
                {data.condition || "Configurar Condição..."}
            </div>
            
            <div className="flex justify-between mt-3 px-2">
                <div className="text-[10px] font-bold text-green-600 uppercase">Verdadeiro</div>
                <div className="text-[10px] font-bold text-red-600 uppercase">Falso</div>
            </div>

            <Handle type="source" position={Position.Bottom} id="true" style={{ left: '25%' }} className="w-3 h-3 bg-green-500" />
            <Handle type="source" position={Position.Bottom} id="false" style={{ left: '75%' }} className="w-3 h-3 bg-red-500" />
        </div>
    );
};

const nodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
    decision: DecisionNode,
};

// --- MAIN BUILDER COMPONENT ---

import TrailNodeEditor from './TrailNodeEditor';

// --- MAIN BUILDER COMPONENT ---

const TrailBuilder = ({ trailId, onBack }) => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [trailData, setTrailData] = useState(null);
    
    // Editor States
    const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
    const [isNodeEditorOpen, setIsNodeEditorOpen] = useState(false);
    
    const [editingNodeId, setEditingNodeId] = useState(null);
    const [editingNodeData, setEditingNodeData] = useState(null); // Full node object for Editor
    const [currentFormula, setCurrentFormula] = useState('');
    const [editingProperty, setEditingProperty] = useState(null); // 'condition' only for Decision
    
    useEffect(() => {
        loadTrail();
    }, [trailId]);

    const loadTrail = async () => {
        if (!trailId) return; 
        try {
            const { data } = await apiClient.get(`/api/builder/trails/${trailId}`);
            setTrailData(data);
            reconstructGraph(data.nodes);
        } catch (error) {
            console.error("Error loading trail", error);
        }
    };

    const reconstructGraph = (nodesMap) => {
        if (!nodesMap) {
            const triggerId = 'trigger_0';
            setNodes([{ 
                id: triggerId, 
                type: 'trigger', 
                position: { x: 250, y: 0 }, 
                data: { label: 'Início Manual', config: {} } 
            }]);
            return;
        }

        const flowNodes = [];
        const flowEdges = [];
        const yGap = 150;
        
        const traverse = (nodeId, x, y) => {
            const nodeData = nodesMap[nodeId];
            if (!nodeData) return;

            const existing = flowNodes.find(n => n.id === nodeId);
            if (existing) return;

            // We pass the FULL node data to the visualization so it can pass it back to editor
            flowNodes.push({
                id: nodeId,
                type: nodeData.type.toLowerCase(),
                position: { x, y },
                data: { 
                    label: nodeData.name || nodeData.type,
                    actionType: nodeData.action_type,
                    condition: nodeData.config?.condition,
                    config: nodeData.config || {}, // Ensure config object exists
                    // Pass wrapper function that sends ID and current Node State
                    onEdit: () => openEditor(nodeId, nodeData), // We'll need to fetch latest state from `nodes` state in openEditor really, but this works for init
                    onAddNext: () => addNode(nodeId)
                }
            });

            if (nodeData.type === 'DECISION') {
                if (nodeData.next_true) {
                    flowEdges.push({ id: `e${nodeId}-true`, source: nodeId, target: nodeData.next_true, sourceHandle: 'true', animated: true, label: 'Sim' });
                    traverse(nodeData.next_true, x - 150, y + yGap);
                }
                if (nodeData.next_false) {
                    flowEdges.push({ id: `e${nodeId}-false`, source: nodeId, target: nodeData.next_false, sourceHandle: 'false', animated: true, label: 'Não' });
                    traverse(nodeData.next_false, x + 150, y + yGap);
                }
            } else {
                if (nodeData.next_node_id) {
                    flowEdges.push({ id: `e${nodeId}-${nodeData.next_node_id}`, source: nodeId, target: nodeData.next_node_id, animated: true });
                    traverse(nodeData.next_node_id, x, y + yGap);
                }
            }
        };

        let startId = Object.keys(nodesMap).find(k => nodesMap[k].type === 'TRIGGER') || Object.keys(nodesMap)[0];
        if (startId) traverse(startId, 250, 50);

        setNodes(flowNodes);
        setEdges(flowEdges);
    };

    const openEditor = (nodeId, initialData) => {
        // Find the LATEST node data from state, as initialData in closure might be stale
        const liveNode = nodes.find(n => n.id === nodeId);
        const nodeToEdit = liveNode || { id: nodeId, data: initialData }; // Fallback
        
        setEditingNodeId(nodeId);
        setEditingNodeData(nodeToEdit);

        if (initialData.type === 'DECISION') {
            // Decision uses Formula Editor directly for Condition
            setEditingProperty('condition');
            setCurrentFormula(liveNode?.data?.condition || initialData.config?.condition || '');
            setIsFormulaModalOpen(true);
        } else if (initialData.type === 'ACTION') {
            // Actions use the new Node Editor
            setIsNodeEditorOpen(true);
        }
    };

    const handleSaveNode = (nodeId, newData) => {
        setNodes(nds => nds.map(n => {
            if (n.id === nodeId) {
                return { ...n, data: { ...n.data, ...newData } };
            }
            return n;
        }));
        setIsNodeEditorOpen(false);
    };

    const handleSaveFormula = (newVal) => {
         setNodes(nds => nds.map(n => {
            if (n.id === editingNodeId) {
                return { ...n, data: { ...n.data, condition: newVal } };
            }
            return n;
        }));
        setIsFormulaModalOpen(false);
    };

    const addNode = (parentId) => {
        // Placeholder
    };

    const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

    // Helper to get previous nodes for the Source Selector
    // In a tree, this is tricky, just linear for now or all nodes
    // Ideally we traverse graph backwards. For MVP, we just pass ALL nodes except self.
    const getPotentialContextNodes = () => {
        return nodes.filter(n => n.id !== editingNodeId && n.type === 'action'); // Only actions produce IDs typically
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button 
                            onClick={onBack}
                            className="p-2 -ml-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full transition-colors"
                        >
                             <ArrowDown className="rotate-90" size={20} />
                        </button>
                    )}
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <GitBranch size={20} className="text-blue-500" />
                            {trailData?.name || "Nova Trilha"}
                        </h1>
                        <p className="text-xs text-slate-400">Editor Visual de Fluxo</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-blue-500/20 transition-all">
                        <Save size={16} /> Salvar Trilha
                    </button>
                    <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-green-500/20 transition-all">
                        <Play size={16} /> Testar
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-right"
                    className="bg-slate-50 dark:bg-slate-950"
                >
                    <Background color="#94a3b8" gap={20} size={1} />
                    <Controls />
                </ReactFlow>
            </div>

            {/* Modals */}
            
            {/* 1. Formula Editor for Decisions */}
            <FormulaEditorModal 
                isOpen={isFormulaModalOpen}
                onClose={() => setIsFormulaModalOpen(false)}
                formula={currentFormula}
                onSave={handleSaveFormula}
            />

            {/* 2. New Node Editor for Actions */}
            <TrailNodeEditor 
                isOpen={isNodeEditorOpen}
                onClose={() => setIsNodeEditorOpen(false)}
                node={editingNodeData}
                previousNodes={getPotentialContextNodes()} // Passing all actions as candidates for now
                onSave={handleSaveNode}
            />
        </div>
    );
};

export default TrailBuilder;
