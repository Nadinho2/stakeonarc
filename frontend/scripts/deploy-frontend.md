# Deploy the Vibe Staking frontend

// VIBE: Step-by-step for First Sons Academy — from zero to a live dApp on Vercel.

## 1. WalletConnect Project ID

1. Open [https://cloud.walletconnect.com](https://cloud.walletconnect.com) and sign in (or create an account).
2. Create a **New Project**, pick a name (e.g. `vibe-staking-arc`).
3. Copy the **Project ID** (a UUID string).
4. Put it in `frontend/.env.local` as `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...`.

// VIBE: This ID powers RainbowKit’s mobile + WalletConnect flows — keep it public (it is not a secret).

## 2. Deploy contracts with Foundry

From the monorepo `contracts/` folder:

```bash
cd contracts
forge build
forge test
```

// VIBE: Deploy with your own script — example pattern:

```bash
forge script script/YourScript.s.sol:YourScript --rpc-url $ARC_TESTNET_RPC --private-key $PRIVATE_KEY --broadcast
```

After deployment, copy:

- **VibeToken** address  
- **VibeStaking** address  

Paste them into `frontend/.env.local`:

```env
NEXT_PUBLIC_VIBE_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_VIBE_STAKING_ADDRESS=0x...
```

// VIBE: If your ABI changes, copy `out/VibeToken.sol/VibeToken.json` (and VibeStaking) into `frontend/contracts/abi/` or update the JSON ABI files there so the frontend stays in sync.

## 3. Arc Testnet RPC

Use the public RPC (or your own):

```env
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
```

Optional explorer override (defaults are already set in code):

```env
NEXT_PUBLIC_ARC_EXPLORER_URL=https://testnet.arcscan.app
```

## 4. Run locally

```bash
cd frontend
cp .env.local.example .env.local
# edit .env.local — add WalletConnect ID + contract addresses
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), connect a wallet, and **switch to Arc Testnet (5042002)** if prompted.

## 5. Deploy to Vercel

1. Push the repo to GitHub/GitLab/Bitbucket.
2. Import the project in [Vercel](https://vercel.com) and set **Root Directory** to `frontend` (if the repo is the monorepo).
3. Add the same **Environment Variables** as in `.env.local` (all `NEXT_PUBLIC_*` keys).
4. Deploy. Vercel will run `npm run build` and host the Next.js app.

// VIBE: After deploy, test a small stake on testnet and confirm transaction links open on `testnet.arcscan.app`.
