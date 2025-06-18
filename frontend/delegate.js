// Import required dependencies
// We'll use the custom SigningStargateClient that's already loaded in the page
// No need to import from CDN since we're using the custom implementation

const DelegateApp = {
    // Configuration
    config: {
        chainId: "layertest-4",
        rpcEndpoint: "https://node-palmito.tellorlayer.com",
        prefix: "layer",
        gasPrice: { denom: "loya", amount: "0.025" }
    },

    // State
    state: {
        client: null,
        address: null,
        validators: [],
        selectedValidator: null,
        delegationAmount: "",
        initialized: false,
        registry: null
    },

    // Initialize registry with proto types
    initRegistry: function() {
        if (!this.state.registry) {
            // Use the default registry from CosmJS without any custom registrations
            this.state.registry = window.cosmjs.stargate.defaultRegistry;
        }
        return this.state.registry;
    },

    // Wait for CosmJS to be loaded
    waitForCosmJS: function() {
        return new Promise((resolve, reject) => {
            if (window.cosmjsLoaded && window.cosmjs && window.cosmjs.stargate) {
                resolve();
                return;
            }

            // Check every 100ms for CosmJS to be loaded
            const checkInterval = setInterval(() => {
                if (window.cosmjsLoaded && window.cosmjs && window.cosmjs.stargate) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);

            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error('Timeout waiting for CosmJS to load'));
            }, 10000);
        });
    },

    // Initialize the delegation functionality
    init: async function() {
        try {
            // Wait for CosmJS to be loaded
            await this.waitForCosmJS();
            
            // Initialize UI elements
            this.initUI();
            
            // Check if Keplr is already connected via App
            if (window.App && window.App.isKeplrConnected) {
                this.state.address = window.App.keplrAddress;
                await this.loadValidators();
            }
            
            this.state.initialized = true;
            console.log('DelegateApp initialized successfully');
        } catch (error) {
            console.error('Failed to initialize DelegateApp:', error);
        }
    },

    // Initialize UI elements
    initUI: function() {
        console.log('Initializing delegation UI...');
        const delegateSection = document.getElementById('delegateSection');
        if (!delegateSection) {
            console.error('Delegate section not found in DOM');
            return;
        }

        // Initialize validator selection dropdown
        const validatorSelect = document.getElementById('validatorSelect');
        if (validatorSelect) {
            console.log('Found validator select element');
            validatorSelect.addEventListener('change', (e) => {
                this.state.selectedValidator = e.target.value;
                console.log('Selected validator:', e.target.value);
            });
        } else {
            console.error('Validator select element not found');
        }

        // Initialize delegation amount input
        const delegateAmountInput = document.getElementById('delegateAmount');
        if (delegateAmountInput) {
            console.log('Found delegation amount input');
            delegateAmountInput.addEventListener('input', (e) => {
                this.state.delegationAmount = e.target.value;
                console.log('Delegation amount updated:', e.target.value);
            });
        } else {
            console.error('Delegation amount input not found');
        }

        // Initialize delegate button
        const delegateButton = document.getElementById('delegateButton');
        if (delegateButton) {
            console.log('Found delegate button');
            delegateButton.addEventListener('click', async () => {
                console.log('Delegate button clicked');
                try {
                    await this.handleDelegate();
                } catch (error) {
                    console.error('Error in delegate button handler:', error);
                }
            });
        } else {
            console.error('Delegate button not found');
        }

        // Initialize connect wallet button to use App's Cosmos wallet connection
        const connectWalletBtn = document.getElementById('connectKeplrWallet');
        if (connectWalletBtn) {
            console.log('Found connect wallet button');
            connectWalletBtn.addEventListener('click', async () => {
                console.log('Connect wallet button clicked');
                try {
                    if (window.App.isKeplrConnected) {
                        await window.App.disconnectKeplr();
                    } else {
                        await window.App.connectCosmosWallet();
                        // After successful connection, update our state
                        this.state.address = window.App.keplrAddress;
                        await this.loadValidators();
                    }
                    this.updateUI();
                } catch (error) {
                    console.error("Cosmos wallet operation failed:", error);
                    alert("Failed to connect to Cosmos wallet");
                }
            });
        } else {
            console.error('Connect wallet button not found');
        }

        console.log('Delegation UI initialization complete');
    },

    // Load validators list
    loadValidators: async function() {
        if (!window.App.isKeplrConnected || !window.App.keplrAddress) return;

        try {
            // Get the appropriate offline signer based on which wallet is connected
            let offlineSigner;
            if (window.App.cosmosWallet === 'leap' && window.leap) {
                offlineSigner = window.leap.getOfflineSigner(this.config.chainId);
            } else if (window.App.cosmosWallet === 'keplr' && window.keplr) {
                offlineSigner = window.keplr.getOfflineSigner(this.config.chainId);
            } else {
                throw new Error('No Cosmos wallet available');
            }

            // Create a new client instance with proper options
            this.state.client = await window.cosmjs.stargate.SigningStargateClient.connectWithSigner(
                this.config.rpcEndpoint,
                offlineSigner,
                {
                    gasPrice: this.config.gasPrice
                }
            );

            const validators = await this.state.client.getStakingValidators();
            this.state.validators = validators.validators;
            this.updateValidatorDropdown();
        } catch (error) {
            console.error("Failed to load validators:", error);
            alert("Failed to load validators list");
        }
    },

    // Update validator dropdown
    updateValidatorDropdown: function() {
        const validatorSelect = document.getElementById('validatorSelect');
        if (!validatorSelect) return;

        validatorSelect.innerHTML = '<option value="">Select a validator</option>';
        this.state.validators.forEach(validator => {
            const option = document.createElement('option');
            option.value = validator.operatorAddress;
            // Format: "Moniker (addr...)"
            const truncatedAddr = validator.operatorAddress.slice(0, 6) + '...' + validator.operatorAddress.slice(-4);
            option.textContent = `${validator.description.moniker} (${truncatedAddr})`;
            validatorSelect.appendChild(option);
        });
    },

    // Handle delegation
    handleDelegate: async function() {
        if (!window.App.isKeplrConnected) {
            alert("Please connect your Cosmos wallet first");
            return;
        }

        if (!this.state.selectedValidator) {
            alert("Please select a validator");
            return;
        }

        if (!this.state.delegationAmount || isNaN(this.state.delegationAmount) || parseFloat(this.state.delegationAmount) <= 0) {
            alert("Please enter a valid delegation amount");
            return;
        }

        try {
            // Get the appropriate offline signer based on which wallet is connected
            let offlineSigner;
            if (window.App.cosmosWallet === 'leap' && window.leap) {
                offlineSigner = window.leap.getOfflineSigner(this.config.chainId);
            } else if (window.App.cosmosWallet === 'keplr' && window.keplr) {
                offlineSigner = window.keplr.getOfflineSigner(this.config.chainId);
            } else {
                throw new Error('No Cosmos wallet available');
            }
            
            // Get account info
            const accounts = await offlineSigner.getAccounts();
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found in signer');
            }
            const account = accounts[0];

            // Log wallet's public key and address
            console.log('Cosmos wallet account:', account);

            // Fetch on-chain account info
            const accountResponse = await fetch(`${this.config.rpcEndpoint}/cosmos/auth/v1beta1/accounts/${account.address}`);
            const accountData = await accountResponse.json();
            console.log('On-chain account data:', accountData);

            // Log on-chain public key (if available)
            if (accountData.account && accountData.account.pub_key) {
                console.log('On-chain pub_key:', accountData.account.pub_key.key);
            } else {
                console.log('No on-chain pub_key found');
            }
            
            // Validate we have all required data
            if (!this.state.selectedValidator) {
                throw new Error('No validator selected');
            }

            if (!this.state.delegationAmount) {
                throw new Error('Please enter a delegation amount');
            }

            // Get the current delegation amount and validate it
            const delegationAmount = this.state.delegationAmount;
            console.log('Raw delegation amount:', delegationAmount);

            if (!delegationAmount || isNaN(parseFloat(delegationAmount)) || parseFloat(delegationAmount) <= 0) {
                throw new Error('Please enter a valid delegation amount greater than 0');
            }

            // Calculate delegation amount in micro units (1 loya = 1,000,000 microloya)
            const delegationAmountMicro = Math.floor(parseFloat(delegationAmount) * 1000000);
            console.log('Delegation amount in micro units:', delegationAmountMicro);
            
            if (delegationAmountMicro <= 0) {
                throw new Error('Invalid delegation amount: must be greater than 0');
            }

            // Log all required data before proceeding
            console.log('Delegation data:', {
                validator: this.state.selectedValidator,
                amount: delegationAmount,
                amountMicro: delegationAmountMicro,
                account: account.address,
                chainId: this.config.chainId
            });

            // Prepare the MsgDelegate message
            const msg = {
                typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
                value: {
                    delegatorAddress: account.address,
                    validatorAddress: this.state.selectedValidator,
                    amount: {
                    denom: "loya",
                    amount: delegationAmountMicro.toString()
                }
                }
            };

            // Log the MsgDelegate message
            console.log('MsgDelegate message:', msg);

            // Use the client to sign and broadcast (direct mode)
            // (If you want to log the signDoc, you would need to add a log inside the custom Stargate client before signer.signDirect)
            const result = await this.state.client.signAndBroadcast(
                account.address,
                [msg],
                {
                    amount: [{ denom: "loya", amount: "500" }],
                    gas: "200000"
                },
                ""
            );

            console.log('Broadcast result:', result);

            if (result.code && result.code !== 0) {
                throw new Error(result.raw_log || 'Transaction failed');
            }

            alert('Delegation successful!');
            return result;
        } catch (error) {
            console.error('Delegation failed:', error);
            alert('Delegation failed: ' + (error.message || error));
            throw error;
        }
    },

    // Helper function to convert base64 to hex for logging
    base64ToHex: function(base64) {
        const binary = atob(base64);
        let hex = '';
        for (let i = 0; i < binary.length; i++) {
            hex += binary.charCodeAt(i).toString(16).padStart(2, '0');
        }
        return hex;
    },

    // Update UI based on current state
    updateUI: async function() {
        const connectWalletBtn = document.getElementById('connectKeplrWallet');
        const walletAddress = document.getElementById('keplrWalletAddress');
        const delegateSection = document.getElementById('delegateSection');
        const delegateControls = document.querySelector('.delegate-controls');

        if (connectWalletBtn) {
            if (window.App.isKeplrConnected) {
                const walletName = window.App.cosmosWallet === 'leap' ? 'Leap' : 'Keplr';
                connectWalletBtn.innerHTML = `Disconnect ${walletName} <span class="truncated-address">(${window.App.keplrAddress.slice(0, 6)}...${window.App.keplrAddress.slice(-4)})</span>`;
                if (walletAddress) {
                    walletAddress.textContent = window.App.keplrAddress;
                }
                if (delegateControls) {
                    delegateControls.style.display = 'flex';
                }
            } else {
                connectWalletBtn.innerHTML = 'Connect Cosmos Wallet';
                if (walletAddress) {
                    walletAddress.textContent = 'Not connected';
                }
                if (delegateControls) {
                    delegateControls.style.display = 'none';
                }
            }
        }
    }
};

// Export for use in main app
export default DelegateApp; 