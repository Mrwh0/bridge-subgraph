import { Bytes, Address, log, dataSource } from "@graphprotocol/graph-ts";

import { Token } from "../types/Omnibridge/Token";
import { Token as TokenEntity } from "../types/schema";

class TokenObject {
  address: Address;
  name: string;
  symbol: string;
  decimals: i32;
}

export function getDirection(): String {
  let network = dataSource.network();
  let address = dataSource.address();
  if (network == "olympus") {
    if (
      address ==
      Address.fromString("0xdbcEB62c9f00B1BFF0B34a85e19f6EE8A3e88BA3")
    ) {
      return "polis-fantom";
    }
    return "";
  } else if (network == "fantom") {
    if (
      address ==
      Address.fromString("0x5210297D69359939F36f8Fda38D1E0fE82fDb02B")
    ) {
      return "polis-fantom";
    }
    return "";
  }
  return "";
}

export function fetchTokenInfo(address: Address): TokenObject {
  let tokenInstance = Token.bind(address);
  log.debug("TokenContract at {}", [address.toHex()]);
  let tokenObject = new TokenObject();
  tokenObject.address = address;

  let name = tokenInstance.try_name();
  let symbol = tokenInstance.try_symbol();
  let decimals = tokenInstance.try_decimals();

  if (!name.reverted) {
    tokenObject.name = name.value;
  }

  if (!symbol.reverted) {
    tokenObject.symbol = symbol.value;
  }

  if (!decimals.reverted) {
    tokenObject.decimals = decimals.value;
  }

  return tokenObject;
}

export function updateHomeToken(tokenAddress: Address): void {
  let token = TokenEntity.load(tokenAddress.toHexString());
  if (token == null) {
    let tokenInfo = fetchTokenInfo(tokenAddress);
    updateHomeTokenInfo(tokenAddress, tokenInfo);
  }
}

export function updateHomeTokenInfo(
  tokenAddress: Address,
  tokenObject: TokenObject
): void {
  let token = TokenEntity.load(tokenAddress.toHexString());
  if (token == null) {
    let token = new TokenEntity(tokenAddress.toHexString());

    token.symbol = tokenObject.symbol;
    token.decimals = tokenObject.decimals;
    token.homeAddress = tokenAddress;

    let network = dataSource.network();
    if (network == "olympus") {
      token.homeChainId = 333999;
      token.homeName = tokenObject.name;
    } else if (network == "fantom") {
      token.homeChainId = 250;
      token.homeName = tokenObject.name;
    }

    token.save();
    log.debug("New overridden homeToken {}", [token.homeAddress.toHexString()]);
  }
}

// headerLength = 79 + sourceChainIdLength + destinationChainIdLength
// for bsc, sokol, kovan, xdai and mainnet chainId < 255
// => len(chainId) = 1
var HEADER_LENGTH = 79 + 1 + 1;
var METHOD_SIGNATURE_LENGTH = 4;
var PADDED_LENGTH = 32;
var ADDRESS_LENGTH = 20;

var handleNativeTokensAndCall = Bytes.fromHexString("0x867f7a4d") as Bytes;
var handleNativeTokens = Bytes.fromHexString("0x272255bb") as Bytes;
var handleBridgedTokensAndCall = Bytes.fromHexString("0xc5345761") as Bytes;
var handleBridgedTokens = Bytes.fromHexString("0x125e4cfb") as Bytes;
var deployAndHandleBridgedTokensAndCall = Bytes.fromHexString(
  "0xd522cfd7"
) as Bytes;
var deployAndHandleBridgedTokens = Bytes.fromHexString("0x2ae87cdd") as Bytes;

export function decodeRecipient(encodedData: Bytes): Bytes {
  let data = encodedData.subarray(HEADER_LENGTH + METHOD_SIGNATURE_LENGTH);
  let method = encodedData.subarray(
    HEADER_LENGTH,
    HEADER_LENGTH + METHOD_SIGNATURE_LENGTH
  ) as Bytes;

  if (
    method == handleNativeTokens ||
    method == handleNativeTokensAndCall ||
    method == handleBridgedTokens ||
    method == handleBridgedTokensAndCall
  ) {
    // _token, 0 - 32
    // _receiver, 32 - 64
    // _value, 64 - 96
    return data.subarray(
      2 * PADDED_LENGTH - ADDRESS_LENGTH, // removing padded zeros
      2 * PADDED_LENGTH
    ) as Bytes;
  } else if (
    method == deployAndHandleBridgedTokens ||
    method == deployAndHandleBridgedTokensAndCall
  ) {
    // _token, 0 - 32
    // name, 32 - 64
    // symbol, 64 - 96
    // _decimals, 96 - 128
    // _receiver, 128 - 160
    // _value, 160 - 192
    return data.subarray(
      5 * PADDED_LENGTH - ADDRESS_LENGTH, // removing padded zeros
      5 * PADDED_LENGTH
    ) as Bytes;
  }
  return null;
}
