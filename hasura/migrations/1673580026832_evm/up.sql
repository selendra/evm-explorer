CREATE TYPE public.contracttype AS ENUM (
    'ERC20',
    'ERC721',
    'ERC1155',
    'other'
);

CREATE TABLE IF NOT EXISTS evm_block (  
  block_number BIGINT NOT NULL,
  block_author TEXT NOT NULL,
  block_hash TEXT NOT NULL,
  parent_hash TEXT NOT NULL,
  size BIGINT NOT NULL,
  total_transactions INT NOT NULL,
  gas_used NUMERIC(30,0) NOT NULL,
  gas_limit NUMERIC(30,0) NOT NULL,
  state_root TEXT,
  transactionsRoot TEXT,
  fee_recipient TEXT,
  extra_data TEXT,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number )
);

CREATE TABLE IF NOT EXISTS evm_account  (  
  account_id TEXT NOT NULL,
  balances NUMERIC(40,0) NOT NULL,
  block_height BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( account_id )  
);

CREATE TABLE IF NOT EXISTS smart_contract  (  
  address TEXT NOT NULL,
  bytecode NUMERIC(40,0) NOT NULL,
  type public.contracttype DEFAULT 'other'::public.contracttype,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( address )  
);

CREATE TABLE IF NOT EXISTS evm_transaction  (  
  transactio_hash TEXT NOT NULL,
  transactio_index INT NOT NULL,
  transactio_status BOOLEAN NOT NULL,
  block_height BIGINT NOT NULL,
  transaction_from TEXT NOT NULL,
  transaction_to TEXT NOT NULL,
  amount NUMERIC(40,0) NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( transactio_hash )  
);

-- Evm Block
START TRANSACTION;
CREATE FUNCTION evm_block_count() RETURNS trigger LANGUAGE plpgsql AS
$$BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE total SET count = count + 1 WHERE name = 'evm_blocks';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE total SET count = count - 1 WHERE name = 'evm_blocks';
    RETURN OLD;
  ELSE
    UPDATE total SET count = 0 WHERE name = 'evm_blocks';
    RETURN NULL;
  END IF;
END;$$;
CREATE CONSTRAINT TRIGGER evm_block_count_mod
  AFTER INSERT OR DELETE ON evm_block
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE PROCEDURE evm_block_count();
-- TRUNCATE triggers must be FOR EACH STATEMENT
CREATE TRIGGER evm_block_count_trunc AFTER TRUNCATE ON evm_block
  FOR EACH STATEMENT EXECUTE PROCEDURE evm_block_count();
-- initialize the counter table
UPDATE total SET count = (SELECT count(*) FROM evm_block) WHERE name = 'evm_blocks';
COMMIT;

-- Evm transaction
START TRANSACTION;
CREATE FUNCTION evm_transaction_count() RETURNS trigger LANGUAGE plpgsql AS
$$BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE total SET count = count + 1 WHERE name = 'evm_transactions';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE total SET count = count - 1 WHERE name = 'evm_transactions';
    RETURN OLD;
  ELSE
    UPDATE total SET count = 0 WHERE name = 'evm_transactions';
    RETURN NULL;
  END IF;
END;$$;
CREATE CONSTRAINT TRIGGER evm_transaction_count_mod
  AFTER INSERT OR DELETE ON evm_transaction
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE PROCEDURE evm_transaction_count();
-- TRUNCATE triggers must be FOR EACH STATEMENT
CREATE TRIGGER evm_transaction_count_trunc AFTER TRUNCATE ON evm_transaction
  FOR EACH STATEMENT EXECUTE PROCEDURE evm_transaction_count();
-- initialize the counter table
UPDATE total SET count = (SELECT count(*) FROM evm_transaction) WHERE name = 'evm_transactions';
COMMIT;
