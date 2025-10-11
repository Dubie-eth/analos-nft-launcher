import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnalosNftLauncher } from "../target/types/analos_nft_launcher";
import { expect } from "chai";

describe("analos-nft-launcher", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.AnalosNftLauncher as Program<AnalosNftLauncher>;
  const provider = anchor.getProvider();

  // Test accounts
  const authority = provider.wallet;
  const user = anchor.web3.Keypair.generate();

  // Collection data
  const collectionName = "Analos Test Collection";
  const collectionSymbol = "ATC";
  const collectionUri = "https://analos-nft-launcher.vercel.app/api/collection-metadata/test";
  const maxSupply = 1000;
  const mintPrice = 100000000; // 0.1 SOL in lamports

  // NFT data
  const nftName = "Test NFT #1";
  const nftSymbol = "TN1";
  const nftUri = "https://analos-nft-launcher.vercel.app/api/metadata/test-nft-1";

  let collectionPda: anchor.web3.PublicKey;
  let collectionBump: number;

  before(async () => {
    // Get collection PDA
    [collectionPda, collectionBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("collection"), Buffer.from(collectionName)],
      program.programId
    );

    // Airdrop SOL to user for testing
    const signature = await provider.connection.requestAirdrop(
      user.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);
  });

  it("Initialize collection", async () => {
    const tx = await program.methods
      .initializeCollection(
        collectionName,
        collectionSymbol,
        collectionUri,
        new anchor.BN(maxSupply),
        new anchor.BN(mintPrice)
      )
      .accounts({
        collection: collectionPda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Collection initialization transaction:", tx);

    // Fetch the collection account
    const collection = await program.account.collection.fetch(collectionPda);
    
    expect(collection.name).to.equal(collectionName);
    expect(collection.symbol).to.equal(collectionSymbol);
    expect(collection.uri).to.equal(collectionUri);
    expect(collection.maxSupply.toNumber()).to.equal(maxSupply);
    expect(collection.currentSupply.toNumber()).to.equal(0);
    expect(collection.mintPrice.toNumber()).to.equal(mintPrice);
    expect(collection.isActive).to.be.true;
  });

  it("Mint NFT", async () => {
    // Get NFT PDA
    const [nftPda, nftBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("nft"), collectionPda.toBuffer(), Buffer.from([0, 0, 0, 0, 0, 0, 0, 0])],
      program.programId
    );

    // Get NFT mint PDA
    const [nftMintPda, nftMintBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("nft_mint"), nftPda.toBuffer()],
      program.programId
    );

    // Get user's token account for SOL
    const userTokenAccount = await anchor.utils.token.associatedAddress({
      mint: anchor.web3.NativeMint,
      owner: user.publicKey,
    });

    // Get collection's token account for SOL
    const collectionTokenAccount = await anchor.utils.token.associatedAddress({
      mint: anchor.web3.NativeMint,
      owner: collectionPda,
    });

    // Get user's NFT token account
    const userNftTokenAccount = await anchor.utils.token.associatedAddress({
      mint: nftMintPda,
      owner: user.publicKey,
    });

    const tx = await program.methods
      .mintNft(nftName, nftSymbol, nftUri)
      .accounts({
        collection: collectionPda,
        nft: nftPda,
        nftMint: nftMintPda,
        nftTokenAccount: userNftTokenAccount,
        user: user.publicKey,
        userTokenAccount: userTokenAccount,
        collectionTokenAccount: collectionTokenAccount,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    console.log("NFT minting transaction:", tx);

    // Fetch the NFT account
    const nft = await program.account.nft.fetch(nftPda);
    
    expect(nft.collection.toString()).to.equal(collectionPda.toString());
    expect(nft.name).to.equal(nftName);
    expect(nft.symbol).to.equal(nftSymbol);
    expect(nft.uri).to.equal(nftUri);
    expect(nft.owner.toString()).to.equal(user.publicKey.toString());

    // Fetch the updated collection account
    const collection = await program.account.collection.fetch(collectionPda);
    expect(collection.currentSupply.toNumber()).to.equal(1);
  });

  it("Get collection info", async () => {
    const collectionInfo = await program.methods
      .getCollectionInfo()
      .accounts({
        collection: collectionPda,
      })
      .view();

    expect(collectionInfo.name).to.equal(collectionName);
    expect(collectionInfo.symbol).to.equal(collectionSymbol);
    expect(collectionInfo.currentSupply.toNumber()).to.equal(1);
    expect(collectionInfo.isActive).to.be.true;
  });

  it("Update collection", async () => {
    const newName = "Updated Analos Collection";
    const newSymbol = "UAC";

    const tx = await program.methods
      .updateCollection(
        newName,
        newSymbol,
        null,
        null
      )
      .accounts({
        collection: collectionPda,
        authority: authority.publicKey,
      })
      .rpc();

    console.log("Collection update transaction:", tx);

    // Fetch the updated collection account
    const collection = await program.account.collection.fetch(collectionPda);
    expect(collection.name).to.equal(newName);
    expect(collection.symbol).to.equal(newSymbol);
  });

  it("Deactivate collection", async () => {
    const tx = await program.methods
      .updateCollection(
        null,
        null,
        null,
        false
      )
      .accounts({
        collection: collectionPda,
        authority: authority.publicKey,
      })
      .rpc();

    console.log("Collection deactivation transaction:", tx);

    // Fetch the updated collection account
    const collection = await program.account.collection.fetch(collectionPda);
    expect(collection.isActive).to.be.false;
  });
});
