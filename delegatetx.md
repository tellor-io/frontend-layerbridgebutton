./layerd query tx --type=hash $txhash                                                                                                                ─╯
code: 0
codespace: ""
data: 122D0A2B2F636F736D6F732E7374616B696E672E763162657461312E4D736744656C6567617465526573706F6E7365
events:
- attributes:
  - index: true
    key: spender
    value: tellor1alcefjzkk37qmfrnel8q4eruyll0pc8arxhxxw
  - index: true
    key: amount
    value: 500loya
  type: coin_spent
- attributes:
  - index: true
    key: receiver
    value: tellor17xpfvakm2amg962yls6f84z3kell8c5ls06m3g
  - index: true
    key: amount
    value: 500loya
  type: coin_received
- attributes:
  - index: true
    key: recipient
    value: tellor17xpfvakm2amg962yls6f84z3kell8c5ls06m3g
  - index: true
    key: sender
    value: tellor1alcefjzkk37qmfrnel8q4eruyll0pc8arxhxxw
  - index: true
    key: amount
    value: 500loya
  type: transfer
- attributes:
  - index: true
    key: sender
    value: tellor1alcefjzkk37qmfrnel8q4eruyll0pc8arxhxxw
  type: message
- attributes:
  - index: true
    key: fee
    value: 500loya
  - index: true
    key: fee_payer
    value: tellor1alcefjzkk37qmfrnel8q4eruyll0pc8arxhxxw
  type: tx
- attributes:
  - index: true
    key: acc_seq
    value: tellor1alcefjzkk37qmfrnel8q4eruyll0pc8arxhxxw/998
  type: tx
- attributes:
  - index: true
    key: signature
    value: KtA40ddSDGww2p50Y3CQI5FrlgUhAbZ/ncxcc4PzfNZx7s6vEfMcazeS44bq5RDu/U2t6qGS2eENJOYCuxWCIA==
  type: tx
- attributes:
  - index: true
    key: action
    value: /cosmos.staking.v1beta1.MsgDelegate
  - index: true
    key: sender
    value: tellor1alcefjzkk37qmfrnel8q4eruyll0pc8arxhxxw
  - index: true
    key: module
    value: staking
  - index: true
    key: msg_index
    value: "0"
  type: message
- attributes:
  - index: true
    key: spender
    value: tellor1jv65s3grqf6v6jl3dp4t6c9t9rk99cd88fa8n2
  - index: true
    key: amount
    value: 672075loya
  - index: true
    key: msg_index
    value: "0"
  type: coin_spent
- attributes:
  - index: true
    key: receiver
    value: tellor1alcefjzkk37qmfrnel8q4eruyll0pc8arxhxxw
  - index: true
    key: amount
    value: 672075loya
  - index: true
    key: msg_index
    value: "0"
  type: coin_received
- attributes:
  - index: true
    key: recipient
    value: tellor1alcefjzkk37qmfrnel8q4eruyll0pc8arxhxxw
  - index: true
    key: sender
    value: tellor1jv65s3grqf6v6jl3dp4t6c9t9rk99cd88fa8n2
  - index: true
    key: amount
    value: 672075loya
  - index: true
    key: msg_index
    value: "0"
  type: transfer
- attributes:
  - index: true
    key: sender
    value: tellor1jv65s3grqf6v6jl3dp4t6c9t9rk99cd88fa8n2
  - index: true
    key: msg_index
    value: "0"
  type: message
- attributes:
  - index: true
    key: amount
    value: 672075loya
  - index: true
    key: validator
    value: tellorvaloper1alcefjzkk37qmfrnel8q4eruyll0pc8akfm5l7
  - index: true
    key: delegator
    value: tellor1alcefjzkk37qmfrnel8q4eruyll0pc8arxhxxw
  - index: true
    key: msg_index
    value: "0"
  type: withdraw_rewards
- attributes:
  - index: true
    key: spender
    value: tellor1alcefjzkk37qmfrnel8q4eruyll0pc8arxhxxw
  - index: true
    key: amount
    value: 1loya
  - index: true
    key: msg_index
    value: "0"
  type: coin_spent
- attributes:
  - index: true
    key: receiver
    value: tellor1fl48vsnmsdzcv85q5d2q4z5ajdha8yu34ds5rz
  - index: true
    key: amount
    value: 1loya
  - index: true
    key: msg_index
    value: "0"
  type: coin_received
- attributes:
  - index: true
    key: validator
    value: tellorvaloper1alcefjzkk37qmfrnel8q4eruyll0pc8akfm5l7
  - index: true
    key: delegator
    value: tellor1alcefjzkk37qmfrnel8q4eruyll0pc8arxhxxw
  - index: true
    key: amount
    value: 1loya
  - index: true
    key: new_shares
    value: "1.000000000000000000"
  - index: true
    key: msg_index
    value: "0"
  type: delegate
gas_used: "169634"
gas_wanted: "200000"
height: "491945"
info: ""
logs: []
raw_log: ""
timestamp: "2025-06-11T18:10:00Z"
tx:
  '@type': /cosmos.tx.v1beta1.Tx
  auth_info:
    fee:
      amount:
      - amount: "500"
        denom: loya
      gas_limit: "200000"
      granter: ""
      payer: ""
    signer_infos:
    - mode_info:
        single:
          mode: SIGN_MODE_DIRECT
      public_key:
        '@type': /cosmos.crypto.secp256k1.PubKey
        key: A8ewUdR2YoNh4vwa6hEB201r+KEXUzahx4iCDlnxzau0
      sequence: "998"
    tip: null
  body:
    extension_options: []
    memo: ""
    messages:
    - '@type': /cosmos.staking.v1beta1.MsgDelegate
      amount:
        amount: "1"
        denom: loya
      delegator_address: tellor1alcefjzkk37qmfrnel8q4eruyll0pc8arxhxxw
      validator_address: tellorvaloper1alcefjzkk37qmfrnel8q4eruyll0pc8akfm5l7
    non_critical_extension_options: []
    timeout_height: "0"
  signatures:
  - KtA40ddSDGww2p50Y3CQI5FrlgUhAbZ/ncxcc4PzfNZx7s6vEfMcazeS44bq5RDu/U2t6qGS2eENJOYCuxWCIA==
txhash: 4739EAAA3A6A35918C93B1DBF1AB61F034E09EE9F2CA69FDF20B66C4F73C341B