---
title: "How OLI and Enscribe Are Building the Security UX of Web3's Identity Layer"
excerpt: "Discover how the integration between OLI and Enscribe is solving the critical problem of blind signing by creating a foundational stack for onchain trust and security."
date: "2025-08-19"
author: "Ahoura"
authorSocial:
  twitter: "https://twitter.com/ahoura_az"
  telegram: "https://t.me/aghostraa"
tags: ["announcement", "partnerships", "security", "ens", "blockchain"]
featured: true
seo:
  title: "OLI and Enscribe Integration - Web3 Security UX Solution"
  description: "Learn how OLI and Enscribe are solving blind signing by creating a foundational stack for onchain trust and security in Web3 applications."
  keywords: ["oli enscribe integration", "web3 security", "blind signing", "ens resolution", "onchain trust", "blockchain security"]
---

## The Peril of Blind Signing

Blockchains are praised for their transparency, but this is often a dangerous illusion. We can see every transaction, but we cannot easily understand its _context_. This leads to "blind signing," a problem so pervasive that core infrastructure teams like Sourcify have called it ["a bigger dragon than we can slay."](https://x.com/SourcifyEth/status/1902329967054401548). Users are asked to approve transactions without truly knowing who they're interacting with, or if it's safe.

Is the name `my-safe-protocol.eth` _actually_ owned and controlled by the contract it points to, or is its owner legit?

Currently, many of the answers are locked in proprietary, siloed databases. As the Sourcify team noted, to solve this problem "once and for all, THE SOLUTION HAS TO BE OPEN." This is where the powerful synergy of three projects—the Ethereum Name Service (ENS), the Open Labels Initiative (OLI) and [Enscribe](https://www.enscribe.xyz/)—comes into play, creating a foundational stack for onchain trust.

## Not All ENS Names Are Created Equal

ENS is a brilliant solution for replacing long, unreadable hex addresses with memorable names. However, a critical security nuance lies in _how_ a name is linked to an address.

Imagine you want to interact with a DeFi protocol. You see the name `popular-defi-protocol.eth` in your wallet, which gives you a sense of security. But how do you know the owner of that name is the same as the owner of the contract it points to?

There are two ways to resolve an ENS name, with vastly different security implications:

*   **Forward Resolution (Less Secure):** The owner of an ENS name points it to an address. This is risky because anyone can register a name and point it to _any_ contract, including a malicious one. An attacker could register `uniswap-v4-airdrop.eth` and point it to a drainer contract.
*   **Reverse Resolution (More Secure):** The owner of an address claims an ENS name for itself. This creates a verified, bidirectional link. The contract is, in effect, saying, "I am `v3-core.uniswap.eth`." This is the gold standard.

The problem? Setting a reverse resolution for a smart contract has historically been a clunky, manual process. As a result, very few contracts use it, leaving the ecosystem reliant on the less-secure forward resolution method.

## Building a New Stack for Open Onchain Trust: OLI + Enscribe

This is the critical gap that the OLI and Enscribe integration solves. It addresses two of the core pillars of transaction safety: **Labeling** (knowing you're talking to the right contract) and **Understandability** (making security signals clear).

### OLI: Surfacing the Security Reality

OLI's search frontend now automatically detects and verifies the resolution method for every address. This crucial context is surfaced directly in the UI:

*   A **green checkmark** appears next to names that are securely reverse-resolved, indicating a higher level of trust.
![OLI Search showing green checkmark for secure reverse-resolved ENS names](/blog-images/enscribe-announcement/oli-search-green-checkmark.png)
*   A **warning icon** flags potentially insecure forward-resolved names, with a tooltip explaining the risk.
![OLI Search showing warning icon for insecure forward-resolved names](/blog-images/enscribe-announcement/oli-search-warning-icon.png)
*   A **badge** that takes users to Enscribe's naming page or explore page in case the ENS exists for that contract.
![OLI Search showing Enscribe badge for contract naming](/blog-images/enscribe-announcement/oli-search-enscribe-badge.png)
Users and developers have an easy way to distinguish between a contract that has verifiably claimed its onchain identity and one that merely has a name pointed at it and are guided to Enscribe to assign an ENS to that contract if need be.

### Enscribe: Making things Effortless

Identifying the problem is only half the battle. Enscribe provides the solution by eliminating the complexity of setting reverse ENS records for smart contracts.

If OLI flags a contract for having a risky forward-resolved name (or no name at all), it now provides a direct link to [Enscribe App](https://app.enscribe.xyz/). Through a simple UI, developers can instantly and easily:

1. **Set the correct Primary Name** for their existing `Ownable` or `ERC-173` compatible contracts.
2. **Secure their contract's onchain identity** in a single, streamlined transaction.

What was once a daunting, multi-step process is now a simple, accessible workflow.
![Enscribe interface showing streamlined ENS naming workflow](/blog-images/enscribe-announcement/enscribe-workflow-interface.png)
## In Search of the "TLS Padlock" for Web3

This integration is a great leap forward, but it's part of a larger quest: the search for a simple, binary trust indicator for users—a "TLS padlock for smart contract applications."

As discussed in the community, the reality of trust is not binary; it exists on a gradient. Security, reputation, and safety are complex, non-linear systems. However, a good user experience abstracts this complexity away. The TLS padlock isn't perfectly secure—CAs can be hijacked—but it provides a powerful abstraction that makes the web safer for billions.

This is the mental model we are building towards.

**The path forward involves:**

1. **Driving Adoption:** Encouraging developers to use OLI to check their contracts and complete the missing information labels and Enscribe to secure them with their own ENS primary domain. The more contracts that have a proper reverse-resolved name, the safer the entire ecosystem becomes.
2. **Building a Web of Trust:** The next step for OLI is to implement a transitive trust algorithm. This will allow users and applications to filter for labels based on who they trust, creating a decentralized reputation score. This underlying gradient of trust can then power the simple, binary signals users need.
3. **Integrating at the Wallet Level:** One of the biggest goals here is to get these signals directly into wallets. When a user is about to sign a transaction, the wallet should be able to show a green padlock for a reverse-resolved, highly trusted contract and a red warning for an unverified or risky one.

Do you also share this vision and think initiatives like this are fighting the good fight? Then spread the word, tell your friends who have already shared an interest in such topics, and move the first pieces of the domino to create the network effects such open standards need.

Open a PR, suggest a tag_id or an integration, and join our monthly OLI calls to stay updated and share your thoughts.

Will see you there!

---

*Ready to explore the OLI ecosystem? Start by [searching existing labels](/search) or [creating your first attestation](/attest).*

