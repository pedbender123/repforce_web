
export const STATIC_SCHEMAS = {
    'clientes': {
        fields: [
            { name: 'Razao_Social', label: 'Razão Social', type: 'text', required: true },
            { name: 'CNPJ', label: 'CNPJ', type: 'text' },
            { name: 'Status_Cadastro', label: 'Status', type: 'select', options: ['Ativo', 'Inativo', 'Prospecção'] },
            { name: 'Classificacao_ABC', label: 'Classificação ABC', type: 'select', options: ['A', 'B', 'C'] },
            { name: 'Cidade', label: 'Cidade', type: 'text' }
        ]
    },
    'produtos': {
        fields: [
            { name: 'Nome', label: 'Nome do Produto', type: 'text', required: true },
            { name: 'SKU', label: 'SKU', type: 'text' },
            { name: 'Preco_Base', label: 'Preço Base', type: 'currency' },
            { name: 'Estoque_Atual', label: 'Estoque Atual', type: 'number' },
            { name: 'Status_Estoque', label: 'Status do Estoque', type: 'text', readOnly: true }
        ]
    },
    'pedidos': {
        fields: [
            { name: 'Cliente_Ref', label: 'Cliente', type: 'text', required: true },
            { name: 'Numero_Controle', label: 'Nº Controle', type: 'text', readOnly: true },
            { name: 'Data_Emissao', label: 'Data Emissão', type: 'date', defaultValue: 'today' },
            { name: 'Status', label: 'Status', type: 'select', options: ['Rascunho', 'Aguardando Aprovação', 'Aprovado', 'Cancelado'] },
            { name: 'Total_Final', label: 'Valor Total', type: 'currency', readOnly: true },
            { name: 'Valor_Desconto', label: 'Desconto (R$)', type: 'currency' },
            { name: 'Fase_Funil', label: 'Fase', type: 'text' }
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
                { field: 'Razao_Social', title: 'Cliente' },
                { field: 'Status_Cadastro', title: 'Status' },
                { field: 'Classificacao_ABC', title: 'ABC' },
                { field: 'Cidade', title: 'Cidade' }
            ]
        },
        subpages: [
            {
                id: 'ficha',
                name: 'Ficha Cadastral',
                type: 'ficha_360',
                config: {
                    sections: [
                        {
                            title: "Dados Principais",
                            fields: ['Razao_Social', 'CNPJ', 'Status_Cadastro', 'Classificacao_ABC']
                        },
                        {
                            title: "Localização",
                            fields: ['Cidade', 'UF']
                        }
                    ]
                }
            }
        ]
    },
    {
        id: 'produtos',
        name: 'Produtos',
        type: 'list',
        entity_id: 'produtos',
        entityName: 'Produtos',
        layout_config: {
            columns: [
                { field: 'Nome', title: 'Produto' },
                { field: 'SKU', title: 'SKU' },
                { field: 'Estoque_Atual', title: 'Estoque' },
                { field: 'Status_Estoque', title: 'Status' },
                { field: 'Preco_Base', title: 'Preço' }
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
                { field: 'Numero_Controle', title: '# ID' },
                { field: 'Cliente_Ref', title: 'Cliente' },
                { field: 'Status', title: 'Status' },
                { field: 'Total_Final', title: 'Total' },
                { field: 'Fase_Funil', title: 'Etapa' }
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
                            fields: ['Numero_Controle', 'Status', 'Data_Emissao', 'Cliente_Ref']
                        },
                        {
                            title: "Valores",
                            fields: ['Total_Final', 'Fase_Funil']
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
                { field: 'Numero_Controle', title: '# ID' },
                { field: 'Cliente_Ref', title: 'Cliente' },
                { field: 'Total_Final', title: 'Total' },
                { field: 'Fase_Funil', title: 'Status' }
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
                { field: 'Razao_Social', title: 'Razão Social' },
                { field: 'CNPJ', title: 'CNPJ' },
                { field: 'Ativo', title: 'Ativo' }
            ]
        }
    }
];
