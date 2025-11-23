import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { mainnet, arbitrum, optimism, base, bsc } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

export const wagmiConfig = getDefaultConfig({
  appName: "Web3 Wallet Connect",
  projectId, // required property from wallet connect cloud
  chains: [mainnet, arbitrum, optimism, base, bsc], // important to allow rainbow show the list of chains
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
  },
  ssr: true,
});
