This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Authorization steps:
1. Connect wallet with Rainbowkit button.
2. Receive status from useConnect() hook.
3. If status === "connected" then unlock button "Authorize".
4. OnClick starts handleSiweSign.
5. Send request to server to get nonce.
- SIWE requires nonce to be unique random string, this is not autoincremented nonce from blockchain.
- it's very important to save used nonce to prevent replay attack. It prevents usage of stealed signature from logs or inaccurate user screenshots.
- it's very important to set nonce expiration time. 
- in case of not checking nonce a signature always remains to be valid, because it was correctly signed by wallet private key. 
6. Nonce returns in response body and set to cookie. When the signature will come to the server, server checks nonce from cookie and nonce in message, check if the nonce is not used before and nonce expirtaion time.
7. Client creates SIWE message using class "Message" from "siwe" library.
8. Client sign message with signMessageAsync from "wagmi" library.