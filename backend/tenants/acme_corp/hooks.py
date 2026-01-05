def before_create(entity_name, data, request):
    """
    Exemplo de hook customizado para a ACME Corp.
    Intercepta qualquer criação de registro e adiciona uma marca d'água no nome.
    """
    if "name" in data:
        data["name"] = f"{data['name']} [ACME BRAND]"
    
    # Exemplo de logging customizado por tenant
    print(f"LOG CUSTOMIZADO: ACME Corp criou um registro em {entity_name}")
    
    return data

def before_list(entity_name, request):
    # Pode ser usado para injetar filtros obrigatórios por tenant
    pass
