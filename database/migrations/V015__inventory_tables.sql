-- V015: Inventory Management Tables
-- Creates tables for medication inventory, warehouse items, transactions, suppliers, and alerts

-- ============================================================================
-- SUPPLIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS suppliers (
  supplier_id SERIAL PRIMARY KEY,
  supplier_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(supplier_name);

CREATE TRIGGER suppliers_set_timestamp
BEFORE UPDATE ON suppliers
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

COMMENT ON TABLE suppliers IS 'Supplier information for inventory items';
COMMENT ON COLUMN suppliers.active IS 'Whether the supplier is currently active';

-- ============================================================================
-- MEDICATION INVENTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS medication_inventory (
  medication_inventory_id SERIAL PRIMARY KEY,
  drug_concept_id INT REFERENCES concept(concept_id) ON DELETE RESTRICT,
  medication_name VARCHAR(255) NOT NULL,
  current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  reorder_level NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'unit',
  cost_per_unit NUMERIC(10, 2) CHECK (cost_per_unit >= 0),
  selling_price_per_unit NUMERIC(10, 2) CHECK (selling_price_per_unit >= 0),
  location VARCHAR(255),
  batch_number VARCHAR(100),
  expiration_date DATE,
  supplier_id INT REFERENCES suppliers(supplier_id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_med_inventory_concept ON medication_inventory(drug_concept_id) WHERE drug_concept_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_med_inventory_supplier ON medication_inventory(supplier_id) WHERE supplier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_med_inventory_active ON medication_inventory(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_med_inventory_stock ON medication_inventory(current_stock, reorder_level);
CREATE INDEX IF NOT EXISTS idx_med_inventory_expiration ON medication_inventory(expiration_date) WHERE expiration_date IS NOT NULL;

CREATE TRIGGER medication_inventory_set_timestamp
BEFORE UPDATE ON medication_inventory
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

COMMENT ON TABLE medication_inventory IS 'Medicine inventory stock levels and details';
COMMENT ON COLUMN medication_inventory.drug_concept_id IS 'Link to concept table for terminology integration (optional)';
COMMENT ON COLUMN medication_inventory.current_stock IS 'Current stock quantity';
COMMENT ON COLUMN medication_inventory.reorder_level IS 'Minimum stock level before reorder alert';
COMMENT ON COLUMN medication_inventory.unit_of_measure IS 'Unit of measure (e.g., unit, box, vial, mg)';

-- ============================================================================
-- WAREHOUSE ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS warehouse_items (
  warehouse_item_id SERIAL PRIMARY KEY,
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  reorder_level NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'unit',
  cost_per_unit NUMERIC(10, 2) CHECK (cost_per_unit >= 0),
  location VARCHAR(255),
  supplier_id INT REFERENCES suppliers(supplier_id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_supplier ON warehouse_items(supplier_id) WHERE supplier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_warehouse_active ON warehouse_items(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_warehouse_category ON warehouse_items(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_warehouse_stock ON warehouse_items(current_stock, reorder_level);

CREATE TRIGGER warehouse_items_set_timestamp
BEFORE UPDATE ON warehouse_items
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

COMMENT ON TABLE warehouse_items IS 'Non-medication inventory items (supplies, equipment, etc.)';
COMMENT ON COLUMN warehouse_items.category IS 'Item category (e.g., Supplies, Equipment)';

-- ============================================================================
-- INVENTORY TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_transactions (
  transaction_id SERIAL PRIMARY KEY,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('medication', 'warehouse')),
  item_id INT NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('incoming', 'outgoing', 'adjustment', 'transfer')),
  quantity NUMERIC(10, 2) NOT NULL,
  reference_type VARCHAR(50),
  reference_id INT,
  notes TEXT,
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_item ON inventory_transactions(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON inventory_transactions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_created ON inventory_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON inventory_transactions(reference_type, reference_id) WHERE reference_id IS NOT NULL;

COMMENT ON TABLE inventory_transactions IS 'Stock movement transactions for inventory items';
COMMENT ON COLUMN inventory_transactions.item_type IS 'Type of item: medication or warehouse';
COMMENT ON COLUMN inventory_transactions.item_id IS 'ID of the medication_inventory or warehouse_items record';
COMMENT ON COLUMN inventory_transactions.transaction_type IS 'Type: incoming (stock in), outgoing (stock out), adjustment (manual), transfer';
COMMENT ON COLUMN inventory_transactions.reference_type IS 'Type of reference (e.g., prescription, order, adjustment)';
COMMENT ON COLUMN inventory_transactions.reference_id IS 'ID of the reference record';

-- ============================================================================
-- INVENTORY ALERTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_alerts (
  alert_id SERIAL PRIMARY KEY,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('medication', 'warehouse')),
  item_id INT NOT NULL,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('low_stock', 'expiring', 'expired', 'overstock')),
  threshold NUMERIC(10, 2),
  current_value NUMERIC(10, 2),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  acknowledged_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_item ON inventory_alerts(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON inventory_alerts(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_alerts_type ON inventory_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON inventory_alerts(created_at DESC);

COMMENT ON TABLE inventory_alerts IS 'Inventory alerts for low stock, expiring items, etc.';
COMMENT ON COLUMN inventory_alerts.item_type IS 'Type of item: medication or warehouse';
COMMENT ON COLUMN inventory_alerts.item_id IS 'ID of the medication_inventory or warehouse_items record';
COMMENT ON COLUMN inventory_alerts.alert_type IS 'Type of alert: low_stock, expiring, expired, overstock';
COMMENT ON COLUMN inventory_alerts.status IS 'Alert status: active, acknowledged, resolved';

-- ============================================================================
-- FUNCTIONS FOR AUTOMATIC STOCK UPDATES
-- ============================================================================

-- Function to update medication inventory stock after transaction
CREATE OR REPLACE FUNCTION update_medication_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.item_type = 'medication' THEN
    IF NEW.transaction_type = 'incoming' THEN
      UPDATE medication_inventory 
      SET current_stock = current_stock + NEW.quantity
      WHERE medication_inventory_id = NEW.item_id;
    ELSIF NEW.transaction_type = 'outgoing' THEN
      UPDATE medication_inventory 
      SET current_stock = GREATEST(0, current_stock - NEW.quantity)
      WHERE medication_inventory_id = NEW.item_id;
    ELSIF NEW.transaction_type = 'adjustment' THEN
      UPDATE medication_inventory 
      SET current_stock = NEW.quantity
      WHERE medication_inventory_id = NEW.item_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update warehouse item stock after transaction
CREATE OR REPLACE FUNCTION update_warehouse_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.item_type = 'warehouse' THEN
    IF NEW.transaction_type = 'incoming' THEN
      UPDATE warehouse_items 
      SET current_stock = current_stock + NEW.quantity
      WHERE warehouse_item_id = NEW.item_id;
    ELSIF NEW.transaction_type = 'outgoing' THEN
      UPDATE warehouse_items 
      SET current_stock = GREATEST(0, current_stock - NEW.quantity)
      WHERE warehouse_item_id = NEW.item_id;
    ELSIF NEW.transaction_type = 'adjustment' THEN
      UPDATE warehouse_items 
      SET current_stock = NEW.quantity
      WHERE warehouse_item_id = NEW.item_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update stock
CREATE TRIGGER trigger_update_medication_stock
AFTER INSERT ON inventory_transactions
FOR EACH ROW
WHEN (NEW.item_type = 'medication')
EXECUTE FUNCTION update_medication_stock();

CREATE TRIGGER trigger_update_warehouse_stock
AFTER INSERT ON inventory_transactions
FOR EACH ROW
WHEN (NEW.item_type = 'warehouse')
EXECUTE FUNCTION update_warehouse_stock();

-- ============================================================================
-- FUNCTION TO CHECK AND CREATE LOW STOCK ALERTS
-- ============================================================================

CREATE OR REPLACE FUNCTION check_low_stock_alerts()
RETURNS void AS $$
BEGIN
  -- Check medication inventory for low stock
  INSERT INTO inventory_alerts (item_type, item_id, alert_type, threshold, current_value, status)
  SELECT 
    'medication',
    medication_inventory_id,
    'low_stock',
    reorder_level,
    current_stock,
    'active'
  FROM medication_inventory
  WHERE active = true
    AND current_stock <= reorder_level
    AND NOT EXISTS (
      SELECT 1 FROM inventory_alerts 
      WHERE item_type = 'medication' 
        AND item_id = medication_inventory_id 
        AND alert_type = 'low_stock' 
        AND status = 'active'
    )
  ON CONFLICT DO NOTHING;

  -- Check warehouse items for low stock
  INSERT INTO inventory_alerts (item_type, item_id, alert_type, threshold, current_value, status)
  SELECT 
    'warehouse',
    warehouse_item_id,
    'low_stock',
    reorder_level,
    current_stock,
    'active'
  FROM warehouse_items
  WHERE active = true
    AND current_stock <= reorder_level
    AND NOT EXISTS (
      SELECT 1 FROM inventory_alerts 
      WHERE item_type = 'warehouse' 
        AND item_id = warehouse_item_id 
        AND alert_type = 'low_stock' 
        AND status = 'active'
    )
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_low_stock_alerts() IS 'Checks for low stock items and creates alerts';

