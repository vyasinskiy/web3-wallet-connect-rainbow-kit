import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { mainnet, arbitrum } from "wagmi/chains";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "00000000000000000000000000000000";

export const wagmiConfig = getDefaultConfig({
  appName: "Web3 Wallet Connect",
  projectId,
  chains: [mainnet, arbitrum], // important to allow rainbow show the list of chains
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
  },
  ssr: true,
});
