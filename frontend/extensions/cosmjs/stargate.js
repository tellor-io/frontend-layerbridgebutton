// @cosmjs/stargate v0.28.11

(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.cosmjs = global.cosmjs || {}, global.cosmjs.stargate = {}));
}(this, (function (exports) {
    'use strict';

    // Add registry for custom message types
    const customTypes = [
        ["/layer.bridge.MsgWithdrawTokens", {
            encode: (message) => {
                // Create a fresh message each time
                const msg = {
                    creator: message.creator,
                    recipient: message.recipient.toLowerCase(),
                    amount: {
                        denom: message.amount.denom,
                        amount: message.amount.amount.toString()
                    }
                };
                return window.layerProto.bridge.MsgWithdrawTokens.encode(msg);
            },
            decode: (binary) => {
                return window.layerProto.bridge.MsgWithdrawTokens.decode(binary);
            }
        }],
        ["/layer.bridge.MsgRequestAttestations", {
            encode: (message) => {
                // Create a fresh message each time
                const msg = {
                    creator: message.creator,
                    query_id: message.query_id,
                    timestamp: message.timestamp.toString()
                };
                return window.layerProto.bridge.MsgRequestAttestations.encode(msg);
            },
            decode: (binary) => {
                return window.layerProto.bridge.MsgRequestAttestations.decode(binary);
            }
        }],
        ["/cosmos.staking.v1beta1.MsgDelegate", {
            encode: (message) => {
                // Use the auto-generated encoder from staking_proto.js
                // staking_proto.js attaches to window.cosmos.staking.v1beta1.MsgDelegate
                return window.cosmos.staking.v1beta1.MsgDelegate.encode(message).finish();
            },
            decode: (binary) => {
                return window.cosmos.staking.v1beta1.MsgDelegate.decode(binary);
            }
        }]
    ];

    // Stargate client implementation
    class SigningStargateClient {
        constructor(rpcUrl, signer) {
            // Remove any trailing slashes and ensure we don't have /rpc in the base URL
            this.rpcUrl = (rpcUrl || "https://node-palmito.tellorlayer.com").replace(/\/+$/, '').replace(/\/rpc$/, '');
            this.signer = signer;
            this.registry = new Map(customTypes);
            // Add sequence management
            this.sequenceCache = new Map(); // address -> { sequence, lastUpdated }
        }

        static async connectWithSigner(rpcUrl, signer) {
            return new SigningStargateClient(rpcUrl, signer);
        }

        async getAccount(address) {
            try {
                // Use the correct REST API endpoint
                const accountUrl = `${this.rpcUrl}/cosmos/auth/v1beta1/accounts/${address}`;
                
                const response = await fetch(accountUrl);

                if (!response.ok) {
                    if (response.status === 404) {
                        // If account is new, return default values
                        return {
                            account_number: "0",
                            sequence: "0"
                        };
                    }
                    const errorText = await response.text();
                    console.error('Account fetch error:', errorText);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (!data || !data.account) {
                    console.error('Invalid account response format:', data);
                    throw new Error('Invalid response format');
                }

                // Extract account number and sequence
                return {
                    account_number: data.account.account_number || "0",
                    sequence: data.account.sequence || "0"
                };
            } catch (error) {
                console.error('Error in getAccount:', error);
                throw error;
            }
        }

        async getBalance(address, searchDenom) {
            try {
                // Use the offline signer to get the account
                const accounts = await this.signer.getAccounts();
                const account = accounts.find(acc => acc.address === address);
                
                if (!account) {
                    console.error('Account not found in signer');
                    throw new Error('Account not found');
                }

                // Use the correct REST API endpoint
                const baseUrl = 'https://node-palmito.tellorlayer.com';
                const balanceUrl = `${baseUrl}/cosmos/bank/v1beta1/balances/${address}`;
                
                const response = await fetch(balanceUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        return {
                            amount: "0",
                            denom: searchDenom
                        };
                    }
                    const errorText = await response.text();
                    console.error('Balance fetch error:', errorText);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (!data || !data.balances) {
                    console.error('Invalid balance response format:', data);
                    throw new Error('Invalid response format');
                }

                // Find the balance with the matching denom
                const balance = data.balances.find(b => b.denom === searchDenom);
                if (balance) {
                    return balance;
                }

                // If no matching balance found, return default
                return {
                    amount: "0",
                    denom: searchDenom
                };
            } catch (error) {
                console.error('Error in getBalance:', error);
                return {
                    amount: "0",
                    denom: searchDenom
                };
            }
        }

        async signAndBroadcast(signerAddress, messages, fee, memo = "") {
            try {
                // Get sequence with proper management
                const sequence = await this.getAndIncrementSequence(signerAddress);
                const accountInfo = await this.getAccount(signerAddress);
                console.log('Signing with account info:', { ...accountInfo, sequence });
                
                // Debug: Log sequence details
                console.log('Sequence details:', {
                    originalSequence: accountInfo.sequence,
                    usedSequence: sequence,
                    sequenceType: typeof sequence,
                    sequenceParsed: parseInt(sequence),
                    successfulTransactionSequence: '998',
                    sequenceDifference: parseInt(sequence) - 998,
                    accountAddress: signerAddress,
                    successfulAccountAddress: 'tellor1alcefjzkk37qmfrnel8q4eruyll0pc8arxhxxw',
                    sameAccount: signerAddress === 'tellor1alcefjzkk37qmfrnel8q4eruyll0pc8arxhxxw'
                });

                if (!accountInfo) {
                    throw new Error('Account not found');
                }

                // Check if this is a staking message (use signDirect)
                if (messages.length === 1 && messages[0].typeUrl === "/cosmos.staking.v1beta1.MsgDelegate") {
                    try {
                        // --- signDirect logic ---
                        // Prepare proto-encoded message
                        const encoder = this.registry.get(messages[0].typeUrl);
                        if (!encoder) {
                            throw new Error(`No encoder found for message type: ${messages[0].typeUrl}`);
                        }
                        const msgValue = encoder.encode(messages[0].value);
                        
                        // Debug: Log message encoding
                        console.log('Message encoding details:', {
                            originalMessage: messages[0].value,
                            encodedLength: msgValue.length,
                            encodedHex: Array.from(msgValue).map(b => b.toString(16).padStart(2, '0')).join(''),
                            successfulMessageHex: '0a2d74656c6c6f7231616c6365666a7a6b6b3337716d66726e656c387134657275796c6c3070633861727868787877123474656c6c6f7276616c6f70657231616c6365666a7a6b6b3337716d66726e656c387134657275796c6c3070633861727868666d356c371a0e0a046c6f7961120131'
                        });

                        // Protobuf types
                        const root = new protobuf.Root();
                        const Coin = new protobuf.Type("Coin")
                            .add(new protobuf.Field("denom", 1, "string"))
                            .add(new protobuf.Field("amount", 2, "string"));
                        const Any = new protobuf.Type("Any")
                            .add(new protobuf.Field("typeUrl", 1, "string"))
                            .add(new protobuf.Field("value", 2, "bytes"));
                        const TxBody = new protobuf.Type("TxBody")
                            .add(new protobuf.Field("messages", 1, "Any", "repeated"))
                            .add(new protobuf.Field("memo", 2, "string"))
                            .add(new protobuf.Field("timeout_height", 3, "uint64"));
                        const PubKey = new protobuf.Type("PubKey")
                            .add(new protobuf.Field("key", 1, "bytes"));
                        
                        // Define SignMode enum correctly
                        const SignMode = new protobuf.Enum("SignMode")
                            .add("SIGN_MODE_UNSPECIFIED", 0)
                            .add("SIGN_MODE_DIRECT", 1)
                            .add("SIGN_MODE_TEXTUAL", 2)
                            .add("SIGN_MODE_LEGACY_AMINO_JSON", 127);
                        
                        const Single = new protobuf.Type("Single")
                            .add(new protobuf.Field("mode", 1, "SignMode"));
                        const ModeInfo = new protobuf.Type("ModeInfo")
                            .add(new protobuf.Field("single", 1, "Single"));
                        const SignerInfo = new protobuf.Type("SignerInfo")
                            .add(new protobuf.Field("public_key", 1, "Any"))
                            .add(new protobuf.Field("mode_info", 2, "ModeInfo"))
                            .add(new protobuf.Field("sequence", 3, "uint64"));
                        const Fee = new protobuf.Type("Fee")
                            .add(new protobuf.Field("amount", 1, "Coin", "repeated"))
                            .add(new protobuf.Field("gas_limit", 2, "uint64"));
                        const AuthInfo = new protobuf.Type("AuthInfo")
                            .add(new protobuf.Field("signer_infos", 1, "SignerInfo", "repeated"))
                            .add(new protobuf.Field("fee", 2, "Fee"));
                        const Tx = new protobuf.Type("Tx")
                            .add(new protobuf.Field("body", 1, "TxBody"))
                            .add(new protobuf.Field("auth_info", 2, "AuthInfo"))
                            .add(new protobuf.Field("signatures", 3, "bytes", "repeated"));
                        
                        // Add all types to root
                        root.add(Coin);
                        root.add(Any);
                        root.add(TxBody);
                        root.add(PubKey);
                        root.add(SignMode);
                        root.add(Single);
                        root.add(ModeInfo);
                        root.add(SignerInfo);
                        root.add(Fee);
                        root.add(AuthInfo);
                        root.add(Tx);

                        // Build TxBody
                        const txBody = {
                            messages: [{
                                typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
                                value: msgValue
                            }],
                            memo: memo || "",
                            timeout_height: 0
                        };
                        const TxBodyType = root.lookupType("TxBody");
                        const bodyBytes = TxBodyType.encode(txBody).finish();
                        
                        // Debug: Compare message structure
                        console.log('Message comparison:', {
                            ourMessage: {
                                typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
                                value: messages[0].value
                            },
                            successfulMessage: {
                                typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
                                value: {
                                    delegatorAddress: "tellor1alcefjzkk37qmfrnel8q4eruyll0pc8arxhxxw",
                                    validatorAddress: "tellorvaloper1alcefjzkk37qmfrnel8q4eruyll0pc8akfm5l7",
                                    amount: { denom: "loya", amount: "1" }
                                }
                            },
                            bodyBytesLength: bodyBytes.length
                        });

                        // Build AuthInfo
                        // Use the signer that was passed to the client constructor
                        const accounts = await this.signer.getAccounts();
                        const account = accounts.find(acc => acc.address === signerAddress);
                        if (!account) throw new Error('Account not found in signer');
                        
                        // Use the public key from the wallet signer instead of fetching from chain
                        let pubKeyBytes = account.pubkey;
                        
                        // Debug: Log the public key being used
                        console.log('Wallet public key (Uint8Array):', Array.from(pubKeyBytes));
                        console.log('Wallet public key (base64):', btoa(String.fromCharCode.apply(null, pubKeyBytes)));
                        
                        // Debug: Compare with successful transaction public key
                        const successfulPubKey = 'A8ewUdR2YoNh4vwa6hEB201r+KEXUzahx4iCDlnxzau0';
                        console.log('Successful transaction public key:', successfulPubKey);
                        console.log('Public key match:', btoa(String.fromCharCode.apply(null, pubKeyBytes)) === successfulPubKey);
                        
                        // Try to fetch on-chain public key as fallback
                        try {
                            const accountResp = await fetch(`${this.rpcUrl}/cosmos/auth/v1beta1/accounts/${signerAddress}`);
                            const accountJson = await accountResp.json();
                            const onChainPubKeyBase64 = accountJson.account?.pub_key?.key;
                            
                            if (onChainPubKeyBase64) {
                                const onChainPubKeyBytes = Uint8Array.from(atob(onChainPubKeyBase64), c => c.charCodeAt(0));
                                console.log('On-chain public key (base64):', onChainPubKeyBase64);
                                console.log('On-chain vs wallet public key match:', onChainPubKeyBase64 === btoa(String.fromCharCode.apply(null, pubKeyBytes)));
                                
                                // Use on-chain public key if it's different from wallet
                                if (onChainPubKeyBase64 !== btoa(String.fromCharCode.apply(null, pubKeyBytes))) {
                                    console.log('Using on-chain public key instead of wallet public key');
                                    pubKeyBytes = onChainPubKeyBytes;
                                }
                            }
                        } catch (error) {
                            console.warn('Could not fetch on-chain public key:', error);
                        }
                        
                        const PubKeyType = root.lookupType("PubKey");
                        const encodedPubKey = PubKeyType.encode({ key: pubKeyBytes }).finish();
                        const pubKeyAny = {
                            typeUrl: "/cosmos.crypto.secp256k1.PubKey",
                            value: encodedPubKey
                        };
                        
                        // Debug: Log the public key Any structure
                        console.log('Public key Any structure:', {
                            typeUrl: pubKeyAny.typeUrl,
                            valueLength: pubKeyAny.value.length,
                            valueHex: Array.from(pubKeyAny.value).map(b => b.toString(16).padStart(2, '0')).join('')
                        });
                        
                        const AuthInfoType = root.lookupType("AuthInfo");
                        const authInfo = {
                            signer_infos: [{
                                public_key: pubKeyAny,
                                mode_info: { single: { mode: 1 } }, // SIGN_MODE_DIRECT
                                sequence: parseInt(sequence)
                            }],
                            fee: {
                                amount: fee.amount,
                                gas_limit: parseInt(fee.gas)
                            }
                        };
                        const authInfoBytes = AuthInfoType.encode(authInfo).finish();
                        
                        // Debug: Log authInfo details
                        console.log('AuthInfo details:', {
                            signer_infos: authInfo.signer_infos,
                            fee: authInfo.fee,
                            authInfoBytesLength: authInfoBytes.length,
                            authInfoBytesHex: Array.from(authInfoBytes).map(b => b.toString(16).padStart(2, '0')).join('')
                        });
                        
                        // Debug: Compare with successful transaction fee
                        console.log('Fee comparison:', {
                            ourFee: authInfo.fee,
                            successfulFee: { amount: [{ denom: "loya", amount: "500" }], gas_limit: 200000 },
                            feeMatch: JSON.stringify(authInfo.fee) === JSON.stringify({ amount: [{ denom: "loya", amount: "500" }], gas_limit: 200000 })
                        });

                        // Debug: Compare protobuf field definitions
                        console.log('Protobuf field definitions:', {
                            feeFields: Fee.fieldsArray.map(f => ({ name: f.name, id: f.id, type: f.type })),
                            signerInfoFields: SignerInfo.fieldsArray.map(f => ({ name: f.name, id: f.id, type: f.type })),
                            authInfoFields: AuthInfo.fieldsArray.map(f => ({ name: f.name, id: f.id, type: f.type }))
                        });

                        // Create SignDoc
                        const signDoc = {
                            bodyBytes: bodyBytes,
                            authInfoBytes: authInfoBytes,
                            chainId: 'layertest-4',
                            accountNumber: parseInt(accountInfo.account_number)
                        };

                        console.log('SignDoc for signDirect:', {
                            bodyBytes: Array.from(bodyBytes).map(b => b.toString(16).padStart(2, '0')).join(''),
                            authInfoBytes: Array.from(authInfoBytes).map(b => b.toString(16).padStart(2, '0')).join(''),
                            chainId: signDoc.chainId,
                            accountNumber: signDoc.accountNumber
                        });
                        
                        // Debug: Log signDoc structure
                        console.log('SignDoc structure:', {
                            bodyBytesLength: bodyBytes.length,
                            authInfoBytesLength: authInfoBytes.length,
                            chainId: signDoc.chainId,
                            accountNumber: signDoc.accountNumber,
                            bodyBytesHex: Array.from(bodyBytes).map(b => b.toString(16).padStart(2, '0')).join(''),
                            authInfoBytesHex: Array.from(authInfoBytes).map(b => b.toString(16).padStart(2, '0')).join('')
                        });

                        // signDirect
                        const signResult = await this.signer.signDirect(signerAddress, signDoc);
                        this.signature = signResult.signature.signature;
                        this.publicKey = pubKeyBytes;

                        // Debug: Log signature details
                        console.log('SignDirect result:', {
                            signature: this.signature,
                            signatureLength: this.signature.length,
                            publicKey: Array.from(pubKeyBytes),
                            signDoc: signDoc
                        });
                        
                        // Debug: Compare signature with successful transaction
                        const successfulSignature = 'KtA40ddSDGww2p50Y3CQI5FrlgUhAbZ/ncxcc4PzfNZx7s6vEfMcazeS44bq5RDu/U2t6qGS2eENJOYCuxWCIA==';
                        console.log('Signature comparison:', {
                            ourSignature: this.signature,
                            successfulSignature: successfulSignature,
                            signatureMatch: this.signature === successfulSignature,
                            ourSignatureLength: this.signature.length,
                            successfulSignatureLength: successfulSignature.length
                        });

                        // Build Tx
                        const TxType = root.lookupType("Tx");
                        
                        // Convert base64 signature to Uint8Array properly
                        const signatureBytes = Uint8Array.from(atob(this.signature), c => c.charCodeAt(0));
                        
                        const tx = {
                            body: txBody,
                            auth_info: authInfo,
                            signatures: [signatureBytes]
                        };
                        
                        // Debug: Log final transaction
                        console.log('Final transaction:', {
                            body: tx.body,
                            auth_info: tx.auth_info,
                            signatures: Array.from(tx.signatures[0])
                        });
                        
                        // Create and encode the final transaction
                        const txObj = TxType.create(tx);
                        
                        // Debug: Validate protobuf encoding
                        const validationError = TxType.verify(txObj);
                        if (validationError) {
                            console.error('Protobuf validation error:', validationError);
                            throw new Error(`Protobuf validation failed: ${validationError}`);
                        }
                        
                        const encodedTx = TxType.encode(txObj).finish();
                        const base64Tx = btoa(String.fromCharCode.apply(null, encodedTx));
                        
                        console.log('Encoded transaction (base64):', base64Tx);
                        console.log('Encoded transaction length:', encodedTx.length);

                        // Broadcast
                        const response = await fetch(`${this.rpcUrl}/cosmos/tx/v1beta1/txs`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ tx_bytes: base64Tx, mode: "BROADCAST_MODE_SYNC" })
                        });
                        const result = await response.json();
                        if (result.tx_response?.code !== 0) {
                            console.error('Transaction error details:', {
                                code: result.tx_response?.code,
                                message: result.tx_response?.raw_log,
                                txHash: result.tx_response?.txhash,
                                height: result.tx_response?.height
                            });
                            throw new Error(result.tx_response?.raw_log || 'Transaction failed');
                        }
                        
                        // Update sequence after successful transaction
                        this.updateSequenceAfterSuccess(signerAddress, sequence);
                        return result.tx_response;
                    } catch (signDirectError) {
                        console.warn('SignDirect failed, falling back to signAmino:', signDirectError);
                        // Fall back to signAmino for staking messages
                        console.log('Falling back to signAmino for staking message...');
                    }
                }

                // --- Default: signAmino for all other messages ---
                // Create the transaction to sign
                const txToSign = {
                    chain_id: 'layertest-4',
                    account_number: accountInfo.account_number,
                    sequence: sequence,
                    fee: {
                        amount: fee.amount,
                        gas: fee.gas
                    },
                    msgs: messages.map(msg => ({
                            type: msg.typeUrl,
                            value: msg.value
                    })),
                    memo: memo
                };

                console.log('Transaction to sign:', txToSign);

                // Sign the transaction
                const signResult = await this.signer.signAmino(signerAddress, txToSign);
                console.log('Sign result:', signResult);

                // Store the signature and public key for broadcasting
                this.signature = signResult.signature.signature;
                this.publicKey = signResult.signature.pub_key.value;

                // Encode messages for broadcasting
                const encodedMessages = await Promise.all(messages.map(async (msg) => {
                    const encoder = this.registry.get(msg.typeUrl);
                if (!encoder) {
                        throw new Error(`No encoder found for message type: ${msg.typeUrl}`);
                }
                    const encoded = encoder.encode(msg.value);
                    return {
                        typeUrl: msg.typeUrl,
                        value: encoded
                    };
                }));

                // Broadcast the transaction
                const broadcastResult = await this.broadcastTransaction(encodedMessages, messages);
                
                // Update sequence after successful transaction
                this.updateSequenceAfterSuccess(signerAddress, sequence);
                
                return broadcastResult;
            } catch (error) {
                console.error('Error in signAndBroadcast:', error);
                throw error;
            }
        }

        // Helper method to handle transaction broadcasting
        async broadcastTransaction(encodedMessages, originalMessages, mode = "BROADCAST_MODE_SYNC", sequence = null) {
            try {
                // If no sequence provided, get it from the signer address
                if (!sequence && this.signature && this.publicKey) {
                    const accounts = await this.signer.getAccounts();
                    if (accounts.length > 0) {
                        sequence = await this.getAndIncrementSequence(accounts[0].address);
                    }
                }
                
                if (!sequence) {
                    throw new Error('No sequence number available for transaction');
                }
                
                // Create protobuf types
                const root = new protobuf.Root();
                
                // Define Coin type
                const Coin = new protobuf.Type("Coin")
                    .add(new protobuf.Field("denom", 1, "string"))
                    .add(new protobuf.Field("amount", 2, "string"));
                
                // Define Any type
                const Any = new protobuf.Type("Any")
                    .add(new protobuf.Field("typeUrl", 1, "string"))
                    .add(new protobuf.Field("value", 2, "bytes"));
                
                // Define PubKey type for secp256k1
                const PubKey = new protobuf.Type("PubKey")
                    .add(new protobuf.Field("key", 1, "bytes"));
                
                // Define TxBody type
                const TxBody = new protobuf.Type("TxBody")
                    .add(new protobuf.Field("messages", 1, "Any", "repeated"))
                    .add(new protobuf.Field("memo", 2, "string"))
                    .add(new protobuf.Field("timeout_height", 3, "uint64"));
                
                // Define SignMode enum
                const SignMode = new protobuf.Enum("SignMode")
                    .add("SIGN_MODE_UNSPECIFIED", 0)
                    .add("SIGN_MODE_DIRECT", 1)
                    .add("SIGN_MODE_TEXTUAL", 2)
                    .add("SIGN_MODE_LEGACY_AMINO_JSON", 127);
                
                // Define Single type
                const Single = new protobuf.Type("Single")
                    .add(new protobuf.Field("mode", 1, "SignMode"));
                
                // Define ModeInfo type
                const ModeInfo = new protobuf.Type("ModeInfo")
                    .add(new protobuf.Field("single", 1, "Single"));
                
                // Define SignerInfo type
                const SignerInfo = new protobuf.Type("SignerInfo")
                    .add(new protobuf.Field("public_key", 1, "Any"))
                    .add(new protobuf.Field("mode_info", 2, "ModeInfo"))
                    .add(new protobuf.Field("sequence", 3, "uint64"));
                
                // Define Fee type
                const Fee = new protobuf.Type("Fee")
                    .add(new protobuf.Field("amount", 1, "Coin", "repeated"))
                    .add(new protobuf.Field("gas_limit", 2, "uint64"));
                
                // Define AuthInfo type
                const AuthInfo = new protobuf.Type("AuthInfo")
                    .add(new protobuf.Field("signer_infos", 1, "SignerInfo", "repeated"))
                    .add(new protobuf.Field("fee", 2, "Fee"));
                
                // Define Tx type
                const Tx = new protobuf.Type("Tx")
                    .add(new protobuf.Field("body", 1, "TxBody"))
                    .add(new protobuf.Field("auth_info", 2, "AuthInfo"))
                    .add(new protobuf.Field("signatures", 3, "bytes", "repeated"));

                // Add types to root
                root.add(Coin);
                root.add(Any);
                root.add(PubKey);
                root.add(TxBody);
                root.add(SignMode);
                root.add(Single);
                root.add(ModeInfo);
                root.add(SignerInfo);
                root.add(Fee);
                root.add(AuthInfo);
                root.add(Tx);

                // Get the types
                const TxType = root.lookupType("Tx");
                const AnyType = root.lookupType("Any");
                const TxBodyType = root.lookupType("TxBody");
                const AuthInfoType = root.lookupType("AuthInfo");
                const PubKeyType = root.lookupType("PubKey");

                // Get the account from the signer
                const accounts = await this.signer.getAccounts();
                if (!accounts || accounts.length === 0) {
                    throw new Error('No accounts found in signer');
                }
                const account = accounts[0];

                // Create the TxBody with all messages
                const txBody = {
                    messages: encodedMessages,
                    memo: originalMessages[0].typeUrl === '/layer.bridge.MsgWithdrawTokens' 
                        ? "Withdraw TRB to Ethereum"
                        : originalMessages[0].typeUrl === '/cosmos.staking.v1beta1.MsgDelegate'
                        ? "Delegate tokens to validator"
                        : "Request attestations for withdrawal",
                    timeout_height: 0
                };

                // Create the public key
                const pubKey = {
                    key: this.publicKey
                };
                const encodedPubKey = PubKeyType.encode(pubKey).finish();

                // Create the public key Any
                const pubKeyAny = {
                    typeUrl: "/cosmos.crypto.secp256k1.PubKey",
                    value: encodedPubKey
                };

                // Create the AuthInfo
                const authInfo = {
                    signer_infos: [{
                        public_key: pubKeyAny,
                        mode_info: {
                            single: {
                                mode: 127 // SIGN_MODE_LEGACY_AMINO_JSON
                            }
                        },
                        sequence: parseInt(sequence)
                    }],
                    fee: {
                        amount: [{ denom: "loya", amount: "5000" }],
                        gas_limit: parseInt("200000"),
                        payer: "",
                        granter: ""
                    }
                };

                // Create the final transaction
                const tx = {
                    body: txBody,
                    auth_info: authInfo,
                    signatures: [this.signature]
                };

                // Create and encode the final transaction
                const txObj = TxType.create(tx);
                
                // Debug: Validate protobuf encoding
                const validationError = TxType.verify(txObj);
                if (validationError) {
                    console.error('Protobuf validation error:', validationError);
                    throw new Error(`Protobuf validation failed: ${validationError}`);
                }
                
                const encodedTx = TxType.encode(txObj).finish();
                const base64Tx = btoa(String.fromCharCode.apply(null, encodedTx));
                
                console.log('Encoded transaction (base64):', base64Tx);
                console.log('Encoded transaction length:', encodedTx.length);

                // Broadcast the transaction using the encoded bytes
                const response = await fetch(`${this.rpcUrl}/cosmos/tx/v1beta1/txs`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        tx_bytes: base64Tx,
                        mode: mode
                    })
                });

                const result = await response.json();

                if (result.tx_response?.code !== 0) {
                    console.error('Transaction error details:', {
                        code: result.tx_response?.code,
                        message: result.tx_response?.raw_log,
                        txHash: result.tx_response?.txhash,
                        height: result.tx_response?.height
                    });
                    throw new Error(result.tx_response?.raw_log || 'Transaction failed');
                }

                // Poll for transaction status
                const txHash = result.tx_response.txhash;
                let attempts = 0;
                const maxAttempts = 10;
                const pollInterval = 2000; // 2 seconds

                while (attempts < maxAttempts) {
                    attempts++;
                    
                    try {
                        const statusResponse = await fetch(`${this.rpcUrl}/cosmos/tx/v1beta1/txs/${txHash}`);
                        const statusData = await statusResponse.json();
                        
                        if (statusResponse.ok && statusData.tx_response) {
                            const txResponse = statusData.tx_response;
                            
                            if (txResponse.height !== "0") {
                                // Transaction has been included in a block
                                if (txResponse.code === 0) {
                                    return txResponse;
                                } else {
                                    throw new Error(txResponse.raw_log || 'Transaction failed');
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error polling transaction status:', error);
                    }
                    
                    // Wait before next attempt
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                }

                // If we get here, the transaction hasn't been included in a block
                return result.tx_response;
            } catch (error) {
                console.error('Error encoding transaction:', error);
                throw error;
            }
        }

        async getStakingValidators() {
            try {
                const response = await fetch(`${this.rpcUrl}/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                return {
                    validators: data.validators.map(validator => ({
                        operatorAddress: validator.operator_address,
                        description: {
                            moniker: validator.description.moniker,
                            identity: validator.description.identity,
                            website: validator.description.website,
                            details: validator.description.details
                        },
                        status: validator.status,
                        tokens: validator.tokens,
                        commission: validator.commission
                    }))
                };
            } catch (error) {
                console.error('Error fetching validators:', error);
                throw error;
            }
        }

        // Add method to get and manage sequence numbers
        async getAndIncrementSequence(address) {
            const now = Date.now();
            const cached = this.sequenceCache.get(address);
            
            // If we have a recent cache (within 5 seconds), use it and increment
            if (cached && (now - cached.lastUpdated) < 5000) {
                const currentSequence = cached.sequence;
                cached.sequence = (parseInt(currentSequence) + 1).toString();
                cached.lastUpdated = now;
                return currentSequence;
            }
            
            // Otherwise, fetch fresh from chain
            const accountInfo = await this.getAccount(address);
            const sequence = accountInfo.sequence;
            
            // Cache the next sequence
            this.sequenceCache.set(address, {
                sequence: (parseInt(sequence) + 1).toString(),
                lastUpdated: now
            });
            
            return sequence;
        }

        // Add method to update sequence after successful transaction
        updateSequenceAfterSuccess(address, newSequence) {
            const now = Date.now();
            this.sequenceCache.set(address, {
                sequence: (parseInt(newSequence) + 1).toString(),
                lastUpdated: now
            });
        }
    }

    // Export to both module and global scope
    exports.SigningStargateClient = SigningStargateClient;
    
    // Ensure cosmjs object exists
    window.cosmjs = window.cosmjs || {};
    window.cosmjs.stargate = window.cosmjs.stargate || {};
    
    // Export to both locations
    window.cosmjs.stargate.SigningStargateClient = SigningStargateClient;
    window.cosmjsStargate = {
        SigningStargateClient: SigningStargateClient
    };

    async function pollTransactionStatus(txHash) {
        try {
            // Format the hash to match the expected format (remove '0x' if present and ensure uppercase)
            const formattedHash = txHash.replace('0x', '').toUpperCase();
            const baseUrl = 'https://node-palmito.tellorlayer.com';
            
            // Try both endpoints
            const endpoints = [
                `${baseUrl}/rpc/tx?hash=0x${formattedHash}&prove=false`,
                `${baseUrl}/cosmos/tx/v1beta1/txs/${formattedHash}`
            ];
            
            console.log('Polling transaction status from:', endpoints[0]);
            
            // Try the first endpoint
            let response = await fetch(endpoints[0]);
            let data;
            
            if (!response.ok) {
                console.log('First endpoint failed, trying second endpoint...');
                // Try the second endpoint
                response = await fetch(endpoints[1]);
                if (!response.ok) {
                    throw new Error(`Failed to fetch transaction status: ${response.status}`);
                }
            }
            
            data = await response.json();
            console.log('Transaction status:', data);
            
            // Handle both response formats
            let txResult;
            if (data.result && data.result.tx_result) {
                // First endpoint format
                txResult = data.result.tx_result;
            } else if (data.tx_response) {
                // Second endpoint format
                txResult = data.tx_response;
            } else {
                throw new Error('Unexpected response format');
            }
            
            // Check if transaction was successful
            if (txResult.code === 0) {
                console.log('Transaction successful!');
                console.log('Gas used:', txResult.gas_used);
                console.log('Gas wanted:', txResult.gas_wanted);
                
                // Look for the tokens_withdrawn event
                const events = txResult.events || [];
                const withdrawEvent = events.find(event => event.type === 'tokens_withdrawn');
                if (withdrawEvent) {
                    console.log('Withdrawal details:', {
                        sender: withdrawEvent.attributes.find(attr => attr.key === 'sender')?.value,
                        recipient: withdrawEvent.attributes.find(attr => attr.key === 'recipient_evm_address')?.value,
                        amount: withdrawEvent.attributes.find(attr => attr.key === 'amount')?.value,
                        withdrawId: withdrawEvent.attributes.find(attr => attr.key === 'withdraw_id')?.value
                    });
                }
                
                return {
                    success: true,
                    height: data.result?.height || data.tx_response?.height,
                    gasUsed: txResult.gas_used,
                    gasWanted: txResult.gas_wanted,
                    events: events
                };
            } else {
                console.error('Transaction failed:', txResult.log);
                return {
                    success: false,
                    error: txResult.log
                };
            }
        } catch (error) {
            console.error('Error polling transaction status:', error);
            // Don't throw the error, just return a failure status
            return {
                success: false,
                error: error.message,
                retryable: true // Indicate that this error might be temporary
            };
        }
    }

    async function withdrawFromLayer(amount, ethereumAddress, account) {
        try {
            const amountInMicroUnits = (parseFloat(amount) * 1000000).toString();

            const offlineSigner = window.getOfflineSigner('layertest-4');

            const client = await SigningStargateClient.connectWithSigner(
                'https://node-palmito.tellorlayer.com/rpc',
                offlineSigner
            );

            // Create a fresh message each time
            const msg = {
                typeUrl: '/layer.bridge.MsgWithdrawTokens',
                value: {
                    creator: account,
                    recipient: ethereumAddress,
                    amount: {
                        amount: amountInMicroUnits,
                        denom: 'loya'
                    }
                }
            };

            // Show pending popup
            showPendingPopup();

            // Sign and broadcast the transaction
            const result = await client.signAndBroadcast(
                account,
                [msg],
                {
                    amount: [{ denom: 'loya', amount: '5000' }],
                    gas: '200000'
                },
                'Withdraw TRB to Ethereum'
            );

            hidePendingPopup();
            showSuccessPopup();
            return result;
        } catch (error) {
            console.error('Transaction error:', error);
            hidePendingPopup();
            showErrorPopup(error.message);
            throw error;
        }
    }

    async function requestAttestations(account, queryId, timestamp) {
        try {
            const offlineSigner = window.getOfflineSigner('layertest-4');

            const client = await SigningStargateClient.connectWithSigner(
                'https://node-palmito.tellorlayer.com/rpc',
                offlineSigner
            );

            // Create the message using the same pattern as withdrawal
            const msg = {
                typeUrl: '/layer.bridge.MsgRequestAttestations',
                value: {
                    creator: account,
                    query_id: queryId,
                    timestamp: timestamp.toString() // Ensure timestamp is a string
                }
            };

            // Sign and broadcast using the same pattern as withdrawal
            const result = await client.signAndBroadcast(
                account,
                [msg],
                {
                    amount: [{ denom: 'loya', amount: '5000' }],
                    gas: '200000'
                },
                'Request attestations for withdrawal'
            );

            return result;
        } catch (error) {
            console.error('Transaction error:', error);
            throw error;
        }
    }

    // Export to both module and global scope
    exports.SigningStargateClient = SigningStargateClient;
    exports.requestAttestations = requestAttestations;

    // Ensure cosmjs object exists
    window.cosmjs = window.cosmjs || {};
    window.cosmjs.stargate = window.cosmjs.stargate || {};

    // Export to both locations
    window.cosmjs.stargate.SigningStargateClient = SigningStargateClient;
    window.cosmjs.stargate.requestAttestations = requestAttestations;
    window.cosmjsStargate = {
        SigningStargateClient: SigningStargateClient,
        requestAttestations: requestAttestations
    };
}))); 