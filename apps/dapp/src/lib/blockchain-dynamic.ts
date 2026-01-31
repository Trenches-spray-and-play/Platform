import dynamic from "next/dynamic";

// Dynamically import heavy blockchain libraries
// Note: These are utilities, so we handle the import in the function or component that needs it.

export const getEthers = async () => {
    const { ethers } = await import("ethers");
    return ethers;
};

export const getViem = async () => {
    const viem = await import("viem");
    return viem;
};

export const getSolana = async () => {
    const solana = await import("@solana/web3.js");
    return solana;
};

