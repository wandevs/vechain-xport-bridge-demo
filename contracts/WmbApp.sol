// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IWmbGateway.sol";

abstract contract WmbApp {
    address public wmbGateway;
    address public remoteSC;
    uint256 public remoteChainId;
    bool public isInited;

    constructor(address _wmbGateway) {
        wmbGateway = _wmbGateway;
    }

    function estimateFee(uint256 toChain, uint256 gasLimit) virtual public view returns (uint256) {
        return IWmbGateway(wmbGateway).estimateFee(toChain, gasLimit);
    }

    function wmbReceive(
        bytes calldata data,
        bytes32 messageId,
        uint256 fromChainId,
        address from
    ) virtual external {
        // Only the WMB gateway can call this function
        require(msg.sender == wmbGateway, "WmbApp: Only WMB gateway can call this function");

        if (!isInited) {
            remoteSC = from;
            remoteChainId = fromChainId;
            isInited = true;
        } else {
            require(from == remoteSC, "WmbApp: Only remote SC can call this function");
            require(fromChainId == remoteChainId, "WmbApp: Only remote chain can call this function");
            _wmbReceive(data, messageId, fromChainId, from);
        }
    }

    function _wmbReceive(
        bytes calldata data,
        bytes32 messageId,
        uint256 fromChainId,
        address from
    ) virtual internal;
}