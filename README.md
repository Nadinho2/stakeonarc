# arc-staking-vibe

Full-stack staking dApp starter for Arc blockchain (Circle's stablecoin-native EVM L1).

## Monorepo Structure

```txt
arc-staking-vibe/
├── contracts/      # Foundry + Solidity contracts
├── frontend/       # Next.js 15 + Wagmi + RainbowKit UI
├── backend/        # Optional Express API for off-chain features
├── .env.example
├── .gitignore
└── package.json
```

## Quick Start

1. Copy `.env.example` to `.env` and fill in values.
2. Install backend deps:
   - `cd backend && npm install`
3. Frontend deps are already included in `frontend/package.json`.
4. Build contracts:
   - `npm run build:contracts`
5. Start frontend:
   - `npm run dev:frontend`
6. (Optional) Start backend:
   - `npm run dev:backend`

## Scripts

- `npm run build:contracts` - Compile Solidity contracts with Foundry
- `npm run test:contracts` - Run Foundry tests
- `npm run deploy:contracts:arc-testnet` - Deploy staking contract to Arc Testnet
- `npm run dev:frontend` - Start Next.js app
- `npm run dev:backend` - Start Express API with reload
