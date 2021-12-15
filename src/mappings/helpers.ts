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
      Address.fromString("0x26f898A29CD9Ea4c327037547DF6FA7E2967b8D6")
    ) {
      return "polis-fantom";
    }
    if (
      address ==
      Address.fromString("0x9CEBA3f59CE10F65311B56D5eF3895Ffbc3245e3")
    ) {
      return "polis-bsc";
    }
    if (
      address ==
      Address.fromString("0x0306BcA3Ea988112acf420aA58EBAbA40040A1Fd")
    ) {
      return "polis-matic";
    }
    if (
      address ==
      Address.fromString("0x96ba6eFcF8c12547fd4a069370602904D50e4d34")
    ) {
      return "polis-mainnet";
    }
    if (
      address ==
      Address.fromString("0xfB59876201405Aee8D8aDa645b168AFEdb442F76")
    ) {
      return "polis-avalanche";
    }
    if (
      address ==
      Address.fromString("0x1A8D1775335366F1068e6078813160Abf84c26bd")
    ) {
      return "polis-iotex";
    }
    return "";
  } else if (network == "fantom") {
    if (
      address ==
      Address.fromString("0xf4Ce1C6d4eF79d5661AfAA6678892446822Cb558")
    ) {
      return "polis-fantom";
    }
    return "";
  } else if (network == "bsc") {
    if (
      address ==
      Address.fromString("0x75fBF4e5aD4b725Bb4E300B6b2572596f87CA2D3")
    ) {
      return "polis-bsc";
    }
    return "";
  } else if (network == "matic") {
    if (
      address ==
      Address.fromString("0xDA4Afcd8c7305AbedEb676768b04D29412d60eFB")
    ) {
      return "polis-matic";
    }
    return "";
  } else if (network == "mainnet") {
    if (
      address ==
      Address.fromString("0x4f7488D150eA5295d20c8f0E3524b7897b1b7021")
    ) {
      return "polis-mainnet";
    }
    return "";
  } else if (network == "avalanche") {
    if (
      address ==
      Address.fromString("0xfB59876201405Aee8D8aDa645b168AFEdb442F76")
    ) {
      return "polis-avalanche";
    }
    return "";
  } else if (network == "iotex") {
    if (
      address ==
      Address.fromString("0x712B61e244CB26c8bB41655913d8076E144C7A21")
    ) {
      return "polis-avalanche";
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
    } else if (network == "bsc") {
      token.homeChainId = 56;
      token.homeName = tokenObject.name;
    } else if (network == "matic") {
      token.homeChainId = 137;
      token.homeName = tokenObject.name;
    } else if (network == "mainnet") {
      token.homeChainId = 1;
      token.homeName = tokenObject.name;
    } else if (network == "avalanche") {
      token.homeChainId = 43114;
      token.homeName = tokenObject.name;
    } else if (network == "iotex") {
      token.homeChainId = 4689;
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
