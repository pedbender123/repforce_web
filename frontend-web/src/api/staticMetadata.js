
export const STATIC_SCHEMAS = {
    'clientes': {
        fields: [
            { name: 'razao_social', label: 'Razão Social', type: 'text', required: true },
            { name: 'cnpj', label: 'CNPJ', type: 'text' },
            { name: 'status_cadastro', label: 'Status', type: 'select', options: ['Ativo', 'Inativo', 'Prospecção'] },
            { name: 'classificacao_abc', label: 'Classificação ABC', type: 'select', options: ['A', 'B', 'C'] },
            { name: 'vendedor_id', label: 'Vendedor', type: 'lookup', entity: 'users' }
        ]
    },
    'produtos': {
        fields: [
            { name: 'nome', label: 'Nome do Produto', type: 'text', required: true },
            { name: 'sku', label: 'SKU', type: 'text' },
            { name: 'preco_base', label: 'Preço Base', type: 'currency' },
            { name: 'estoque_atual', label: 'Estoque Atual', type: 'number' },
            { name: 'status_estoque', label: 'Status do Estoque', type: 'text', readOnly: true }
        ]
    },
    'pedidos': {
        fields: [
            { name: 'cliente_id', label: 'Cliente', type: 'lookup', entity: 'clientes', required: true },
            { name: 'data_emissao', label: 'Data Emissão', type: 'date', defaultValue: 'today' },
            { name: 'status', label: 'Status', type: 'select', options: ['Rascunho', 'Aguardando Aprovação', 'Aprovado', 'Cancelado'] },
            { name: 'total_final', label: 'Valor Total', type: 'currency', readOnly: true },
            { name: 'valor_desconto', label: 'Desconto (R$)', type: 'currency' }
        ]
    }
};

export const STATIC_PAGES = [
    {
        id: 'clientes',
        name: 'Clientes',
        type: 'list',
        entity_id: 'clientes',
        entityName: 'Clientes',
        layout_config: {
            columns: [
                { field: 'razao_social', title: 'Cliente' },
                { field: 'status_cadastro', title: 'Status' },
                { field: 'classificacao_abc', title: 'ABC' }
            ]
        }
    },
    {
        id: 'produtos',
        name: 'Produtos',
        type: 'list',
        entity_id: 'produtos',
        entityName: 'Produtos',
        layout_config: {
            columns: [
                { field: 'nome', title: 'Produto' },
                { field: 'sku', title: 'SKU' },
                { field: 'estoque_atual', title: 'Estoque' },
                { field: 'status_estoque', title: 'Status' },
                { field: 'preco_base', title: 'Preço' }
            ]
        }
    },
    {
        id: 'pedidos',
        name: 'Pedidos de Venda',
        type: 'list',
        entity_id: 'pedidos',
        entityName: 'Pedidos',
        layout_config: {
            columns: [
                { field: 'id', title: '# ID' },
                { field: 'cliente_id', title: 'Cliente' }, // Mock lookups usually show ID or simple string
                { field: 'status', title: 'Status' },
                { field: 'total_final', title: 'Total' },
                { field: 'fase_funil', title: 'Etapa' }
            ]
        },
        subpages: [
            {
                id: 'ficha',
                name: 'Detalhes do Pedido',
                type: 'ficha_360',
                config: {
                    sections: [
                        {
                            title: "Informações Gerais",
                            fields: ['id', 'status', 'data_emissao', 'cliente_ref']
                        },
                        {
                            title: "Valores",
                            fields: ['total_final', 'valor_desconto', 'fase_funil']
                        }
                    ],
                    related_lists: [
                        {
                            title: "Itens do Pedido",
                            entity_id: "itens_pedido",
                            filter_field: "pedido_id", // Filter itens_pedido where pedido_id = current.id
                            columns: [
                                { field: 'produto_id', title: 'Produto' },
                                { field: 'quantidade', title: 'Qtd' },
                                { field: 'preco_unitario', title: 'Unitário' },
                                { field: 'total', title: 'Total' }
                            ]
                        }
                    ]
                }
            }
        ]
    },
    {
        id: 'orcamentos',
        name: 'Orçamentos',
        type: 'list',
        entity_id: 'pedidos',
        entityName: 'Pedidos',
        layout_config: {
            columns: [
                { field: 'id', title: '# ID' },
                { field: 'cliente_ref', title: 'Cliente' },
                { field: 'total_final', title: 'Total' },
                { field: 'fase_funil', title: 'Status' }
            ]
        }
    },
    {
        id: 'fornecedores',
        name: 'Fornecedores',
        type: 'list',
        entity_id: 'fornecedores',
        entityName: 'Fornecedores',
        layout_config: {
            columns: [
                { field: 'razao_social', title: 'Razão Social' },
                { field: 'cnpj', title: 'CNPJ' },
                { field: 'ativo', title: 'Ativo' }
            ]
        }
    }
];
