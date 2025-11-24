import { isAddress, recoverMessageAddress } from "viem";

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node scripts/verifySignature.mjs --address <0xWallet> --message \"<message>\" --signature <0xSignature>",
      "",
      "Options:",
      "  --address, -a    Wallet address that is expected to have signed the message",
      "  --message, -m    Message string that was signed",
      "  --signature, -s  Signature hex string",
    ].join("\n")
  );
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    const value = args[i + 1];

    if (!value) continue;

    switch (key) {
      case "--address":
      case "-a":
        parsed.address = value;
        i += 1;
        break;
      case "--message":
      case "-m":
        parsed.message = value;
        i += 1;
        break;
      case "--signature":
      case "-s":
        parsed.signature = value;
        i += 1;
        break;
      case "--help":
      case "-h":
        parsed.help = true;
        break;
      default:
        break;
    }
  }

  return parsed;
}

async function main() {
  const { address, message, signature, help } = parseArgs();

  if (help) {
    printUsage();
    return;
  }

  console.log("Starting signature verification...");

  if (!address || !message || !signature) {
    console.error("Missing required arguments.");
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (!isAddress(address)) {
    console.error(`Address is not valid: ${address}`);
    process.exitCode = 1;
    return;
  }

  const normalizedAddress = address.toLowerCase();
  const normalizedSignature = signature.startsWith("0x")
    ? signature
    : `0x${signature}`;

  console.log(`- Address:    ${normalizedAddress}`);
  console.log(`- Message:    "${message}"`);
  console.log(`- Signature:  ${normalizedSignature}`);
  console.log("- Recovering address from signature...");

  let recovered;
  try {
    recovered = await recoverMessageAddress({
      message,
      signature: normalizedSignature,
    });
  } catch (err) {
    console.error("Failed to recover address from signature:", err);
    process.exitCode = 1;
    return;
  }

  console.log(`- Recovered:  ${recovered.toLowerCase()}`);

  const matches = recovered.toLowerCase() === normalizedAddress;
  if (matches) {
    console.log("Signature IS valid for the provided address.");
    process.exitCode = 0;
  } else {
    console.error("Signature is NOT valid for the provided address.");
    process.exitCode = 1;
  }
}

main();
