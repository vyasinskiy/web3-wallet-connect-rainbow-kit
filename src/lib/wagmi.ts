import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { mainnet, arbitrum, optimism, base, bsc, hardhat } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

// runtime configuration for wagmi
export const wagmiConfig = getDefaultConfig({
  appName: "Web3 Wallet Connect",
  projectId, // required property from wallet connect cloud
  chains: [hardhat, mainnet, arbitrum, optimism, base, bsc], // important to allow rainbow show the list of chains
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
  },
  ssr: true,
});
