GRANT ALL PRIVILEGES ON DATABASE selendra TO selendra;

CREATE TABLE IF NOT EXISTS substrate_block (  
  block_number BIGINT NOT NULL,
  finalized BOOLEAN NOT NULL,
  block_author TEXT NOT NULL,
  block_author_name TEXT NOT NULL,
  block_hash TEXT NOT NULL,
  parent_hash TEXT NOT NULL,
  extrinsics_root TEXT NOT NULL,
  state_root TEXT NOT NULL,
  active_era BIGINT NOT NULL,
  current_index BIGINT NOT NULL,
  spec_version INT NOT NULL,
  total_events INT NOT NULL,
  total_extrinsics INT NOT NULL,
  total_issuance NUMERIC(40,0) NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number )
);

CREATE TABLE IF NOT EXISTS evm_block (  
  block_number BIGINT NOT NULL,
  block_author TEXT NOT NULL,
  block_hash TEXT NOT NULL,
  parent_hash TEXT NOT NULL,
  size BIGINT NOT NULL,
  total_transactions INT NOT NULL,
  transaction_list TEXT[] NOT NULL,
  gas_used NUMERIC(30,0) NOT NULL,
  gas_limit NUMERIC(30,0) NOT NULL,
  state_root TEXT,
  transactionsRoot TEXT,
  fee_recipient TEXT,
  extra_data TEXT,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number )
);

CREATE TABLE IF NOT EXISTS harvest_error (  
  block_number BIGINT NOT NULL,
  error TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number )
);
