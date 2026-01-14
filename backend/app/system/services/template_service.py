from sqlalchemy.orm import Session
from app.engine.metadata import models as models_meta
from app.system import models as models_system
from app.system.services.schema_manager import SchemaManager
import json

class TemplateService:
    @staticmethod
    def create_snapshot(db: Session, tenant_id: str, name: str, description: str = None) -> models_system.TenantTemplate:
        """
        Creates a JSON snapshot of the tenant's metadata and saves it as a TenantTemplate.
        """
        
        # 1. Fetch Entities & Fields
        entities = db.query(models_meta.MetaEntity).filter(models_meta.MetaEntity.tenant_id == tenant_id).all()
        entities_data = []
        for ent in entities:
            fields = []
            for field in ent.fields:
                fields.append({
                    "name": field.name,
                    "label": field.label,
                    "type": field.field_type,
                    "is_required": field.is_required,
                    "options": field.options,
                    "formula": field.formula,
                    "is_virtual": field.is_virtual
                })
            
            entities_data.append({
                "slug": ent.slug,
                "display_name": ent.display_name,
                "icon": ent.icon,
                "layout_config": ent.layout_config,
                "fields": fields
            })

        # 2. Fetch Navigation & Pages
        nav_groups = db.query(models_meta.MetaNavigationGroup).filter(models_meta.MetaNavigationGroup.tenant_id == tenant_id).all()
        navigation_data = []
        for group in nav_groups:
            pages = []
            for page in group.pages:
                entity_slug = None
                if page.entity_id:
                    # Resolve Entity ID to Slug (Portable)
                    page_ent = db.query(models_meta.MetaEntity).filter(models_meta.MetaEntity.id == page.entity_id).first()
                    if page_ent:
                         entity_slug = page_ent.slug

                pages.append({
                    "name": page.name,
                    "type": page.type,
                    "entity_slug": entity_slug,
                    "layout_config": page.layout_config,
                    "tabs_config": page.tabs_config,
                    "order": page.order
                })
            
            navigation_data.append({
                "name": group.name,
                "icon": group.icon,
                "order": group.order,
                "pages": pages
            })

        # 3. Fetch Actions
        actions = db.query(models_meta.MetaAction).filter(models_meta.MetaAction.tenant_id == tenant_id).all()
        actions_data = []
        for action in actions:
            # If action triggers context is entity ID, we need to convert to slug?
            # Action Context handling is complex if it uses IDs.
            # Ideally Actions should link to Slugs or generic references.
            # For now, we assume direct copy, but ID references will break.
            # TODO: Improve ID sanitation.
            actions_data.append({
                "name": action.name,
                "action_type": action.action_type,
                "trigger_source": action.trigger_source,
                "trigger_context": action.trigger_context, # Might need re-mapping
                "config": action.config
            })

        # 4. Fetch Trails
        trails = db.query(models_meta.MetaTrail).filter(models_meta.MetaTrail.tenant_id == tenant_id).all()
        trails_data = []
        for trail in trails:
            trails_data.append({
                "name": trail.name,
                "description": trail.description,
                "trigger_type": trail.trigger_type,
                "trigger_config": trail.trigger_config,
                "nodes": trail.nodes
            })

        # Assemble Full Structure
        snapshot_data = {
            "version": "2.0",
            "entities": entities_data,
            "navigation": navigation_data,
            "actions": actions_data,
            "trails": trails_data
        }

        # Save to DB
        template = models_system.TenantTemplate(
            name=name,
            description=description,
            structure_json=snapshot_data,
            is_public=True
        )
        db.add(template)
        db.commit()
        db.refresh(template)
        return template

    @staticmethod
    def apply_template(db: Session, tenant_id: str, template_data: dict):
        """
        Applies a JSON template to a specific tenant.
        Creates Tables, Columns, Pages, Menus, etc.
        """
        import uuid
        
        # 0. Get Tenant Info (for schema name)
        tenant = db.query(models_system.Tenant).filter(models_system.Tenant.id == tenant_id).first()
        schema_name = f"tenant_{tenant.slug.replace('-', '_')}"

        # 1. Create Entities & Fields
        entity_map = {} # Slug -> New ID
        
        for entity_def in template_data.get("entities", []):
            new_entity = models_meta.MetaEntity(
                tenant_id=tenant_id,
                slug=entity_def["slug"],
                display_name=entity_def["display_name"],
                icon=entity_def.get("icon", "Database"),
                layout_config=entity_def.get("layout_config", {})
            )
            db.add(new_entity)
            db.commit()
            db.refresh(new_entity)
            entity_map[new_entity.slug] = new_entity.id

            # Create Physical Table
            SchemaManager.create_table(schema_name, new_entity.slug)

            # Create Fields
            for field_def in entity_def.get("fields", []):
                new_field = models_meta.MetaField(
                    entity_id=new_entity.id,
                    name=field_def["name"],
                    label=field_def["label"],
                    field_type=field_def["type"],
                    is_required=field_def.get("is_required", False),
                    options=field_def.get("options", []),
                    formula=field_def.get("formula"),
                    is_virtual=field_def.get("is_virtual", False)
                )
                db.add(new_field)
                
                # Physical Column (Only if not virtual)
                if not new_field.is_virtual:
                    SchemaManager.add_column(
                        schema_name, 
                        new_entity.slug, 
                        field_def["name"], 
                        field_def["type"], 
                        field_def.get("is_required", False)
                    )
            
            db.commit()

        # 2. Navigation
        for group_def in template_data.get("navigation", []):
            new_group = models_meta.MetaNavigationGroup(
                tenant_id=tenant_id,
                name=group_def["name"],
                icon=group_def.get("icon", "Folder"),
                order=group_def.get("order", 0)
            )
            db.add(new_group)
            db.commit()
            db.refresh(new_group)

            for page_def in group_def.get("pages", []):
                # Resolve Entity Slug to new ID
                ent_id = None
                if page_def.get("entity_slug"):
                    ent_id = entity_map.get(page_def["entity_slug"])
                
                new_page = models_meta.MetaPage(
                    group_id=new_group.id,
                    entity_id=ent_id,
                    name=page_def["name"],
                    type=page_def["type"],
                    layout_config=page_def.get("layout_config", {}),
                    tabs_config=page_def.get("tabs_config", {}),
                    order=page_def.get("order", 0)
                )
                db.add(new_page)
            db.commit()

        # 3. Actions (Basic Copy)
        for action_def in template_data.get("actions", []):
            new_action = models_meta.MetaAction(
                tenant_id=tenant_id,
                trigger_source=action_def["trigger_source"],
                trigger_context=action_def["trigger_context"], # WARNING: If this is an ID, it breaks. Assuming slugs or handled elsewhere.
                name=action_def["name"],
                action_type=action_def["action_type"],
                config=action_def.get("config", {})
            )
            db.add(new_action)
        db.commit()

        # 4. Trails
        for trail_def in template_data.get("trails", []):
            new_trail = models_meta.MetaTrail(
                tenant_id=tenant_id,
                name=trail_def["name"],
                description=trail_def.get("description"),
                trigger_type=trail_def["trigger_type"],
                trigger_config=trail_def.get("trigger_config", {}),
                nodes=trail_def.get("nodes", {})
            )
            db.add(new_trail)
        db.commit()
