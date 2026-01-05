import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import {
  ShoppingCartIcon,
  UserIcon,
  CheckIcon,
  TrashIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function AppOrderCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Steps: 1-Client, 2-Products, 3-Review
  const [step, setStep] = useState(1);

  // Form State
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // Client Search
  const [productSearch, setProductSearch] = useState(''); // Product Search

  // Cart State: { productId: quantity }
  const [cart, setCart] = useState({});

  // Cart Summary (from API)
  const [cartSummary, setCartSummary] = useState(null);

  // --- DATA FETCHING ---
  const { data: clients } = useQuery(['clients'], async () => {
    const res = await apiClient.get('/crm/clients');
    return res.data;
  });

  const { data: products } = useQuery(['products'], async () => {
    const res = await apiClient.get('/crm/products');
    return res.data;
  });

  const previewMutation = useMutation(async (cartItems) => {
    // cartItems: [{product_id, quantity}]
    const res = await apiClient.post('/crm/orders/preview', cartItems);
    return res.data; // CartSummary
  }, {
    onSuccess: (data) => setCartSummary(data)
  });

  const createOrderMutation = useMutation(async (payload) => {
    const res = await apiClient.post('/crm/orders', payload);
    return res.data;
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      alert('Pedido enviado com sucesso!');
      navigate('/app/orders');
    },
    onError: (err) => alert("Erro ao criar pedido: " + (err.response?.data?.detail || err.message))
  });

  // --- EFFECT: Debounce Preview ---
  useEffect(() => {
    const timer = setTimeout(() => {
      const items = Object.entries(cart)
        .map(([pid, qty]) => ({ product_id: parseInt(pid), quantity: parseInt(qty) }))
        .filter(i => i.quantity > 0);

      if (items.length > 0) {
        previewMutation.mutate(items);
      } else {
        setCartSummary(null);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [cart]);

  // --- HANDLERS ---
  const handleProductChange = (productId, qty) => {
    setCart(prev => ({
      ...prev,
      [productId]: Math.max(0, parseInt(qty) || 0)
    }));
  };

  const handleSubmit = () => {
    if (!selectedClient) return alert('Selecione um cliente');
    if (!cartSummary || cartSummary.items.length === 0) return alert('Carrinho vazio');

    const items = cartSummary.items.map(i => ({
      product_id: i.product_id,
      quantity: i.quantity
    }));

    createOrderMutation.mutate({
      client_id: selectedClient.id,
      items: items,
      notes: "Pedido via Web App"
      // custom_attributes se necessário
    });
  };

  // --- RENDERERS ---
  const renderClientSelection = () => {
    const filtered = clients?.filter(c =>
      c.fantasy_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cnpj?.includes(searchTerm)
    );

    return (
      <div className="space-y-4">
        <input
          className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Buscar cliente..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {filtered?.map(client => (
            <div
              key={client.id}
              onClick={() => { setSelectedClient(client); setStep(2); }}
              className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer bg-white dark:bg-gray-800 dark:border-gray-700 transition"
            >
              <h3 className="font-bold dark:text-white">{client.fantasy_name}</h3>
              <p className="text-sm text-gray-500">{client.cnpj}</p>
              <p className="text-sm text-gray-500">{client.city} - {client.state}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProductSelection = () => {
    const filtered = products?.filter(p =>
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.code?.includes(productSearch)
    );

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700">← Voltar</button>
          <div className="flex-1 text-center font-medium dark:text-white">
            Cliente: {selectedClient?.fantasy_name}
          </div>
        </div>

        <input
          className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Buscar produtos..."
          value={productSearch}
          onChange={e => setProductSearch(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          {filtered?.map(product => (
            <div key={product.id} className="p-4 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 flex flex-col justify-between">
              <div>
                <h4 className="font-semibold dark:text-white">{product.name}</h4>
                <p className="text-sm text-gray-500">Ref: {product.code}</p>
                <p className="text-lg font-bold text-blue-600">{formatMoney(product.price)}</p>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <label className="text-sm dark:text-gray-300">Qtd:</label>
                <input
                  type="number"
                  min="0"
                  className="w-20 p-2 border rounded text-center dark:bg-gray-700 dark:text-white"
                  value={cart[product.id] || ''}
                  onChange={(e) => handleProductChange(product.id, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCartReview = () => {
    if (!cartSummary) return <div className="text-center p-4">Calculando...</div>;

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold dark:text-white">Resumo do Pedido</h2>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3 text-right">Qtd</th>
                <th className="px-4 py-3 text-right">Unit. Liq</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {cartSummary.items.map(item => (
                <tr key={item.product_id}>
                  <td className="px-4 py-3 dark:text-white">
                    {item.name}
                    {item.rule_applied && (
                      <span className="block text-xs text-green-600">Regra: {item.rule_applied}</span>
                    )}
                    {item.discount_value > 0 && (
                      <span className="block text-xs text-gray-400 line-through">{formatMoney(item.unit_price)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right dark:text-gray-300">{item.quantity}</td>
                  <td className="px-4 py-3 text-right dark:text-gray-300">{formatMoney(item.net_unit_price)}</td>
                  <td className="px-4 py-3 text-right font-medium dark:text-white">{formatMoney(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-gray-700 font-bold">
              <tr>
                <td colSpan="3" className="px-4 py-3 text-right">Subtotal Bruto</td>
                <td className="px-4 py-3 text-right">{formatMoney(cartSummary.total_gross)}</td>
              </tr>
              {cartSummary.total_discount > 0 && (
                <tr className="text-green-600">
                  <td colSpan="3" className="px-4 py-3 text-right">Descontos</td>
                  <td className="px-4 py-3 text-right">-{formatMoney(cartSummary.total_discount)}</td>
                </tr>
              )}
              <tr className="text-lg">
                <td colSpan="3" className="px-4 py-3 text-right">Total Líquido</td>
                <td className="px-4 py-3 text-right">{formatMoney(cartSummary.total_net)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setStep(2)}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Alterar Itens
          </button>
          <button
            onClick={handleSubmit}
            disabled={createOrderMutation.isLoading}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow font-bold flex justify-center items-center"
          >
            {createOrderMutation.isLoading ? 'Enviando...' : 'Finalizar Pedido'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 p-4 max-w-7xl mx-auto">
      {/* Left Panel: Steps */}
      <div className="md:w-2/3 flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="mb-6 flex items-center gap-4">
          <h1 className="text-2xl font-bold dark:text-white">Novo Pedido</h1>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            Passo {step} de 3
          </span>
        </div>

        {step === 1 && renderClientSelection()}
        {step === 2 && renderProductSelection()}
        {step === 3 && renderCartReview()}
      </div>

      {/* Right Panel: Floating Cart Summary (Desktop) or Bottom Bar (Mobile) */}
      <div className="md:w-1/3 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 flex-col hidden md:flex">
        <div className="flex items-center gap-2 text-lg font-bold mb-4 dark:text-white">
          <ShoppingCartIcon className="w-6 h-6" />
          Resumo
        </div>

        {!selectedClient ? (
          <p className="text-gray-500 text-sm">Selecione um cliente para iniciar.</p>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
              <p className="font-bold dark:text-white">Cliente</p>
              <p className="truncate dark:text-gray-300">{selectedClient.fantasy_name}</p>
            </div>

            <div className="flex-1">
              {/* Mini items list */}
              {cartSummary && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Itens</span>
                    <span className="font-medium dark:text-white">{cartSummary.items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Econômia</span>
                    <span className="font-medium">{formatMoney(cartSummary.total_discount)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between text-xl font-bold dark:text-white">
                    <span>Total</span>
                    <span>{formatMoney(cartSummary.total_net)}</span>
                  </div>
                </div>
              )}
            </div>

            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                disabled={!cartSummary || cartSummary.items.length === 0}
                className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Revisar Pedido →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Bar */}
      {step === 2 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t p-4 flex justify-between items-center shadow-lg z-50">
          <div>
            <p className="text-xs text-gray-500">Total Estimado</p>
            <p className="font-bold text-lg dark:text-white">{cartSummary ? formatMoney(cartSummary.total_net) : 'R$ 0,00'}</p>
          </div>
          <button
            onClick={() => setStep(3)}
            disabled={!cartSummary || cartSummary.items.length === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 disabled:opacity-50"
          >
            Revisar
          </button>
        </div>
      )}
    </div>
  );
}